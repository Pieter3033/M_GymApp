export type ExerciseType = "strength" | "cardio";

interface ExerciseBase {
  id: string;
  name: string;
  notes: string;
  type: ExerciseType;
}

export interface StrengthExercise extends ExerciseBase {
  type: "strength";
  sets: number;
  minReps: number;
  maxReps: number;
  restSeconds: number;
}

export interface CardioExercise extends ExerciseBase {
  type: "cardio";
  targetMinutes: number;
}

export type Exercise = StrengthExercise | CardioExercise;

export interface WorkoutDay {
  id: string;
  name: string;
  focus: string;
  isRest: boolean;
  exercises: Exercise[];
}

export interface Program {
  id: string;
  name: string;
  days: WorkoutDay[];
}

export interface SetRecord {
  id: string;
  weight: number | null;
  reps: number | null;
  done: boolean;
}

export interface StrengthExerciseRecord {
  type: "strength";
  exerciseId: string;
  exerciseName: string;
  sets: SetRecord[];
  completed: boolean;
  updatedAt: string;
}

export interface CardioExerciseRecord {
  type: "cardio";
  exerciseId: string;
  exerciseName: string;
  duration: number | null;
  distance: number | null;
  speed: number | null;
  incline: number | null;
  completed: boolean;
  updatedAt: string;
}

export type ExerciseRecord =
  | StrengthExerciseRecord
  | CardioExerciseRecord;

export interface WorkoutRecord {
  date: string;
  dayId: string;
  dayName: string;
  focus: string;
  exercises: Record<string, ExerciseRecord>;
}

export interface Settings {
  autoStartTimer: boolean;
  theme: "light" | "dark";
}

export interface GymAppData {
  version: 1;
  program: Program;
  workoutHistory: Record<string, WorkoutRecord>;
  settings: Settings;
}

export type AppScreen = "today" | "program" | "progress" | "settings";
