import type { JourneyHotspot } from "../types/journey";

const topLeft = { x: 2.8, y: 1.5, width: 14.5, height: 10.5, radius: 50 };
const topRight = { x: 82.5, y: 1.5, width: 14.5, height: 10.5, radius: 50 };
const bottomHint = { x: 17, y: 94, width: 66, height: 4 };

export const journeyHotspots: Record<number, Record<string, JourneyHotspot>> = {
  1: {
    music_toggle: { x: 82, y: 2.5, width: 15, height: 11, radius: 50 },
  },
  2: {
    music_toggle: topLeft,
    start_journey: { x: 14.5, y: 78.3, width: 71, height: 10.5, radius: 4 },
  },
  3: {
    music_toggle: topLeft,
    chapters_menu: topRight,
    continue: { x: 11.5, y: 87.2, width: 77, height: 8.3, radius: 4 },
  },
  4: {
    music_toggle: topLeft,
    chapters_menu: topRight,
    decode_word: { x: 10, y: 84.8, width: 80, height: 9.2, radius: 4 },
    hint: bottomHint,
  },
  5: {
    music_toggle: topLeft,
    chapters_menu: topRight,
    continue: { x: 11.5, y: 87.1, width: 77, height: 8.5, radius: 4 },
    hint: bottomHint,
  },
  6: {
    music_toggle: topLeft,
    chapters_menu: topRight,
    save_date: { x: 35, y: 47.7, width: 30, height: 4.4, radius: 5 },
    ceremony: { x: 14.5, y: 55.1, width: 23, height: 14, radius: 4 },
    reception: { x: 38.5, y: 55.1, width: 23, height: 14, radius: 4 },
    celebration: { x: 62.5, y: 55.1, width: 23, height: 14, radius: 4 },
    dress_code: { x: 18, y: 71.7, width: 64, height: 7.2, radius: 4 },
    continue: { x: 10.5, y: 88.1, width: 79, height: 8.3, radius: 4 },
    hint: bottomHint,
  },
  7: {
    music_toggle: topLeft,
    chapters_menu: topRight,
    continue: { x: 9, y: 85.4, width: 82, height: 7.3, radius: 4 },
    hint: { ...bottomHint, y: 94.3 },
  },
  8: {
    music_toggle: topLeft,
    chapters_menu: topRight,
    sealed_presence_panel: { x: 20, y: 81.1, width: 60, height: 7.5, radius: 4 },
  },
  9: {
    music_toggle: topLeft,
    chapters_menu: topRight,
    magic_ceremony: { x: 18, y: 64, width: 16, height: 13, radius: 3 },
    dinner_toast: { x: 34, y: 64, width: 16, height: 13, radius: 3 },
    music_joy: { x: 50, y: 64, width: 16, height: 13, radius: 3 },
    lasting_memories: { x: 66, y: 64, width: 16, height: 13, radius: 3 },
    continue: { x: 10, y: 88.2, width: 80, height: 7.4, radius: 4 },
    hint: bottomHint,
  },
  10: {
    music_toggle: topLeft,
    chapters_menu: topRight,
    ceremony: { x: 20.5, y: 33.6, width: 62, height: 7.1, radius: 3 },
    celebration: { x: 20.5, y: 41, width: 62, height: 7.1, radius: 3 },
    dress_code: { x: 20.5, y: 48.4, width: 62, height: 7.1, radius: 3 },
    directions: { x: 20.5, y: 55.7, width: 62, height: 7.1, radius: 3 },
    location: { x: 18.2, y: 63, width: 63.6, height: 7.4, radius: 4 },
    rsvp: { x: 10, y: 82.3, width: 80, height: 9.8, radius: 4 },
    hint: bottomHint,
  },
  11: {
    music_toggle: topLeft,
    chapters_menu: topRight,
    gift_list: { x: 4.5, y: 64.2, width: 29.5, height: 15.5, radius: 3 },
    special_message: { x: 35.2, y: 64.2, width: 29.5, height: 15.5, radius: 3 },
    important_details: { x: 66, y: 64.2, width: 29.5, height: 15.5, radius: 3 },
    continue: { x: 13, y: 89.1, width: 74, height: 7.1, radius: 4 },
    hint: bottomHint,
  },
};
