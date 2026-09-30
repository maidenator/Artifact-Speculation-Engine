export interface ArtifactEngineClass {
  setSeed(seed: bigint | number): void;
  generateBatchJson(count: number, upgrade: boolean): string;
  generateBatchWithHistoryJson(count: number): string;
  runSimulationJson(configJson: string): string;
  delete(): void;
}

export interface ArtifactEngineInstance {
  ArtifactInterface: new (seed?: bigint | number) => ArtifactEngineClass;
}

declare function createArtifactEngine(
  moduleOverrides?: Record<string, unknown>
): Promise<ArtifactEngineInstance>;

export default createArtifactEngine;