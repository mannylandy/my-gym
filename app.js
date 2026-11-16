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
  const label = document.getElementById("hero-label");
  const name = document.getElementById("hero-name");
  const note = document.getElementById("hero-note");
  const buttonText = document.getElementById("hero-btn-text");

  if (workouts.length === 0) {
    label.textContent = "Start here";
    name.textContent = "Build your first workout";
    note.textContent = "Pick the exercises and watch the muscles light up.";
    buttonText.textContent = "New workout";
  } else if (workout) {
    label.textContent = todayPick !== undefined ? "Your pick today" : "Planned for today";
    name.textContent = workout.name;
    note.textContent = workoutSummary(workout);
    buttonText.textContent = "Change workout";
  } else {
    label.textContent = todayPick === "none" ? "Day off" : "Nothing planned";
    name.textContent = "Rest day";
    note.textContent = "Feel like training anyway? Pick one of your workouts.";
    buttonText.textContent = "Pick a workout";
  }

  // The goal is the number of days you have put a workout on
  const plannedDays = schedule.filter((id) => findWorkout(id)).length;
  document.getElementById("sessions-goal").textContent = plannedDays ? "/" + plannedDays : "";

  // The exercise list and body map only show when there is a workout today
  document.getElementById("today-work").hidden = !workout;
  if (!workout) return;

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

function renderAll() {
  renderWeek();
  renderToday();
  renderWorkouts();
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

document.getElementById("hero-btn").addEventListener("click", () => {
  if (workouts.length === 0) openEditor(null);
  else chooseForToday();
});

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
