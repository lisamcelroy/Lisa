// When you usually eat: breakfast, lunch and dinner windows, with different
// times for weekdays and weekends and optional changes for a single day
// ("Saturdays we have a late breakfast"). Used for defrost timing and for
// working out which meal is next.
import { fromIsoDay } from "./plan.js";

export const MEAL_ORDER = ["breakfast", "lunch", "dinner"];
export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const DEFAULT_MEAL_TIMES = {
  weekday: { breakfast: ["07:00", "08:30"], lunch: ["12:00", "13:00"], dinner: ["18:00", "19:30"] },
  weekend: { breakfast: ["09:00", "10:30"], lunch: ["12:30", "14:00"], dinner: ["18:00", "19:30"] },
  days: {}, // day of week (0 = Sunday) -> its own times
};

const isWeekend = (dow) => dow === 0 || dow === 6;

/** The saved schedule with defaults filled in. */
export function mealSchedule(saved) {
  return {
    weekday: { ...DEFAULT_MEAL_TIMES.weekday, ...(saved?.weekday || {}) },
    weekend: { ...DEFAULT_MEAL_TIMES.weekend, ...(saved?.weekend || {}) },
    days: { ...(saved?.days || {}) },
  };
}

/** Meal windows for a date: that day's own times, else weekday or weekend times. */
export function timesFor(saved, date) {
  const s = mealSchedule(saved);
  const dow = date.getDay();
  const base = isWeekend(dow) ? s.weekend : s.weekday;
  return { ...base, ...(s.days[dow] || {}) };
}

const atTime = (date, hhmm) => {
  const [h, m] = String(hhmm || "12:00").split(":").map(Number);
  const d = new Date(date);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};

/** When a planned meal starts (ISO day + meal). */
export function mealStart(saved, iso, meal) {
  const day = fromIsoDay(iso);
  return atTime(day, timesFor(saved, day)[meal]?.[0]);
}

/** The meal happening now, or the next one today (after dinner: dinner). */
export function currentMeal(saved, now = new Date()) {
  const t = timesFor(saved, now);
  for (const meal of MEAL_ORDER) if (now < atTime(now, t[meal][1])) return meal;
  return "dinner";
}

/** "7:00 to 8:30" style label. */
export function windowLabel(win) {
  const fmt = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date(2000, 0, 1, h, m);
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: m ? "2-digit" : undefined });
  };
  return `${fmt(win[0])} to ${fmt(win[1])}`;
}
