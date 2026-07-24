import { sha256 as nobleSha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

const EXPECTED_WORD_HASH =
  "a29bb351ab7025926eb34a77f0485a0f8ab9dc993009f990cbd8eabbf0d947e3";

export function normalizeSecretWord(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export async function sha256(
  value: string,
  subtle: SubtleCrypto | null | undefined = globalThis.crypto?.subtle,
): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  if (!subtle) {
    return bytesToHex(nobleSha256(bytes));
  }
  const hashBuffer = await subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function validateSecretWord(
  value: string,
  subtle: SubtleCrypto | null | undefined = globalThis.crypto?.subtle,
): Promise<boolean> {
  const normalizedValue = normalizeSecretWord(value);
  if (!normalizedValue) {
    return false;
  }
  return (await sha256(normalizedValue, subtle)) === EXPECTED_WORD_HASH;
}
