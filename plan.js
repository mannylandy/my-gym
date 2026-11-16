// Your plan lives here: the workouts you build and the days you put them on.
// Nothing is preset. Everything is saved on this phone with localStorage
// (the browser's built-in storage), so it is still there next time you open the app.

const KEYS = {
  workouts: "mygym.myworkouts", // the workouts you built
  schedule: "mygym.schedule", // which workout is on which weekday
  custom: "mygym.custom", // exercises you created yourself
  pick: "mygym.pick", // a different workout you picked just for today
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

// Today's date as text, for example "2026-11-16"
function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
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
