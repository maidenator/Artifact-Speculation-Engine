#include <catch2/catch_test_macros.hpp>
#include <catch2/matchers/catch_matchers_floating_point.hpp>
#include "artifact_interface.hpp"

TEST_CASE("Simulation: FixedResin mode", "[simulation][fixed_resin]") {
    ArtifactInterface interface(42);

    SECTION("Respects resin budget and step increments") {
        SimulationConfig config;
        config.mode = SimulationMode::FixedResin;
        config.resinBudget = 2000;
        config.topK = 5;

        auto summary = interface.executeSimulation(config);

        // Runs must cost 20 resin each, so total spent must be >= requested budget
        REQUIRE(summary.totalResinSpent >= 2000);
        REQUIRE(summary.totalResinSpent % distributions::RESIN_PER_RUN == 0);
        REQUIRE(summary.domainRunsCompleted == summary.totalResinSpent / distributions::RESIN_PER_RUN);

        // Days conversion check (180 resin/day)
        double expectedDays = static_cast<double>(summary.totalResinSpent) / 180.0;
        REQUIRE_THAT(summary.equivalentDays, Catch::Matchers::WithinRel(expectedDays, 1e-5));

        // Must drop at least 1 five-star per run
        REQUIRE(summary.totalFiveStarsFound >= summary.domainRunsCompleted);
    }

    SECTION("Top-K reservoir never exceeds requested size") {
        SimulationConfig config;
        config.mode = SimulationMode::FixedResin;
        config.resinBudget = 4000;
        config.topK = 3;

        auto summary = interface.executeSimulation(config);

        REQUIRE(summary.topArtifacts.size() <= 3);
        REQUIRE_FALSE(summary.topArtifacts.empty());
    }

    SECTION("Developer safety limits clamp out-of-bounds K") {
        SimulationConfig config;
        config.mode = SimulationMode::FixedResin;
        config.resinBudget = 10000;

        // User requests an excessive K
        config.topK = 100;
        auto summaryHigh = interface.executeSimulation(config);
        REQUIRE(summaryHigh.topArtifacts.size() <= 20);

        // User requests K = 0 (or negative)
        config.topK = 0;
        auto summaryZero = interface.executeSimulation(config);
        REQUIRE(summaryZero.topArtifacts.size() <= 1);
    }

    SECTION("Top artifacts are sorted descending by score") {
        SimulationConfig config;
        config.mode = SimulationMode::FixedResin;
        config.resinBudget = 3000;
        config.topK = 10;

        auto summary = interface.executeSimulation(config);

        for (size_t i = 1; i < summary.topArtifacts.size(); ++i) {
            double prevScore = evaluateArtifactScore(summary.topArtifacts[i - 1], config);
            double currScore = evaluateArtifactScore(summary.topArtifacts[i], config);
            REQUIRE(prevScore >= currScore);
        }
    }

    SECTION("All returned pieces are fully upgraded to Level 20") {
        SimulationConfig config;
        config.mode = SimulationMode::FixedResin;
        config.resinBudget = 1000;
        config.topK = 5;

        auto summary = interface.executeSimulation(config);

        for (const auto &art : summary.topArtifacts) {
            REQUIRE(art.level == 20);
            REQUIRE(art.substatCount == 4);
        }
    }
}

TEST_CASE("Simulation: TargetGoal mode", "[simulation][target_goal]") {
    ArtifactInterface interface(1337);

    SECTION("Halts immediately upon achieving the target criteria") {
        SimulationConfig config;
        config.mode = SimulationMode::TargetGoal;
        config.targetSlot = ArtifactSlot::flower; // Flowers have fixed HP main stat
        config.minCritValue = 20.0;               // Very achievable CV threshold
        config.resinBudget = 50000;              // High safety ceiling
        config.topK = 5;

        auto summary = interface.executeSimulation(config);

        REQUIRE(summary.targetAchieved);
        REQUIRE_FALSE(summary.topArtifacts.empty());

        // The best piece must satisfy all target constraints
        const auto &bestPiece = summary.topArtifacts.front();
        REQUIRE(bestPiece.slot == ArtifactSlot::flower);
        REQUIRE(generator::calculateCritValue(bestPiece) >= 20.0);
    }

    SECTION("Halts when safety budget cap is exhausted without finding target") {
        SimulationConfig config;
        config.mode = SimulationMode::TargetGoal;
        config.targetSlot = ArtifactSlot::goblet;
        config.targetMainStat = ArtifactMainStat::pyroDmg;
        config.minCritValue = 54.0; // Mathematically nearly impossible CV
        config.resinBudget = 600;   // Low budget cap (30 runs)
        config.topK = 5;

        auto summary = interface.executeSimulation(config);

        REQUIRE_FALSE(summary.targetAchieved);
        REQUIRE(summary.totalResinSpent >= 600);
        REQUIRE(summary.domainRunsCompleted == summary.totalResinSpent / 20);
    }

    SECTION("Enforces slot and main stat filters on candidate pieces") {
        SimulationConfig config;
        config.mode = SimulationMode::TargetGoal;
        config.targetSlot = ArtifactSlot::circlet;
        config.targetMainStat = ArtifactMainStat::critRate;
        config.minCritValue = 10.0;
        config.resinBudget = 30000;

        auto summary = interface.executeSimulation(config);

        if (summary.targetAchieved) {
            const auto &winningPiece = summary.topArtifacts.front();
            REQUIRE(winningPiece.slot == ArtifactSlot::circlet);
            REQUIRE(winningPiece.mainStat.type == ArtifactMainStat::critRate);
        }
    }
}

TEST_CASE("Simulation: Strongbox Recycling", "[simulation][strongbox]") {
    ArtifactInterface interface(999);

    SECTION("Strongbox performs 3-for-1 recycling and increments counters") {
        SimulationConfig config;
        config.mode = SimulationMode::FixedResin;
        config.resinBudget = 4000;
        config.useStrongBox = true;

        auto summary = interface.executeSimulation(config);

        // Over 200 domain drops, strongbox rolls must be triggered
        REQUIRE(summary.strongboxRollsCompleted > 0);
        // Total 5-stars processed must strictly exceed drops from domain runs alone
        REQUIRE(summary.totalFiveStarsFound > summary.domainRunsCompleted);
    }

    SECTION("Disabled strongbox does not perform recycling rolls") {
        SimulationConfig config;
        config.mode = SimulationMode::FixedResin;
        config.resinBudget = 2000;
        config.useStrongBox = false;

        auto summary = interface.executeSimulation(config);

        REQUIRE(summary.strongboxRollsCompleted == 0);
    }
}

TEST_CASE("Simulation: Multi-Trial Monte Carlo", "[simulation][trials]") {
    ArtifactInterface interface(777);

    SECTION("Runs multiple trials in TargetGoal mode and aggregates metrics") {
        SimulationConfig config;
        config.mode = SimulationMode::TargetGoal;
        config.targetSlot = ArtifactSlot::flower;
        config.minCritValue = 20.0;
        config.resinBudget = 10000;
        config.trials = 20;

        auto summary = interface.executeSimulation(config);

        REQUIRE(summary.trials == 20);
        REQUIRE(summary.successfulTrials > 0);
        REQUIRE(summary.successRate > 0.0);
        REQUIRE(summary.targetAchieved == true);
        REQUIRE(summary.trialResinSpents.size() == 20);
        REQUIRE(summary.trialTargetAchieved.size() == 20);
        REQUIRE(summary.minResinSpent > 0.0);
        REQUIRE(summary.medianResinSpent >= summary.minResinSpent);
        REQUIRE(summary.p90ResinSpent >= summary.medianResinSpent);
        REQUIRE(summary.maxResinSpent >= summary.p90ResinSpent);
    }

    SECTION("Reports zero success rate for unattainable goals") {
        SimulationConfig config;
        config.mode = SimulationMode::TargetGoal;
        config.targetSlot = ArtifactSlot::goblet;
        config.targetMainStat = ArtifactMainStat::pyroDmg;
        config.minCritValue = 54.0;
        config.resinBudget = 200;
        config.trials = 10;

        auto summary = interface.executeSimulation(config);

        REQUIRE(summary.trials == 10);
        REQUIRE(summary.successfulTrials == 0);
        REQUIRE(summary.successRate == 0.0);
        REQUIRE(summary.targetAchieved == false);
        for (int resin : summary.trialResinSpents) {
            REQUIRE(resin == 200);
        }
    }

    SECTION("JSON serialization round-trip includes multi-trial fields") {
        std::string jsonConfig = R"({
            "mode": 1,
            "targetSlot": 0,
            "minCritValue": 20.0,
            "resinBudget": 10000,
            "trials": 5
        })";

        std::string resultJson = interface.runSimulationJson(jsonConfig);
        auto parsed = nlohmann::json::parse(resultJson);

        REQUIRE(parsed["trials"].get<int>() == 5);
        REQUIRE(parsed.contains("successfulTrials"));
        REQUIRE(parsed.contains("successRate"));
        REQUIRE(parsed.contains("medianResinSpent"));
        REQUIRE(parsed.contains("p90ResinSpent"));
        REQUIRE(parsed["trialResinSpents"].is_array());
        REQUIRE(parsed["trialResinSpents"].size() == 5);
    }
}