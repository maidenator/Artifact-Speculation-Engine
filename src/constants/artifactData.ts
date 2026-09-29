import type { WeightPreset } from "../types/artifact"

export const Stat = {
  CritDMG: 0,
  CritRate: 1,
  ElementalMastery: 2,
  EnergyRecharge: 3,
  AtkPercent: 4,
  FlatAtk: 5,
  HpPercent: 6,
  FlatHp: 7,
  DefPercent: 8,
  FlatDef: 9,
  HealingBonus: 10,
  PyroDMG: 11,
  HydroDMG: 12,
  ElectroDMG: 13,
  CryoDMG: 14,
  AnemoDMG: 15,
  GeoDMG: 16,
  DendroDMG: 17,
  PhysicalDMG: 18,
} as const

export type StatId = (typeof Stat)[keyof typeof Stat]

export const Slot = {
  Flower: 0,
  Feather: 1,
  Sands: 2,
  Goblet: 3,
  Circlet: 4,
} as const

export type SlotId = (typeof Slot)[keyof typeof Slot]

export const MAIN_STAT_NAMES: Record<number, string> = {
  [Stat.CritDMG]: "Crit DMG",
  [Stat.CritRate]: "Crit Rate",
  [Stat.ElementalMastery]: "Elemental Mastery",
  [Stat.EnergyRecharge]: "Energy Recharge",
  [Stat.AtkPercent]: "ATK%",
  [Stat.FlatAtk]: "Flat ATK",
  [Stat.HpPercent]: "HP%",
  [Stat.FlatHp]: "Flat HP",
  [Stat.DefPercent]: "DEF%",
  [Stat.FlatDef]: "Flat DEF",
  [Stat.HealingBonus]: "Healing Bonus",
  [Stat.PyroDMG]: "Pyro DMG",
  [Stat.HydroDMG]: "Hydro DMG",
  [Stat.ElectroDMG]: "Electro DMG",
  [Stat.CryoDMG]: "Cryo DMG",
  [Stat.AnemoDMG]: "Anemo DMG",
  [Stat.GeoDMG]: "Geo DMG",
  [Stat.DendroDMG]: "Dendro DMG",
  [Stat.PhysicalDMG]: "Physical DMG",
}

export const SUBSTAT_NAMES: Record<number, string> = {
  [Stat.CritDMG]: "Crit DMG",
  [Stat.CritRate]: "Crit Rate",
  [Stat.ElementalMastery]: "Elemental Mastery",
  [Stat.EnergyRecharge]: "Energy Recharge",
  [Stat.AtkPercent]: "ATK%",
  [Stat.FlatAtk]: "Flat ATK",
  [Stat.HpPercent]: "HP%",
  [Stat.FlatHp]: "Flat HP",
  [Stat.DefPercent]: "DEF%",
  [Stat.FlatDef]: "Flat DEF",
}

export const SLOT_NAMES = ["Flower", "Feather", "Sands", "Goblet", "Circlet"]

export const SLOT_MAIN_STATS: Record<number, number[]> = {
  [Slot.Flower]: [Stat.FlatHp],
  [Slot.Feather]: [Stat.FlatAtk],
  [Slot.Sands]: [
    Stat.HpPercent,
    Stat.AtkPercent,
    Stat.DefPercent,
    Stat.EnergyRecharge,
    Stat.ElementalMastery,
  ],
  [Slot.Goblet]: [
    Stat.HpPercent,
    Stat.AtkPercent,
    Stat.DefPercent,
    Stat.PyroDMG,
    Stat.HydroDMG,
    Stat.ElectroDMG,
    Stat.CryoDMG,
    Stat.AnemoDMG,
    Stat.GeoDMG,
    Stat.DendroDMG,
    Stat.PhysicalDMG,
    Stat.ElementalMastery,
  ],
  [Slot.Circlet]: [
    Stat.HpPercent,
    Stat.AtkPercent,
    Stat.DefPercent,
    Stat.CritRate,
    Stat.CritDMG,
    Stat.HealingBonus,
    Stat.ElementalMastery,
  ],
}

// Stats shown without a % sign
export const FLAT_STATS = new Set<number>([
  Stat.ElementalMastery,
  Stat.FlatAtk,
  Stat.FlatHp,
  Stat.FlatDef,
])

export const WEIGHT_PRESETS: WeightPreset[] = [
  {
    label: "Crit Value",
    weights: {
      [Stat.CritDMG]: 1,
      [Stat.CritRate]: 1,
    },
  },
  {
    label: "Crit + ATK%",
    weights: {
      [Stat.CritDMG]: 1,
      [Stat.CritRate]: 1,
      [Stat.AtkPercent]: 0.5,
    },
  },
  {
    label: "Crit + ER%",
    weights: {
      [Stat.CritDMG]: 1,
      [Stat.CritRate]: 1,
      [Stat.EnergyRecharge]: 0.5,
    },
  },
  {
    label: "Crit + EM",
    weights: {
      [Stat.CritDMG]: 1,
      [Stat.CritRate]: 1,
      [Stat.ElementalMastery]: 0.5,
    },
  },
  {
    label: "Crit + HP%",
    weights: {
      [Stat.CritDMG]: 1,
      [Stat.CritRate]: 1,
      [Stat.HpPercent]: 0.5,
    },
  },
  {
    label: "Crit + DEF%",
    weights: {
      [Stat.CritDMG]: 1,
      [Stat.CritRate]: 1,
      [Stat.DefPercent]: 0.5,
    },
  },
]