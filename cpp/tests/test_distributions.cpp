#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include <vector>
#include "distributions.hpp"

// =====================================================================
// Main Stat Weight Tables (FLOWER / FEATHER / SANDS / GOBLET / CIRCLET)
// =====================================================================

TEST_CASE("Flower main stat is always HP Flat at 100%") {
    REQUIRE(distributions::FLOWER_MAIN_STATS.size() == 1);
    REQUIRE(distributions::FLOWER_MAIN_STATS[0].stat == ArtifactMainStat::hpFlat);
    REQUIRE(distributions::FLOWER_MAIN_STATS[0].weight == Catch::Approx(100.0));
}

TEST_CASE("Feather main stat is always ATK Flat at 100%") {
    REQUIRE(distributions::FEATHER_MAIN_STATS.size() == 1);
    REQUIRE(distributions::FEATHER_MAIN_STATS[0].stat == ArtifactMainStat::atkFlat);
    REQUIRE(distributions::FEATHER_MAIN_STATS[0].weight == Catch::Approx(100.0));
}

TEST_CASE("Sands has exactly 5 possible main stats") {
    REQUIRE(distributions::SANDS_MAIN_STATS.size() == 5);
}

TEST_CASE("Sands main stat weights sum to 100") {
    double sum = 0.0;
    for (const auto& w : distributions::SANDS_MAIN_STATS) sum += w.weight;
    REQUIRE(sum == Catch::Approx(100.0).margin(0.01));
}

TEST_CASE("Goblet has exactly 12 possible main stats") {
    REQUIRE(distributions::GOBLET_MAIN_STATS.size() == 12);
}

TEST_CASE("Goblet main stat weights sum to 100") {
    double sum = 0.0;
    for (const auto& w : distributions::GOBLET_MAIN_STATS) sum += w.weight;
    REQUIRE(sum == Catch::Approx(100.0).margin(0.01));
}

TEST_CASE("Goblet elemental damage bonuses are all equally weighted at 5%") {
    // pyro, hydro, electro, cryo, anemo, geo, dendro, physical
    int elementalCount = 0;
    for (const auto& w : distributions::GOBLET_MAIN_STATS) {
        if (w.stat == ArtifactMainStat::pyroDmg   || w.stat == ArtifactMainStat::hydroDmg  ||
            w.stat == ArtifactMainStat::electroDmg|| w.stat == ArtifactMainStat::cryoDmg   ||
            w.stat == ArtifactMainStat::anemoDmg  || w.stat == ArtifactMainStat::geoDmg    ||
            w.stat == ArtifactMainStat::dendroDmg || w.stat == ArtifactMainStat::physicalDmg) {
            REQUIRE(w.weight == Catch::Approx(5.0));
            elementalCount++;
        }
    }
    REQUIRE(elementalCount == 8);
}

TEST_CASE("Circlet has exactly 7 possible main stats") {
    REQUIRE(distributions::CIRCLET_MAIN_STATS.size() == 7);
}

TEST_CASE("Circlet main stat weights sum to 100") {
    double sum = 0.0;
    for (const auto& w : distributions::CIRCLET_MAIN_STATS) sum += w.weight;
    REQUIRE(sum == Catch::Approx(100.0).margin(0.01));
}

TEST_CASE("Circlet crit stats and healing bonus are all weighted at 10%") {
    int checkedCount = 0;
    for (const auto& w : distributions::CIRCLET_MAIN_STATS) {
        if (w.stat == ArtifactMainStat::critRate ||
            w.stat == ArtifactMainStat::critDmg  ||
            w.stat == ArtifactMainStat::healingBonus) {
            REQUIRE(w.weight == Catch::Approx(10.0));
            checkedCount++;
        }
    }
    REQUIRE(checkedCount == 3);
}

// =====================================================================
// getMainStatWeights (slot -> weight table dispatcher)
// =====================================================================

TEST_CASE("getMainStatWeights routes each slot to its correct table") {
    SECTION("Flower returns FLOWER_MAIN_STATS") {
        auto weights = distributions::getMainStatWeights(ArtifactSlot::flower);
        REQUIRE(weights.data() == distributions::FLOWER_MAIN_STATS.data());
        REQUIRE(weights.size() == distributions::FLOWER_MAIN_STATS.size());
    }

    SECTION("Feather returns FEATHER_MAIN_STATS") {
        auto weights = distributions::getMainStatWeights(ArtifactSlot::feather);
        REQUIRE(weights.data() == distributions::FEATHER_MAIN_STATS.data());
        REQUIRE(weights.size() == distributions::FEATHER_MAIN_STATS.size());
    }

    SECTION("Sands returns SANDS_MAIN_STATS") {
        auto weights = distributions::getMainStatWeights(ArtifactSlot::sands);
        REQUIRE(weights.data() == distributions::SANDS_MAIN_STATS.data());
        REQUIRE(weights.size() == distributions::SANDS_MAIN_STATS.size());
    }

    SECTION("Goblet returns GOBLET_MAIN_STATS") {
        auto weights = distributions::getMainStatWeights(ArtifactSlot::goblet);
        REQUIRE(weights.data() == distributions::GOBLET_MAIN_STATS.data());
        REQUIRE(weights.size() == distributions::GOBLET_MAIN_STATS.size());
    }

    SECTION("Circlet returns CIRCLET_MAIN_STATS") {
        auto weights = distributions::getMainStatWeights(ArtifactSlot::circlet);
        REQUIRE(weights.data() == distributions::CIRCLET_MAIN_STATS.data());
        REQUIRE(weights.size() == distributions::CIRCLET_MAIN_STATS.size());
    }
}

TEST_CASE("getMainStatWeights never returns an empty span for a valid slot") {
    for (auto slot : {ArtifactSlot::flower, ArtifactSlot::feather, ArtifactSlot::sands,
                       ArtifactSlot::goblet, ArtifactSlot::circlet}) {
        REQUIRE_FALSE(distributions::getMainStatWeights(slot).empty());
    }
}

// =====================================================================
// get5StarMainStatRange (base/max value ranges per main stat)
// =====================================================================

TEST_CASE("get5StarMainStatRange: known exact values for hpFlat and critRate") {
    auto hpFlat = distributions::get5StarMainStatRange(ArtifactMainStat::hpFlat);
    REQUIRE(hpFlat.base == Catch::Approx(717.0));
    REQUIRE(hpFlat.max  == Catch::Approx(4780.0));

    auto critRate = distributions::get5StarMainStatRange(ArtifactMainStat::critRate);
    REQUIRE(critRate.base == Catch::Approx(4.7));
    REQUIRE(critRate.max  == Catch::Approx(31.1));
}

TEST_CASE("get5StarMainStatRange: max is always greater than base for valid stats") {
    // defFlat is explicitly not a valid main stat (returns {0.0, 0.0}), so skip it
    std::vector<ArtifactMainStat> validStats = {
        ArtifactMainStat::hpFlat, ArtifactMainStat::atkFlat,
        ArtifactMainStat::hpPercent, ArtifactMainStat::atkPercent, ArtifactMainStat::defPercent,
        ArtifactMainStat::energyRecharge, ArtifactMainStat::elementalMastery,
        ArtifactMainStat::critRate, ArtifactMainStat::critDmg, ArtifactMainStat::healingBonus,
        ArtifactMainStat::pyroDmg, ArtifactMainStat::hydroDmg, ArtifactMainStat::electroDmg,
        ArtifactMainStat::cryoDmg, ArtifactMainStat::anemoDmg, ArtifactMainStat::geoDmg,
        ArtifactMainStat::dendroDmg, ArtifactMainStat::physicalDmg
    };

    for (auto stat : validStats) {
        auto range = distributions::get5StarMainStatRange(stat);
        REQUIRE(range.max > range.base);
    }
}

TEST_CASE("get5StarMainStatRange: defFlat is explicitly invalid as a main stat") {
    auto range = distributions::get5StarMainStatRange(ArtifactMainStat::defFlat);
    REQUIRE(range.base == Catch::Approx(0.0));
    REQUIRE(range.max == Catch::Approx(0.0));
}

TEST_CASE("get5StarMainStatRange: hpPercent and atkPercent share the same range") {
    auto hp  = distributions::get5StarMainStatRange(ArtifactMainStat::hpPercent);
    auto atk = distributions::get5StarMainStatRange(ArtifactMainStat::atkPercent);
    REQUIRE(hp.base == Catch::Approx(atk.base));
    REQUIRE(hp.max  == Catch::Approx(atk.max));
}

TEST_CASE("get5StarMainStatRange: all elemental DMG bonuses share the same range") {
    // physicalDmg deliberately excluded -- it shares defPercent's range instead
    std::vector<ArtifactMainStat> elementalStats = {
        ArtifactMainStat::pyroDmg, ArtifactMainStat::hydroDmg, ArtifactMainStat::electroDmg,
        ArtifactMainStat::cryoDmg, ArtifactMainStat::anemoDmg, ArtifactMainStat::geoDmg,
        ArtifactMainStat::dendroDmg
    };
    auto reference = distributions::get5StarMainStatRange(elementalStats[0]);
    for (auto stat : elementalStats) {
        auto range = distributions::get5StarMainStatRange(stat);
        REQUIRE(range.base == Catch::Approx(reference.base));
        REQUIRE(range.max  == Catch::Approx(reference.max));
    }
}

// =====================================================================
// getMainStatValue (level-interpolated main stat value)
// =====================================================================

TEST_CASE("getMainStatValue: level 0 (or below) returns base value") {
    auto range = distributions::get5StarMainStatRange(ArtifactMainStat::critRate);
    REQUIRE(distributions::getMainStatValue(ArtifactMainStat::critRate, 0) == Catch::Approx(range.base));
    REQUIRE(distributions::getMainStatValue(ArtifactMainStat::critRate, -5) == Catch::Approx(range.base));
}

TEST_CASE("getMainStatValue: level 20 returns max value") {
    auto range = distributions::get5StarMainStatRange(ArtifactMainStat::critRate);
    REQUIRE(distributions::getMainStatValue(ArtifactMainStat::critRate, 20) == Catch::Approx(range.max));
}

TEST_CASE("getMainStatValue: level above 20 still clamps to max") {
    auto range = distributions::get5StarMainStatRange(ArtifactMainStat::critRate);
    REQUIRE(distributions::getMainStatValue(ArtifactMainStat::critRate, 999) == Catch::Approx(range.max));
}

TEST_CASE("getMainStatValue: non-5-star rarity always returns base regardless of level") {
    auto range = distributions::get5StarMainStatRange(ArtifactMainStat::critRate);
    REQUIRE(distributions::getMainStatValue(ArtifactMainStat::critRate, 20, 4) == Catch::Approx(range.base));
}

TEST_CASE("getMainStatValue: interpolates linearly at intermediate levels") {
    auto range = distributions::get5StarMainStatRange(ArtifactMainStat::critRate);
    double expectedAtLevel10 = range.base + ((range.max - range.base) / 20.0) * 10;
    REQUIRE(distributions::getMainStatValue(ArtifactMainStat::critRate, 10) == Catch::Approx(expectedAtLevel10));
}

// =====================================================================
// isMainStatConflict (main stat vs. substat overlap check)
// =====================================================================

TEST_CASE("isMainStatConflict: detects true conflicts") {
    REQUIRE(distributions::isMainStatConflict(ArtifactMainStat::critRate, ArtifactSubstat::critRate));
    REQUIRE(distributions::isMainStatConflict(ArtifactMainStat::hpFlat, ArtifactSubstat::hpFlat));
    REQUIRE(distributions::isMainStatConflict(ArtifactMainStat::defFlat, ArtifactSubstat::defFlat));
}

TEST_CASE("isMainStatConflict: no false positives for different stats") {
    REQUIRE_FALSE(distributions::isMainStatConflict(ArtifactMainStat::critRate, ArtifactSubstat::hpFlat));
    REQUIRE_FALSE(distributions::isMainStatConflict(ArtifactMainStat::hpFlat, ArtifactSubstat::critRate));
}

TEST_CASE("isMainStatConflict: exclusive main stats never conflict with any substat") {
    std::vector<ArtifactMainStat> exclusiveStats = {
        ArtifactMainStat::healingBonus, ArtifactMainStat::pyroDmg, ArtifactMainStat::hydroDmg,
        ArtifactMainStat::electroDmg, ArtifactMainStat::cryoDmg, ArtifactMainStat::anemoDmg,
        ArtifactMainStat::geoDmg, ArtifactMainStat::dendroDmg, ArtifactMainStat::physicalDmg
    };
    for (auto mainStat : exclusiveStats) {
        for (auto subStat : distributions::ALL_SUBSTATS) {
            REQUIRE_FALSE(distributions::isMainStatConflict(mainStat, subStat));
        }
    }
}

// =====================================================================
// getSubStatWeight (substat roll weight)
// =====================================================================

TEST_CASE("getSubStatWeight: flat stats weigh 6") {
    REQUIRE(distributions::getSubStatWeight(ArtifactSubstat::hpFlat) == 6);
    REQUIRE(distributions::getSubStatWeight(ArtifactSubstat::atkFlat) == 6);
    REQUIRE(distributions::getSubStatWeight(ArtifactSubstat::defFlat) == 6);
}

TEST_CASE("getSubStatWeight: percent/advanced stats weigh 4") {
    REQUIRE(distributions::getSubStatWeight(ArtifactSubstat::hpPercent) == 4);
    REQUIRE(distributions::getSubStatWeight(ArtifactSubstat::atkPercent) == 4);
    REQUIRE(distributions::getSubStatWeight(ArtifactSubstat::defPercent) == 4);
    REQUIRE(distributions::getSubStatWeight(ArtifactSubstat::energyRecharge) == 4);
    REQUIRE(distributions::getSubStatWeight(ArtifactSubstat::elementalMastery) == 4);
}

TEST_CASE("getSubStatWeight: crit stats weigh 3") {
    REQUIRE(distributions::getSubStatWeight(ArtifactSubstat::critRate) == 3);
    REQUIRE(distributions::getSubStatWeight(ArtifactSubstat::critDmg) == 3);
}

TEST_CASE("getSubStatWeight: every entry in ALL_SUBSTATS has a nonzero weight") {
    for (auto stat : distributions::ALL_SUBSTATS) {
        REQUIRE(distributions::getSubStatWeight(stat) > 0);
    }
}

// =====================================================================
// getSubstatValues (4-tier roll values per substat)
// =====================================================================

TEST_CASE("getSubstatValues: known exact values for hpFlat and critDmg") {
    auto hpFlat = distributions::getSubstatValues(ArtifactSubstat::hpFlat);
    REQUIRE(hpFlat[0] == Catch::Approx(209.13));
    REQUIRE(hpFlat[3] == Catch::Approx(298.75));

    auto critDmg = distributions::getSubstatValues(ArtifactSubstat::critDmg);
    REQUIRE(critDmg[0] == Catch::Approx(5.44));
    REQUIRE(critDmg[3] == Catch::Approx(7.77));
}

TEST_CASE("getSubstatValues: each roll tier is strictly increasing") {
    for (auto stat : distributions::ALL_SUBSTATS) {
        auto values = distributions::getSubstatValues(stat);
        REQUIRE(values[0] < values[1]);
        REQUIRE(values[1] < values[2]);
        REQUIRE(values[2] < values[3]);
    }
}

TEST_CASE("getSubstatValues: hpPercent and atkPercent share identical roll values") {
    auto hp  = distributions::getSubstatValues(ArtifactSubstat::hpPercent);
    auto atk = distributions::getSubstatValues(ArtifactSubstat::atkPercent);
    for (int i = 0; i < 4; ++i) {
        REQUIRE(hp[i] == Catch::Approx(atk[i]));
    }
}

// =====================================================================
// mainStatToSubStat (main stat -> equivalent substat mapping)
// =====================================================================

TEST_CASE("mainStatToSubStat: shared stats map to their substat equivalent") {
    REQUIRE(distributions::mainStatToSubStat(ArtifactMainStat::hpFlat) == ArtifactSubstat::hpFlat);
    REQUIRE(distributions::mainStatToSubStat(ArtifactMainStat::critRate) == ArtifactSubstat::critRate);
    REQUIRE(distributions::mainStatToSubStat(ArtifactMainStat::elementalMastery) == ArtifactSubstat::elementalMastery);
}

TEST_CASE("mainStatToSubStat: exclusive main stats return nullopt") {
    REQUIRE_FALSE(distributions::mainStatToSubStat(ArtifactMainStat::healingBonus).has_value());
    REQUIRE_FALSE(distributions::mainStatToSubStat(ArtifactMainStat::pyroDmg).has_value());
    REQUIRE_FALSE(distributions::mainStatToSubStat(ArtifactMainStat::physicalDmg).has_value());
}

TEST_CASE("mainStatToSubStat: result is consistent with isMainStatConflict") {
    // Any main stat that maps to a substat should conflict with exactly that substat
    std::vector<ArtifactMainStat> allMainStats = {
        ArtifactMainStat::hpFlat, ArtifactMainStat::atkFlat, ArtifactMainStat::defFlat,
        ArtifactMainStat::hpPercent, ArtifactMainStat::atkPercent, ArtifactMainStat::defPercent,
        ArtifactMainStat::energyRecharge, ArtifactMainStat::elementalMastery,
        ArtifactMainStat::critRate, ArtifactMainStat::critDmg
    };
    for (auto mainStat : allMainStats) {
        auto mapped = distributions::mainStatToSubStat(mainStat);
        REQUIRE(mapped.has_value());
        REQUIRE(distributions::isMainStatConflict(mainStat, *mapped));
    }
}