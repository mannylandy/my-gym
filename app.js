const USER_NAME = "Manny";

// Order must match the tabs in index.html
const SCREENS = ["today", "workout", "progress"];

// Big title and small line above it, per screen
const SCREEN_TEXT = {
  today: { title: "Today", eyebrow: () => greeting() + ", " + USER_NAME },
  workout: { title: "Workout", eyebrow: () => "Chalk up" },
  progress: { title: "Progress", eyebrow: () => "Proof of work" },
};

// Greeting that fits the time of day
function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Late one";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Show one screen and hide the others
function showScreen(name) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.toggle("active", screen.id === "screen-" + name);
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.screen === name);
  });

  // Slide the volt pill under the selected tab
  const tabBar = document.getElementById("tab-bar");
  tabBar.style.setProperty("--active", SCREENS.indexOf(name));

  // Swap the header text and replay its little animation
  const title = document.getElementById("screen-title");
  title.textContent = SCREEN_TEXT[name].title;
  document.getElementById("eyebrow").textContent = SCREEN_TEXT[name].eyebrow();
  title.classList.remove("title-in");
  void title.offsetWidth; // makes the browser restart the animation
  title.classList.add("title-in");

  window.scrollTo(0, 0);
}

// Draw Monday to Sunday for the current week, with today highlighted
function renderWeek() {
  const letters = ["M", "T", "W", "T", "F", "S", "S"];
  const today = new Date();
  const daysSinceMonday = (today.getDay() + 6) % 7; // getDay(): Sunday is 0

  const week = document.getElementById("week");
  week.innerHTML = "";

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - daysSinceMonday + i);

    const day = document.createElement("div");
    day.className = "day";
    if (i < daysSinceMonday) day.classList.add("past");
    if (i === daysSinceMonday) day.classList.add("today");

    const letter = document.createElement("span");
    letter.textContent = letters[i];

    const number = document.createElement("span");
    number.className = "day-number";
    number.textContent = date.getDate();

    day.append(letter, number);
    week.append(day);
  }
}

// Finished workouts saved on this phone. Empty until logging is built.
function loadWorkouts() {
  try {
    return JSON.parse(localStorage.getItem("mygym.workouts")) || [];
  } catch (error) {
    return [];
  }
}

// The day after the one you did last. Day A if you have no history.
function nextDayId() {
  const workouts = loadWorkouts();
  if (workouts.length === 0) return PLAN.days[0].id;

  const lastId = workouts[workouts.length - 1].dayId;
  const lastIndex = PLAN.days.findIndex((day) => day.id === lastId);
  return PLAN.days[(lastIndex + 1) % PLAN.days.length].id;
}

// The day shown on the Today screen. Starts as the next one in the plan.
let selectedDayId = nextDayId();

// The exercise you tapped in the list (its position), or null for the whole workout
let selectedExerciseIndex = null;

function selectedDay() {
  return PLAN.days.find((day) => day.id === selectedDayId);
}

// The exercises of a day, skipping any id that is not in the library (a typo, for example)
function dayItems(day) {
  return day.exercises.filter((item) => findExercise(item.exercise));
}

function isCardio(exercise) {
  return exercise.primary.includes("cardio");
}

// Turn a list of muscle keys into readable names: "Chest · Triceps"
function muscleNames(keys) {
  return keys.map((key) => MUSCLES[key]).join(" · ");
}

// Fill the Today screen with the selected day from the plan
function renderToday() {
  const day = selectedDay();
  const otherDay = PLAN.days.find((d) => d.id !== selectedDayId);
  const isPlanned = selectedDayId === nextDayId();

  const items = dayItems(day);
  const lifts = items.filter((item) => !isCardio(findExercise(item.exercise)));
  const totalSets = lifts.reduce((sum, item) => sum + item.sets, 0);
  const hasCardio = lifts.length < items.length;

  document.getElementById("hero-label").textContent = isPlanned ? "Next up" : "Your pick";
  document.getElementById("hero-day").textContent = "Day " + day.id;
  document.getElementById("hero-name").textContent = day.name;
  document.getElementById("hero-note").textContent =
    lifts.length + " exercises · " + totalSets + " sets" + (hasCardio ? " · cardio finisher" : "");

  document.getElementById("swap-text").textContent = "Day " + otherDay.id;
  document.getElementById("swap-btn").classList.toggle("flipped", !isPlanned);
  document.getElementById("sessions-goal").textContent = "/" + PLAN.sessionsPerWeek;

  const list = document.getElementById("exercise-list");
  list.innerHTML = "";

  items.forEach((item, i) => {
    const exercise = findExercise(item.exercise);
    const cardio = isCardio(exercise);

    const row = document.createElement("li");
    row.style.animationDelay = i * 0.04 + "s";

    // A button, so the whole row can be tapped
    const button = document.createElement("button");
    button.className = "exercise" + (cardio ? " cardio" : "");
    button.addEventListener("click", () => selectExercise(i));

    const index = document.createElement("span");
    index.className = "exercise-index";
    index.textContent = cardio ? "+" : i + 1;

    const text = document.createElement("span");
    text.className = "exercise-text";
    const name = document.createElement("span");
    name.className = "exercise-name";
    name.textContent = exercise.name;
    const muscle = document.createElement("span");
    muscle.className = "exercise-muscle";
    muscle.textContent = muscleNames(exercise.primary);
    text.append(name, muscle);

    const dose = document.createElement("span");
    dose.className = "exercise-dose";
    dose.textContent = item.sets > 1 ? item.sets + " × " + item.reps : item.reps;

    button.append(index, text, dose);
    row.append(button);
    list.append(row);
  });

  renderMap();
}

// Tap an exercise to see its muscles. Tap it again to go back to the whole workout.
function selectExercise(index) {
  selectedExerciseIndex = selectedExerciseIndex === index ? null : index;
  renderMap();
}

// Light up the body map for the tapped exercise, or for the whole workout
function renderMap() {
  const items = dayItems(selectedDay());
  const day = selectedDay();
  const single = selectedExerciseIndex !== null;

  const ids = single
    ? [items[selectedExerciseIndex].exercise]
    : items.map((item) => item.exercise);
  const levels = muscleLevels(ids);

  drawBodyMap(document.getElementById("body-map"), levels);

  document.getElementById("map-kicker").textContent = single ? "This exercise" : "Whole workout";
  document.getElementById("map-title").textContent = single
    ? findExercise(ids[0]).name
    : day.name;

  // One chip per muscle: main muscles first, then the helpers
  const chips = document.getElementById("map-chips");
  chips.innerHTML = "";
  [2, 1].forEach((level) => {
    Object.keys(MUSCLES).forEach((key) => {
      if (levels[key] !== level) return;
      const chip = document.createElement("span");
      chip.className = "chip" + (level === 1 ? " half" : "") + (key === "cardio" ? " heat" : "");
      chip.textContent = MUSCLES[key];
      chips.append(chip);
    });
  });

  // Mark the tapped row in the list
  document.querySelectorAll("#exercise-list .exercise").forEach((button, i) => {
    button.classList.toggle("selected", i === selectedExerciseIndex);
  });
}

// Let you pick the other day if you don't want the planned one
document.getElementById("swap-btn").addEventListener("click", () => {
  const otherDay = PLAN.days.find((d) => d.id !== selectedDayId);
  selectedDayId = otherDay.id;
  selectedExerciseIndex = null;
  renderToday();
});

// Switch screen when a tab is tapped
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => showScreen(tab.dataset.screen));
});

document.getElementById("start-btn").addEventListener("click", () => {
  showScreen("workout");
});

renderWeek();
renderToday();
showScreen("today");
