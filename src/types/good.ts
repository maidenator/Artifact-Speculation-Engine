export type StatKey =
  | "hp"
  | "hp_"
  | "atk"
  | "atk_"
  | "def"
  | "def_"
  | "eleMas"
  | "enerRech_"
  | "heal_"
  | "critRate_"
  | "critDMG_"
  | "physical_dmg_"
  | "anemo_dmg_"
  | "geo_dmg_"
  | "electro_dmg_"
  | "hydro_dmg_"
  | "pyro_dmg_"
  | "cryo_dmg_"
  | "dendro_dmg_";

export type SlotKey = "flower" | "plume" | "sands" | "goblet" | "circlet";

export type SetKey = string;
export type CharacterKey = string;

export interface ISubstat {
  key: StatKey;
  value: number;
  // GOOD 3 additions
  initialValue?: number;
}

export interface IArtifact {
  setKey: SetKey;
  slotKey: SlotKey;
  level: number;
  rarity: number;
  mainStatKey: StatKey;
  location: CharacterKey | "";
  lock: boolean;
  substats: ISubstat[];

  // GOOD 3 additions
  totalRolls?: number;
  astralMark?: boolean;
  elixirCrafted?: boolean;
  unactivatedSubstats?: ISubstat[];
}

export interface IGOOD {
  format: "GOOD";
  version: number;
  source: string;
  artifacts?: IArtifact[];
}
