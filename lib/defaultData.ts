import type {
  CardioExercise,
  GymAppData,
  StrengthExercise,
  WorkoutDay,
} from "./types";

const strength = (
  id: string,
  name: string,
  notes = "",
  sets = 3,
  minReps = 8,
  maxReps = 12,
  restSeconds = 75,
): StrengthExercise => ({
  id,
  name,
  notes,
  type: "strength",
  sets,
  minReps,
  maxReps,
  restSeconds,
});

const cardio = (
  id: string,
  name: string,
  targetMinutes: number,
  notes = "",
): CardioExercise => ({
  id,
  name,
  notes,
  type: "cardio",
  targetMinutes,
});

const day = (
  id: string,
  name: string,
  focus: string,
  exercises: WorkoutDay["exercises"],
): WorkoutDay => ({ id, name, focus, isRest: false, exercises });

export const createDefaultData = (): GymAppData => ({
  version: 1,
  program: {
    id: "primary-program",
    name: "My weekly program",
    days: [
      day("monday", "Monday", "Legs", [
        strength("rdl", "RDL’s"),
        strength("leg-press", "Leg Press", "high & wide stance"),
        strength("leg-extension", "Leg Extension"),
        cardio("monday-treadmill", "Treadmill", 30),
      ]),
      day("tuesday", "Tuesday", "Shoulders", [
        strength("lateral-raise", "Lateral Raise"),
        strength("bicep-curl", "Bicep Curl"),
        strength("shoulder-press", "Shoulder Press"),
        strength("face-pulls", "Face Pulls"),
        cardio("tuesday-treadmill", "Treadmill", 30),
      ]),
      day("wednesday", "Wednesday", "Legs", [
        strength("wednesday-leg-press", "Leg Press", "high & wide stance"),
        strength("calf-raises", "Calf Raises"),
        strength("wednesday-leg-extension", "Leg Extension"),
        cardio("wednesday-treadmill", "Treadmill", 30),
      ]),
      day("thursday", "Thursday", "Back", [
        strength("lat-pulldown", "Lat Pulldown"),
        strength("single-arm-row", "Single Arm Dumbbell Row"),
        strength("reverse-fly", "Reverse Fly"),
        strength("seated-cable-row", "Seated Cable Row"),
        cardio("thursday-treadmill", "Treadmill", 30),
      ]),
      day("friday", "Friday", "Cardio", [
        cardio("friday-treadmill", "Treadmill", 60),
      ]),
      {
        id: "saturday",
        name: "Saturday",
        focus: "Rest",
        isRest: true,
        exercises: [],
      },
      {
        id: "sunday",
        name: "Sunday",
        focus: "Rest",
        isRest: true,
        exercises: [],
      },
    ],
  },
  workoutHistory: {},
  settings: { autoStartTimer: true },
});

