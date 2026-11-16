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
  title.classList.remove("swap");
  void title.offsetWidth; // makes the browser restart the animation
  title.classList.add("swap");

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

// Switch screen when a tab is tapped
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => showScreen(tab.dataset.screen));
});

document.getElementById("start-btn").addEventListener("click", () => {
  showScreen("workout");
});

renderWeek();
showScreen("today");
