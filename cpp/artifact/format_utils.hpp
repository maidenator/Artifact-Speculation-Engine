#pragma once
#include "distributions.hpp"
#include <iostream>

// Conveniently prints my enum values without needing to wrap them into a function

// Artifact Slot
inline std::ostream& operator<<(std::ostream& out, const ArtifactSlot value) {
    switch(value) {
        case ArtifactSlot::flower: out << "Flower of Life"; break;
        case ArtifactSlot::feather: out << "Plume of Death"; break;
        case ArtifactSlot::sands: out << "Sands of Eon"; break;
        case ArtifactSlot::goblet: out << "Goblet of Eonothem"; break;
        case ArtifactSlot::circlet: out << "Circlet of Logos"; break;
        default: out << "Unknown"; break;
    }
    return out;
}

// Artifact Substat
inline std::ostream& operator<<(std::ostream& out, const ArtifactSubstat value) {
    switch(value) {
        case ArtifactSubstat::critDmg: out << "Crit DMG %"; break;
        case ArtifactSubstat::critRate: out << "Crit Rate %"; break;

        case ArtifactSubstat::elementalMastery: out << "Elemental Mastery"; break;
        case ArtifactSubstat::energyRecharge: out << "Energy Recharge%"; break;

        case ArtifactSubstat::atkPercent: out << "ATK%"; break;
        case ArtifactSubstat::hpPercent: out << "HP%"; break;
        case ArtifactSubstat::defPercent: out << "DEF%"; break;

        case ArtifactSubstat::atkFlat: out << "ATK"; break;
        case ArtifactSubstat::hpFlat: out << "HP"; break;
        case ArtifactSubstat::defFlat: out << "DEF"; break;

        default: out << "Unknown"; break;

    }
    return out;
}

// Artifact Main Stat
inline std::ostream& operator<<(std::ostream& out, const ArtifactMainStat value) {
    switch(value) {
        // Substats valid as Main Stats
        case ArtifactMainStat::critDmg:          out << "Crit DMG"; break;
        case ArtifactMainStat::critRate:         out << "Crit Rate"; break;
        case ArtifactMainStat::elementalMastery: out << "Elemental Mastery"; break;
        case ArtifactMainStat::energyRecharge:   out << "Energy Recharge"; break;
        case ArtifactMainStat::atkPercent:       out << "ATK%"; break;
        case ArtifactMainStat::atkFlat:          out << "ATK"; break;
        case ArtifactMainStat::hpPercent:        out << "HP%"; break;
        case ArtifactMainStat::hpFlat:           out << "HP"; break;
        case ArtifactMainStat::defPercent:       out << "DEF%"; break;
        case ArtifactMainStat::defFlat:          out << "DEF"; break;

        // Exclusive Main Stats
        case ArtifactMainStat::healingBonus:     out << "Healing Bonus"; break;
        case ArtifactMainStat::pyroDmg:          out << "Pyro DMG Bonus"; break;
        case ArtifactMainStat::hydroDmg:         out << "Hydro DMG Bonus"; break;
        case ArtifactMainStat::electroDmg:       out << "Electro DMG Bonus"; break;
        case ArtifactMainStat::cryoDmg:          out << "Cryo DMG Bonus"; break;
        case ArtifactMainStat::anemoDmg:         out << "Anemo DMG Bonus"; break;
        case ArtifactMainStat::geoDmg:           out << "Geo DMG Bonus"; break;
        case ArtifactMainStat::dendroDmg:        out << "Dendro DMG Bonus"; break;
        case ArtifactMainStat::physicalDmg:      out << "Physical DMG Bonus"; break;

        default: out << "Unknown"; break;
    }
    return out;
}