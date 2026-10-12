#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include <string>
#include <cstdint>
#include <nlohmann/json.hpp>

#include "domain/artifact_interface.hpp" // adjust path if needed

using json = nlohmann::json;

// =====================================================================
// Seed determinism
// =====================================================================

TEST_CASE("ArtifactInterface: identical seeds produce identical batch output") {
    uint64_t seed = 424242;
    ArtifactInterface engine1(seed);
    ArtifactInterface engine2(seed);

    std::string batch1 = engine1.generateBatchJson(10, true);
    std::string batch2 = engine2.generateBatchJson(10, true);

    REQUIRE(batch1 == batch2);
}

// =====================================================================
// generateBatchJson
// =====================================================================

TEST_CASE("ArtifactInterface: generateBatchJson returns valid level 20 artifacts") {
    ArtifactInterface engine(12345);
    const int count = 5;

    json parsed = json::parse(engine.generateBatchJson(count, true));

    REQUIRE(parsed.is_array());
    REQUIRE(parsed.size() == static_cast<size_t>(count));

    for (const auto& art : parsed) {
        REQUIRE(art.contains("slot"));
        REQUIRE(art.contains("level"));
        REQUIRE(art["level"].get<int>() == 20);   // batch generator upgrades to +20
        REQUIRE(art.contains("mainStat"));
        REQUIRE(art.contains("subStats"));
        REQUIRE(art["subStats"].size() == 4);     // 5 upgrades always end as a 4-liner
        REQUIRE(art.contains("critValue"));
    }
}

TEST_CASE("ArtifactInterface: generateBatchWithHistoryJson returns history arrays") {
    ArtifactInterface engine(12345);
    const int count = 3;

    json parsed = json::parse(engine.generateBatchWithHistoryJson(count));

    REQUIRE(parsed.is_array());
    REQUIRE(parsed.size() == static_cast<size_t>(count));

    for (const auto& history : parsed) {
        REQUIRE(history.is_array());
        REQUIRE(history.size() == 6); // +0, +4, +8, +12, +16, +20
        
        REQUIRE(history[0]["level"].get<int>() == 0);
        REQUIRE(history[5]["level"].get<int>() == 20);
    }
}

// =====================================================================
// executeSimulation: FixedResin mode
// =====================================================================

TEST_CASE("ArtifactInterface: FixedResin mode stops exactly at the resin budget") {
    ArtifactInterface engine(999);

    SimulationConfig config;
    config.mode = SimulationMode::FixedResin;
    config.resinBudget = 200; // exactly 10 domain runs at 20 resin each
    config.topK = 3;
    config.useStrongBox = false;

    SimulationSummary summary = engine.executeSimulation(config);

    REQUIRE(summary.totalResinSpent == 200);
    REQUIRE(summary.domainRunsCompleted == 10);
    REQUIRE(summary.strongboxRollsCompleted == 0);
    REQUIRE(summary.topArtifacts.size() <= 3);
    REQUIRE(summary.equivalentDays == Catch::Approx(200.0 / 180.0).margin(0.001));
}

// =====================================================================
// Top-K reservoir ordering
// =====================================================================

TEST_CASE("ArtifactInterface: top artifacts are sorted by descending score") {
    ArtifactInterface engine(777);

    SimulationConfig config;
    config.mode = SimulationMode::FixedResin;
    config.resinBudget = 1000;
    config.topK = 5;
    config.useStrongBox = false;
    config.substatWeights.clear(); // fall back to CV scoring

    SimulationSummary summary = engine.executeSimulation(config);

    REQUIRE_FALSE(summary.topArtifacts.empty());
    REQUIRE(summary.topArtifacts.size() <= 5);

    double previousScore = 1e9;
    for (const auto& art : summary.topArtifacts) {
        double currentScore = evaluateArtifactScore(art, config);
        REQUIRE(currentScore <= previousScore);
        previousScore = currentScore;
    }
}

// =====================================================================
// Strongbox recycling
// =====================================================================

TEST_CASE("ArtifactInterface: strongbox recycling produces extra rerolls") {
    ArtifactInterface engine(555);

    SimulationConfig config;
    config.mode = SimulationMode::FixedResin;
    config.resinBudget = 2000;
    config.useStrongBox = true;

    SimulationSummary summary = engine.executeSimulation(config);

    REQUIRE(summary.strongboxRollsCompleted > 0);
    // Total 5-stars found must exceed the initial domain drops alone
    REQUIRE(summary.totalFiveStarsFound > summary.domainRunsCompleted);
}

// =====================================================================
// HuntList mode
// =====================================================================

TEST_CASE("ArtifactInterface: HuntList mode finds targets and records exact resin") {
    ArtifactInterface engine(10101);

    SimulationConfig config;
    config.mode = SimulationMode::HuntList;
    config.resinBudget = 20000;
    config.useStrongBox = false;

    // Search for a Flower with HP Flat main stat (always guaranteed for Flower)
    // and at least 1 roll of Crit Rate
    HuntTarget target1;
    target1.id = "flower-cr";
    target1.slot = ArtifactSlot::flower;
    target1.mainStat = ArtifactMainStat::hpFlat;
    target1.setIndex = -1; // either set
    target1.substats.push_back({ ArtifactSubstat::critRate, 1, 0.0 });
    config.huntTargets.push_back(target1);

    SimulationSummary summary = engine.executeSimulation(config);

    REQUIRE(summary.targetAchieved == true);
    REQUIRE(summary.huntResults.size() == 1);
    REQUIRE(summary.huntResults[0].found == true);
    REQUIRE(summary.huntResults[0].id == "flower-cr");
    REQUIRE(summary.huntResults[0].resinSpent > 0);
    REQUIRE(summary.huntResults[0].resinSpent <= summary.totalResinSpent);
    REQUIRE(summary.huntResults[0].artifact.has_value());
    REQUIRE(summary.huntResults[0].artifact->slot == ArtifactSlot::flower);
}

// =====================================================================
// Dedicated Regression Tests for the 4 Hunt Bugs
// =====================================================================

TEST_CASE("Regression 1: HuntList checks every drop and bypasses topK reservoir cap") {
    ArtifactInterface engine(4242);

    SimulationConfig config;
    config.mode = SimulationMode::HuntList;
    config.resinBudget = 4000; // 200 runs, ~213 drops >> topK
    config.topK = 3; // tiny reservoir cap
    config.useStrongBox = false;

    // Search for a Sands with DefPercent main stat (0 crit stats, would not make top-3)
    HuntTarget target;
    target.id = "def-sands";
    target.slot = ArtifactSlot::sands;
    target.mainStat = ArtifactMainStat::defPercent;
    target.setIndex = -1;
    config.huntTargets.push_back(target);

    SimulationSummary summary = engine.executeSimulation(config);

    REQUIRE(summary.huntResults.size() == 1);
    REQUIRE(summary.huntResults[0].found == true);
    REQUIRE(summary.huntResults[0].artifact.has_value());
    REQUIRE(summary.huntResults[0].artifact->slot == ArtifactSlot::sands);
    REQUIRE(summary.huntResults[0].artifact->mainStat.type == ArtifactMainStat::defPercent);
}

TEST_CASE("Regression 2: Drop set chance is 50%, not 25%") {
    // In the old implementation, a 50% coin-flip was performed in C++ to discard pieces,
    // and then another 50% roll in JS reduced the probability of the target set to 25%.
    // In the new implementation, every drop is assigned setIndex 0 or 1 with equal 50% probability.
    int set0Found = 0;
    int set1Found = 0;
    const int trials = 100;

    for (int i = 0; i < trials; ++i) {
        ArtifactInterface engine(3000 + i);

        // 10 runs (200 resin) ≈ 10.6 drops. With 50% set chance, P(flower set 0) = 1 - (0.9)^10.6 ≈ 67%.
        // Under the old 25% bug, P(flower set 0) = 1 - (0.95)^10.6 ≈ 42%.
        SimulationConfig config0;
        config0.mode = SimulationMode::HuntList;
        config0.resinBudget = 200;
        config0.useStrongBox = false;
        config0.huntTargets = { HuntTarget{ "f0", ArtifactSlot::flower, ArtifactMainStat::hpFlat, 0, {} } };

        if (engine.executeSimulation(config0).huntResults[0].found) {
            set0Found++;
        }

        SimulationConfig config1;
        config1.mode = SimulationMode::HuntList;
        config1.resinBudget = 200;
        config1.useStrongBox = false;
        config1.huntTargets = { HuntTarget{ "f1", ArtifactSlot::flower, ArtifactMainStat::hpFlat, 1, {} } };

        if (engine.executeSimulation(config1).huntResults[0].found) {
            set1Found++;
        }
    }

    // Both sets must drop with 50% symmetry, well above the 42% threshold of the 25% bug
    REQUIRE(set0Found >= 55);
    REQUIRE(set1Found >= 55);
    REQUIRE(std::abs(set0Found - set1Found) <= 20);
}

TEST_CASE("Regression 3: Set matching strictly respects setIndex (0, 1, and -1)") {
    ArtifactInterface engine(55555);

    // Target 0 only accepts set 0
    HuntTarget target0;
    target0.id = "set-0";
    target0.slot = ArtifactSlot::flower;
    target0.mainStat = ArtifactMainStat::hpFlat;
    target0.setIndex = 0;

    // Target 1 only accepts set 1
    HuntTarget target1;
    target1.id = "set-1";
    target1.slot = ArtifactSlot::flower;
    target1.mainStat = ArtifactMainStat::hpFlat;
    target1.setIndex = 1;

    // TargetAny accepts either set
    HuntTarget targetAny;
    targetAny.id = "set-any";
    targetAny.slot = ArtifactSlot::flower;
    targetAny.mainStat = ArtifactMainStat::hpFlat;
    targetAny.setIndex = -1;

    SimulationConfig config;
    config.mode = SimulationMode::HuntList;
    config.resinBudget = 2000;
    config.useStrongBox = false;
    config.huntTargets = { target0, target1, targetAny };

    SimulationSummary summary = engine.executeSimulation(config);

    REQUIRE(summary.targetAchieved == true);
    for (const auto &hr : summary.huntResults) {
        REQUIRE(hr.found == true);
        if (hr.id == "set-0") {
            REQUIRE(hr.setIndex == 0);
        } else if (hr.id == "set-1") {
            REQUIRE(hr.setIndex == 1);
        } else if (hr.id == "set-any") {
            REQUIRE((hr.setIndex == 0 || hr.setIndex == 1));
        }
    }
}

TEST_CASE("Regression 4: Each hunt item records exact resin when found, not final total") {
    ArtifactInterface engine(88888);

    // Item A: Easy flower (found within 20-100 resin)
    HuntTarget targetA;
    targetA.id = "flower-easy";
    targetA.slot = ArtifactSlot::flower;
    targetA.mainStat = ArtifactMainStat::hpFlat;
    targetA.setIndex = -1;

    // Item B: Rarer Circlet with Crit Rate main stat (takes significantly more resin)
    HuntTarget targetB;
    targetB.id = "circlet-crit";
    targetB.slot = ArtifactSlot::circlet;
    targetB.mainStat = ArtifactMainStat::critRate;
    targetB.setIndex = -1;

    SimulationConfig config;
    config.mode = SimulationMode::HuntList;
    config.resinBudget = 20000;
    config.useStrongBox = false;
    config.huntTargets = { targetA, targetB };

    SimulationSummary summary = engine.executeSimulation(config);

    REQUIRE(summary.targetAchieved == true);
    REQUIRE(summary.huntResults.size() == 2);

    const auto &resA = summary.huntResults[0];
    const auto &resB = summary.huntResults[1];

    REQUIRE(resA.found == true);
    REQUIRE(resB.found == true);

    // Resin must be exact run increments (multiples of 20)
    REQUIRE(resA.resinSpent % 20 == 0);
    REQUIRE(resB.resinSpent % 20 == 0);

    // Item A was found before Item B
    REQUIRE(resA.resinSpent < resB.resinSpent);

    // Item B was the final item found, terminating the simulation at its exact resin
    REQUIRE(resB.resinSpent == summary.totalResinSpent);
}