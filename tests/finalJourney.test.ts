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
    expect(finalJourneyScenes[13].renderedControls).toEqual(["music_toggle", "chapters_menu"]);
    expect(finalJourneyScenes[13].videoPath).toContain("15-important-details-v2");
    expect(finalJourneyScenes[13].aspectRatio).toBe(1080 / 2230);
    expect(finalJourneyScenes[14].videoPath).toContain("16-final-thanks-v2");
    expect(finalJourneyScenes[14].narrationPath).toContain("16-final-thanks-v2-voice.mp3");
    expect(finalJourneyScenes[14].holdFrameAt).toBeUndefined();
    expect(finalJourneyScenes[14].renderedControls).toEqual(["music_toggle", "chapters_menu"]);
    expect(finalJourneyScenes[5].id).toBe("two-souls");
    for (const order of [6, 7, 8, 9, 10]) {
      const bounds = journeyHotspots[order].continue;
      expect(bounds.y).toBeLessThanOrEqual(92);
      expect(bounds.y + bounds.height).toBeGreaterThanOrEqual(96);
    }
    const map = journeyHotspots[8].celebration_map;
    expect(map.y + map.height).toBeGreaterThanOrEqual(87);
    const rsvp = journeyHotspots[11].rsvp;
    expect(rsvp.y + rsvp.height).toBeGreaterThanOrEqual(73);
  });
  it("plays the approved unified door-and-date film as one scene before the two-souls scene", () => {
    const unified = finalJourneyScenes[4];
    expect(unified.videoPath).toBe("/journey-final/05-06-unified-web.mp4");
    expect(unified.firstFramePath).toBe("/journey-final/05-06-unified-first.png");
    expect(unified.frozenFramePath).toBe("/journey-final/05-06-unified-final.png");
    expect(unified.narrationPath).toBe("/journey-final/05-06-unified-voice.mp3");
    expect(unified.narrationWindows).toEqual([
      [2.821565, 7.552948], [8.203605, 11.63907], [14.592313, 16.737528],
      [17.056757, 19.411814], [20.000794, 27.684104],
    ]);
    expect(unified.surfaces.find(item => item.id === "continue")?.destination_order).toBe(6);
    expect(finalJourneyScenes[5].id).toBe("two-souls");
    expect(finalJourneyScenes[5].surfaces.find(item => item.id === "continue")?.destination_order).toBe(7);
    expect(unified.holdFrameAt).toBe(28.8);
  });

  it("keeps all fifteen delivered scenes in one ordered manifest", () => {
    expect(finalJourneyScenes).toHaveLength(15);
    expect(finalJourneyScenes.map(({ order }) => order)).toEqual(Array.from({ length: 15 }, (_, index) => index + 1));
    expect(new Set(finalJourneyScenes.map(({ id }) => id)).size).toBe(15);

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
      .toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 15]);
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
    expect(finalJourneyScenes[6].surfaces.map(({ id }) => id)).toContain("ceremony_map");
    expect(finalJourneyScenes[7].surfaces.map(({ id }) => id)).toContain("celebration_map");
    expect(finalJourneyScenes[10].surfaces.map(({ id }) => id)).toContain("rsvp");
    expect(finalJourneyScenes[12].surfaces.map(({ id }) => id)).toEqual(expect.arrayContaining(["music_joy", "lasting_memories", "contact"]));
    expect(finalJourneyScenes[13].surfaces.map(({ id }) => id)).toContain("continue");
    expect(finalJourneyScenes[14].surfaces.map(({ id }) => id)).toEqual(["music_toggle", "chapters_menu"]);
    expect(existsSync(publicAsset(finalJourneyScenes[10].rsvpArtworkPath!))).toBe(true);
    Object.values(finalJourneyScenes[12].detailArtwork!).forEach((path) => {
      expect(existsSync(publicAsset(path)), path).toBe(true);
    });
  });
});
