import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
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
    expect(finalJourneyScenes[10].surfaces.map((surface) => surface.id)).toContain("rsvp");
  });
});
