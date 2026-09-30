import type { JourneyHotspot } from "../types/journey";

// Keep the utility controls deliberately quiet: the scene stays the focal point.
// At 9:16, 11% × 6% renders as a compact, near-square touch target.
const music = { x: 5, y: 3.5, width: 11, height: 6, radius: 50 };
const chapters = { x: 84, y: 3.5, width: 11, height: 6, radius: 50 };
const continueButton = { x: 12, y: 84, width: 76, height: 8, radius: 4 };

export const journeyHotspots: Record<number, Record<string, JourneyHotspot>> = {
  1: { music_toggle: music, chapters_menu: chapters, start_journey: { x: 14, y: 79, width: 72, height: 11, radius: 4 } },
  2: { music_toggle: music, chapters_menu: chapters, start_journey: { x: 16, y: 78, width: 68, height: 11, radius: 4 } },
  3: { music_toggle: music, chapters_menu: chapters, continue: { x: 12, y: 91, width: 76, height: 7, radius: 4 } },
  4: { music_toggle: music, chapters_menu: chapters, decode_word: { x: 20, y: 79, width: 60, height: 7, radius: 4 }, hint: { x: 29, y: 85.6, width: 42, height: 5.2, radius: .45 } },
  5: { music_toggle: music, chapters_menu: chapters, continue: { x: 14, y: 84, width: 72, height: 10, radius: 4 } },
  6: { music_toggle: music, chapters_menu: chapters, save_date: { x: 31, y: 69, width: 38, height: 6, radius: 4 }, continue: { x: 14, y: 84, width: 72, height: 10, radius: 4 } },
  7: { music_toggle: music, chapters_menu: chapters, continue: continueButton },
  8: { music_toggle: music, chapters_menu: chapters, ceremony_map: { x: 25, y: 81, width: 50, height: 5, radius: 4 }, continue: { x: 14, y: 87, width: 72, height: 10, radius: 4 } },
  9: { music_toggle: music, chapters_menu: chapters, celebration_map: { x: 24, y: 80, width: 52, height: 5.5, radius: 4 }, continue: { x: 14, y: 86, width: 72, height: 10, radius: 4 } },
  10: { music_toggle: music, chapters_menu: chapters, continue: { x: 14, y: 84, width: 72, height: 10, radius: 4 } },
  11: { music_toggle: music, chapters_menu: chapters, continue: { x: 14, y: 85, width: 72, height: 10, radius: 4 } },
  12: { music_toggle: music, chapters_menu: chapters, rsvp: { x: 16, y: 28, width: 68, height: 43, radius: 2 } },
  13: { music_toggle: music, chapters_menu: chapters, continue: { x: 8, y: 83, width: 84, height: 12, radius: 4 } },
  14: { music_toggle: music, chapters_menu: chapters, music_joy: { x: 16, y: 31, width: 68, height: 12, radius: 4 }, lasting_memories: { x: 16, y: 44, width: 68, height: 12, radius: 4 }, contact: { x: 16, y: 57, width: 68, height: 12, radius: 4 }, continue: { x: 10, y: 84, width: 80, height: 12, radius: 4 } },
  15: { music_toggle: music, chapters_menu: chapters, continue: { x: 23, y: 88, width: 54, height: 8, radius: 4 } },
  16: { music_toggle: music, chapters_menu: chapters },
};
