#include <catch2/catch_test_macros.hpp>
#include <catch2/matchers/catch_matchers_floating_point.hpp>
#include <random>
#include <array>
#include "../artifact/generator.hpp"

TEST_CASE("Artifact generation distributions are correct", "[distributions][generator]") {
    // Use a fixed seed for deterministic testing
    rng::Xoshiro256 rng(42);
    const int N = 1'000'000;

    std::array<long, 5> slotCount{};
    std::array<long, 25> gobletMain{}; // Use 25 to safely fit all enum bounds
    std::array<long, 20> subCount{};   // Use 20 to safely fit all enum bounds
    long fourLiners = 0, gobletTotal = 0, totalSubs = 0;

    for (int i = 0; i < N; ++i) {
        Artifact a = generator::generateArtifact(rng);
        slotCount[static_cast<int>(a.slot)]++;
        fourLiners += (a.substatCount == 4);
        if (a.slot == ArtifactSlot::goblet) {
            gobletMain[static_cast<int>(a.mainStat.type)]++;
            gobletTotal++;
        }
        for (int s = 0; s < a.substatCount; ++s) {
            subCount[static_cast<int>(a.subStats[s].type)]++;
            totalSubs++;
        }
    }

    SECTION("Four-liner rate is approximately 20%") {
        double rate = 100.0 * fourLiners / N;
        REQUIRE_THAT(rate, Catch::Matchers::WithinAbs(20.0, 0.5));
    }

    SECTION("Slot shares are approximately 20% each") {
        for (int i = 0; i < 5; ++i) {
            double rate = 100.0 * slotCount[i] / N;
            REQUIRE_THAT(rate, Catch::Matchers::WithinAbs(20.0, 0.5));
        }
    }

    SECTION("Goblet main stats match expected distributions") {
        double emRate = 100.0 * gobletMain[2] / gobletTotal; // EM
        REQUIRE_THAT(emRate, Catch::Matchers::WithinAbs(2.5, 0.5));

        double hpRate = 100.0 * gobletMain[4] / gobletTotal; // HP%
        REQUIRE_THAT(hpRate, Catch::Matchers::WithinAbs(19.25, 0.5));

        double atkRate = 100.0 * gobletMain[6] / gobletTotal; // ATK%
        REQUIRE_THAT(atkRate, Catch::Matchers::WithinAbs(19.25, 0.5));

        double defRate = 100.0 * gobletMain[8] / gobletTotal; // DEF%
        REQUIRE_THAT(defRate, Catch::Matchers::WithinAbs(19.0, 0.5));

        // Elemental / Physical Damage Bonuses
        for (int i = 11; i <= 18; ++i) {
            double elemRate = 100.0 * gobletMain[i] / gobletTotal;
            REQUIRE_THAT(elemRate, Catch::Matchers::WithinAbs(5.0, 0.5));
        }
    }

    SECTION("Substat shares match expected distribution") {
        // Expected rates from standard Genshin drop weight calculations
        std::array<double, 10> expectedSubstatRates = {
            7.9, 7.9, 10.0, 10.15, 8.95, 11.4, 8.95, 11.4, 8.95, 14.35
        };

        for (int i = 0; i < 10; ++i) {
            double rate = 100.0 * subCount[i] / totalSubs;
            REQUIRE_THAT(rate, Catch::Matchers::WithinAbs(expectedSubstatRates[i], 0.5));
        }
    }
}
