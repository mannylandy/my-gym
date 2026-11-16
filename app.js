const USER_NAME = "Manny";

// Order must match the tabs in index.html
const SCREENS = ["today", "workout", "progress"];

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

// Big title and small line above it, per screen
const SCREEN_TEXT = {
  today: { title: "Today", eyebrow: () => greeting() + ", " + USER_NAME },
  workout: { title: "Workouts", eyebrow: () => "Your plan, your rules" },
  progress: { title: "Progress", eyebrow: () => "Proof of work" },
};

// ---------- What the app remembers while it is open ----------
let workouts = loadMyWorkouts(); // the workouts you built
let schedule = loadSchedule(); // 7 slots, Monday first: a workout id or null
let todayPick = loadTodayPick(); // see plan.js
let selectedExerciseIndex = null; // the exercise tapped on Today, or null
let sessions = loadSessions(); // every workout you finished
let activeSession = loadActiveSession(); // the workout you are in the middle of, or null

// ---------- Small helpers ----------

// Greeting that fits the time of day
function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Late one";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// 0 = Monday ... 6 = Sunday
function todayIndex() {
  return (new Date().getDay() + 6) % 7; // getDay(): Sunday is 0
}

function findWorkout(id) {
  return workouts.find((workout) => workout.id === id) || null;
}

// The exercises of a workout, skipping any that no longer exist in the library
function validItems(workout) {
  return workout.exercises.filter((item) => findExercise(item.exercise));
}

function isCardio(exercise) {
  return exercise.primary.includes("cardio");
}

// "Chest · Triceps"
function muscleNames(keys) {
  return keys.map((key) => MUSCLES[key]).join(" · ");
}

// "5 exercises · 15 sets"
function workoutSummary(workout) {
  const items = validItems(workout);
  const sets = items.reduce((sum, item) => sum + item.sets, 0);
  return items.length + (items.length === 1 ? " exercise" : " exercises") + " · " + sets + " sets";
}

// "3 × 10", or just "10 min" when there is one set
function doseText(item) {
  return item.sets > 1 ? item.sets + " × " + item.reps : item.reps;
}

// Make a small icon from the icon set in index.html
function icon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "icon");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", "#i-" + name);
  svg.append(use);
  return svg;
}

// Shortcut for making an element with a class and text
function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

// The workout for today: your own pick if you made one, otherwise the schedule
function todaysWorkout() {
  if (todayPick === "none") return null;
  if (todayPick !== undefined && findWorkout(todayPick)) return findWorkout(todayPick);
  return findWorkout(schedule[todayIndex()]);
}

// ---------- Numbers from your logged sessions ----------

// "12 sets · 3,240 kg lifted · 1 PR"
function sessionSummary(session) {
  let sets = 0;
  let volume = 0;
  session.exercises.forEach((entry) => {
    entry.sets.forEach((set) => {
      sets += 1;
      volume += set.kg * set.reps;
    });
  });

  let text = sets + (sets === 1 ? " set" : " sets");
  if (volume > 0) text += " · " + Math.round(volume).toLocaleString("en-GB") + " kg lifted";
  if (session.prs) text += " · " + session.prs + (session.prs === 1 ? " PR" : " PRs");
  return text;
}

// The sets you logged the last time you did an exercise, or null
function lastLogged(exerciseId) {
  for (let i = sessions.length - 1; i >= 0; i--) {
    const entry = sessions[i].exercises.find((e) => e.exercise === exerciseId);
    if (entry && entry.sets.length) return entry.sets;
  }
  return null;
}

// The heaviest weight you have ever logged for an exercise (0 if never)
function bestKg(exerciseId) {
  let best = 0;
  sessions.forEach((session) => {
    session.exercises.forEach((entry) => {
      if (entry.exercise !== exerciseId) return;
      entry.sets.forEach((set) => {
        best = Math.max(best, set.kg);
      });
    });
  });
  return best;
}

function sessionsThisWeek() {
  const thisWeek = mondayKey(new Date());
  return sessions.filter((session) => mondayKey(parseKey(session.date)) === thisWeek).length;
}

// Weeks in a row where you trained as many times as you planned (at least once).
// This week counts as soon as you reach the goal, and does not break the streak before that.
function weekStreak() {
  const goal = Math.max(1, schedule.filter((id) => findWorkout(id)).length);

  const perWeek = {};
  sessions.forEach((session) => {
    const week = mondayKey(parseKey(session.date));
    perWeek[week] = (perWeek[week] || 0) + 1;
  });

  const cursor = parseKey(mondayKey(new Date()));
  let streak = 0;
  if ((perWeek[dateKey(cursor)] || 0) >= goal) streak += 1;
  cursor.setDate(cursor.getDate() - 7);
  while ((perWeek[dateKey(cursor)] || 0) >= goal) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

// What the big card on Today should show right now
function heroState() {
  if (activeSession) return "active"; // a workout is in progress
  if (sessions.some((session) => session.date === todayKey())) return "done";
  if (workouts.length === 0) return "empty";
  return todaysWorkout() ? "planned" : "rest";
}

// ---------- Screens and tabs ----------

function showScreen(name) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.toggle("active", screen.id === "screen-" + name);
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.screen === name);
  });

  // Slide the volt pill under the selected tab
  document.getElementById("tab-bar").style.setProperty("--active", SCREENS.indexOf(name));

  // Swap the header text and replay its little animation
  const title = document.getElementById("screen-title");
  title.textContent = SCREEN_TEXT[name].title;
  document.getElementById("eyebrow").textContent = SCREEN_TEXT[name].eyebrow();
  title.classList.remove("title-in");
  void title.offsetWidth; // makes the browser restart the animation
  title.classList.add("title-in");

  window.scrollTo(0, 0);
}

// ---------- Body map panel (used on Today and in the editor) ----------

function fillMapPanel(panel, exerciseIds, kicker, title) {
  const levels = muscleLevels(exerciseIds);
  drawBodyMap(panel.querySelector(".body-map"), levels);

  panel.querySelector(".map-kicker").textContent = kicker;
  panel.querySelector(".map-title").textContent = title;

  // One chip per muscle: main muscles first, then the helpers
  const chips = panel.querySelector(".chips");
  chips.innerHTML = "";
  [2, 1].forEach((level) => {
    Object.keys(MUSCLES).forEach((key) => {
      if (levels[key] !== level) return;
      const chip = el("span", "chip", MUSCLES[key]);
      if (level === 1) chip.classList.add("half");
      if (key === "cardio") chip.classList.add("heat");
      chips.append(chip);
    });
  });
}

// ---------- Today ----------

// Monday to Sunday. Tap a day to choose which workout goes on it.
function renderWeek() {
  const today = new Date();
  const week = document.getElementById("week");
  week.innerHTML = "";

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - todayIndex() + i);
    const planned = findWorkout(schedule[i]);

    const day = el("button", "day");
    if (i < todayIndex()) day.classList.add("past");
    if (i === todayIndex()) day.classList.add("today");
    if (planned) day.classList.add("has");
    if (sessions.some((session) => session.date === dateKey(date))) day.classList.add("done");
    day.setAttribute("aria-label", DAY_NAMES[i] + (planned ? ": " + planned.name : ": rest"));

    day.append(
      el("span", "", DAY_LETTERS[i]),
      el("span", "day-number", date.getDate()),
      el("span", "day-dot")
    );
    day.addEventListener("click", () => chooseForWeekday(i));
    week.append(day);
  }
}

function renderToday() {
  const workout = todaysWorkout();
  const state = heroState();

  // label, big name, small note, button text
  let texts;
  if (state === "active") {
    const done = countSets(activeSession, true);
    texts = ["In progress", activeSession.name, done + " of " + countSets(activeSession, false) + " sets done", "Continue workout"];
  } else if (state === "done") {
    const todays = sessions.filter((session) => session.date === todayKey());
    const latest = todays[todays.length - 1];
    texts = ["Done today", latest.name, sessionSummary(latest), "Train again"];
  } else if (state === "empty") {
    texts = ["Start here", "Build your first workout", "Pick the exercises and watch the muscles light up.", "New workout"];
  } else if (state === "planned") {
    texts = [todayPick !== undefined ? "Your pick today" : "Planned for today", workout.name, workoutSummary(workout), "Start workout"];
  } else {
    texts = [
      todayPick === "none" ? "Day off" : "Nothing planned",
      "Rest day",
      "Feel like training anyway? Pick one of your workouts.",
      "Pick a workout",
    ];
  }

  document.getElementById("hero-label").textContent = texts[0];
  document.getElementById("hero-name").textContent = texts[1];
  document.getElementById("hero-note").textContent = texts[2];
  document.getElementById("hero-btn-text").textContent = texts[3];
  document.getElementById("hero-alt").hidden = state !== "planned";

  // The two tiles. The goal is the number of days you have put a workout on.
  const plannedDays = schedule.filter((id) => findWorkout(id)).length;
  document.getElementById("streak-number").textContent = weekStreak();
  document.getElementById("sessions-number").textContent = sessionsThisWeek();
  document.getElementById("sessions-goal").textContent = plannedDays ? "/" + plannedDays : "";

  // The exercise list and body map only show before you start today's workout
  document.getElementById("today-work").hidden = state !== "planned";
  if (state !== "planned") return;

  const list = document.getElementById("exercise-list");
  list.innerHTML = "";

  validItems(workout).forEach((item, i) => {
    const exercise = findExercise(item.exercise);
    const cardio = isCardio(exercise);

    const row = el("li");
    row.style.animationDelay = i * 0.04 + "s";

    // A button, so the whole row can be tapped
    const button = el("button", "exercise" + (cardio ? " cardio" : ""));
    button.addEventListener("click", () => {
      // Tap again to go back to the whole workout
      selectedExerciseIndex = selectedExerciseIndex === i ? null : i;
      renderTodayMap();
    });

    const text = el("span", "exercise-text");
    text.append(
      el("span", "exercise-name", exercise.name),
      el("span", "exercise-muscle", muscleNames(exercise.primary))
    );

    button.append(
      el("span", "exercise-index", cardio ? "+" : i + 1),
      text,
      el("span", "exercise-dose", doseText(item))
    );
    row.append(button);
    list.append(row);
  });

  renderTodayMap();
}

// Light up the body map for the tapped exercise, or for the whole workout
function renderTodayMap() {
  const workout = todaysWorkout();
  if (!workout) return;

  const items = validItems(workout);
  if (selectedExerciseIndex !== null && !items[selectedExerciseIndex]) selectedExerciseIndex = null;
  const single = selectedExerciseIndex !== null;

  const ids = single ? [items[selectedExerciseIndex].exercise] : items.map((item) => item.exercise);

  fillMapPanel(
    document.getElementById("today-map"),
    ids,
    single ? "This exercise" : "Whole workout",
    single ? findExercise(ids[0]).name : workout.name
  );

  document.querySelectorAll("#exercise-list .exercise").forEach((button, i) => {
    button.classList.toggle("selected", i === selectedExerciseIndex);
  });
}

// ---------- Workouts screen ----------

function renderWorkouts() {
  const list = document.getElementById("workout-list");
  list.innerHTML = "";
  document.getElementById("workouts-empty").hidden = workouts.length > 0;

  workouts.forEach((workout) => {
    const card = el("button", "wcard");
    card.addEventListener("click", () => openEditor(workout.id));

    const map = el("div", "body-map mini");
    drawBodyMap(map, muscleLevels(validItems(workout).map((item) => item.exercise)));

    const text = el("div", "wcard-text");
    text.append(el("p", "wcard-name", workout.name), el("p", "wcard-note", workoutSummary(workout)));

    // The days this workout is planned on
    const days = el("div", "chips");
    schedule.forEach((id, i) => {
      if (id === workout.id) days.append(el("span", "chip", DAY_SHORT[i]));
    });
    if (!days.children.length) days.append(el("span", "chip half", "No day set"));
    text.append(days);

    card.append(map, text);
    list.append(card);
  });
}

// ---------- Progress screen: your finished sessions, newest first ----------

let chartExerciseId = null; // the exercise shown in the chart

// Exercises you have logged at least once, the most recently trained first
function loggedExerciseIds() {
  const ids = [];
  sessions
    .slice()
    .reverse()
    .forEach((session) => {
      session.exercises.forEach((entry) => {
        if (!ids.includes(entry.exercise) && findExercise(entry.exercise)) ids.push(entry.exercise);
      });
    });
  return ids;
}

// One point per session: the heaviest kg you lifted that day.
// Bodyweight exercises (no kg) use the most reps, cardio uses the most minutes.
function chartData(exerciseId) {
  const exercise = findExercise(exerciseId);
  const entries = [];
  sessions.forEach((session) => {
    session.exercises.forEach((entry) => {
      if (entry.exercise === exerciseId && entry.sets.length) entries.push({ date: session.date, sets: entry.sets });
    });
  });

  const usesKg = !isCardio(exercise) && entries.some((e) => e.sets.some((set) => set.kg > 0));
  const unit = isCardio(exercise) ? "min" : usesKg ? "kg" : "reps";

  // In kg mode, skip workouts where no weight was written down (they would show as 0)
  const points = entries
    .filter((e) => !usesKg || e.sets.some((set) => set.kg > 0))
    .map((e) => ({
      date: e.date,
      value: Math.max(...e.sets.map((set) => (usesKg ? set.kg : set.reps))),
    }));
  return { points: points, unit: unit };
}

// "16 Nov"
function shortDate(key) {
  return parseKey(key).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// Round to at most one decimal: 62.5 stays, 62.4999 becomes 62.5
function niceNumber(value) {
  return Math.round(value * 10) / 10;
}

// Draw the line chart as an SVG. Only numbers and dates go in, never typed text.
function chartSvg(points, unit) {
  const width = 320;
  const height = 170;
  const left = 34;
  const right = 14;
  const top = 16;
  const bottom = 26;

  const values = points.map((p) => p.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  // Give the line some room so a flat line sits in the middle
  const pad = Math.max((max - min) * 0.2, max * 0.05, 1);
  min = Math.max(0, min - pad);
  max = max + pad;

  const x = (i) => (points.length === 1 ? (left + width - right) / 2 : left + (i * (width - left - right)) / (points.length - 1));
  const y = (v) => top + ((max - v) * (height - top - bottom)) / (max - min);

  const coords = points.map((p, i) => [x(i), y(p.value)]);
  const line = coords.map((c, i) => (i ? "L" : "M") + c[0].toFixed(1) + " " + c[1].toFixed(1)).join(" ");
  const floor = height - bottom;
  const area =
    line + " L" + coords[coords.length - 1][0].toFixed(1) + " " + floor + " L" + coords[0][0].toFixed(1) + " " + floor + " Z";

  // Three faint guide lines with their values
  let grid = "";
  [0, 0.5, 1].forEach((f) => {
    const value = min + (max - min) * f;
    const gy = y(value).toFixed(1);
    grid +=
      '<line class="grid" x1="' + left + '" x2="' + (width - right) + '" y1="' + gy + '" y2="' + gy + '"/>' +
      '<text class="axis" x="' + (left - 6) + '" y="' + gy + '" text-anchor="end" dominant-baseline="middle">' +
      Math.round(value) + "</text>";
  });

  // Dates under the first and last point
  let dates = '<text class="axis" x="' + coords[0][0].toFixed(1) + '" y="' + (height - 6) + '" text-anchor="' +
    (points.length === 1 ? "middle" : "start") + '">' + shortDate(points[0].date) + "</text>";
  if (points.length > 1) {
    dates += '<text class="axis" x="' + coords[coords.length - 1][0].toFixed(1) + '" y="' + (height - 6) +
      '" text-anchor="end">' + shortDate(points[points.length - 1].date) + "</text>";
  }

  // A dot per session. The newest one is big, with its value above it.
  let dots = "";
  coords.forEach((c, i) => {
    const last = i === coords.length - 1;
    dots += '<circle class="' + (last ? "dot last" : "dot") + '" cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) +
      '" r="' + (last ? 6 : 3.5) + '" style="animation-delay:' + (0.3 + i * 0.05).toFixed(2) + 's"/>';
  });
  const lastC = coords[coords.length - 1];
  const tag = niceNumber(points[points.length - 1].value) + " " + unit;
  dots += '<text class="tag" x="' + Math.min(lastC[0], width - right).toFixed(1) + '" y="' + (lastC[1] - 12).toFixed(1) +
    '" text-anchor="' + (points.length === 1 ? "middle" : "end") + '">' + tag + "</text>";

  return (
    '<svg viewBox="0 0 ' + width + " " + height + '" role="img" aria-label="Progress chart">' +
    '<defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#d4ff3f" stop-opacity="0.35"/><stop offset="1" stop-color="#d4ff3f" stop-opacity="0"/>' +
    "</linearGradient></defs>" +
    grid +
    (points.length > 1 ? '<path class="area" d="' + area + '"/><path class="line" pathLength="1" d="' + line + '"/>' : "") +
    dots +
    dates +
    "</svg>"
  );
}

function renderChart() {
  const ids = loggedExerciseIds();
  document.getElementById("chart-card").hidden = ids.length === 0;
  if (!ids.length) return;
  if (!ids.includes(chartExerciseId)) chartExerciseId = ids[0];

  // One chip per exercise you have logged
  const pick = document.getElementById("chart-pick");
  pick.innerHTML = "";
  ids.forEach((id) => {
    const chip = el("button", "filter-chip" + (id === chartExerciseId ? " on" : ""), findExercise(id).name);
    chip.addEventListener("click", () => {
      chartExerciseId = id;
      renderChart();
    });
    pick.append(chip);
  });

  const data = chartData(chartExerciseId);
  const values = data.points.map((p) => p.value);
  const first = values[0];
  const latest = values[values.length - 1];
  const change = niceNumber(latest - first);

  // Three numbers above the chart
  const stats = document.getElementById("chart-stats");
  stats.innerHTML = "";
  [
    ["Best", niceNumber(Math.max(...values)) + " " + data.unit, ""],
    ["Latest", niceNumber(latest) + " " + data.unit, ""],
    ["Since start", (change > 0 ? "+" : "") + change + " " + data.unit, change > 0 ? "up" : ""],
  ].forEach(([label, value, extra]) => {
    const stat = el("div", "stat");
    stat.append(el("p", "stat-value " + extra, value), el("p", "stat-label", label));
    stats.append(stat);
  });

  document.getElementById("chart").innerHTML = chartSvg(data.points, data.unit);
  document.getElementById("chart-hint").textContent =
    data.points.length === 1
      ? "Log it again to see your line grow."
      : data.unit === "kg"
        ? "Heaviest set per workout."
        : data.unit === "reps"
          ? "Most reps in a set per workout."
          : "Longest cardio per workout.";
}

// Sets per muscle this week, lit up on the body map
function renderWeekMuscles() {
  const thisWeek = mondayKey(new Date());
  const weekSessions = sessions.filter((session) => mondayKey(parseKey(session.date)) === thisWeek);
  document.getElementById("week-card").hidden = weekSessions.length === 0;
  if (!weekSessions.length) return;

  // Count each set for the main muscles of the exercise
  const setsPer = {};
  const levels = {};
  let total = 0;
  weekSessions.forEach((session) => {
    session.exercises.forEach((entry) => {
      const exercise = findExercise(entry.exercise);
      if (!exercise) return;
      total += entry.sets.length;
      exercise.primary.forEach((muscle) => {
        setsPer[muscle] = (setsPer[muscle] || 0) + entry.sets.length;
        levels[muscle] = 2;
      });
      exercise.secondary.forEach((muscle) => {
        if (!levels[muscle]) levels[muscle] = 1;
      });
    });
  });

  // Every exercise this week was deleted: nothing to show
  if (total === 0) {
    document.getElementById("week-card").hidden = true;
    return;
  }

  document.getElementById("week-total").textContent =
    weekSessions.length + (weekSessions.length === 1 ? " workout" : " workouts") + " · " + total + " sets";
  drawBodyMap(document.querySelector("#week-map .body-map"), levels);

  // A small bar per muscle, the most trained first
  const bars = document.getElementById("muscle-bars");
  bars.innerHTML = "";
  const sorted = Object.keys(setsPer).sort((a, b) => setsPer[b] - setsPer[a]);
  const most = setsPer[sorted[0]];
  sorted.forEach((muscle, i) => {
    const row = el("div", "mbar" + (muscle === "cardio" ? " heat" : ""));
    const track = el("span", "mbar-track");
    const fill = el("span", "mbar-fill");
    fill.style.width = (setsPer[muscle] / most) * 100 + "%";
    fill.style.animationDelay = i * 0.05 + "s";
    track.append(fill);
    row.append(el("span", "mbar-name", MUSCLES[muscle]), track, el("span", "mbar-num", setsPer[muscle]));
    bars.append(row);
  });
}

function renderProgress() {
  renderChart();
  renderWeekMuscles();
  document.getElementById("history-label").hidden = sessions.length === 0;

  const list = document.getElementById("history-list");
  list.innerHTML = "";
  document.getElementById("progress-empty").hidden = sessions.length > 0;

  sessions
    .slice()
    .reverse()
    .forEach((session) => {
      const card = el("div", "hcard");

      const top = el("div", "hcard-top");
      const date = parseKey(session.date).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      top.append(el("p", "hcard-name", session.name), el("p", "hcard-date", date));
      card.append(top, el("p", "hcard-note", sessionSummary(session)));

      session.exercises.forEach((entry) => {
        const exercise = findExercise(entry.exercise);
        const line = el("p", "hcard-line");
        line.append(
          el("strong", "", exercise ? exercise.name : "Removed exercise"),
          " " + entry.sets.map((set) => setText(set, exercise)).join(", ")
        );
        card.append(line);
      });

      list.append(card);
    });
}

// "60 kg × 8", "12 reps" for bodyweight, "10 min" for cardio
function setText(set, exercise) {
  if (exercise && isCardio(exercise)) return set.reps + " min";
  return set.kg ? set.kg + " kg × " + set.reps : set.reps + " reps";
}

function renderAll() {
  renderWeek();
  renderToday();
  renderWorkouts();
  renderProgress();
}

// ---------- Chooser: the small list that slides up from the bottom ----------

// options: [{ label, note, current, onPick }]
function openChooser(title, options) {
  document.getElementById("chooser-title").textContent = title;
  const list = document.getElementById("chooser-list");
  list.innerHTML = "";

  options.forEach((option) => {
    const button = el("button", "choice" + (option.current ? " current" : ""));
    const text = el("span", "choice-text");
    text.append(el("span", "choice-label", option.label));
    if (option.note) text.append(el("span", "choice-note", option.note));
    button.append(text);
    if (option.current) button.append(icon("check"));

    button.addEventListener("click", () => {
      closeChooser();
      option.onPick();
    });
    list.append(button);
  });

  document.getElementById("chooser").hidden = false;
}

function closeChooser() {
  document.getElementById("chooser").hidden = true;
}

// Always offered at the end of a chooser
function newWorkoutOption() {
  return { label: "New workout", note: "Build one from the exercise library", onPick: () => openEditor(null) };
}

// Put a workout on a weekday (it repeats every week)
function chooseForWeekday(dayIndex) {
  const setDay = (id) => {
    schedule[dayIndex] = id;
    saveSchedule(schedule);
    selectedExerciseIndex = null;
    renderAll();
  };

  const options = workouts.map((workout) => ({
    label: workout.name,
    note: workoutSummary(workout),
    current: schedule[dayIndex] === workout.id,
    onPick: () => setDay(workout.id),
  }));
  options.push({
    label: "Rest day",
    note: "Nothing planned",
    current: !findWorkout(schedule[dayIndex]),
    onPick: () => setDay(null),
  });
  options.push(newWorkoutOption());

  openChooser("Every " + DAY_NAMES[dayIndex], options);
}

// Pick a different workout just for today. The schedule stays as it is.
function chooseForToday() {
  const setPick = (id) => {
    todayPick = id;
    saveTodayPick(id);
    selectedExerciseIndex = null;
    renderAll();
  };

  const current = todaysWorkout();
  const options = workouts.map((workout) => ({
    label: workout.name,
    note: workoutSummary(workout),
    current: current !== null && current.id === workout.id,
    onPick: () => setPick(workout.id),
  }));
  options.push({ label: "No training today", note: "Take the day off", current: !current, onPick: () => setPick("none") });

  // Only useful when you have changed away from the schedule
  if (todayPick !== undefined) {
    const planned = findWorkout(schedule[todayIndex()]);
    options.push({
      label: "Back to my schedule",
      note: planned ? planned.name : "Rest day",
      onPick: () => setPick(undefined),
    });
  }
  options.push(newWorkoutOption());

  openChooser("Today", options);
}

// After finishing one workout today, pick one to do as well
function chooseToTrainAgain() {
  const options = workouts.map((workout) => ({
    label: workout.name,
    note: workoutSummary(workout),
    onPick: () => startSession(workout),
  }));
  options.push(newWorkoutOption());
  openChooser("Train again", options);
}

// ---------- Logging: doing a workout and writing down your sets ----------

// Read a typed number. Accepts a comma ("62,5") and never goes below 0.
function toNumber(text) {
  const value = parseFloat(String(text).replace(",", "."));
  return value > 0 ? value : 0;
}

// How many sets a session in progress has (all of them, or only the ticked ones)
function countSets(session, onlyDone) {
  let count = 0;
  session.exercises.forEach((entry) => {
    if (!findExercise(entry.exercise)) return; // a deleted custom exercise
    entry.sets.forEach((set) => {
      if (!onlyDone || set.done) count += 1;
    });
  });
  return count;
}

// Start a workout. Each set is filled in with what you did last time.
function startSession(workout) {
  activeSession = {
    workoutId: workout.id,
    name: workout.name,
    date: todayKey(),
    exercises: validItems(workout).map((item) => {
      const last = lastLogged(item.exercise);
      const plannedReps = parseInt(item.reps, 10);
      const sets = [];

      for (let i = 0; i < item.sets; i++) {
        const before = last ? last[i] || last[last.length - 1] : null;
        sets.push({
          kg: before && before.kg ? String(before.kg) : "",
          reps: before ? String(before.reps) : plannedReps ? String(plannedReps) : "",
          done: false,
        });
      }
      return { exercise: item.exercise, sets: sets };
    }),
  };

  saveActiveSession(activeSession);
  openLogger();
}

function openLogger() {
  document.getElementById("logger-title").textContent = activeSession.name;
  document.getElementById("logger").hidden = false;
  document.getElementById("logger").scrollTop = 0;
  document.body.classList.add("locked");
  renderLogger();
}

// Closing keeps the workout in progress. Today shows "Continue workout".
function closeLogger() {
  document.getElementById("logger").hidden = true;
  document.body.classList.remove("locked");
  renderAll();
}

function updateLoggerProgress() {
  const done = countSets(activeSession, true);
  const total = countSets(activeSession, false);
  document.getElementById("log-count").textContent = done + " of " + total + " sets done";
  document.getElementById("log-bar-fill").style.width = (total ? (done / total) * 100 : 0) + "%";
  document.getElementById("logger-finish").disabled = done === 0;
}

function renderLogger() {
  const list = document.getElementById("logger-list");
  list.innerHTML = "";

  activeSession.exercises.forEach((entry, exerciseIndex) => {
    const exercise = findExercise(entry.exercise);
    if (!exercise) return;
    const cardio = isCardio(exercise);
    const best = bestKg(entry.exercise);
    const last = lastLogged(entry.exercise);

    const card = el("div", "log-card");

    const head = el("div", "log-head");
    const text = el("span", "exercise-text");
    text.append(
      el("span", "exercise-name", exercise.name),
      el("span", "exercise-muscle", muscleNames(exercise.primary))
    );
    head.append(el("span", "exercise-index", cardio ? "+" : exerciseIndex + 1), text);

    const lastLine = el(
      "p",
      "log-last",
      last ? "Last time: " + last.map((set) => setText(set, exercise)).join(", ") : "First time logging this one."
    );

    // Column names above the set rows
    const labels = el("div", "set-head" + (cardio ? " cardio" : ""));
    labels.append(el("span", "", "Set"));
    if (!cardio) labels.append(el("span", "", "Kg"));
    labels.append(el("span", "", cardio ? "Minutes" : "Reps"), el("span", "", ""));

    card.append(head, lastLine, labels);

    entry.sets.forEach((set, setIndex) => {
      const row = el("div", "set-row" + (cardio ? " cardio" : ""));
      const number = el("span", "set-num");

      // A text box with a number keyboard, so "62,5" with a comma works too
      const kg = el("input", "input set-input");
      kg.type = "text";
      kg.inputMode = "decimal";
      kg.value = set.kg;
      kg.setAttribute("aria-label", "Kg");

      const reps = el("input", "input set-input");
      reps.type = "number";
      reps.inputMode = "numeric";
      reps.min = "0";
      reps.value = set.reps;
      reps.setAttribute("aria-label", cardio ? "Minutes" : "Reps");

      const check = el("button", "set-check");
      check.setAttribute("aria-label", "Set done");
      check.append(icon("check"));

      // Show the row as done, and as a PR when it beats your heaviest ever
      const refresh = () => {
        const isPr = set.done && !cardio && best > 0 && toNumber(set.kg) > best;
        row.classList.toggle("done", set.done);
        number.classList.toggle("pr", isPr);
        number.textContent = isPr ? "PR" : setIndex + 1;
      };

      kg.addEventListener("input", () => {
        set.kg = kg.value;
        saveActiveSession(activeSession);
        refresh();
      });
      reps.addEventListener("input", () => {
        set.reps = reps.value;
        saveActiveSession(activeSession);
      });
      check.addEventListener("click", () => {
        // A set needs reps (or minutes) before it can be ticked
        if (!set.done && !(toNumber(set.reps) > 0)) {
          reps.focus();
          return;
        }
        set.done = !set.done;
        saveActiveSession(activeSession);
        refresh();
        updateLoggerProgress();
      });

      row.append(number);
      if (!cardio) row.append(kg);
      row.append(reps, check);
      refresh();
      card.append(row);
    });

    // One more set, starting from the same numbers as the last one
    const addSet = el("button", "add-set", "+ Add set");
    addSet.addEventListener("click", () => {
      const previous = entry.sets[entry.sets.length - 1];
      entry.sets.push({ kg: previous ? previous.kg : "", reps: previous ? previous.reps : "", done: false });
      saveActiveSession(activeSession);
      renderLogger();
    });
    card.append(addSet);

    list.append(card);
  });

  updateLoggerProgress();
}

// Save the ticked sets as a finished session
function finishSession() {
  let prs = 0;
  const exercises = [];

  activeSession.exercises.forEach((entry) => {
    if (!findExercise(entry.exercise)) return; // a deleted custom exercise
    const sets = entry.sets
      .filter((set) => set.done)
      .map((set) => ({ kg: toNumber(set.kg), reps: toNumber(set.reps) }));
    if (!sets.length) return;

    // A PR is a heavier weight than you have ever logged for this exercise
    const best = bestKg(entry.exercise);
    if (best > 0 && Math.max(...sets.map((set) => set.kg)) > best) prs += 1;

    exercises.push({ exercise: entry.exercise, sets: sets });
  });
  if (!exercises.length) return;

  sessions.push({
    date: todayKey(),
    workoutId: activeSession.workoutId,
    name: activeSession.name,
    prs: prs,
    exercises: exercises,
  });
  saveSessions(sessions);

  activeSession = null;
  saveActiveSession(null);
  closeLogger();
  showScreen("today");
}

function discardSession() {
  if (!confirm("Discard this workout? The sets you ticked will not be saved.")) return;
  activeSession = null;
  saveActiveSession(null);
  closeLogger();
}

// ---------- Editor: make a new workout or change one ----------

let draft = null; // the workout being edited (a copy, so Close throws the changes away)
let draftDays = []; // weekdays ticked in the editor, for example [0, 3]

function openEditor(workoutId) {
  const existing = findWorkout(workoutId);

  draft = existing
    ? JSON.parse(JSON.stringify(existing)) // a full copy
    : { id: null, name: "", exercises: [] };
  draftDays = [];
  schedule.forEach((id, i) => {
    if (existing && id === existing.id) draftDays.push(i);
  });

  document.getElementById("editor-title").textContent = existing ? "Edit workout" : "New workout";
  document.getElementById("editor-name").value = draft.name;
  document.getElementById("editor-delete").hidden = !existing;
  document.getElementById("editor").hidden = false;
  document.getElementById("editor").scrollTop = 0;
  document.body.classList.add("locked");

  renderEditor();
}

function closeEditor() {
  document.getElementById("editor").hidden = true;
  document.body.classList.remove("locked");
  draft = null;
}

function renderEditor() {
  renderEditorList();
  renderEditorMap();
  renderEditorDays();
}

// Save only works when the workout has a name and at least one exercise
function updateSaveButton() {
  const ready = draft.name.trim() !== "" && validItems(draft).length > 0;
  document.getElementById("editor-save").disabled = !ready;
}

function renderEditorMap() {
  fillMapPanel(
    document.getElementById("editor-map"),
    draft.exercises.map((item) => item.exercise),
    draft.exercises.length ? "This workout trains" : "Add exercises to light it up",
    draft.name.trim() || "New workout"
  );
  updateSaveButton();
}

function renderEditorList() {
  const list = document.getElementById("editor-list");
  list.innerHTML = "";

  draft.exercises.forEach((item, i) => {
    const exercise = findExercise(item.exercise);
    if (!exercise) return;

    const row = el("li", "edit-row");

    // Top line: number, name, move up, remove
    const top = el("div", "edit-top");
    const text = el("span", "exercise-text");
    text.append(
      el("span", "exercise-name", exercise.name),
      el("span", "exercise-muscle", muscleNames(exercise.primary))
    );

    const up = el("button", "icon-btn small");
    up.setAttribute("aria-label", "Move up");
    up.append(icon("up"));
    up.disabled = i === 0;
    up.addEventListener("click", () => {
      draft.exercises.splice(i - 1, 0, draft.exercises.splice(i, 1)[0]);
      renderEditorList();
    });

    const remove = el("button", "icon-btn small");
    remove.setAttribute("aria-label", "Remove");
    remove.append(icon("close"));
    remove.addEventListener("click", () => {
      draft.exercises.splice(i, 1);
      renderEditorList();
      renderEditorMap();
    });

    top.append(el("span", "exercise-index", i + 1), text, up, remove);

    // Bottom line: sets and reps
    const bottom = el("div", "edit-bottom");

    const stepper = el("div", "stepper");
    const minus = el("button", "", "−");
    const value = el("span", "stepper-value", item.sets);
    const plus = el("button", "", "+");
    minus.setAttribute("aria-label", "Fewer sets");
    plus.setAttribute("aria-label", "More sets");
    const changeSets = (amount) => {
      item.sets = Math.min(10, Math.max(1, item.sets + amount));
      value.textContent = item.sets;
    };
    minus.addEventListener("click", () => changeSets(-1));
    plus.addEventListener("click", () => changeSets(1));
    stepper.append(minus, value, plus);

    const reps = el("input", "input reps-input");
    reps.value = item.reps;
    reps.maxLength = 12;
    reps.setAttribute("aria-label", "Reps");
    reps.addEventListener("input", () => {
      item.reps = reps.value;
    });

    bottom.append(el("span", "mini-label", "Sets"), stepper, el("span", "mini-label", "Reps"), reps);

    row.append(top, bottom);
    list.append(row);
  });
}

function renderEditorDays() {
  const box = document.getElementById("editor-days");
  box.innerHTML = "";

  DAY_SHORT.forEach((name, i) => {
    const button = el("button", "day-toggle" + (draftDays.includes(i) ? " on" : ""), name);
    button.addEventListener("click", () => {
      draftDays = draftDays.includes(i) ? draftDays.filter((d) => d !== i) : draftDays.concat(i);
      renderEditorDays();
    });
    box.append(button);
  });

  // Warn when a ticked day already has another workout on it
  const replaced = draftDays
    .filter((i) => findWorkout(schedule[i]) && schedule[i] !== draft.id)
    .map((i) => findWorkout(schedule[i]).name + " on " + DAY_NAMES[i]);

  document.getElementById("editor-days-hint").textContent = replaced.length
    ? "Saving replaces " + replaced.join(", ") + "."
    : "Optional. You can always pick a workout on the day instead.";
}

function saveEditor() {
  draft.name = draft.name.trim();
  // Empty reps would look broken in the list, so fall back to 10
  draft.exercises.forEach((item) => {
    item.reps = String(item.reps).trim() || "10";
  });

  if (draft.id === null) {
    draft.id = "w" + Date.now().toString(36);
    workouts.push(draft);
  } else {
    workouts = workouts.map((workout) => (workout.id === draft.id ? draft : workout));
  }

  // Put it on the ticked days, and take it off days that were unticked
  schedule = schedule.map((id, i) => {
    if (draftDays.includes(i)) return draft.id;
    return id === draft.id ? null : id;
  });

  saveMyWorkouts(workouts);
  saveSchedule(schedule);
  selectedExerciseIndex = null;
  closeEditor();
  renderAll();
}

function deleteEditorWorkout() {
  if (!confirm('Delete "' + draft.name + '"? This cannot be undone.')) return;

  const id = draft.id;
  workouts = workouts.filter((workout) => workout.id !== id);
  schedule = schedule.map((slot) => (slot === id ? null : slot));
  if (todayPick === id) {
    todayPick = undefined;
    saveTodayPick(undefined);
  }

  saveMyWorkouts(workouts);
  saveSchedule(schedule);
  selectedExerciseIndex = null;
  closeEditor();
  renderAll();
}

// ---------- Exercise picker: opens on top of the editor ----------

let pickerFilter = "all"; // "all" or a muscle key

function openPicker() {
  pickerFilter = "all";
  document.getElementById("custom-name").value = "";
  document.getElementById("picker").hidden = false;
  document.getElementById("picker").scrollTop = 0;
  renderPicker();
}

function closePicker() {
  document.getElementById("picker").hidden = true;
  renderEditor();
}

function renderPicker() {
  // Filter chips: All, then every muscle
  const filter = document.getElementById("picker-filter");
  filter.innerHTML = "";
  [["all", "All"]].concat(Object.entries(MUSCLES)).forEach(([key, name]) => {
    const chip = el("button", "filter-chip" + (pickerFilter === key ? " on" : ""), name);
    chip.addEventListener("click", () => {
      pickerFilter = key;
      renderPicker();
    });
    filter.append(chip);
  });

  const list = document.getElementById("picker-list");
  list.innerHTML = "";

  allExercises()
    .filter((exercise) => pickerFilter === "all" || exercise.primary.includes(pickerFilter))
    .forEach((exercise) => {
      const picked = draft.exercises.some((item) => item.exercise === exercise.id);

      const row = el("li");
      const button = el("button", "pick-row" + (picked ? " picked" : ""));
      const check = el("span", "pick-check");
      check.append(icon("check"));

      const text = el("span", "exercise-text");
      text.append(
        el("span", "exercise-name", exercise.name),
        el("span", "exercise-muscle", muscleNames(exercise.primary.concat(exercise.secondary)))
      );

      // Tap to add it, tap again to take it out
      button.addEventListener("click", () => {
        if (picked) {
          draft.exercises = draft.exercises.filter((item) => item.exercise !== exercise.id);
        } else {
          addToDraft(exercise);
        }
        renderPicker();
      });

      button.append(check, text);
      row.append(button);
      list.append(row);
    });

  if (!list.children.length) {
    list.append(el("li", "pick-empty", "No exercises here yet. Make your own below."));
  }
}

function addToDraft(exercise) {
  const cardio = isCardio(exercise);
  draft.exercises.push({
    exercise: exercise.id,
    sets: cardio ? 1 : 3,
    reps: cardio ? "10 min" : "10",
  });
}

// Create an exercise that is not in the library and add it to the workout
function createCustomExercise() {
  const input = document.getElementById("custom-name");
  const name = input.value.trim();
  if (!name) {
    input.focus();
    return;
  }

  const exercise = {
    id: "c" + Date.now().toString(36),
    name: name,
    primary: [document.getElementById("custom-muscle").value],
    secondary: [],
  };

  saveCustomExercises(loadCustomExercises().concat(exercise));
  addToDraft(exercise);
  input.value = "";
  renderPicker();
}

// ---------- Hooking up the buttons ----------

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => showScreen(tab.dataset.screen));
});

// The big button on Today does different things depending on where you are
document.getElementById("hero-btn").addEventListener("click", () => {
  const state = heroState();
  if (state === "active") openLogger();
  else if (state === "done") chooseToTrainAgain();
  else if (state === "empty") openEditor(null);
  else if (state === "planned") startSession(todaysWorkout());
  else chooseForToday();
});
document.getElementById("hero-alt").addEventListener("click", chooseForToday);

document.getElementById("logger-close").addEventListener("click", closeLogger);
document.getElementById("logger-finish").addEventListener("click", finishSession);
document.getElementById("logger-discard").addEventListener("click", discardSession);

document.getElementById("new-workout-btn").addEventListener("click", () => openEditor(null));

document.getElementById("editor-close").addEventListener("click", closeEditor);
document.getElementById("editor-save").addEventListener("click", saveEditor);
document.getElementById("editor-delete").addEventListener("click", deleteEditorWorkout);
document.getElementById("editor-add").addEventListener("click", openPicker);
document.getElementById("editor-name").addEventListener("input", (event) => {
  draft.name = event.target.value;
  renderEditorMap();
});

document.getElementById("picker-done").addEventListener("click", closePicker);
document.getElementById("custom-add").addEventListener("click", createCustomExercise);

// Tapping the dark area outside the chooser closes it
document.getElementById("chooser").addEventListener("click", (event) => {
  if (event.target.id === "chooser") closeChooser();
});

// The muscle choices for a custom exercise
Object.entries(MUSCLES).forEach(([key, name]) => {
  const option = el("option", "", name);
  option.value = key;
  document.getElementById("custom-muscle").append(option);
});

// When you come back to the app (for example the next morning), refresh what "today" is
document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  todayPick = loadTodayPick();
  renderAll();
});

renderAll();
showScreen("today");
