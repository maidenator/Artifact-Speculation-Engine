#pragma once
#include <string>
#include <vector>
#include <cstdint>
#include <algorithm>
#include <cmath>
#include <numeric>

#include "simulation_types.hpp"
#include "serializer.hpp"
#include "../artifact/types.hpp"
#include "../artifact/random_utils.hpp"
#include "../artifact/generator.hpp"

class ArtifactInterface {
public:
    ArtifactInterface() : masterRng(1337) {}
    explicit ArtifactInterface(uint64_t seed) : masterRng(seed) {}

    void setSeed(uint64_t seed) {
        masterRng = rng::Xoshiro256(seed);
    }

    std::string generateBatchJson(int count, bool upgrade) {
        std::vector<Artifact> batch;
        batch.reserve(count);
        for (int i = 0; i < count; ++i) {
            Artifact art = generator::generateArtifact(masterRng);
            if(upgrade) {
                for (int step = 0; step < 5; ++step) {
                    generator::upgradeArtifactOnce(art, masterRng);
                }
            }
            batch.push_back(art);
        }
        return serializer::serializeArtifactsJson(batch);
    }

    std::string generateBatchWithHistoryJson(int count) {
        std::vector<std::vector<Artifact>> batches;
        batches.reserve(count);
        for (int i = 0; i < count; ++i) {
            std::vector<Artifact> history;
            history.reserve(6);
            
            // Base artifact (+0)
            Artifact art = generator::generateArtifact(masterRng);
            history.push_back(art);
            
            // Upgrade 5 times to +20, saving state each time
            for (int step = 0; step < 5; ++step) {
                generator::upgradeArtifactOnce(art, masterRng);
                history.push_back(art);
            }
            batches.push_back(history);
        }
        return serializer::serializeArtifactHistoriesJson(batches);
    }

    std::string runSimulationJson(const std::string &configJson) {
        SimulationConfig config = serializer::parseConfigJson(configJson);
        SimulationSummary summary = executeSimulation(config);
        return serializer::serializeSummaryJson(summary);
    }

    SimulationSummary executeSingleTrial(const SimulationConfig &config);
    SimulationSummary executeSimulation(const SimulationConfig &config);

private:
    rng::Xoshiro256 masterRng;
};

inline SimulationSummary ArtifactInterface::executeSingleTrial(const SimulationConfig &config) {
    SimulationSummary summary;

    const size_t effectiveK = std::clamp(static_cast<size_t>(config.topK), size_t(1), size_t(20));

    struct ScoredArtifact {
        Artifact art;
        double score;
    };
    std::vector<ScoredArtifact> reservoir;
    reservoir.reserve(effectiveK + 1);

    auto updateReservoir = [&](const Artifact &art, double score) {
        reservoir.push_back({art, score});
        std::sort(reservoir.begin(), reservoir.end(), [](const ScoredArtifact &a, const ScoredArtifact &b) {
            return a.score > b.score;
        });
        if (reservoir.size() > effectiveK) {
            reservoir.pop_back();
        }
    };

    int junkFiveStarCount = 0;

    struct HuntTracker {
        HuntTarget target;
        bool found = false;
        int resinSpent = 0;
        std::optional<Artifact> artifact = std::nullopt;
        int setIndex = -1;
    };
    std::vector<HuntTracker> huntTrackers;
    size_t huntItemsRemaining = 0;
    if (config.mode == SimulationMode::HuntList) {
        huntTrackers.reserve(config.huntTargets.size());
        for (const auto &t : config.huntTargets) {
            huntTrackers.push_back({t, false, 0, std::nullopt, -1});
        }
        huntItemsRemaining = huntTrackers.size();
    }

    auto checkHuntMatch = [&](const Artifact &art, int setIdx) -> bool {
        for (auto &tracker : huntTrackers) {
            if (!tracker.found && artifactMeetsHuntTarget(art, setIdx, tracker.target)) {
                tracker.found = true;
                tracker.resinSpent = summary.totalResinSpent;
                tracker.artifact = art;
                tracker.setIndex = setIdx;
                huntItemsRemaining--;
                return true;
            }
        }
        return false;
    };

    auto processPiece = [&](Artifact &art) -> bool {
        if (config.targetSlot.has_value() && art.slot != *config.targetSlot) {
            junkFiveStarCount++;
            return false;
        }
        if (config.targetMainStat.has_value() && art.mainStat.type != *config.targetMainStat) {
            junkFiveStarCount++;
            return false;
        }

        // Upgrade piece to Level 20
        for (int step = 0; step < 5; ++step) {
            generator::upgradeArtifactOnce(art, masterRng);
        }

        double score = evaluateArtifactScore(art, config);
        updateReservoir(art, score);

        bool metCriteria = satisfiesTargetCriteria(art, config, score);
        if (!metCriteria) {
            junkFiveStarCount++;
        }
        return metCriteria;
    };

    while (true) {
        if (config.mode == SimulationMode::FixedResin && summary.totalResinSpent >= config.resinBudget) {
            break;
        }
        if (config.mode == SimulationMode::TargetGoal && summary.targetAchieved) {
            break;
        }
        if (config.mode == SimulationMode::TargetGoal && config.resinBudget > 0 && summary.totalResinSpent >= config.resinBudget) {
            break;
        }
        if (config.mode == SimulationMode::HuntList && huntItemsRemaining == 0) {
            summary.targetAchieved = true;
            break;
        }
        if (config.mode == SimulationMode::HuntList && config.resinBudget > 0 && summary.totalResinSpent >= config.resinBudget) {
            break;
        }

        summary.totalResinSpent += distributions::RESIN_PER_RUN;
        summary.domainRunsCompleted++;

        int dropsThisRun = (rng::fastUniformDouble(masterRng) < distributions::DOUBLE_5_STAR_CHANCE) ? 2 : 1;

        for (int d = 0; d < dropsThisRun; ++d) {
            summary.totalFiveStarsFound++;

            if (config.mode == SimulationMode::HuntList) {
                int dropSet = rng::fastUniformRange(0, 1, masterRng);
                Artifact art = generator::generateArtifact(masterRng);
                for (int step = 0; step < 5; ++step) {
                    generator::upgradeArtifactOnce(art, masterRng);
                }
                double score = evaluateArtifactScore(art, config);
                updateReservoir(art, score);

                bool matched = checkHuntMatch(art, dropSet);
                if (!matched) {
                    junkFiveStarCount++;
                }
                if (huntItemsRemaining == 0) {
                    summary.targetAchieved = true;
                    break;
                }
            } else {
                if (rng::fastUniformRange(0, 1, masterRng) == 0) {
                    Artifact art = generator::generateArtifact(masterRng);
                    if (processPiece(art) && config.mode == SimulationMode::TargetGoal) {
                        summary.targetAchieved = true;
                        break;
                    }
                } else {
                    junkFiveStarCount++;
                }
            }
        }
        if (config.mode == SimulationMode::HuntList && huntItemsRemaining == 0) {
            break;
        }

        if (config.useStrongBox) {
            while (junkFiveStarCount >= 3) {
                junkFiveStarCount -= 3;
                summary.strongboxRollsCompleted++;
                summary.totalFiveStarsFound++;

                Artifact boxArt = generator::generateArtifact(masterRng);

                if (config.mode == SimulationMode::HuntList) {
                    for (int step = 0; step < 5; ++step) {
                        generator::upgradeArtifactOnce(boxArt, masterRng);
                    }
                    double score = evaluateArtifactScore(boxArt, config);
                    updateReservoir(boxArt, score);

                    bool matched = false;
                    for (auto &tracker : huntTrackers) {
                        if (!tracker.found) {
                            int targetSet = (tracker.target.setIndex != -1) ? tracker.target.setIndex : 0;
                            if (artifactMeetsHuntTarget(boxArt, targetSet, tracker.target)) {
                                tracker.found = true;
                                tracker.resinSpent = summary.totalResinSpent;
                                tracker.artifact = boxArt;
                                tracker.setIndex = targetSet;
                                huntItemsRemaining--;
                                matched = true;
                                break;
                            }
                        }
                    }
                    if (huntItemsRemaining == 0) {
                        summary.targetAchieved = true;
                        break;
                    }
                } else {
                    if (processPiece(boxArt) && config.mode == SimulationMode::TargetGoal) {
                        summary.targetAchieved = true;
                        break;
                    }
                }
            }
            if (config.mode == SimulationMode::HuntList && huntItemsRemaining == 0) {
                break;
            }
        }
    }

    if (config.mode == SimulationMode::HuntList) {
        summary.huntResults.reserve(huntTrackers.size());
        for (const auto &tr : huntTrackers) {
            summary.huntResults.push_back({
                tr.target.id,
                tr.found,
                tr.resinSpent,
                tr.artifact,
                tr.setIndex
            });
        }
        summary.targetAchieved = (huntItemsRemaining == 0);
    }

    summary.equivalentDays = static_cast<double>(summary.totalResinSpent) / 180.0;
    summary.topArtifacts.reserve(reservoir.size());
    for (const auto &entry : reservoir) {
        summary.topArtifacts.push_back(entry.art);
    }

    return summary;
}

inline SimulationSummary ArtifactInterface::executeSimulation(const SimulationConfig &config) {
    int totalTrials = std::max(1, config.trials);
    if (totalTrials == 1) {
        SimulationSummary single = executeSingleTrial(config);
        single.trials = 1;
        single.successfulTrials = single.targetAchieved ? 1 : 0;
        single.successRate = single.targetAchieved ? 1.0 : 0.0;
        single.medianResinSpent = single.totalResinSpent;
        single.p90ResinSpent = single.totalResinSpent;
        single.minResinSpent = single.totalResinSpent;
        single.maxResinSpent = single.totalResinSpent;
        single.meanResinSpent = single.totalResinSpent;
        single.trialResinSpents = { single.totalResinSpent };
        single.trialTargetAchieved = { single.targetAchieved };
        return single;
    }

    SimulationSummary summary;
    summary.trials = totalTrials;

    const size_t effectiveK = std::clamp(static_cast<size_t>(config.topK), size_t(1), size_t(20));
    struct ScoredArtifact {
        Artifact art;
        double score;
    };
    std::vector<ScoredArtifact> globalReservoir;
    globalReservoir.reserve(effectiveK + 1);

    auto updateGlobalReservoir = [&](const Artifact &art, double score) {
        globalReservoir.push_back({art, score});
        std::sort(globalReservoir.begin(), globalReservoir.end(), [](const ScoredArtifact &a, const ScoredArtifact &b) {
            return a.score > b.score;
        });
        if (globalReservoir.size() > effectiveK) {
            globalReservoir.pop_back();
        }
    };

    std::vector<int> allResinSpents;
    std::vector<int> successfulResinSpents;
    std::vector<bool> allSuccesses;
    allResinSpents.reserve(totalTrials);
    allSuccesses.reserve(totalTrials);

    long long sumDomainRuns = 0;
    long long sumStrongboxRolls = 0;
    long long sumFiveStars = 0;

    for (int t = 0; t < totalTrials; ++t) {
        SimulationSummary trialSummary = executeSingleTrial(config);

        allResinSpents.push_back(trialSummary.totalResinSpent);
        allSuccesses.push_back(trialSummary.targetAchieved);

        sumDomainRuns += trialSummary.domainRunsCompleted;
        sumStrongboxRolls += trialSummary.strongboxRollsCompleted;
        sumFiveStars += trialSummary.totalFiveStarsFound;

        if (trialSummary.targetAchieved) {
            summary.successfulTrials++;
            successfulResinSpents.push_back(trialSummary.totalResinSpent);
        }

        for (const auto &art : trialSummary.topArtifacts) {
            double score = evaluateArtifactScore(art, config);
            updateGlobalReservoir(art, score);
        }

        if (t == 0 || trialSummary.targetAchieved) {
            summary.huntResults = trialSummary.huntResults;
        }
    }

    summary.successRate = static_cast<double>(summary.successfulTrials) / totalTrials;
    summary.targetAchieved = (summary.successfulTrials > 0);
    summary.trialResinSpents = std::move(allResinSpents);
    summary.trialTargetAchieved = std::move(allSuccesses);

    summary.domainRunsCompleted = static_cast<int>(sumDomainRuns);
    summary.strongboxRollsCompleted = static_cast<int>(sumStrongboxRolls);
    summary.totalFiveStarsFound = static_cast<int>(sumFiveStars);

    const std::vector<int> &resinData = (!successfulResinSpents.empty()) ? successfulResinSpents : summary.trialResinSpents;
    std::vector<int> sortedResin = resinData;
    std::sort(sortedResin.begin(), sortedResin.end());

    auto computePercentile = [&](const std::vector<int> &data, double p) -> double {
        if (data.empty()) return 0.0;
        double idx = p * (data.size() - 1);
        size_t lower = static_cast<size_t>(std::floor(idx));
        size_t upper = static_cast<size_t>(std::ceil(idx));
        if (lower == upper) return data[lower];
        double weight = idx - lower;
        return data[lower] * (1.0 - weight) + data[upper] * weight;
    };

    summary.minResinSpent = sortedResin.front();
    summary.maxResinSpent = sortedResin.back();
    summary.medianResinSpent = computePercentile(sortedResin, 0.5);
    summary.p90ResinSpent = computePercentile(sortedResin, 0.9);

    double sum = 0.0;
    for (int r : sortedResin) sum += r;
    summary.meanResinSpent = sum / sortedResin.size();

    if (config.mode == SimulationMode::TargetGoal) {
        summary.totalResinSpent = static_cast<int>(std::round(summary.medianResinSpent));
    } else {
        summary.totalResinSpent = config.resinBudget;
    }
    summary.equivalentDays = static_cast<double>(summary.totalResinSpent) / 180.0;

    summary.topArtifacts.reserve(globalReservoir.size());
    for (const auto &entry : globalReservoir) {
        summary.topArtifacts.push_back(entry.art);
    }

    return summary;
}