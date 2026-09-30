#pragma once
#include <vector>
#include <cstdint>
#include <optional>
#include "../artifact/types.hpp"
#include "../artifact/generator.hpp"

enum class SimulationMode : uint8_t {
    FixedResin,
    TargetGoal
};

struct SubstatWeight {
    ArtifactSubstat stat;
    double weight = 1.0;
};

struct SimulationConfig {
    SimulationMode mode = SimulationMode::FixedResin;

    std::optional<ArtifactSlot> targetSlot = std::nullopt;
    std::optional<ArtifactMainStat> targetMainStat = std::nullopt;

    int resinBudget = 2000;
    int topK = 10;
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