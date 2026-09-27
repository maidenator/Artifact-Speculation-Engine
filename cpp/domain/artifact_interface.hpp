#pragma once
#include <string>
#include <vector>
#include <cstdint>
#include <optional>
#include <algorithm>
#include "../artifact/types.hpp"
#include "../artifact/random_utils.hpp"
#include "../artifact/generator.hpp"

enum class SimulationMode : uint8_t {
    FixedResin,
    TargetGoal
};

struct SubstatWeight {
    ArtifactSubstat stat;
    double weight = 1.0; // 1.0 for high priority, 0.5 for mid, 0.0 for dead
};

struct SimulationConfig {
    SimulationMode mode = SimulationMode::FixedResin;

    std::optional<ArtifactSlot> targetSlot = std::nullopt;
    std::optional<ArtifactMainStat> targetMainStat = std::nullopt;

    int resinBudget = 2000;
    int topK = 5;
    bool useStrongBox = false;

    double minCritValue = 0.0;
    double minRollValue = 0.0;

    std::vector<SubstatWeight> substatWeights;

    std::vector<ArtifactSubstat> prioritySubstats;
    int minPriorityRolls = 0;
};

struct SimulationSummary {
    bool targetAchieved = false;
    int totalResinSpent = 0;
    double equivalentDays = 0.0;
    int domainRunsCompleted = 0;
    int strongboxRollsCompleted = 0;
    int totalFiveStarsFound = 0;

    std::vector<Artifact> topArtifacts;
};

/**
 * Computes an artifact's composite score using user-defined substat weights.
 * Falls back to standard Crit Value (Crit DMG + 2 * Crit Rate) if no custom weights are provided.
 * 
 * @param art The artifact object containing the substats to evaluate.
 * @param config The simulation configuration containing optional substat weights.
 * @return double The calculated numeric score or crit value.
 */
inline double evaluateArtifactScore(const Artifact &art, const SimulationConfig &config) {
    if (config.substatWeights.empty()) {
        return generator::calculateCritValue(art);
    }

    double score = 0.0;
    for (size_t i = 0; i < art.substatCount; ++i) {
        const auto &sub = art.subStats[i];
        for (const auto &w : config.substatWeights) {
            if (sub.type == w.stat) {
                score += sub.value * w.weight;
                break;
            }
        }
    }
    return score;
}

/**
 * Checks if an artifact satisfies the target requirements, including slot, 
 * main stat, and minimum crit value thresholds.
 * 
 * @param art The artifact candidate to validate.
 * @param config The simulation configuration defining the target filters and cutoffs.
 * @param score The evaluated numeric score of the artifact.
 * @return bool True if the artifact meets all specified criteria, false otherwise.
 */
inline bool satisfiesTargetCriteria(const Artifact &art, const SimulationConfig &config, double score) {
    if (config.targetSlot.has_value() && art.slot != *config.targetSlot) {
        return false;
    }

    if (config.targetMainStat.has_value() && art.mainStat.type != *config.targetMainStat) {
        return false;
    }

    if (config.minCritValue > 0.0 && generator::calculateCritValue(art) < config.minCritValue) {
        return false;
    }

    return true;
}

class ArtifactInterface {
public:
    ArtifactInterface() : masterRng(1337) {}
    explicit ArtifactInterface(uint64_t seed) : masterRng(seed) {}

    void setSeed(uint64_t seed) {
        masterRng = rng::Xoshiro256(seed);
    }

    std::string generateBatchJson(int count);
    std::string runSimulationJson(const std::string &configJson);

    // Made public so native Catch2 unit tests can test the engine directly with structs
    SimulationSummary executeSimulation(const SimulationConfig &config);

private:
    rng::Xoshiro256 masterRng;

    SimulationConfig parseConfigJson(const std::string &jsonStr);
    std::string serializeSummaryJson(const SimulationSummary &summary);
    std::string serializeArtifactsJson(const std::vector<Artifact> &artifacts);
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