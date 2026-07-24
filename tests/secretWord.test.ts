import { describe, expect, it } from "vitest";
import {
  normalizeSecretWord,
  sha256,
  validateSecretWord,
} from "../src/utils/secretWord";

const expectedHash =
  "a29bb351ab7025926eb34a77f0485a0f8ab9dc993009f990cbd8eabbf0d947e3";

describe("secret word", () => {
  it("normalizes spaces, capitalization and diacritics", () => {
    expect(normalizeSecretWord("  ÁMÍGÓ  ")).toBe("amigo");
  });

  it("produces the expected SHA-256 hash", async () => {
    expect(await sha256("amigo")).toBe(expectedHash);
  });

  it("accepts normalized correct variations", async () => {
    await expect(validateSecretWord(" AMIGO ")).resolves.toBe(true);
  });

  it("rejects an empty or incorrect value", async () => {
    await expect(validateSecretWord("")).resolves.toBe(false);
    await expect(validateSecretWord("puerta")).resolves.toBe(false);
  });

  it("uses the local hash fallback when SubtleCrypto is unavailable", async () => {
    await expect(validateSecretWord("amigo", null)).resolves.toBe(true);
  });
});
