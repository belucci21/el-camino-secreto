import type { JourneyHotspot } from "../types/journey";

const music = { x: 5, y: 3.5, width: 16, height: 8, radius: 50 };
const chapters = { x: 78, y: 3.5, width: 17, height: 8, radius: 50 };
const continueButton = { x: 12, y: 84, width: 76, height: 8, radius: 4 };

export const journeyHotspots: Record<number, Record<string, JourneyHotspot>> = {
  1: { music_toggle: music, chapters_menu: chapters, start_journey: { x: 12, y: 78, width: 76, height: 9, radius: 4 } },
  2: { music_toggle: music, chapters_menu: chapters, start_journey: { x: 12, y: 78, width: 76, height: 9, radius: 4 } },
  3: { music_toggle: music, chapters_menu: chapters, continue: continueButton },
  4: { music_toggle: music, chapters_menu: chapters, decode_word: { x: 10, y: 82, width: 80, height: 8, radius: 4 }, hint: { x: 18, y: 92, width: 64, height: 3, radius: 2 } },
  5: { music_toggle: music, chapters_menu: chapters, continue: continueButton },
  6: { music_toggle: music, chapters_menu: chapters, save_date: { x: 31, y: 69, width: 38, height: 6, radius: 4 }, continue: continueButton },
  7: { music_toggle: music, chapters_menu: chapters, continue: continueButton },
  8: { music_toggle: music, chapters_menu: chapters, continue: continueButton },
  9: { music_toggle: music, chapters_menu: chapters, location: { x: 18, y: 72, width: 64, height: 7, radius: 4 }, continue: continueButton },
  10: { music_toggle: music, chapters_menu: chapters, dress_code: { x: 13, y: 63, width: 74, height: 8, radius: 4 }, continue: continueButton },
  11: { music_toggle: music, chapters_menu: chapters, rsvp: { x: 12, y: 73, width: 76, height: 12, radius: 4 } },
};
