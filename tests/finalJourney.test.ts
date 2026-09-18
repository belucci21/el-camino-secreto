import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { finalJourneyScenes } from "../src/config/finalJourney";

describe("final journey manifest", () => {
  it("includes the complete thirteen-scene delivery and a frozen frame for every film", () => {
    expect(finalJourneyScenes).toHaveLength(13);
    expect(finalJourneyScenes.map((scene) => scene.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
    ]);

    finalJourneyScenes.forEach((scene) => {
      expect(scene.videoPath).toMatch(/^\/journey-final\/\d{2}-.+\.mp4$/);
      expect(scene.frozenFramePath).toMatch(/^\/journey-final\/\d{2}-.+-final\.png$/);
      [scene.videoPath, scene.frozenFramePath, scene.firstFramePath].forEach((path) => {
        expect(existsSync(join(process.cwd(), "public", path)), path).toBe(true);
      });
    });
  });

  it("keeps the secret word and RSVP as actual visitor actions", () => {
    expect(finalJourneyScenes[3].surfaces.map((surface) => surface.id)).toContain("decode_word");
    expect(finalJourneyScenes[3].surfaces.find((surface) => surface.id === "hint")?.visible_label)
      .toBe("ACERTIJO 1: \u201cDI LA PALABRA AMIGO\u201d");
    expect(finalJourneyScenes[10].surfaces.map((surface) => surface.id)).toContain("rsvp");
  });

  it("serves the approved scene one through four films and frozen source frames byte-for-byte", () => {
    const approvedMedia = [
      { order: 1, video: "4bea127c9afdf014d5c21ef7f7f4efc9b1b006c5f47a9a8b4f49fac1defeff3a", first: "0f88edd0d0ef1d0977a283b4c942964f3722964c2a22bdfa1d8283c7f411f4ee", final: "1c597c185ba87d477443b84ec1a1ea694347f7e0aea2508cb61842319fece508" },
      { order: 2, video: "99123b4afbfbd53555852b8b50bc5b089d3803d8a370eb10a819761159a8f628", first: "3556604a6f4965f0d151a15e9e954f319d08357342ecd9690df6654c03e83f01", final: "711d4458463a5b2dedb551b057d121945ead98beb4eb8220975522cb42da8b83" },
      { order: 3, video: "14eb713dedc067b73a5f247f4ad3d4e3db5021c40f372c47c2037353abadf069", first: "3556604a6f4965f0d151a15e9e954f319d08357342ecd9690df6654c03e83f01", final: "3465fb309d63272b2d32069394ef272e09e40d9ebd48eb704487da53f1904128" },
      { order: 4, video: "0b3f796ed981f61d68fe39bfec35ac004b07d9e0a4fd3e71d5222ce24f2ea20e", first: "3556604a6f4965f0d151a15e9e954f319d08357342ecd9690df6654c03e83f01", final: "7a94dbd563af6cafca9aad944196c889d17bd5d848caa7410d488c55441888ec" },
    ] as const;

    for (const expected of approvedMedia) {
      const scene = finalJourneyScenes.find(({ order }) => order === expected.order)!;
      const media = [
        [scene.videoPath, expected.video],
        [scene.firstFramePath, expected.first],
        [scene.frozenFramePath, expected.final],
      ] as const;

      for (const [path, hash] of media) {
        const asset = readFileSync(join(process.cwd(), "public", path));
        expect(createHash("sha256").update(asset).digest("hex")).toBe(hash);
      }
    }
  });

  it("unlocks the approved scene actions when their baked controls become visible", () => {
    const approvedTiming = [
      { order: 1, interactionReadyAt: 285 / 30, narrationWindows: [[1.303, 17.207]] },
      { order: 2, interactionReadyAt: 3 / 30, narrationWindows: [[1.267, 17.785]] },
      { order: 3, interactionReadyAt: 3 / 30, narrationWindows: [[1.832, 6.481]] },
      { order: 4, interactionReadyAt: 3 / 30, narrationWindows: [[1.323, 15.626]] },
    ];

    for (const expected of approvedTiming) {
      const scene = finalJourneyScenes.find(({ order }) => order === expected.order)!;
      expect(scene.interactionReadyAt).toBe(expected.interactionReadyAt);
      expect(scene.narrationWindows).toEqual(expected.narrationWindows);
    }
  });
});
