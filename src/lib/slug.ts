import { customAlphabet } from "nanoid";

// Bez znaków łatwych do pomylenia (0/O, 1/l/I) — slug bywa przepisywany ręcznie.
const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";

// 14 znaków -> ~83 bity entropii. Niemożliwy do trafienia przypadkiem.
const nano = customAlphabet(alphabet, 14);

export function newSlug(): string {
  return nano();
}
