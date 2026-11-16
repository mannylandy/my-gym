// Your training plan. Change exercises, sets or reps here.
// "exercise" is the id of an exercise in exercises.js.
// The days repeat in order: A, B, A, B ...
const PLAN = {
  sessionsPerWeek: 4,
  days: [
    {
      id: "A",
      name: "Upper body",
      exercises: [
        { exercise: "bench-press", sets: 3, reps: "8–10" },
        { exercise: "barbell-row", sets: 3, reps: "8–10" },
        { exercise: "shoulder-press", sets: 3, reps: "10" },
        { exercise: "lat-pulldown", sets: 3, reps: "10–12" },
        { exercise: "biceps-curl", sets: 2, reps: "12" },
        { exercise: "triceps-pushdown", sets: 2, reps: "12" },
        { exercise: "cardio", sets: 1, reps: "10–15 min" },
      ],
    },
    {
      id: "B",
      name: "Lower body",
      exercises: [
        { exercise: "squat", sets: 3, reps: "8–10" },
        { exercise: "romanian-deadlift", sets: 3, reps: "10" },
        { exercise: "walking-lunges", sets: 3, reps: "10 each" },
        { exercise: "calf-raise", sets: 3, reps: "15" },
        { exercise: "plank", sets: 3, reps: "45 sec" },
        { exercise: "cardio", sets: 1, reps: "10–15 min" },
      ],
    },
  ],
};
