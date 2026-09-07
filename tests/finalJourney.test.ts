import { describe, expect, it } from "vitest";
import { finalJourneyScenes } from "../src/config/finalJourney";

describe("final journey manifest", () => {
  it("locks the approved eleven-scene order and uses a final frozen frame for every film", () => {
    expect(finalJourneyScenes).toHaveLength(11);
    expect(finalJourneyScenes.map((scene) => scene.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);

    finalJourneyScenes.forEach((scene) => {
      expect(scene.videoPath).toMatch(/^\/journey-final\/\d{2}-.+\.mp4$/);
      expect(scene.frozenFramePath).toMatch(/^\/journey-final\/\d{2}-.+-final\.png$/);
    });
  });

  it("keeps the secret word and RSVP as actual visitor actions", () => {
    expect(finalJourneyScenes[3].surfaces.map((surface) => surface.id)).toContain("decode_word");
    expect(finalJourneyScenes[10].surfaces.map((surface) => surface.id)).toContain("rsvp");
  });
});
