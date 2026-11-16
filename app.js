// Screen titles shown in the top bar
const SCREEN_TITLES = {
  today: "Today",
  workout: "Workout",
  progress: "Progress",
};

// Show one screen and hide the others
function showScreen(name) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.toggle("active", screen.id === "screen-" + name);
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.screen === name);
  });

  document.getElementById("screen-title").textContent = SCREEN_TITLES[name];
}

// Switch screen when a tab is tapped
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => showScreen(tab.dataset.screen));
});
