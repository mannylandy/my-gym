// Every muscle the body map can light up, with the name shown in the app.
const MUSCLES = {
  chest: "Chest",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  core: "Core",
  traps: "Traps",
  lats: "Lats",
  lowerback: "Lower back",
  glutes: "Glutes",
  quads: "Quads",
  hamstrings: "Hamstrings",
  calves: "Calves",
  cardio: "Heart & lungs",
};

// The exercise library.
// primary = the muscles doing most of the work (bright on the body map)
// secondary = the muscles helping out (dim on the body map)
const EXERCISES = [
  // Chest
  { id: "bench-press", name: "Bench press", primary: ["chest"], secondary: ["shoulders", "triceps"] },
  { id: "incline-press", name: "Incline dumbbell press", primary: ["chest"], secondary: ["shoulders", "triceps"] },
  { id: "push-up", name: "Push-up", primary: ["chest"], secondary: ["shoulders", "triceps", "core"] },
  { id: "chest-fly", name: "Chest fly", primary: ["chest"], secondary: ["shoulders"] },
  { id: "dips", name: "Dips", primary: ["chest", "triceps"], secondary: ["shoulders"] },

  // Back
  { id: "barbell-row", name: "Barbell row", primary: ["lats"], secondary: ["traps", "biceps", "lowerback"] },
  { id: "lat-pulldown", name: "Lat pulldown", primary: ["lats"], secondary: ["biceps", "forearms"] },
  { id: "pull-up", name: "Pull-up", primary: ["lats"], secondary: ["biceps", "forearms"] },
  { id: "cable-row", name: "Seated cable row", primary: ["lats"], secondary: ["traps", "biceps"] },
  { id: "face-pull", name: "Face pull", primary: ["shoulders", "traps"], secondary: [] },
  { id: "back-extension", name: "Back extension", primary: ["lowerback"], secondary: ["glutes", "hamstrings"] },

  // Shoulders
  { id: "shoulder-press", name: "Shoulder press", primary: ["shoulders"], secondary: ["triceps", "traps"] },
  { id: "lateral-raise", name: "Lateral raise", primary: ["shoulders"], secondary: ["traps"] },

  // Arms
  { id: "biceps-curl", name: "Biceps curl", primary: ["biceps"], secondary: ["forearms"] },
  { id: "hammer-curl", name: "Hammer curl", primary: ["biceps", "forearms"], secondary: [] },
  { id: "triceps-pushdown", name: "Triceps pushdown", primary: ["triceps"], secondary: [] },
  { id: "skull-crusher", name: "Skull crusher", primary: ["triceps"], secondary: [] },

  // Legs
  { id: "squat", name: "Squat", primary: ["quads", "glutes"], secondary: ["hamstrings", "core", "lowerback"] },
  { id: "leg-press", name: "Leg press", primary: ["quads"], secondary: ["glutes", "hamstrings"] },
  { id: "split-squat", name: "Bulgarian split squat", primary: ["quads", "glutes"], secondary: ["hamstrings"] },
  { id: "walking-lunges", name: "Walking lunges", primary: ["quads", "glutes"], secondary: ["hamstrings", "calves"] },
  { id: "leg-extension", name: "Leg extension", primary: ["quads"], secondary: [] },
  { id: "romanian-deadlift", name: "Romanian deadlift", primary: ["hamstrings", "glutes"], secondary: ["lowerback", "forearms"] },
  { id: "deadlift", name: "Deadlift", primary: ["hamstrings", "glutes", "lowerback"], secondary: ["quads", "traps", "forearms"] },
  { id: "leg-curl", name: "Leg curl", primary: ["hamstrings"], secondary: [] },
  { id: "hip-thrust", name: "Hip thrust", primary: ["glutes"], secondary: ["hamstrings"] },
  { id: "calf-raise", name: "Calf raise", primary: ["calves"], secondary: [] },

  // Core
  { id: "plank", name: "Plank", primary: ["core"], secondary: ["shoulders"] },
  { id: "leg-raise", name: "Hanging leg raise", primary: ["core"], secondary: ["forearms"] },
  { id: "cable-crunch", name: "Cable crunch", primary: ["core"], secondary: [] },
  { id: "russian-twist", name: "Russian twist", primary: ["core"], secondary: [] },

  // Cardio
  { id: "cardio", name: "Cardio finisher", primary: ["cardio"], secondary: [] },
];

// Look up one exercise by its id
function findExercise(id) {
  return EXERCISES.find((exercise) => exercise.id === id);
}

// Work out how hard each muscle is hit by a list of exercise ids.
// Returns for example { chest: 2, triceps: 1 } where 2 = main, 1 = helper.
function muscleLevels(exerciseIds) {
  const levels = {};

  exerciseIds.forEach((id) => {
    const exercise = findExercise(id);
    if (!exercise) return;

    exercise.secondary.forEach((muscle) => {
      levels[muscle] = Math.max(levels[muscle] || 0, 1);
    });
    exercise.primary.forEach((muscle) => {
      levels[muscle] = 2;
    });
  });

  return levels;
}
