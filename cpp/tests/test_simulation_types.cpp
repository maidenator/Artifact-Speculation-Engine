#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include <vector>
#include "artifact/types.hpp"
#include "domain/simulation_types.hpp" // adjust to your actual header path

using Catch::Approx;

namespace {

// Helper to construct mock artifacts quickly
Artifact createMockArtifact(
    ArtifactSlot slot,
    ArtifactMainStat mainStat,
    const std::vector<SubstatRoll>& substats
) {
    Artifact art;
    art.slot = slot;
    art.mainStat = MainStat{ mainStat, 46.6 };
    art.substatCount = static_cast<int>(substats.size());
    for (size_t i = 0; i < substats.size() && i < 4; ++i) {
        art.subStats[i] = substats[i];
    }
    return art;
}

} // namespace

// =====================================================================
// evaluateArtifactScore
// =====================================================================

TEST_CASE("evaluateArtifactScore: falls back to Crit Value when weights are empty") {
    // 14.8 crit DMG and 3.9 crit rate
    Artifact art = createMockArtifact(
        ArtifactSlot::feather,
        ArtifactMainStat::atkFlat,
        {
            SubstatRoll{ ArtifactSubstat::critDmg, 14.8, 2 },
            SubstatRoll{ ArtifactSubstat::critRate, 3.9, 1 },
            SubstatRoll{ ArtifactSubstat::atkPercent, 5.8, 1 }
        }
    );

    SimulationConfig config;
    config.substatWeights.clear();

    // Expected CV: 14.8 + (3.9 * 2) = 22.6
    REQUIRE(evaluateArtifactScore(art, config) == Approx(22.6).margin(0.001));
}

TEST_CASE("evaluateArtifactScore: custom substat weights are applied") {
    Artifact art = createMockArtifact(
        ArtifactSlot::sands,
        ArtifactMainStat::atkPercent,
        {
            SubstatRoll{ ArtifactSubstat::critRate, 10.0, 3 },       // weight 2.0 -> 20.0
            SubstatRoll{ ArtifactSubstat::critDmg, 20.0, 3 },        // weight 1.0 -> 20.0
            SubstatRoll{ ArtifactSubstat::energyRecharge, 10.0, 2 }, // weight 0.5 -> 5.0
            SubstatRoll{ ArtifactSubstat::defFlat, 30.0, 1 }         // unweighted -> 0.0
        }
    );

    SimulationConfig config;
    config.substatWeights = {
        { ArtifactSubstat::critRate, 2.0 },
        { ArtifactSubstat::critDmg, 1.0 },
        { ArtifactSubstat::energyRecharge, 0.5 }
    };

    // Expected: (10.0 * 2.0) + (20.0 * 1.0) + (10.0 * 0.5) = 45.0
    REQUIRE(evaluateArtifactScore(art, config) == Approx(45.0).margin(0.001));
}

// =====================================================================
// satisfiesTargetCriteria
// =====================================================================

TEST_CASE("satisfiesTargetCriteria: slot and main stat filtering") {
    Artifact gobletElectro = createMockArtifact(
        ArtifactSlot::goblet,
        ArtifactMainStat::electroDmg,
        { SubstatRoll{ ArtifactSubstat::critRate, 3.9, 1 } }
    );

    SimulationConfig config;
    config.targetSlot = ArtifactSlot::goblet;
    config.targetMainStat = ArtifactMainStat::electroDmg;

    SECTION("exact match passes") {
        REQUIRE(satisfiesTargetCriteria(gobletElectro, config, 0.0) == true);
    }

    SECTION("wrong slot fails") {
        config.targetSlot = ArtifactSlot::circlet;
        REQUIRE(satisfiesTargetCriteria(gobletElectro, config, 0.0) == false);
    }

    SECTION("wrong main stat fails") {
        config.targetMainStat = ArtifactMainStat::pyroDmg;
        REQUIRE(satisfiesTargetCriteria(gobletElectro, config, 0.0) == false);
    }
}

TEST_CASE("satisfiesTargetCriteria: minimum Crit Value threshold") {
    // CV = 7.0 + (3.5 * 2) = 14.0
    Artifact artLowCV = createMockArtifact(
        ArtifactSlot::flower,
        ArtifactMainStat::hpFlat,
        {
            SubstatRoll{ ArtifactSubstat::critRate, 3.5, 1 },
            SubstatRoll{ ArtifactSubstat::critDmg, 7.0, 1 }
        }
    );

    SimulationConfig config;

    SECTION("14.0 CV fails a 30.0 threshold") {
        config.minCritValue = 30.0;
        REQUIRE(satisfiesTargetCriteria(artLowCV, config, 0.0) == false);
    }

    SECTION("14.0 CV passes a 10.0 threshold") {
        config.minCritValue = 10.0;
        REQUIRE(satisfiesTargetCriteria(artLowCV, config, 0.0) == true);
    }
}