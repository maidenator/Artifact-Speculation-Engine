#include <iostream>
#include <iomanip>
#include <random>
#include <string>
#include <limits>

#include "domain/artifact_interface.hpp"
#include "artifact/format_utils.hpp"

// Utility helper to safely clear stdin after bad inputs
void clearInput() {
    std::cin.clear();
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
}

// Generates a hardware-backed 64-bit entropy seed
uint64_t generateRandomSeed() {
    std::random_device rd;
    return (static_cast<uint64_t>(rd()) << 32) | rd();
}

bool isPercentageStat(ArtifactSubstat stat) {
    switch (stat) {
        case ArtifactSubstat::hpFlat:
        case ArtifactSubstat::atkFlat:
        case ArtifactSubstat::defFlat:
        case ArtifactSubstat::elementalMastery:
            return false;
        default:
            return true;
    }
}

void printArtifactCard(int rank, const Artifact &art, const SimulationConfig &config) {
    double cv = generator::calculateCritValue(art);
    double score = evaluateArtifactScore(art, config);

    std::cout << "--------------------------------------------------------\n";
    std::cout << "  #" << rank << " | " << art.slot << " (+20)\n";
    std::cout << "  Main: " << art.mainStat.type << " +" 
              << std::fixed << std::setprecision(1) << art.mainStat.value << "\n";
    std::cout << "  Substats:\n";

    for (size_t i = 0; i < art.substatCount; ++i) {
        const auto &sub = art.subStats[i];
        std::cout << "    - " << std::left << std::setw(22) << sub.type << ": ";
        if (isPercentageStat(sub.type)) {
            std::cout << std::fixed << std::setprecision(1) << sub.value << "%";
        } else {
            std::cout << static_cast<int>(sub.value);
        }
        std::cout << " (" << sub.rolls << " rolls)\n";
    }
    std::cout << "  Crit Value (CV): " << std::fixed << std::setprecision(1) << cv;
    if (!config.substatWeights.empty()) {
        std::cout << " | Weighted Score: " << std::fixed << std::setprecision(1) << score;
    }
    std::cout << "\n";
}

void displayResults(const SimulationSummary &summary, const SimulationConfig &config) {
    std::cout << "\n========================================================\n";
    std::cout << "                  SIMULATION RESULTS                    \n";
    std::cout << "========================================================\n";
    std::cout << "Target Achieved          : " << (summary.targetAchieved ? "YES" : "NO") << "\n";
    std::cout << "Total Resin Spent        : " << summary.totalResinSpent << " resin\n";
    std::cout << "Equivalent Farming Days  : " << std::fixed << std::setprecision(1) 
              << summary.equivalentDays << " days (" 
              << std::setprecision(1) << summary.equivalentDays / 30.4 << " months)\n";
    std::cout << "Domain Runs Completed    : " << summary.domainRunsCompleted << "\n";
    std::cout << "Strongbox Rolls          : " << summary.strongboxRollsCompleted << "\n";
    std::cout << "Total 5-Stars Dropped    : " << summary.totalFiveStarsFound << "\n";
    std::cout << "Top Artifacts Captured   : " << summary.topArtifacts.size() << "\n\n";

    if (summary.topArtifacts.empty()) {
        std::cout << "No artifacts found matching your filter criteria within the budget.\n";
    } else {
        std::cout << "Top Artifacts Ranked:\n";
        for (size_t i = 0; i < summary.topArtifacts.size(); ++i) {
            printArtifactCard(static_cast<int>(i + 1), summary.topArtifacts[i], config);
        }
    }
    std::cout << "--------------------------------------------------------\n";
}

SimulationConfig promptUserConfig() {
    SimulationConfig config;

    std::cout << "\n--- Configure Simulation Parameters ---\n";

    // 1. Simulation Mode
    std::cout << "Choose Mode:\n";
    std::cout << "  [1] Fixed Resin Budget (e.g. spend 4,000 resin)\n";
    std::cout << "  [2] Target Goal (farm until target threshold met)\n";
    std::cout << "Select (1/2): ";
    int modeChoice = 1;
    std::cin >> modeChoice;
    config.mode = (modeChoice == 2) ? SimulationMode::TargetGoal : SimulationMode::FixedResin;

    // 2. Resin Budget
    if (config.mode == SimulationMode::FixedResin) {
        std::cout << "Enter Resin Budget (multiple of 20, e.g. 2000): ";
        std::cin >> config.resinBudget;
    } else {
        std::cout << "Enter Maximum Resin Ceiling / Safety Cap (e.g. 50000): ";
        std::cin >> config.resinBudget;
    }

    // 3. Slot Filter
    std::cout << "\nFilter by Slot:\n";
    std::cout << "  [0] Any Slot\n";
    std::cout << "  [1] Flower of Life\n";
    std::cout << "  [2] Plume of Death\n";
    std::cout << "  [3] Sands of Eon\n";
    std::cout << "  [4] Goblet of Eonothem\n";
    std::cout << "  [5] Circlet of Logos\n";
    std::cout << "Select (0-5): ";
    int slotChoice = 0;
    std::cin >> slotChoice;
    if (slotChoice >= 1 && slotChoice <= 5) {
        config.targetSlot = static_cast<ArtifactSlot>(slotChoice - 1);
    }

    // 4. Main Stat Filter
    if (config.targetSlot.has_value() && 
       (*config.targetSlot == ArtifactSlot::sands || 
        *config.targetSlot == ArtifactSlot::goblet || 
        *config.targetSlot == ArtifactSlot::circlet)) {
        
        std::cout << "\nFilter by Main Stat? (y/n): ";
        char filterMain;
        std::cin >> filterMain;
        if (filterMain == 'y' || filterMain == 'Y') {
            std::cout << "Available Main Stats:\n";
            std::cout << "  [1] ATK%        [2] HP%         [3] DEF%\n";
            std::cout << "  [4] ER%         [5] EM          [6] CRIT Rate%\n";
            std::cout << "  [7] CRIT DMG%   [8] Pyro DMG%   [9] Hydro DMG%\n";
            std::cout << "  [10] Cryo DMG%  [11] Electro DMG% [12] Anemo DMG%\n";
            std::cout << "  [13] Geo DMG%   [14] Dendro DMG%  [15] Physical DMG%\n";
            std::cout << "Select: ";
            int mainChoice;
            std::cin >> mainChoice;

            switch (mainChoice) {
                case 1:  config.targetMainStat = ArtifactMainStat::atkPercent; break;
                case 2:  config.targetMainStat = ArtifactMainStat::hpPercent; break;
                case 3:  config.targetMainStat = ArtifactMainStat::defPercent; break;
                case 4:  config.targetMainStat = ArtifactMainStat::energyRecharge; break;
                case 5:  config.targetMainStat = ArtifactMainStat::elementalMastery; break;
                case 6:  config.targetMainStat = ArtifactMainStat::critRate; break;
                case 7:  config.targetMainStat = ArtifactMainStat::critDmg; break;
                case 8:  config.targetMainStat = ArtifactMainStat::pyroDmg; break;
                case 9:  config.targetMainStat = ArtifactMainStat::hydroDmg; break;
                case 10: config.targetMainStat = ArtifactMainStat::cryoDmg; break;
                case 11: config.targetMainStat = ArtifactMainStat::electroDmg; break;
                case 12: config.targetMainStat = ArtifactMainStat::anemoDmg; break;
                case 13: config.targetMainStat = ArtifactMainStat::geoDmg; break;
                case 14: config.targetMainStat = ArtifactMainStat::dendroDmg; break;
                case 15: config.targetMainStat = ArtifactMainStat::physicalDmg; break;
                default: break;
            }
        }
    }

    // 5. Target CV
    if (config.mode == SimulationMode::TargetGoal) {
        std::cout << "\nMinimum Target CV required (e.g. 30.0 or 40.0): ";
        std::cin >> config.minCritValue;
    }

    // 6. Strongbox Toggle
    std::cout << "\nEnable Strongbox 3-for-1 recycling? (1 = yes, 0 = no): ";
    int boxChoice = 0;
    std::cin >> boxChoice;
    config.useStrongBox = (boxChoice == 1);

    // 7. Top K
    std::cout << "How many top artifacts to display (1 to 20): ";
    std::cin >> config.topK;

    return config;
}

int main() {
    std::cout << "========================================================\n";
    std::cout << "       GENSHIN ARTIFACT MONTE CARLO SIMULATOR\n";
    std::cout << "========================================================\n";

    SimulationConfig activeConfig = promptUserConfig();

    while (true) {
        std::cout << "\n[+] Generating hardware seed and starting simulation...\n";
        ArtifactInterface engine(generateRandomSeed());

        auto summary = engine.executeSimulation(activeConfig);
        displayResults(summary, activeConfig);

        // Interactive Redo / Navigation Menu
        std::cout << "\nAction Menu:\n";
        std::cout << "  [r] Redo simulation (same config, new seed)\n";
        std::cout << "  [c] Change config and run\n";
        std::cout << "  [q] Quit\n";
        std::cout << "Choose action (r/c/q): ";

        char action;
        std::cin >> action;

        if (action == 'r' || action == 'R') {
            continue; // Repeats using activeConfig with freshly seeded engine
        } else if (action == 'c' || action == 'C') {
            activeConfig = promptUserConfig();
        } else if (action == 'q' || action == 'Q') {
            std::cout << "Exiting simulator.\n";
            break;
        } else {
            std::cout << "Unrecognized choice. Rerunning with current configuration...\n";
        }
    }

    return 0;
}