#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include <string>
#include <vector>
#include <nlohmann/json.hpp>

#include "domain/serializer.hpp" // adjust path if needed

using Catch::Approx;

// =====================================================================
// parseConfigJson
// =====================================================================

TEST_CASE("parseConfigJson: full payload is parsed correctly") {
    std::string jsonStr = R"({
        "mode": 1,
        "targetSlot": 3,
        "targetMainStat": 11,
        "resinBudget": 4000,
        "topK": 10,
        "useStrongBox": true,
        "minCritValue": 35.5,
        "substatWeights": [
            { "stat": 0, "weight": 1.0 },
            { "stat": 1, "weight": 2.0 },
            { "stat": 4, "weight": 0.5 }
        ]
    })";

    SimulationConfig config = serializer::parseConfigJson(jsonStr);

    REQUIRE(config.mode == SimulationMode::TargetGoal);
    REQUIRE(config.targetSlot.has_value());
    REQUIRE(*config.targetSlot == ArtifactSlot::goblet);
    REQUIRE(config.targetMainStat.has_value());
    REQUIRE(*config.targetMainStat == ArtifactMainStat::pyroDmg);
    REQUIRE(config.resinBudget == 4000);
    REQUIRE(config.topK == 10);
    REQUIRE(config.useStrongBox == true);
    REQUIRE(config.minCritValue == Approx(35.5).margin(0.001));

    REQUIRE(config.substatWeights.size() == 3);
    REQUIRE(config.substatWeights[0].stat == ArtifactSubstat::critDmg);
    REQUIRE(config.substatWeights[0].weight == Approx(1.0).margin(0.001));
    REQUIRE(config.substatWeights[1].stat == ArtifactSubstat::critRate);
    REQUIRE(config.substatWeights[1].weight == Approx(2.0).margin(0.001));
    REQUIRE(config.substatWeights[2].stat == ArtifactSubstat::atkPercent);
    REQUIRE(config.substatWeights[2].weight == Approx(0.5).margin(0.001));
}

TEST_CASE("parseConfigJson: partial payload with null targets is handled") {
    std::string jsonStr = R"({
        "mode": 0,
        "targetSlot": null,
        "resinBudget": 800
    })";

    SimulationConfig config = serializer::parseConfigJson(jsonStr);

    REQUIRE(config.mode == SimulationMode::FixedResin);
    REQUIRE_FALSE(config.targetSlot.has_value());
    REQUIRE_FALSE(config.targetMainStat.has_value());
    REQUIRE(config.resinBudget == 800);
    REQUIRE(config.substatWeights.empty());
}

// =====================================================================
// serializeSummaryJson
// =====================================================================

TEST_CASE("serializeSummaryJson: output matches the input summary") {
    SimulationSummary summary;
    summary.targetAchieved = true;
    summary.totalResinSpent = 1600;
    summary.equivalentDays = 8.88;
    summary.domainRunsCompleted = 80;
    summary.strongboxRollsCompleted = 26;
    summary.totalFiveStarsFound = 85;

    Artifact art;
    art.slot = ArtifactSlot::circlet;
    art.level = 20;
    art.mainStat = MainStat{ ArtifactMainStat::critRate, 31.1 };
    art.substatCount = 2;
    art.subStats[0] = SubstatRoll{ ArtifactSubstat::critDmg, 21.0, 3 };
    art.subStats[1] = SubstatRoll{ ArtifactSubstat::atkPercent, 9.9, 2 };
    summary.topArtifacts.push_back(art);

    nlohmann::json parsed = nlohmann::json::parse(serializer::serializeSummaryJson(summary));

    REQUIRE(parsed["targetAchieved"].get<bool>() == true);
    REQUIRE(parsed["totalResinSpent"].get<int>() == 1600);
    REQUIRE(parsed["equivalentDays"].get<double>() == Approx(8.88).margin(0.001));
    REQUIRE(parsed["domainRunsCompleted"].get<int>() == 80);
    REQUIRE(parsed["strongboxRollsCompleted"].get<int>() == 26);
    REQUIRE(parsed["totalFiveStarsFound"].get<int>() == 85);

    auto topArts = parsed["topArtifacts"];
    REQUIRE(topArts.is_array());
    REQUIRE(topArts.size() == 1);

    auto piece = topArts[0];
    REQUIRE(piece["slot"].get<int>() == static_cast<int>(ArtifactSlot::circlet));
    REQUIRE(piece["level"].get<int>() == 20);
    REQUIRE(piece["mainStat"]["type"].get<int>() == static_cast<int>(ArtifactMainStat::critRate));
    REQUIRE(piece["mainStat"]["value"].get<double>() == Approx(31.1).margin(0.001));

    REQUIRE(piece["subStats"].size() == 2);
    REQUIRE(piece["subStats"][0]["type"].get<int>() == static_cast<int>(ArtifactSubstat::critDmg));
    REQUIRE(piece["subStats"][0]["value"].get<double>() == Approx(21.0).margin(0.001));
    REQUIRE(piece["subStats"][0]["rolls"].get<int>() == 3);

    // CV should equal 21.0 since only crit DMG is in the substats
    REQUIRE(piece["critValue"].get<double>() == Approx(21.0).margin(0.001));
}

// =====================================================================
// serializeArtifactsJson
// =====================================================================

TEST_CASE("serializeArtifactsJson: standalone artifact list serializes correctly") {
    std::vector<Artifact> artifacts;
    Artifact art;
    art.slot = ArtifactSlot::flower;
    art.level = 0;
    art.mainStat = MainStat{ ArtifactMainStat::hpFlat, 717.0 };
    art.substatCount = 1;
    art.subStats[0] = SubstatRoll{ ArtifactSubstat::critRate, 3.9, 1 };
    artifacts.push_back(art);

    nlohmann::json parsed = nlohmann::json::parse(serializer::serializeArtifactsJson(artifacts));

    REQUIRE(parsed.is_array());
    REQUIRE(parsed.size() == 1);
    REQUIRE(parsed[0]["slot"].get<int>() == static_cast<int>(ArtifactSlot::flower));
    REQUIRE(parsed[0]["critValue"].get<double>() == Approx(7.8).margin(0.001)); // 3.9 * 2
}

// =====================================================================
// serializeArtifactHistoriesJson
// =====================================================================

TEST_CASE("serializeArtifactHistoriesJson: artifact histories serialize correctly") {
    std::vector<std::vector<Artifact>> histories;
    std::vector<Artifact> history;
    
    Artifact art0;
    art0.slot = ArtifactSlot::flower;
    art0.level = 0;
    art0.mainStat = MainStat{ ArtifactMainStat::hpFlat, 717.0 };
    history.push_back(art0);
    
    Artifact art20 = art0;
    art20.level = 20;
    art20.mainStat.value = 4780.0;
    history.push_back(art20);
    
    histories.push_back(history);

    nlohmann::json parsed = nlohmann::json::parse(serializer::serializeArtifactHistoriesJson(histories));

    REQUIRE(parsed.is_array());
    REQUIRE(parsed.size() == 1);
    REQUIRE(parsed[0].is_array());
    REQUIRE(parsed[0].size() == 2);
    REQUIRE(parsed[0][0]["level"].get<int>() == 0);
    REQUIRE(parsed[0][1]["level"].get<int>() == 20);
}