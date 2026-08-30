const SHARD_NAMES = [
  "Obsidian",
  "Feldspar",
  "Mica",
  "Quartz",
  "Basalt",
  "Slate",
  "Amber",
  "Flint",
  "Jasper",
  "Pumice",
  "Cinnabar",
  "Schist",
] as const;

export function pickShardName(): string {
  const index = Math.floor(Math.random() * SHARD_NAMES.length);
  return SHARD_NAMES[index] ?? "Flint";
}
