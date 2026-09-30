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