#pragma once
#include <string>
#include <vector>
#include <cstdint>
#include <algorithm>

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

    SimulationSummary executeSimulation(const SimulationConfig &config);

private:
    rng::Xoshiro256 masterRng;
};

inline SimulationSummary ArtifactInterface::executeSimulation(const SimulationConfig &config) {
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

        summary.totalResinSpent += 20;
        summary.domainRunsCompleted++;

        int dropsThisRun = (rng::fastUniformRange(1, 1000, masterRng) <= 65) ? 2 : 1;

        for (int d = 0; d < dropsThisRun; ++d) {
            summary.totalFiveStarsFound++;

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

        if (config.useStrongBox) {
            while (junkFiveStarCount >= 3) {
                junkFiveStarCount -= 3;
                summary.strongboxRollsCompleted++;
                summary.totalFiveStarsFound++;

                Artifact boxArt = generator::generateArtifact(masterRng);
                if (processPiece(boxArt) && config.mode == SimulationMode::TargetGoal) {
                    summary.targetAchieved = true;
                    break;
                }
            }
        }
    }

    summary.equivalentDays = static_cast<double>(summary.totalResinSpent) / 180.0;
    summary.topArtifacts.reserve(reservoir.size());
    for (const auto &entry : reservoir) {
        summary.topArtifacts.push_back(entry.art);
    }

    return summary;
}