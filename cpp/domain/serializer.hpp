#pragma once
#include <string>
#include <vector>
#include <nlohmann/json.hpp>
#include "simulation_types.hpp"
#include "../artifact/generator.hpp"


namespace serializer {

inline SimulationConfig parseConfigJson(const std::string &jsonStr) {
    using json = nlohmann::json;
    json j = json::parse(jsonStr);
    SimulationConfig config;

    if (j.contains("mode")) config.mode = static_cast<SimulationMode>(j["mode"].get<int>());

    if (j.contains("targetSlot") && !j["targetSlot"].is_null()) {
        config.targetSlot = static_cast<ArtifactSlot>(j["targetSlot"].get<int>());
    }

    if (j.contains("targetMainStat") && !j["targetMainStat"].is_null()) {
        config.targetMainStat = static_cast<ArtifactMainStat>(j["targetMainStat"].get<int>());
    }

    if (j.contains("resinBudget")) config.resinBudget = j["resinBudget"].get<int>();
    if (j.contains("topK")) config.topK = j["topK"].get<int>();
    if (j.contains("useStrongBox")) config.useStrongBox = j["useStrongBox"].get<bool>();
    if (j.contains("minCritValue")) config.minCritValue = j["minCritValue"].get<double>();

    if (j.contains("substatWeights")) {
        for (const auto &w : j["substatWeights"]) {
            config.substatWeights.push_back({
                static_cast<ArtifactSubstat>(w["stat"].get<int>()),
                w["weight"].get<double>()
            });
        }
    }

    return config;
}

inline std::string serializeSummaryJson(const SimulationSummary &summary) {
    using json = nlohmann::json;
    json j;

    j["targetAchieved"] = summary.targetAchieved;
    j["totalResinSpent"] = summary.totalResinSpent;
    j["equivalentDays"] = summary.equivalentDays;
    j["domainRunsCompleted"] = summary.domainRunsCompleted;
    j["strongboxRollsCompleted"] = summary.strongboxRollsCompleted;
    j["totalFiveStarsFound"] = summary.totalFiveStarsFound;

    json topArts = json::array();
    for (const auto &art : summary.topArtifacts) {
        json a;
        a["slot"] = static_cast<int>(art.slot);
        a["level"] = art.level;

        a["mainStat"] = {
            {"type", static_cast<int>(art.mainStat.type)},
            {"value", art.mainStat.value}
        };

        json subs = json::array();
        for (size_t i = 0; i < art.substatCount; ++i) {
            subs.push_back({
                {"type", static_cast<int>(art.subStats[i].type)},
                {"value", art.subStats[i].value},
                {"rolls", art.subStats[i].rolls}
            });
        }
        a["subStats"] = subs;
        a["critValue"] = generator::calculateCritValue(art);

        topArts.push_back(a);
    }
    j["topArtifacts"] = topArts;

    return j.dump();
}

inline std::string serializeArtifactsJson(const std::vector<Artifact> &artifacts) {
    using json = nlohmann::json;
    json arr = json::array();

    for (const auto &art : artifacts) {
        json a;
        a["slot"] = static_cast<int>(art.slot);
        a["level"] = art.level;
        a["mainStat"] = {
            {"type", static_cast<int>(art.mainStat.type)},
            {"value", art.mainStat.value}
        };

        json subs = json::array();
        for (size_t i = 0; i < art.substatCount; ++i) {
            subs.push_back({
                {"type", static_cast<int>(art.subStats[i].type)},
                {"value", art.subStats[i].value},
                {"rolls", art.subStats[i].rolls}
            });
        }
        a["subStats"] = subs;
        a["critValue"] = generator::calculateCritValue(art);
        arr.push_back(a);
    }

    return arr.dump();
}

inline std::string serializeArtifactHistoriesJson(const std::vector<std::vector<Artifact>> &histories) {
    using json = nlohmann::json;
    json arr = json::array();

    for (const auto &history : histories) {
        json histArr = json::array();
        for (const auto &art : history) {
            json a;
            a["slot"] = static_cast<int>(art.slot);
            a["level"] = art.level;
            a["mainStat"] = {
                {"type", static_cast<int>(art.mainStat.type)},
                {"value", art.mainStat.value}
            };

            json subs = json::array();
            for (size_t i = 0; i < art.substatCount; ++i) {
                subs.push_back({
                    {"type", static_cast<int>(art.subStats[i].type)},
                    {"value", art.subStats[i].value},
                    {"rolls", art.subStats[i].rolls}
                });
            }
            a["subStats"] = subs;
            a["critValue"] = generator::calculateCritValue(art);
            histArr.push_back(a);
        }
        arr.push_back(histArr);
    }

    return arr.dump();
}

} // namespace serializer