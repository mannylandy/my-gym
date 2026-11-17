// Welcome quiz: the first time you open My Gym it asks a few questions,
// one per screen, and saves the answers as your profile (see plan.js).
// Also: tips on Today, the starter workout and the "Check in at 3T" button.
// Loaded before app.js; app.js opens the quiz when there is no profile yet.

const GOALS = [
  { id: "strength", name: "Get stronger", note: "Lift heavier. Fewer reps, more rest." },
  { id: "muscle", name: "Build muscle", note: "Grow and shape. Medium reps." },
  { id: "fitness", name: "Get fit", note: "Burn, sweat, move. More reps, less rest." },
  { id: "general", name: "Feel good", note: "A bit of everything, stay healthy." },
];

// One starter workout per goal, offered at the end of the quiz (you can skip it)
const STARTERS = {
  strength: {
    name: "Strength base",
    exercises: [
      { exercise: "squat", sets: 4, reps: "5" },
      { exercise: "bench-press", sets: 4, reps: "5" },
      { exercise: "barbell-row", sets: 4, reps: "5" },
      { exercise: "romanian-deadlift", sets: 3, reps: "6" },
      { exercise: "plank", sets: 3, reps: "45 sec" },
    ],
  },
  muscle: {
    name: "Full body pump",
    exercises: [
      { exercise: "bench-press", sets: 3, reps: "10" },
      { exercise: "lat-pulldown", sets: 3, reps: "10" },
      { exercise: "leg-press", sets: 3, reps: "12" },
      { exercise: "shoulder-press", sets: 3, reps: "10" },
      { exercise: "biceps-curl", sets: 2, reps: "12" },
      { exercise: "triceps-pushdown", sets: 2, reps: "12" },
    ],
  },
  fitness: {
    name: "Fit circuit",
    exercises: [
      { exercise: "walking-lunges", sets: 3, reps: "12 each" },
      { exercise: "push-up", sets: 3, reps: "15" },
      { exercise: "cable-row", sets: 3, reps: "15" },
      { exercise: "russian-twist", sets: 3, reps: "20" },
      { exercise: "cardio", sets: 1, reps: "15 min" },
    ],
  },
  general: {
    name: "All-round",
    exercises: [
      { exercise: "squat", sets: 3, reps: "10" },
      { exercise: "push-up", sets: 3, reps: "10" },
      { exercise: "lat-pulldown", sets: 3, reps: "10" },
      { exercise: "plank", sets: 3, reps: "30 sec" },
      { exercise: "cardio", sets: 1, reps: "10 min" },
    ],
  },
};

const TIPS = {
  strength: [
    "Rest 2–3 minutes between heavy sets. Strength needs full recharge.",
    "Add 2.5 kg when you hit all your reps with good form.",
    "Warm up with 2 lighter sets before your first heavy set.",
    "Low reps, big lifts. Squat, bench and row move the needle most.",
  ],
  muscle: [
    "Rest about 90 seconds between sets.",
    "Stop each set 1–2 reps before you can't do another one.",
    "Aim for 10–20 sets per muscle each week. Check Progress to see yours.",
    "Slow down the lowering part of each rep. More time under load, more growth.",
  ],
  fitness: [
    "Keep rests short, 30–60 seconds, to keep your heart rate up.",
    "Finish with 10–15 minutes of cardio.",
    "Move between exercises fast. Think circuit, not long breaks.",
    "Drink water before you feel thirsty.",
  ],
  general: [
    "Showing up beats being perfect. Hit your weekly goal first.",
    "Mix it up: push, pull, legs and some cardio across the week.",
    "Sleep is training too. 8 hours helps you recover.",
    "Light weights with good form beat heavy weights with bad form.",
  ],
};

// ---------- Today: tip and 3T button ----------

// One tip a day that fits your goal (and your age)
function renderTip() {
  const card = document.getElementById("tip-card");
  card.hidden = !profile;
  if (!profile) return;

  const tips = (TIPS[profile.goal] || TIPS.general).slice();
  if (profile.age && profile.age < 18) tips.push("Still growing: learn the technique first, then add weight slowly.");
  if (profile.age && profile.age >= 40) tips.push("Take an extra few minutes to warm up your joints before lifting.");

  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  document.getElementById("tip-text").textContent = tips[dayOfYear % tips.length];
}

// "Check in at 3T": 3T's website says links under 3t.no/app/ open the 3T app
// straight away (iPhone and Android). Without the app installed it opens 3T's app web page.
function renderCheckin() {
  const link = document.getElementById("checkin");
  link.hidden = !(profile && profile.gym3t);
  link.href = "https://www.3t.no/app/";
}

// ---------- The quiz ----------

let quiz = null; // the answers while the quiz is open
let quizStep = 0;
let quizTimer = null; // the short pause before moving on after a tap

// Move on after a short moment, so you see your pick light up
function advanceSoon(step) {
  clearTimeout(quizTimer);
  quizTimer = setTimeout(() => goQuiz(step), 250);
}

const QUIZ_STEPS = ["intro", "name", "age", "goal", "days", "gym", "done"];

function openWelcome() {
  quiz = profile ? Object.assign({}, profile) : { name: "", age: null, goal: "", days: 0, gym3t: null };
  quizStep = profile ? 1 : 0; // coming back from the profile button skips the intro
  document.getElementById("welcome").hidden = false;
  document.body.classList.add("locked");
  renderQuiz();
}

function closeWelcome() {
  clearTimeout(quizTimer);
  document.getElementById("welcome").hidden = true;
  document.body.classList.remove("locked");
}

function goQuiz(step) {
  clearTimeout(quizTimer); // going back cancels a pending move forward
  quizStep = Math.max(0, Math.min(QUIZ_STEPS.length - 1, step));
  renderQuiz();
}

// A big tappable answer card
function answerCard(title, note, selected, onPick) {
  const card = el("button", "answer" + (selected ? " on" : ""));
  const text = el("span", "answer-text");
  text.append(el("span", "answer-title", title));
  if (note) text.append(el("span", "answer-note", note));
  const check = el("span", "pick-check");
  check.append(icon("check"));
  card.append(text, check);
  card.addEventListener("click", onPick);
  return card;
}

function quizButton(text, enabled, onClick) {
  const button = el("button", "btn btn-volt quiz-next");
  button.append(el("span", "", text), icon("go"));
  button.disabled = !enabled;
  button.addEventListener("click", onClick);
  return button;
}

function renderQuiz() {
  const step = QUIZ_STEPS[quizStep];
  const body = document.getElementById("welcome-body");
  body.innerHTML = "";
  body.className = "welcome-body step-" + step;

  // Progress dots and the back button (not on the intro)
  document.getElementById("welcome-back").hidden = quizStep === 0;
  const dots = document.getElementById("welcome-dots");
  dots.innerHTML = "";
  for (let i = 1; i < QUIZ_STEPS.length; i++) {
    dots.append(el("span", "dot" + (i < quizStep ? " past" : i === quizStep ? " now" : "")));
  }
  dots.hidden = quizStep === 0;

  const title = (text) => body.append(el("h2", "quiz-title", text));
  const lead = (text) => body.append(el("p", "quiz-lead", text));

  if (step === "intro") {
    const logo = el("div", "quiz-logo");
    logo.append(icon("workout"));
    body.append(logo);
    title("Your gym. Your plan.");
    lead("Answer 5 quick questions and My Gym shapes itself around you.");
    body.append(quizButton("Let's go", true, () => goQuiz(1)));
    body.append(el("p", "quiz-small", "Everything stays on this phone."));
  }

  if (step === "name") {
    title("What should we call you?");
    const input = el("input", "input quiz-input");
    input.placeholder = "Your name";
    input.maxLength = 20;
    input.autocomplete = "given-name";
    input.value = quiz.name;
    body.append(input);
    const next = quizButton("Next", quiz.name.trim() !== "", () => goQuiz(2));
    input.addEventListener("input", () => {
      quiz.name = input.value;
      next.disabled = input.value.trim() === "";
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && quiz.name.trim()) goQuiz(2);
    });
    body.append(next);
    setTimeout(() => input.focus(), 350);
  }

  if (step === "age") {
    title("How old are you?");
    lead("Used for tips that fit you. You can skip it.");
    const input = el("input", "input quiz-input");
    input.type = "number";
    input.inputMode = "numeric";
    input.min = "10";
    input.max = "99";
    input.placeholder = "Age";
    input.value = quiz.age || "";
    body.append(input);
    const valid = () => {
      const age = parseInt(input.value, 10);
      return age >= 10 && age <= 99;
    };
    const next = quizButton("Next", valid(), () => {
      quiz.age = parseInt(input.value, 10);
      goQuiz(3);
    });
    input.addEventListener("input", () => {
      next.disabled = !valid();
      if (valid()) quiz.age = parseInt(input.value, 10); // kept even if you go back
    });
    body.append(next);
    const skip = el("button", "quiz-skip", "Skip");
    skip.addEventListener("click", () => {
      quiz.age = null;
      goQuiz(3);
    });
    body.append(skip);
  }

  if (step === "goal") {
    title("What are you training for?");
    GOALS.forEach((goal) => {
      body.append(
        answerCard(goal.name, goal.note, quiz.goal === goal.id, () => {
          quiz.goal = goal.id;
          renderQuiz();
          advanceSoon(4);
        })
      );
    });
  }

  if (step === "days") {
    title("How many days a week?");
    lead("This becomes your weekly goal and streak.");
    const grid = el("div", "days-grid");
    for (let n = 1; n <= 7; n++) {
      const button = el("button", "days-btn" + (quiz.days === n ? " on" : ""), n);
      button.addEventListener("click", () => {
        quiz.days = n;
        renderQuiz();
      });
      grid.append(button);
    }
    body.append(grid);
    const advice = { 1: "A start is a start.", 2: "Solid for staying in shape.", 3: "The sweet spot for most people.", 4: "Great for steady progress.", 5: "Serious. Plan your rest days.", 6: "Lots of work. Sleep well.", 7: "Every day? Keep some days light." };
    body.append(el("p", "quiz-small", quiz.days ? advice[quiz.days] : " "));
    body.append(quizButton("Next", quiz.days > 0, () => goQuiz(5)));
  }

  if (step === "gym") {
    title("Do you train at 3T?");
    lead("Then you get a quick button to the 3T app for checking in.");
    body.append(
      answerCard("Yes, at 3T", "Show the check-in button on Today", quiz.gym3t === true, () => {
        quiz.gym3t = true;
        renderQuiz();
        advanceSoon(6);
      })
    );
    body.append(
      answerCard("No, somewhere else", null, quiz.gym3t === false, () => {
        quiz.gym3t = false;
        renderQuiz();
        advanceSoon(6);
      })
    );
  }

  if (step === "done") {
    const goal = GOALS.find((g) => g.id === quiz.goal) || GOALS[3];
    title("Ready, " + quiz.name.trim() + "!");
    const summary = el("div", "quiz-summary");
    [
      [goal.name, "Goal"],
      [quiz.days + " × week", "Training"],
      [quiz.gym3t ? "3T" : "Other", "Gym"],
    ].forEach(([value, label]) => {
      const stat = el("div", "stat");
      stat.append(el("p", "stat-value", value), el("p", "stat-label", label));
      summary.append(stat);
    });
    body.append(summary);

    // Offer one starter workout, only when you have no workouts yet
    const starter = STARTERS[quiz.goal] || STARTERS.general;
    if (workouts.length === 0) {
      const card = el("div", "starter");
      card.append(el("p", "hero-label", "Want a first workout?"), el("p", "starter-name", starter.name));
      const list = el("p", "starter-list", starter.exercises.map((item) => findExercise(item.exercise).name).join(" · "));
      card.append(list);
      body.append(card);
      body.append(quizButton("Use this workout", true, () => finishQuiz(starter)));
      const skip = el("button", "quiz-skip", "No thanks, I'll build my own");
      skip.addEventListener("click", () => finishQuiz(null));
      body.append(skip);
    } else {
      body.append(quizButton("Start training", true, () => finishQuiz(null)));
    }
  }
}

// Save the answers. With a starter, open it in the editor so you can change it before saving.
function finishQuiz(starter) {
  profile = {
    name: quiz.name.trim(),
    age: quiz.age || null,
    goal: quiz.goal || "general",
    days: quiz.days || 3,
    gym3t: quiz.gym3t === true,
  };
  saveProfile(profile);
  closeWelcome();
  renderAll();
  showScreen("today");
  if (starter) {
    openEditor(null, { name: starter.name, exercises: JSON.parse(JSON.stringify(starter.exercises)) });
  }
}

document.getElementById("welcome-back").addEventListener("click", () => {
  // From the first question, going back on a redo closes the quiz without changes
  if (quizStep <= 1 && profile) closeWelcome();
  else goQuiz(quizStep - 1);
});

document.getElementById("profile-btn").addEventListener("click", openWelcome);
