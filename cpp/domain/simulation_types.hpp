#pragma once
#include <string>
#include <vector>
#include <cstdint>
#include <optional>
#include "../artifact/types.hpp"
#include "../artifact/generator.hpp"
#include "../artifact/distributions.hpp"

enum class SimulationMode : uint8_t {
    FixedResin,
    TargetGoal,
    HuntList
};

struct SubstatWeight {
    ArtifactSubstat stat;
    double weight = 1.0;
};

struct HuntSubstatTarget {
    ArtifactSubstat stat;
    int minRolls = 1;
    double minValue = 0.0;
};

struct HuntTarget {
    std::string id;
    ArtifactSlot slot;
    ArtifactMainStat mainStat;
    int setIndex = -1; // -1 = either set in domain, 0 = Set A, 1 = Set B
    std::vector<HuntSubstatTarget> substats;
};

struct HuntItemResultCpp {
    std::string id;
    bool found = false;
    int resinSpent = 0;
    std::optional<Artifact> artifact = std::nullopt;
    int setIndex = -1;
};

struct SimulationConfig {
    SimulationMode mode = SimulationMode::FixedResin;

    std::optional<ArtifactSlot> targetSlot = std::nullopt;
    std::optional<ArtifactMainStat> targetMainStat = std::nullopt;

    int resinBudget = 2000;
    int trials = 1;
    int topK = 10;
    bool useStrongBox = false;

    double minCritValue = 0.0;
    double minRollValue = 0.0;

    std::vector<SubstatWeight> substatWeights;
    std::vector<ArtifactSubstat> prioritySubstats;
    int minPriorityRolls = 0;

    std::vector<HuntTarget> huntTargets;
};

struct SimulationSummary {
    bool targetAchieved = false;
    int totalResinSpent = 0;
    double equivalentDays = 0.0;
    int domainRunsCompleted = 0;
    int strongboxRollsCompleted = 0;
    int totalFiveStarsFound = 0;

    // Multi-trial statistics
    int trials = 1;
    int successfulTrials = 0;
    double successRate = 0.0;
    double medianResinSpent = 0.0;
    double p90ResinSpent = 0.0;
    double minResinSpent = 0.0;
    double maxResinSpent = 0.0;
    double meanResinSpent = 0.0;
    std::vector<int> trialResinSpents;
    std::vector<bool> trialTargetAchieved;

    std::vector<Artifact> topArtifacts;
    std::vector<HuntItemResultCpp> huntResults;
};

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

inline bool satisfiesTargetCriteria(const Artifact &art, const SimulationConfig &config, double /*score*/) {
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

inline bool artifactMeetsHuntTarget(const Artifact &art, int dropSetIndex, const HuntTarget &target) {
    if (art.slot != target.slot) {
        return false;
    }

    if (art.mainStat.type != target.mainStat) {
        return false;
    }

    if (target.setIndex != -1 && dropSetIndex != target.setIndex) {
        return false;
    }

    for (const auto &req : target.substats) {
        bool foundSub = false;
        for (size_t i = 0; i < art.substatCount; ++i) {
            if (art.subStats[i].type == req.stat) {
                double minVal = req.minValue;
                if (minVal <= 0.0) {
                    double avgRoll = distributions::getSubstatValues(req.stat)[1];
                    minVal = (avgRoll * req.minRolls) * 0.95;
                }
                if (art.subStats[i].value >= minVal) {
                    foundSub = true;
                }
                break;
            }
        }
        if (!foundSub) {
            return false;
        }
    }

    return true;
}