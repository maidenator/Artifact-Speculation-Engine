#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include <set>
#include <cctype>
#include "generator.hpp"

// =====================================================================
// calculateCritValue
// =====================================================================

TEST_CASE("calculateCritValue sums crit DMG plus double crit rate") {
    Artifact art;
    art.substatCount = 2;
    art.subStats[0] = { ArtifactSubstat::critDmg, 10.0 };
    art.subStats[1] = { ArtifactSubstat::critRate, 5.0 };

    // Expected: 10.0 (critDmg) + 5.0 * 2 (critRate) = 20.0
    REQUIRE(generator::calculateCritValue(art) == Catch::Approx(20.0f));
}

TEST_CASE("calculateCritValue ignores non-crit substats") {
    Artifact art;
    art.substatCount = 3;
    art.subStats[0] = { ArtifactSubstat::hpFlat, 500.0 };
    art.subStats[1] = { ArtifactSubstat::atkPercent, 10.0 };
    art.subStats[2] = { ArtifactSubstat::defPercent, 10.0 };

    REQUIRE(generator::calculateCritValue(art) == Catch::Approx(0.0f));
}

TEST_CASE("calculateCritValue only reads entries within substatCount") {
    Artifact art;
    art.substatCount = 1;
    art.subStats[0] = { ArtifactSubstat::critRate, 5.0 };
    // Garbage beyond substatCount should be ignored entirely
    art.subStats[1] = { ArtifactSubstat::critDmg, 999.0 };

    REQUIRE(generator::calculateCritValue(art) == Catch::Approx(10.0f)); // 5.0 * 2
}

// =====================================================================
// generateMainStat
// =====================================================================

TEST_CASE("generateMainStat always returns a stat belonging to that slot's table") {
    rng::Xoshiro256 gen(101);

    for (auto slot : {ArtifactSlot::flower, ArtifactSlot::feather, ArtifactSlot::sands,
                       ArtifactSlot::goblet, ArtifactSlot::circlet}) {
        auto validStats = distributions::getMainStatWeights(slot);

        for (int i = 0; i < 200; ++i) {
            auto result = generator::generateMainStat(slot, gen);
            bool found = false;
            for (const auto& w : validStats) {
                if (w.stat == result.type) { found = true; break; }
            }
            REQUIRE(found);
        }
    }
}

TEST_CASE("generateMainStat value matches the base value for the chosen stat") {
    rng::Xoshiro256 gen(202);

    for (int i = 0; i < 100; ++i) {
        auto result = generator::generateMainStat(ArtifactSlot::circlet, gen);
        double expectedBase = distributions::get5StarMainStatRange(result.type).base;
        REQUIRE(result.value == Catch::Approx(expectedBase));
    }
}

TEST_CASE("generateMainStat covers every possible stat given enough draws") {
    // Circlet has 7 possible stats, smallest weight is elementalMastery at 4%.
    // Over 5000 draws the chance of missing a 4% option is astronomically small.
    rng::Xoshiro256 gen(303);
    std::set<ArtifactMainStat> seenStats;

    for (int i = 0; i < 5000; ++i) {
        seenStats.insert(generator::generateMainStat(ArtifactSlot::circlet, gen).type);
    }

    REQUIRE(seenStats.size() == distributions::CIRCLET_MAIN_STAT_COUNT);
}

TEST_CASE("generateMainStat for flower always returns HP Flat") {
    rng::Xoshiro256 gen(404);
    for (int i = 0; i < 50; ++i) {
        REQUIRE(generator::generateMainStat(ArtifactSlot::flower, gen).type == ArtifactMainStat::hpFlat);
    }
}

// =====================================================================
// rollSubstatValue
// =====================================================================

TEST_CASE("rollSubstatValue always returns one of the four defined tiers") {
    rng::Xoshiro256 gen(505);

    for (auto stat : distributions::ALL_SUBSTATS) {
        auto tiers = distributions::getSubstatValues(stat);
        std::set<double> roundedTiers;
        for (auto v : tiers) roundedTiers.insert(std::round(v * 10.0) / 10.0);

        for (int i = 0; i < 50; ++i) {
            double rolled = generator::rollSubstatValue(stat, gen);
            REQUIRE(roundedTiers.count(rolled) == 1);
        }
    }
}

// =====================================================================
// generateArtifactSubstats
// =====================================================================

TEST_CASE("generateArtifactSubstats always produces 3 or 4 substats") {
    rng::Xoshiro256 gen(606);
    MainStat mainStat{ ArtifactMainStat::critRate, 0.0 };

    for (int i = 0; i < 500; ++i) {
        auto art = generator::generateArtifactSubstats(mainStat, gen);
        REQUIRE((art.substatCount == 3 || art.substatCount == 4));
    }
}

TEST_CASE("generateArtifactSubstats never produces duplicate substat types") {
    rng::Xoshiro256 gen(707);
    MainStat mainStat{ ArtifactMainStat::critDmg, 0.0 };

    for (int i = 0; i < 500; ++i) {
        auto art = generator::generateArtifactSubstats(mainStat, gen);
        std::set<ArtifactSubstat> seenTypes;
        for (int j = 0; j < art.substatCount; ++j) {
            seenTypes.insert(art.subStats[j].type);
        }
        REQUIRE(seenTypes.size() == static_cast<size_t>(art.substatCount));
    }
}

TEST_CASE("generateArtifactSubstats excludes the substat matching the main stat") {
    rng::Xoshiro256 gen(808);
    MainStat mainStat{ ArtifactMainStat::hpFlat, 0.0 };

    for (int i = 0; i < 500; ++i) {
        auto art = generator::generateArtifactSubstats(mainStat, gen);
        for (int j = 0; j < art.substatCount; ++j) {
            REQUIRE_FALSE(art.subStats[j].type == ArtifactSubstat::hpFlat);
        }
    }
}

TEST_CASE("generateArtifactSubstats four-liner rate is roughly 20 percent") {
    // Loose statistical check (not an exact probability assertion) --
    // catches gross breakage like the roll always/never landing on 0.
    rng::Xoshiro256 gen(909);
    MainStat mainStat{ ArtifactMainStat::critRate, 0.0 };

    int fourLinerCount = 0;
    const int sampleSize = 5000;
    for (int i = 0; i < sampleSize; ++i) {
        if (generator::generateArtifactSubstats(mainStat, gen).substatCount == 4) {
            fourLinerCount++;
        }
    }

    double rate = static_cast<double>(fourLinerCount) / sampleSize;
    REQUIRE(rate > 0.15);
    REQUIRE(rate < 0.25);
}

// =====================================================================
// generateArtifactId
// =====================================================================

TEST_CASE("generateArtifactId always has the art_ prefix and 9 numeric digits") {
    rng::Xoshiro256 gen(111);

    for (int i = 0; i < 200; ++i) {
        std::string id = generator::generateArtifactId(gen);
        REQUIRE(id.rfind("art_", 0) == 0); // starts with "art_"

        std::string digits = id.substr(4);
        REQUIRE(digits.size() == 9);
        for (char c : digits) {
            REQUIRE(std::isdigit(static_cast<unsigned char>(c)));
        }
    }
}

TEST_CASE("generateArtifactId produces no duplicates across many calls") {
    rng::Xoshiro256 gen(222);
    std::set<std::string> ids;

    const int sampleSize = 5000;
    for (int i = 0; i < sampleSize; ++i) {
        ids.insert(generator::generateArtifactId(gen));
    }

    REQUIRE(ids.size() == sampleSize);
}

// =====================================================================
// generateArtifact
// =====================================================================

TEST_CASE("generateArtifact produces a fully well-formed artifact") {
    rng::Xoshiro256 gen(333);

    for (int i = 0; i < 500; ++i) {
        Artifact art = generator::generateArtifact(gen);

        REQUIRE(art.id.has_value());
        REQUIRE(art.level == 0);
        REQUIRE((art.substatCount == 3 || art.substatCount == 4));

        // Main stat value should equal that stat's base value at level 0
        double expectedBase = distributions::get5StarMainStatRange(art.mainStat.type).base;
        REQUIRE(art.mainStat.value == Catch::Approx(expectedBase));

        // Main stat should belong to the chosen slot's valid table
        auto validStats = distributions::getMainStatWeights(art.slot);
        bool mainStatValid = false;
        for (const auto& w : validStats) {
            if (w.stat == art.mainStat.type) { mainStatValid = true; break; }
        }
        REQUIRE(mainStatValid);

        // No substat should duplicate the main stat's mapped substat
        if (auto mapped = distributions::mainStatToSubStat(art.mainStat.type)) {
            for (int j = 0; j < art.substatCount; ++j) {
                REQUIRE_FALSE(art.subStats[j].type == *mapped);
            }
        }

        // No duplicate substats among themselves
        std::set<ArtifactSubstat> seenTypes;
        for (int j = 0; j < art.substatCount; ++j) seenTypes.insert(art.subStats[j].type);
        REQUIRE(seenTypes.size() == static_cast<size_t>(art.substatCount));
    }
}

// =====================================================================
// upgradeArtifactOnce
// =====================================================================

TEST_CASE("upgradeArtifactOnce increases level by exactly 4 each call") {
    rng::Xoshiro256 gen(444);
    Artifact art = generator::generateArtifact(gen);

    int expectedLevel = 0;
    while (art.level < 20) {
        generator::upgradeArtifactOnce(art, gen);
        expectedLevel += 4;
        REQUIRE(art.level == expectedLevel);
    }
    REQUIRE(art.level == 20);
}

TEST_CASE("upgradeArtifactOnce updates main stat value to match the new level") {
    rng::Xoshiro256 gen(555);
    Artifact art = generator::generateArtifact(gen);

    generator::upgradeArtifactOnce(art, gen);

    double expectedValue = distributions::getMainStatValue(art.mainStat.type, art.level);
    REQUIRE(art.mainStat.value == Catch::Approx(expectedValue));
}

TEST_CASE("upgradeArtifactOnce adds a distinct 4th substat to a 3-liner") {
    rng::Xoshiro256 gen(666);

    Artifact art;
    art.mainStat = { ArtifactMainStat::critRate, 0.0 };
    art.level = 0;
    art.substatCount = 3;
    art.subStats[0] = { ArtifactSubstat::hpFlat, 209.13 };
    art.subStats[1] = { ArtifactSubstat::atkPercent, 4.08 };
    art.subStats[2] = { ArtifactSubstat::energyRecharge, 4.53 };

    generator::upgradeArtifactOnce(art, gen);

    REQUIRE(art.substatCount == 4);

    // The new 4th substat must not duplicate any existing substat...
    REQUIRE(art.subStats[3].type != art.subStats[0].type);
    REQUIRE(art.subStats[3].type != art.subStats[1].type);
    REQUIRE(art.subStats[3].type != art.subStats[2].type);
    // ...nor the main stat's mapped substat (critRate)
    REQUIRE(art.subStats[3].type != ArtifactSubstat::critRate);
}

TEST_CASE("upgradeArtifactOnce boosts exactly one existing substat on a 4-liner") {
    rng::Xoshiro256 gen(777);

    Artifact art;
    art.mainStat = { ArtifactMainStat::critRate, 0.0 };
    art.level = 4;
    art.substatCount = 4;
    art.subStats[0] = { ArtifactSubstat::hpFlat, 209.13 };
    art.subStats[1] = { ArtifactSubstat::atkPercent, 4.08 };
    art.subStats[2] = { ArtifactSubstat::energyRecharge, 4.53 };
    art.subStats[3] = { ArtifactSubstat::defFlat, 16.20 };

    double before[4];
    ArtifactSubstat typesBefore[4];
    for (int i = 0; i < 4; ++i) {
        before[i] = art.subStats[i].value;
        typesBefore[i] = art.subStats[i].type;
    }

    generator::upgradeArtifactOnce(art, gen);

    REQUIRE(art.substatCount == 4);

    int changedCount = 0;
    for (int i = 0; i < 4; ++i) {
        REQUIRE(art.subStats[i].type == typesBefore[i]); // types never change in this branch
        if (art.subStats[i].value != Catch::Approx(before[i])) {
            REQUIRE(art.subStats[i].value > before[i]); // boosted value only ever increases
            changedCount++;
        }
    }
    REQUIRE(changedCount == 1);
}

TEST_CASE("upgradeArtifactOnce never introduces a substat matching the main stat") {
    rng::Xoshiro256 gen(888);

    for (int trial = 0; trial < 200; ++trial) {
        Artifact art = generator::generateArtifact(gen);
        if (art.substatCount != 3) continue; // only exercises the 3->4 branch

        auto mapped = distributions::mainStatToSubStat(art.mainStat.type);
        generator::upgradeArtifactOnce(art, gen);

        if (mapped) {
            REQUIRE(art.subStats[3].type != *mapped);
        }
    }
}