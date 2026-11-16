// Your training plan. Change exercises, sets or reps here.
// The days repeat in order: A, B, A, B ...
const PLAN = {
  sessionsPerWeek: 4,
  days: [
    {
      id: "A",
      name: "Upper body",
      exercises: [
        { name: "Bench press", muscle: "Chest", sets: 3, reps: "8–10" },
        { name: "Barbell row", muscle: "Back", sets: 3, reps: "8–10" },
        { name: "Shoulder press", muscle: "Shoulders", sets: 3, reps: "10" },
        { name: "Lat pulldown", muscle: "Back", sets: 3, reps: "10–12" },
        { name: "Biceps curl", muscle: "Arms", sets: 2, reps: "12" },
        { name: "Triceps pushdown", muscle: "Arms", sets: 2, reps: "12" },
        { name: "Cardio finisher", muscle: "Cardio", sets: 1, reps: "10–15 min" },
      ],
    },
    {
      id: "B",
      name: "Lower body",
      exercises: [
        { name: "Squat", muscle: "Legs", sets: 3, reps: "8–10" },
        { name: "Romanian deadlift", muscle: "Hamstrings", sets: 3, reps: "10" },
        { name: "Walking lunges", muscle: "Legs", sets: 3, reps: "10 each" },
        { name: "Calf raise", muscle: "Calves", sets: 3, reps: "15" },
        { name: "Plank", muscle: "Core", sets: 3, reps: "45 sec" },
        { name: "Cardio finisher", muscle: "Cardio", sets: 1, reps: "10–15 min" },
      ],
    },
  ],
};
