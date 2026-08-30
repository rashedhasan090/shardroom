export const ROOM_CODE_LENGTH = 4;
export const ROOM_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function mintRoomCode(): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    code += ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)];
  }
  return code;
}

export function normalizeRoomCode(raw: string): string {
  return raw.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, ROOM_CODE_LENGTH);
}

export function isRoomCode(value: string): boolean {
  return value.length === ROOM_CODE_LENGTH && [...value].every((ch) => ROOM_ALPHABET.includes(ch));
}

export function hostPeerId(code: string): string {
  return `kiln${code}`;
}
