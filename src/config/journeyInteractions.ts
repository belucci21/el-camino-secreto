import type { JourneyHotspot } from "../types/journey";

const topLeft = { x: 4.4, y: 1.4, width: 12.8, height: 9.8, radius: 50 };
const topRight = { x: 82.8, y: 1.4, width: 12.8, height: 9.8, radius: 50 };
const bottomHint = { x: 20, y: 95, width: 60, height: 3 };

export const journeyHotspots: Record<number, Record<string, JourneyHotspot>> = {
  1: {
    music_toggle: { x: 82.8, y: 2.2, width: 12.8, height: 9.8, radius: 50 },
  },
  2: {
    music_toggle: topLeft,
    start_journey: { x: 15.2, y: 79.4, width: 69.6, height: 9.6, radius: 4 },
  },
  3: {
    music_toggle: topLeft,
    chapters_menu: topRight,
    continue: { x: 12, y: 88, width: 76, height: 7.5, radius: 4 },
  },
  4: {
    music_toggle: topLeft,
    chapters_menu: topRight,
    decode_word: { x: 10.8, y: 86.5, width: 78.4, height: 7.6, radius: 4 },
    hint: bottomHint,
  },
  5: {
    music_toggle: topLeft,
    chapters_menu: topRight,
    continue: { x: 12, y: 89.2, width: 76, height: 6.4, radius: 4 },
    hint: bottomHint,
  },
  6: {
    music_toggle: topLeft,
    chapters_menu: topRight,
    save_date: { x: 36, y: 48.8, width: 28, height: 3.5, radius: 5 },
    ceremony: { x: 15.5, y: 56.5, width: 22, height: 12.5, radius: 4 },
    reception: { x: 39, y: 56.5, width: 22, height: 12.5, radius: 4 },
    celebration: { x: 62.5, y: 56.5, width: 22, height: 12.5, radius: 4 },
    dress_code: { x: 18.5, y: 72.8, width: 63, height: 5.8, radius: 4 },
    continue: { x: 11, y: 89, width: 78, height: 7.2, radius: 4 },
    hint: bottomHint,
  },
  7: {
    music_toggle: topLeft,
    chapters_menu: topRight,
    continue: { x: 9.8, y: 86.5, width: 80.4, height: 6.5, radius: 4 },
    hint: { ...bottomHint, y: 95.1 },
  },
  8: {
    music_toggle: topLeft,
    chapters_menu: topRight,
    sealed_presence_panel: { x: 21, y: 82.4, width: 58, height: 6.2, radius: 4 },
  },
  9: {
    music_toggle: topLeft,
    chapters_menu: topRight,
    magic_ceremony: { x: 19.5, y: 65.3, width: 15, height: 11.5, radius: 3 },
    dinner_toast: { x: 35, y: 65.3, width: 15, height: 11.5, radius: 3 },
    music_joy: { x: 50, y: 65.3, width: 15, height: 11.5, radius: 3 },
    lasting_memories: { x: 65.5, y: 65.3, width: 15, height: 11.5, radius: 3 },
    continue: { x: 10.8, y: 89.1, width: 78.4, height: 6.4, radius: 4 },
    hint: bottomHint,
  },
  10: {
    music_toggle: topLeft,
    chapters_menu: topRight,
    ceremony: { x: 21, y: 33.7, width: 61, height: 6.9, radius: 3 },
    celebration: { x: 21, y: 41.1, width: 61, height: 6.9, radius: 3 },
    dress_code: { x: 21, y: 48.5, width: 61, height: 6.9, radius: 3 },
    directions: { x: 21, y: 55.8, width: 61, height: 6.9, radius: 3 },
    location: { x: 19, y: 63.2, width: 62, height: 5.4, radius: 4 },
    rsvp: { x: 11, y: 85.3, width: 78, height: 7.3, radius: 4 },
    hint: bottomHint,
  },
  11: {
    music_toggle: topLeft,
    chapters_menu: topRight,
    gift_list: { x: 5.2, y: 65, width: 28.5, height: 14.2, radius: 3 },
    special_message: { x: 35.8, y: 65, width: 28.5, height: 14.2, radius: 3 },
    important_details: { x: 66.4, y: 65, width: 28.5, height: 14.2, radius: 3 },
    continue: { x: 13.5, y: 89.7, width: 73, height: 6.4, radius: 4 },
    hint: bottomHint,
  },
};
