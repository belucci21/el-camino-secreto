import { describe, expect, it } from "vitest";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { finalJourneyScenes } from "../src/config/finalJourney";
import { journeyHotspots } from "../src/config/journeyInteractions";

function publicAsset(path: string) {
  return join(process.cwd(), "public", path);
}

describe("September 30 final journey", () => {
  it("preserves scene three's printed controls and covers delivered button targets", () => {
    expect(finalJourneyScenes[2].renderedControls).toBeUndefined();
    expect(finalJourneyScenes[2].frozenFramePath).toBe("/journey-final/03-journey-begins-interactive.png");
    expect(finalJourneyScenes[2].holdFrameAt).toBe(9.8);
    expect(finalJourneyScenes[14].renderedControls).toEqual(["music_toggle", "chapters_menu"]);
    expect(finalJourneyScenes[14].videoPath).toContain("15-important-details-v2");
    expect(finalJourneyScenes[14].aspectRatio).toBe(1080 / 2230);
    expect(finalJourneyScenes[15].videoPath).toContain("16-final-thanks-v2");
    expect(finalJourneyScenes[15].narrationPath).toContain("16-final-thanks-v2-voice.mp3");
    expect(finalJourneyScenes[15].holdFrameAt).toBeUndefined();
    expect(finalJourneyScenes[15].renderedControls).toEqual(["music_toggle", "chapters_menu"]);
    expect(finalJourneyScenes[5].surfaces.some(item => item.id === "save_date")).toBe(false);
    for (const order of [7, 8, 9, 10, 11]) {
      const bounds = journeyHotspots[order].continue;
      expect(bounds.y).toBeLessThanOrEqual(92);
      expect(bounds.y + bounds.height).toBeGreaterThanOrEqual(96);
    }
    const map = journeyHotspots[9].celebration_map;
    expect(map.y + map.height).toBeGreaterThanOrEqual(87);
    const rsvp = journeyHotspots[12].rsvp;
    expect(rsvp.y + rsvp.height).toBeGreaterThanOrEqual(73);
  });
  it("keeps all sixteen delivered scenes in one ordered manifest", () => {
    expect(finalJourneyScenes).toHaveLength(16);
    expect(finalJourneyScenes.map(({ order }) => order)).toEqual(Array.from({ length: 16 }, (_, index) => index + 1));
    expect(new Set(finalJourneyScenes.map(({ id }) => id)).size).toBe(16);

    finalJourneyScenes.forEach((scene) => {
      expect(scene.videoPath).toMatch(/^\/journey-final\/\d{2}-.+\.mp4$/);
      expect(scene.firstFramePath).toMatch(/^\/journey-final\/\d{2}-.+-first\.png$/);
      expect(scene.frozenFramePath).toMatch(/^\/journey-final\/\d{2}-.+-(final|interactive)\.png$/);
      for (const path of [scene.videoPath, scene.firstFramePath, scene.frozenFramePath]) {
        expect(existsSync(publicAsset(path)), path).toBe(true);
        expect(statSync(publicAsset(path)).size, path).toBeGreaterThan(100_000);
      }
      expect(journeyHotspots[scene.order]).toBeDefined();
      scene.surfaces.forEach((surface) => {
        expect(journeyHotspots[scene.order][surface.id], `scene ${scene.order}: ${surface.id}`).toBeDefined();
      });
    });
  });

  it("uses independent voice tracks so no native video can take over the continuous music", () => {
    expect(finalJourneyScenes.filter(({ hasNarration }) => hasNarration).map(({ order }) => order))
      .toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16]);
    finalJourneyScenes.forEach((scene) => {
      if (scene.hasNarration) {
        expect(scene.narrationPath).toMatch(/-voice\.(mp3|m4a)$/);
        expect(existsSync(publicAsset(scene.narrationPath!))).toBe(true);
        expect(scene.narrationWindows.length).toBeGreaterThan(0);
      } else {
        expect(scene.narrationPath).toBeUndefined();
        expect(scene.narrationWindows).toEqual([]);
      }
    });
  });

  it("preserves the riddle, both maps, RSVP and all three final detail cards", () => {
    expect(finalJourneyScenes[3].surfaces.map(({ id }) => id)).toContain("decode_word");
    expect(finalJourneyScenes[3].surfaces.find(({ id }) => id === "hint")?.visible_label).toBe("¿ESTÁS PERDIDO?");
    expect(finalJourneyScenes[7].surfaces.map(({ id }) => id)).toContain("ceremony_map");
    expect(finalJourneyScenes[8].surfaces.map(({ id }) => id)).toContain("celebration_map");
    expect(finalJourneyScenes[11].surfaces.map(({ id }) => id)).toContain("rsvp");
    expect(finalJourneyScenes[13].surfaces.map(({ id }) => id)).toEqual(expect.arrayContaining(["music_joy", "lasting_memories", "contact"]));
    expect(finalJourneyScenes[14].surfaces.map(({ id }) => id)).toContain("continue");
    expect(finalJourneyScenes[15].surfaces.map(({ id }) => id)).toEqual(["music_toggle", "chapters_menu"]);
    expect(existsSync(publicAsset(finalJourneyScenes[11].rsvpArtworkPath!))).toBe(true);
    Object.values(finalJourneyScenes[13].detailArtwork!).forEach((path) => {
      expect(existsSync(publicAsset(path)), path).toBe(true);
    });
  });
});
