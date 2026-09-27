#pragma once
#include <vector>
#include <utility>
#include <array>
#include <span>
#include <cstdint>
#include "types.hpp"

namespace distributions {

constexpr int RESIN_PER_RUN = 20;                   // One run costs 20 Resin
constexpr int BASE_5_STAR_COUNT = 1;                // One 5* Artifact per run
constexpr double DOUBLE_5_STAR_CHANCE = 0.065;      // 6.5% Chance to get a second 5* Artifact per run
constexpr double SET_SPLIT_RATE = 0.50;             // Two sets per domain are equally split
constexpr double SLOT_SPLIT_RATE = 0.20;            // Each Artifact Slot has an equal likelihood (20%) of dropping
constexpr double FOUR_LINER_CHANCE = 0.20;          // A 5* Artifact has a 20% chance to spawn with 4 substats instead of 3

constexpr int FLOWER_MAIN_STAT_COUNT = 1;
constexpr int FEATHER_MAIN_STAT_COUNT = 1;
constexpr int SANDS_MAIN_STAT_COUNT = 5;
constexpr int GOBLET_MAIN_STAT_COUNT = 12;
constexpr int CIRCLET_MAIN_STAT_COUNT = 7;

struct MainStatWeight {
    ArtifactMainStat stat;
    double weight;
};

constexpr std::array<MainStatWeight, FLOWER_MAIN_STAT_COUNT> FLOWER_MAIN_STATS = {{
    //                  Main Stat   Probability of Rolling
    {ArtifactMainStat:: hpFlat,             100}
    //                        Sum should be 100
}};

constexpr std::array<MainStatWeight, FEATHER_MAIN_STAT_COUNT> FEATHER_MAIN_STATS = {{
    {ArtifactMainStat:: atkFlat,            100}
    //                        Sum should be 100
}};

constexpr std::array<MainStatWeight, SANDS_MAIN_STAT_COUNT> SANDS_MAIN_STATS = {{
    //                  Main Stat   Probability of Rolling
    {ArtifactMainStat:: hpPercent,          26.68},
    {ArtifactMainStat:: atkPercent,         26.66},
    {ArtifactMainStat:: defPercent,         26.66},
    {ArtifactMainStat:: energyRecharge,     10.0},
    {ArtifactMainStat:: elementalMastery,   10.0},
    //                        Sum should be 100
}};

constexpr std::array<MainStatWeight, GOBLET_MAIN_STAT_COUNT> GOBLET_MAIN_STATS = {{
    //                  Main Stat   Probability of Rolling
    {ArtifactMainStat:: hpPercent,          19.25},
    {ArtifactMainStat:: atkPercent,         19.25},
    {ArtifactMainStat:: defPercent,         19.00},
    {ArtifactMainStat:: pyroDmg,            5.0},
    {ArtifactMainStat:: hydroDmg,           5.0},
    {ArtifactMainStat:: electroDmg,         5.0},
    {ArtifactMainStat:: cryoDmg,            5.0},
    {ArtifactMainStat:: anemoDmg,           5.0},
    {ArtifactMainStat:: geoDmg,             5.0},
    {ArtifactMainStat:: dendroDmg,          5.0},
    {ArtifactMainStat:: physicalDmg,        5.0},
    {ArtifactMainStat:: elementalMastery,   2.5},
    //                        Sum should be 100
}};

constexpr std::array<MainStatWeight, CIRCLET_MAIN_STAT_COUNT> CIRCLET_MAIN_STATS = {{
    //                  Main Stat   Probability of Rolling
    {ArtifactMainStat:: hpPercent,          22.00},
    {ArtifactMainStat:: atkPercent,         22.00},
    {ArtifactMainStat:: defPercent,         22.00},
    {ArtifactMainStat:: critRate,           10.00},
    {ArtifactMainStat:: critDmg,            10.00},
    {ArtifactMainStat:: healingBonus,       10.00},
    {ArtifactMainStat:: elementalMastery,   4.00},
    //                        Sum should be 100
}};

/*
    Returns a span containing the main stat along
    with its corresponding roll chance (in percent)
    given a valid Artifact Slot.
*/
inline std::span<const MainStatWeight> getMainStatWeights(ArtifactSlot slot) {
    switch (slot) {
        case ArtifactSlot::flower:  return FLOWER_MAIN_STATS;
        case ArtifactSlot::feather: return FEATHER_MAIN_STATS;
        case ArtifactSlot::sands:   return SANDS_MAIN_STATS;
        case ArtifactSlot::goblet:  return GOBLET_MAIN_STATS;
        case ArtifactSlot::circlet: return CIRCLET_MAIN_STATS;
    }
    return {};
}

struct StatScaling {
    double base; // Value at Level 0
    double max;  // Value at Level 20
};  

constexpr StatScaling get5StarMainStatRange(ArtifactMainStat stat) {
    switch (stat) {
        // Flat Stats
        case ArtifactMainStat::hpFlat:           return {717.0, 4780.0};
        case ArtifactMainStat::atkFlat:          return {47.0, 311.0};

        // Standard Percent Stats
        case ArtifactMainStat::hpPercent:
        case ArtifactMainStat::atkPercent:       return {7.0, 46.6};
        case ArtifactMainStat::defPercent:       return {8.7, 58.3};

        // Advanced Stats
        case ArtifactMainStat::energyRecharge:   return {7.8, 51.8};
        case ArtifactMainStat::elementalMastery: return {28.0, 187.0};
        case ArtifactMainStat::critRate:         return {4.7, 31.1};
        case ArtifactMainStat::critDmg:          return {9.3, 62.2};
        case ArtifactMainStat::healingBonus:     return {5.4, 35.9};

        // Elemental / Physical Damage Bonuses
        case ArtifactMainStat::pyroDmg:
        case ArtifactMainStat::hydroDmg:
        case ArtifactMainStat::electroDmg:
        case ArtifactMainStat::cryoDmg:
        case ArtifactMainStat::anemoDmg:
        case ArtifactMainStat::geoDmg:
        case ArtifactMainStat::dendroDmg:        return {7.0, 46.6};
        case ArtifactMainStat::physicalDmg:      return {8.7, 58.3};

        // Flat defense is not a valid Main Stat
        case ArtifactMainStat::defFlat:          return {0.0, 0.0};
    }
    return {0.0, 0.0};
}

constexpr inline double getMainStatValue(ArtifactMainStat stat, int level, int rarity = 5) {
    // Assuming 5* artifact
    if (rarity != 5 || level <= 0) {
        return get5StarMainStatRange(stat).base;
    }
    if (level >= 20) {
        return get5StarMainStatRange(stat).max;
    }

    const auto [base, max] = get5StarMainStatRange(stat);
    return base + ((max - base) / 20.0) * level;
}

constexpr std::array<ArtifactSubstat, 10> ALL_SUBSTATS = {{
    ArtifactSubstat::critDmg,
    ArtifactSubstat::critRate,
    ArtifactSubstat::elementalMastery,
    ArtifactSubstat::energyRecharge,
    ArtifactSubstat::atkPercent,
    ArtifactSubstat::atkFlat,
    ArtifactSubstat::hpPercent,
    ArtifactSubstat::hpFlat,
    ArtifactSubstat::defPercent,
    ArtifactSubstat::defFlat
}};

constexpr bool isMainStatConflict(ArtifactMainStat mainStat, ArtifactSubstat subStat) {
    const auto mainVal = static_cast<int>(mainStat);
    return mainVal < 10 && mainVal == static_cast<int>(subStat);
}

constexpr uint32_t getSubStatWeight(ArtifactSubstat stat) {
    switch(stat) {
        case ArtifactSubstat::hpFlat:
        case ArtifactSubstat::atkFlat:
        case ArtifactSubstat::defFlat:
            return 6;

        case ArtifactSubstat::hpPercent:
        case ArtifactSubstat::atkPercent:
        case ArtifactSubstat::defPercent: 
        case ArtifactSubstat::energyRecharge: 
        case ArtifactSubstat::elementalMastery:
            return 4;

        case ArtifactSubstat::critRate:
        case ArtifactSubstat::critDmg:
            return 3;
    }   
    return 0;
}

constexpr std::array<double, 4> getSubstatValues(ArtifactSubstat subStat) {
    switch (subStat) {
        // Flat Stats
        case ArtifactSubstat::hpFlat:           return {209.13, 239.00, 268.88, 298.75};
        case ArtifactSubstat::atkFlat:          return {13.62,  15.56,  17.51,  19.45};
        case ArtifactSubstat::defFlat:          return {16.20,  18.52,  20.83,  23.15};

        // Percent Stats
        case ArtifactSubstat::hpPercent:        return {4.08,   4.66,   5.25,   5.83};
        case ArtifactSubstat::atkPercent:       return {4.08,   4.66,   5.25,   5.83};
        case ArtifactSubstat::defPercent:       return {5.10,   5.83,   6.56,   7.29};

        // Advanced Stats
        case ArtifactSubstat::energyRecharge:   return {4.53,   5.18,   5.83,   6.48};
        case ArtifactSubstat::elementalMastery: return {16.32,  18.65,  20.98,  23.31};
        case ArtifactSubstat::critRate:         return {2.72,   3.11,   3.50,   3.89};
        case ArtifactSubstat::critDmg:          return {5.44,   6.22,   6.99,   7.77};
    }
    return {0.0, 0.0, 0.0, 0.0};
}

constexpr std::optional<ArtifactSubstat> mainStatToSubStat(ArtifactMainStat mainStat) {
    switch (mainStat) {
        case ArtifactMainStat::hpFlat:              return ArtifactSubstat::hpFlat;
        case ArtifactMainStat::atkFlat:             return ArtifactSubstat::atkFlat;
        case ArtifactMainStat::defFlat:             return ArtifactSubstat::defFlat;
        case ArtifactMainStat::hpPercent:           return ArtifactSubstat::hpPercent;
        case ArtifactMainStat::atkPercent:          return ArtifactSubstat::atkPercent;
        case ArtifactMainStat::defPercent:          return ArtifactSubstat::defPercent;
        case ArtifactMainStat::energyRecharge:      return ArtifactSubstat::energyRecharge;
        case ArtifactMainStat::elementalMastery:    return ArtifactSubstat::elementalMastery;
        case ArtifactMainStat::critRate:            return ArtifactSubstat::critRate;
        case ArtifactMainStat::critDmg:             return ArtifactSubstat::critDmg;
        default: return std::nullopt;
    }
}

}