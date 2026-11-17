// Your plan lives here: the workouts you build and the days you put them on.
// Nothing is preset. Everything is saved on this phone with localStorage
// (the browser's built-in storage), so it is still there next time you open the app.

const KEYS = {
  workouts: "mygym.myworkouts", // the workouts you built
  schedule: "mygym.schedule", // which workout is on which weekday
  custom: "mygym.custom", // exercises you created yourself
  pick: "mygym.pick", // a different workout you picked just for today
  sessions: "mygym.sessions", // every workout you finished, with the sets you logged
  active: "mygym.active", // the workout you are in the middle of
  profile: "mygym.profile", // your answers from the welcome quiz
};

function readStore(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value === null ? fallback : value;
  } catch (error) {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Storage can be blocked (private browsing). The app still works until you close it.
  }
}

// A workout looks like:
// { id: "abc", name: "Chest day", exercises: [{ exercise: "bench-press", sets: 3, reps: "10" }] }
function loadMyWorkouts() {
  const workouts = readStore(KEYS.workouts, []);
  if (!Array.isArray(workouts)) return [];
  // Skip anything that does not look like a workout, so damaged data cannot break the app
  return workouts.filter((workout) => workout && workout.id && Array.isArray(workout.exercises));
}

function saveMyWorkouts(workouts) {
  writeStore(KEYS.workouts, workouts);
}

// The schedule is a list of 7 slots, Monday first. Each slot is a workout id or null (rest).
function loadSchedule() {
  const schedule = readStore(KEYS.schedule, null);
  if (Array.isArray(schedule) && schedule.length === 7) return schedule;
  return [null, null, null, null, null, null, null];
}

function saveSchedule(schedule) {
  writeStore(KEYS.schedule, schedule);
}

function loadCustomExercises() {
  const custom = readStore(KEYS.custom, []);
  return Array.isArray(custom) ? custom : [];
}

function saveCustomExercises(custom) {
  writeStore(KEYS.custom, custom);
}

// A date as text, for example "2026-11-16"
function dateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day;
}

// The other way: "2026-11-16" back to a date
function parseKey(key) {
  const parts = key.split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function todayKey() {
  return dateKey(new Date());
}

// The Monday of the week a date is in, as text
function mondayKey(date) {
  const monday = new Date(date);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return dateKey(monday);
}

// Today's own pick. undefined = follow the schedule, "none" = no training today,
// anything else = the id of the workout you picked. It only counts for today.
function loadTodayPick() {
  const pick = readStore(KEYS.pick, null);
  return pick && pick.date === todayKey() ? pick.id : undefined;
}

function saveTodayPick(id) {
  if (id === undefined) {
    try {
      localStorage.removeItem(KEYS.pick);
    } catch (error) {}
    return;
  }
  writeStore(KEYS.pick, { date: todayKey(), id: id });
}

// A finished session looks like:
// { date: "2026-11-16", workoutId: "abc", name: "Chest day", prs: 1,
//   exercises: [{ exercise: "bench-press", sets: [{ kg: 60, reps: 8 }] }] }
function loadSessions() {
  const sessions = readStore(KEYS.sessions, []);
  if (!Array.isArray(sessions)) return [];
  return sessions.filter((session) => session && session.date && Array.isArray(session.exercises));
}

function saveSessions(sessions) {
  writeStore(KEYS.sessions, sessions);
}

// The workout you are in the middle of, or null. Saved after every set,
// so closing the app at the gym does not lose anything.
function loadActiveSession() {
  const active = readStore(KEYS.active, null);
  return active && Array.isArray(active.exercises) ? active : null;
}

function saveActiveSession(active) {
  if (active === null) {
    try {
      localStorage.removeItem(KEYS.active);
    } catch (error) {}
    return;
  }
  writeStore(KEYS.active, active);
}

// Your profile from the welcome quiz, or null before you have done it:
// { name: "Manny", age: 17, goal: "muscle", days: 4, gym3t: true }
// Saved on this phone only. A real account can later sync this same object.
function loadProfile() {
  const profile = readStore(KEYS.profile, null);
  if (!profile || typeof profile.name !== "string" || !profile.name.trim() || !profile.goal) return null;
  // Damaged numbers fall back to safe values instead of showing nonsense
  const days = parseInt(profile.days, 10);
  profile.days = days >= 1 && days <= 7 ? days : 3;
  const age = parseInt(profile.age, 10);
  profile.age = age >= 10 && age <= 99 ? age : null;
  return profile;
}

function saveProfile(profile) {
  writeStore(KEYS.profile, profile);
}
