import { Stat, Slot } from "../constants/artifactData"
import type { ArtifactOutput, ArtifactSubstatEntry, CharacterOutput, PlayerProfile, WeaponOutput } from "../types/artifact"

// Maps Enka Network API stat names to our engine's Stat IDs
const ENKA_STAT_MAP: Record<string, number> = {
  FIGHT_PROP_HP: Stat.FlatHp,
  FIGHT_PROP_HP_PERCENT: Stat.HpPercent,
  FIGHT_PROP_ATTACK: Stat.FlatAtk,
  FIGHT_PROP_ATTACK_PERCENT: Stat.AtkPercent,
  FIGHT_PROP_DEFENSE: Stat.FlatDef,
  FIGHT_PROP_DEFENSE_PERCENT: Stat.DefPercent,
  FIGHT_PROP_CRITICAL: Stat.CritRate,
  FIGHT_PROP_CRITICAL_HURT: Stat.CritDMG,
  FIGHT_PROP_CHARGE_EFFICIENCY: Stat.EnergyRecharge,
  FIGHT_PROP_ELEMENT_MASTERY: Stat.ElementalMastery,
  FIGHT_PROP_HEAL_ADD: Stat.HealingBonus,
  FIGHT_PROP_PHYSICAL_ADD_HURT: Stat.PhysicalDMG,
  FIGHT_PROP_FIRE_ADD_HURT: Stat.PyroDMG,
  FIGHT_PROP_ELEC_ADD_HURT: Stat.ElectroDMG,
  FIGHT_PROP_WATER_ADD_HURT: Stat.HydroDMG,
  FIGHT_PROP_WIND_ADD_HURT: Stat.AnemoDMG,
  FIGHT_PROP_ICE_ADD_HURT: Stat.CryoDMG,
  FIGHT_PROP_ROCK_ADD_HURT: Stat.GeoDMG,
  FIGHT_PROP_GRASS_ADD_HURT: Stat.DendroDMG,
}

// Maps EquipType to our Slot IDs
const ENKA_SLOT_MAP: Record<string, number> = {
  EQUIP_BRACER: Slot.Flower,
  EQUIP_NECKLACE: Slot.Feather,
  EQUIP_SHOES: Slot.Sands,
  EQUIP_RING: Slot.Goblet,
  EQUIP_DRESS: Slot.Circlet,
}

import charactersJson from "../constants/characters.json"

const CHARACTER_MAP: Record<string, any> = charactersJson

const parseCharacter = (avatar: any): CharacterOutput | null => {
  if (!avatar || !avatar.equipList) return null

  const yattaBase = import.meta.env.DEV ? "/yatta-api" : "https://gi.yatta.moe";

  const weaponEquip = avatar.equipList.find((e: any) => e.flat?.itemType === "ITEM_WEAPON")
  const weaponIcon = weaponEquip?.flat?.icon;
  const weapon: WeaponOutput = {
    level: weaponEquip?.weapon?.level || 1,
    refinement: weaponEquip?.weapon?.affixMap ? Object.values(weaponEquip.weapon.affixMap)[0] as number + 1 : 1,
    iconUrl: weaponIcon ? `${yattaBase}/assets/UI/${weaponIcon}.png` : ""
  }

  const artifacts: ArtifactOutput[] = []

  for (const equip of avatar.equipList) {
    if (equip.flat?.itemType !== "ITEM_RELIQUARY") continue
    if (equip.flat.rankLevel !== 5) continue // Only parse 5-star artifacts

    const flat = equip.flat
    const rel = equip.reliquary

    const slot = ENKA_SLOT_MAP[flat.equipType]
    if (slot === undefined) continue

    const mainType = ENKA_STAT_MAP[flat.reliquaryMainstat?.mainPropId]
    if (mainType === undefined) continue

    const subStats: ArtifactSubstatEntry[] = []
    let cv = 0

    if (flat.reliquarySubstats) {
      for (const sub of flat.reliquarySubstats) {
        const type = ENKA_STAT_MAP[sub.appendPropId]
        if (type === undefined) continue
        
        let value = sub.statValue
        // Enka provides percentages as e.g. 5.8 (for 5.8%), not 0.058
        if (type === Stat.CritRate) cv += value * 2
        if (type === Stat.CritDMG) cv += value

        subStats.push({ type, value, rolls: 1 })
      }
    }

    artifacts.push({
      slot,
      level: rel.level - 1,
      mainStat: { type: mainType, value: flat.reliquaryMainstat.statValue },
      subStats,
      critValue: cv,
      iconUrl: flat.icon,
      setId: flat.setNameTextMapHash ? parseInt(flat.setNameTextMapHash, 10) : undefined
    })
  }

  let charName = avatar.avatarId.toString()
  let iconName = charName
  if (avatar.avatarId === 10000005) {
    charName = "Aether"
    iconName = "UI_AvatarIcon_PlayerBoy"
  } else if (avatar.avatarId === 10000007) {
    charName = "Lumine"
    iconName = "UI_AvatarIcon_PlayerGirl"
  } else {
    const charData = CHARACTER_MAP[avatar.avatarId.toString()]
    if (charData) {
      charName = charData.name || charName
      iconName = charData.icon || `UI_AvatarIcon_${charName}`
    } else {
      iconName = `UI_AvatarIcon_${iconName}`
    }
  }

  return {
    avatarId: avatar.avatarId,
    name: charName,
    level: parseInt(avatar.propMap?.[4001]?.val || "1", 10),
    element: "Unknown", 
    iconUrl: `${yattaBase}/assets/UI/${iconName}.png`,
    weapon,
    artifacts,
    stats: avatar.fightPropMap || {},
    constellation: avatar.talentIdList ? avatar.talentIdList.length : 0
  }
}

export const parseEnkaData = (data: any): { profile: PlayerProfile, characters: CharacterOutput[] } | null => {
  if (!data || !data.playerInfo) return null

  const yattaBase = import.meta.env.DEV ? "/yatta-api" : "https://gi.yatta.moe";

  const profile: PlayerProfile = {
    nickname: data.playerInfo.nickname || "Unknown",
    level: data.playerInfo.level || 1,
    worldLevel: data.playerInfo.worldLevel,
    signature: data.playerInfo.signature,
    abyssFloor: data.playerInfo.towerFloorIndex,
    abyssChamber: data.playerInfo.towerLevelIndex,
    achievementCount: data.playerInfo.finishAchievementNum,
    profilePicture: data.playerInfo.profilePicture?.avatarId ? String(data.playerInfo.profilePicture.avatarId) : undefined,
    profilePictureUrl: data.playerInfo.profilePicture?.avatarId 
      ? `${yattaBase}/assets/UI/UI_AvatarIcon_${data.playerInfo.profilePicture.avatarId}.png`
      : undefined
  }

  const characters: CharacterOutput[] = []
  if (data.avatarInfoList) {
    for (const avatar of data.avatarInfoList) {
      const parsed = parseCharacter(avatar)
      if (parsed) characters.push(parsed)
    }
  }

  return { profile, characters }
}
