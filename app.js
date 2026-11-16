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

// Finished workouts saved on this phone. Empty until step 3 adds logging.
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

// Fill the Today screen with the selected day from the plan
function renderToday() {
  const day = PLAN.days.find((d) => d.id === selectedDayId);
  const otherDay = PLAN.days.find((d) => d.id !== selectedDayId);
  const isPlanned = selectedDayId === nextDayId();

  const lifts = day.exercises.filter((e) => e.muscle !== "Cardio");
  const totalSets = lifts.reduce((sum, e) => sum + e.sets, 0);

  document.getElementById("hero-label").textContent = isPlanned ? "Next up" : "Your pick";
  document.getElementById("hero-day").textContent = "Day " + day.id;
  document.getElementById("hero-name").textContent = day.name;
  document.getElementById("hero-note").textContent =
    lifts.length + " exercises · " + totalSets + " sets · cardio finisher";

  document.getElementById("swap-text").textContent = "Day " + otherDay.id;
  document.getElementById("swap-btn").classList.toggle("flipped", !isPlanned);
  document.getElementById("sessions-goal").textContent = "/" + PLAN.sessionsPerWeek;

  const list = document.getElementById("exercise-list");
  list.innerHTML = "";

  day.exercises.forEach((exercise, i) => {
    const isCardio = exercise.muscle === "Cardio";

    const row = document.createElement("li");
    row.className = "exercise" + (isCardio ? " cardio" : "");
    row.style.animationDelay = i * 0.04 + "s";

    const index = document.createElement("span");
    index.className = "exercise-index";
    index.textContent = isCardio ? "+" : i + 1;

    const text = document.createElement("div");
    text.className = "exercise-text";
    const name = document.createElement("p");
    name.className = "exercise-name";
    name.textContent = exercise.name;
    const muscle = document.createElement("p");
    muscle.className = "exercise-muscle";
    muscle.textContent = exercise.muscle;
    text.append(name, muscle);

    const dose = document.createElement("span");
    dose.className = "exercise-dose";
    dose.textContent = exercise.sets > 1 ? exercise.sets + " × " + exercise.reps : exercise.reps;

    row.append(index, text, dose);
    list.append(row);
  });
}

// Let you pick the other day if you don't want the planned one
document.getElementById("swap-btn").addEventListener("click", () => {
  const otherDay = PLAN.days.find((d) => d.id !== selectedDayId);
  selectedDayId = otherDay.id;
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
