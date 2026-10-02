export interface ArtifactSet {
  id: string
  name: string
  enkaId?: number
}

export interface ArtifactDomain {
  id: string
  name: string
  sets: [ArtifactSet, ArtifactSet]
}

export const ARTIFACT_DOMAINS: ArtifactDomain[] = [
  {
    id: "midsummer_courtyard",
    name: "Midsummer Courtyard",
    sets: [
      { id: "thundering_fury", name: "Thundering Fury" , enkaId: 15005},
      { id: "thundersoother", name: "Thundersoother" , enkaId: 14002},
    ],
  },
  {
    id: "domain_of_guyun",
    name: "Domain of Guyun",
    sets: [
      { id: "archaic_petra", name: "Archaic Petra" , enkaId: 15014},
      { id: "retracing_bolide", name: "Retracing Bolide" , enkaId: 15015},
    ],
  },
  {
    id: "valley_of_remembrance",
    name: "Valley of Remembrance",
    sets: [
      { id: "viridescent_venerer", name: "Viridescent Venerer" , enkaId: 15002},
      { id: "maiden_beloved", name: "Maiden Beloved" , enkaId: 14004},
    ],
  },
  {
    id: "hidden_palace_of_zhou_formula",
    name: "Hidden Palace of Zhou Formula",
    sets: [
      { id: "crimson_witch_of_flames", name: "Crimson Witch of Flames" , enkaId: 15006},
      { id: "lavawalker", name: "Lavawalker" , enkaId: 14003},
    ],
  },
  {
    id: "clear_pool_and_mountain_cavern",
    name: "Clear Pool and Mountain Cavern",
    sets: [
      { id: "bloodstained_chivalry", name: "Bloodstained Chivalry" , enkaId: 15008},
      { id: "noblesse_oblige", name: "Noblesse Oblige" , enkaId: 15007},
    ],
  },
  {
    id: "peak_of_vindagnyr",
    name: "Peak of Vindagnyr",
    sets: [
      { id: "blizzard_strayer", name: "Blizzard Strayer" , enkaId: 14001},
      { id: "heart_of_depth", name: "Heart of Depth" , enkaId: 15016},
    ],
  },
  {
    id: "ridge_watch",
    name: "Ridge Watch",
    sets: [
      { id: "tenacity_of_the_millelith", name: "Tenacity of the Millelith" , enkaId: 15017},
      { id: "pale_flame", name: "Pale Flame" , enkaId: 15018},
    ],
  },
  {
    id: "momiji_dyed_court",
    name: "Momiji-Dyed Court",
    sets: [
      { id: "shimenawas_reminiscence", name: "Shimenawa's Reminiscence" , enkaId: 15019},
      { id: "emblem_of_severed_fate", name: "Emblem of Severed Fate" , enkaId: 15020},
    ],
  },
  {
    id: "slumbering_court",
    name: "Slumbering Court",
    sets: [
      { id: "husk_of_opulent_dreams", name: "Husk of Opulent Dreams" , enkaId: 15021},
      { id: "ocean_hued_clam", name: "Ocean-Hued Clam" , enkaId: 15022},
    ],
  },
  {
    id: "the_lost_valley",
    name: "The Lost Valley",
    sets: [
      { id: "vermillion_hereafter", name: "Vermillion Hereafter" , enkaId: 15023},
      { id: "echoes_of_an_offering", name: "Echoes of an Offering" , enkaId: 15024},
    ],
  },
  {
    id: "spire_of_solitary_enlightenment",
    name: "Spire of Solitary Enlightenment",
    sets: [
      { id: "deepwood_memories", name: "Deepwood Memories" , enkaId: 15025},
      { id: "gilded_dreams", name: "Gilded Dreams" , enkaId: 15026},
    ],
  },
  {
    id: "city_of_gold",
    name: "City of Gold",
    sets: [
      { id: "desert_pavilion_chronicle", name: "Desert Pavilion Chronicle" , enkaId: 15027},
      { id: "flower_of_paradise_lost", name: "Flower of Paradise Lost" , enkaId: 15028},
    ],
  },
  {
    id: "molten_iron_fortress",
    name: "Molten Iron Fortress",
    sets: [
      { id: "nymphs_dream", name: "Nymph's Dream" , enkaId: 15029},
      { id: "vourukashas_glow", name: "Vourukasha's Glow" , enkaId: 15030},
    ],
  },
  {
    id: "denouement_of_sin",
    name: "Denouement of Sin",
    sets: [
      { id: "marechaussee_hunter", name: "Marechaussee Hunter" , enkaId: 15031},
      { id: "golden_troupe", name: "Golden Troupe" , enkaId: 15032},
    ],
  },
  {
    id: "waterfall_ruin",
    name: "Waterfall Ruin",
    sets: [
      { id: "nighttime_whispers", name: "Nighttime Whispers in the Echoing Woods" , enkaId: 15034},
      { id: "song_of_days_past", name: "Song of Days Past" , enkaId: 15033},
    ],
  },
  {
    id: "faded_theater",
    name: "Faded Theater",
    sets: [
      { id: "fragment_of_harmonic_whimsy", name: "Fragment of Harmonic Whimsy" , enkaId: 15035},
      { id: "unfinished_reverie", name: "Unfinished Reverie" , enkaId: 15036},
    ],
  },
  {
    id: "sanctum_of_rainbow_spirits",
    name: "Sanctum of Rainbow Spirits",
    sets: [
      { id: "scroll_of_the_hero_of_cinder_city", name: "Scroll of the Hero of Cinder City" , enkaId: 15037},
      { id: "obsidian_codex", name: "Obsidian Codex" , enkaId: 15038},
    ],
  },
  {
    id: "derelict_masonry_dock",
    name: "Derelict Masonry Dock",
    sets: [
      { id: "finale_of_the_deep_galleries", name: "Finale of the Deep Galleries" , enkaId: 15040},
      { id: "long_nights_oath", name: "Long Night's Oath" , enkaId: 15039},
    ],
  },
  {
    id: "frostladen_machinery",
    name: "Frostladen Machinery",
    sets: [
      { id: "night_of_the_skys_unveiling", name: "Night of the Sky's Unveiling" , enkaId: 15041},
      { id: "silken_moons_serenade", name: "Silken Moon's Serenade" , enkaId: 15042},
    ],
  },
  {
    id: "moonchilds_treasures",
    name: "Moonchild's Treasures",
    sets: [
      { id: "a_day_carved_from_rising_winds", name: "A Day Carved From Rising Winds" , enkaId: 15044},
      { id: "aubade_of_morningstar_and_moon", name: "Aubade of Morningstar and Moon" , enkaId: 15043},
    ],
  },
  {
    id: "thorny_crown_of_the_mountain_wind",
    name: "Thorny Crown of the Mountain Wind",
    sets: [
      { id: "celestial_gift", name: "Celestial Gift" , enkaId: 15045},
      { id: "disenchantment_in_deep_shadow", name: "Disenchantment in Deep Shadow" , enkaId: 15046},
    ],
  },
  {
    id: "inverted_glacier",
    name: "Inverted Glacier",
    sets: [
      { id: "heart_of_the_furnace", name: "Heart of the Furnace" , enkaId: 15048},
      { id: "scarlet_proof", name: "Scarlet Proof" , enkaId: 15047},
    ],
  },
]
