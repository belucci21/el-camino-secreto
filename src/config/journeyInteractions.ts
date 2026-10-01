import type { JourneyHotspot } from "../types/journey";

// Keep the utility controls deliberately quiet: the scene stays the focal point.
// At 9:16, 11% × 6% renders as a compact, near-square touch target.
const music = { x: 5, y: 3.5, width: 11, height: 6, radius: 50 };
const chapters = { x: 84, y: 3.5, width: 11, height: 6, radius: 50 };
const finalMusic = { x: 8, y: 3, width: 14, height: 7, radius: 50 };
const churchChapters = { x: 78, y: 3, width: 17, height: 8, radius: 50 };
const continueButton = { x: 14, y: 87, width: 72, height: 10, radius: 4 };
const wideContinue = { x: 8, y: 83, width: 84, height: 13, radius: 4 };

export const journeyHotspots: Record<number, Record<string, JourneyHotspot>> = {
  1: { music_toggle: music, chapters_menu: chapters, start_journey: { x: 14, y: 79, width: 72, height: 11, radius: 4 } },
  2: { music_toggle: music, chapters_menu: chapters, start_journey: { x: 16, y: 78, width: 68, height: 11, radius: 4 } },
  3: { music_toggle: music, chapters_menu: chapters, continue: { x: 12, y: 87, width: 76, height: 10, radius: 4 } },
  4: { music_toggle: music, chapters_menu: chapters, decode_word: { x: 20, y: 79, width: 60, height: 7, radius: 4 }, hint: { x: 29, y: 85.6, width: 42, height: 5.2, radius: .45 } },
  5: { music_toggle: music, chapters_menu: chapters, continue: wideContinue },
  6: { music_toggle: music, chapters_menu: chapters, continue: wideContinue },
  7: { music_toggle: finalMusic, chapters_menu: churchChapters, continue: continueButton },
  8: { music_toggle: finalMusic, chapters_menu: churchChapters, ceremony_map: { x: 30, y: 82, width: 40, height: 5, radius: 4 }, continue: continueButton },
  9: { music_toggle: finalMusic, chapters_menu: chapters, celebration_map: { x: 20, y: 81, width: 54, height: 6, radius: 4 }, continue: continueButton },
  10: { music_toggle: finalMusic, chapters_menu: chapters, continue: continueButton },
  11: { music_toggle: finalMusic, chapters_menu: chapters, continue: continueButton },
  12: { music_toggle: finalMusic, chapters_menu: chapters, rsvp: { x: 16, y: 28, width: 68, height: 46, radius: 2 } },
  13: { music_toggle: finalMusic, chapters_menu: chapters, continue: wideContinue },
  14: { music_toggle: finalMusic, chapters_menu: chapters, music_joy: { x: 16, y: 31, width: 68, height: 12, radius: 4 }, lasting_memories: { x: 16, y: 44, width: 68, height: 12, radius: 4 }, contact: { x: 16, y: 57, width: 68, height: 12, radius: 4 }, continue: wideContinue },
  15: { music_toggle: { ...music, x: 2, y: 1 }, chapters_menu: { ...chapters, x: 87, y: 1 }, continue: { x: 3, y: 86, width: 94, height: 12, radius: 4 } },
  16: { music_toggle: music, chapters_menu: chapters },
};
