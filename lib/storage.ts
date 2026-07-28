import { createDefaultData } from "./defaultData";
import type {
  Exercise,
  ExerciseRecord,
  GymAppData,
  StrengthExerciseRecord,
  WorkoutRecord,
} from "./types";

export const STORAGE_KEY = "gym-app-data-v1";

export const isGymAppData = (value: unknown): value is GymAppData => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GymAppData>;
  return (
    candidate.version === 1 &&
    !!candidate.program &&
    Array.isArray(candidate.program.days) &&
    !!candidate.workoutHistory &&
    typeof candidate.workoutHistory === "object" &&
    !!candidate.settings
  );
};

export const loadData = (): GymAppData => {
  if (typeof window === "undefined") return createDefaultData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();
    const parsed: unknown = JSON.parse(raw);
    if (!isGymAppData(parsed)) return createDefaultData();
    return {
      ...parsed,
      settings: {
        ...parsed.settings,
        theme: parsed.settings.theme === "dark" ? "dark" : "light",
      },
    };
  } catch {
    return createDefaultData();
  }
};

export const saveData = (data: GymAppData) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseDateKey = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const findPreviousRecord = (
  history: GymAppData["workoutHistory"],
  exerciseId: string,
  beforeDate: string,
): { date: string; record: ExerciseRecord } | null => {
  const matching = Object.entries(history)
    .filter(([date]) => date < beforeDate)
    .flatMap(([date, workout]) => {
      const record = workout.exercises[exerciseId];
      return record ? [{ date, record }] : [];
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  return matching[0] ?? null;
};

export const createExerciseRecord = (
  exercise: Exercise,
  previous?: ExerciseRecord,
): ExerciseRecord => {
  const updatedAt = new Date().toISOString();
  if (exercise.type === "cardio") {
    return {
      type: "cardio",
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      duration: null,
      distance: null,
      speed: null,
      incline: null,
      completed: false,
      updatedAt,
    };
  }

  const priorSets =
    previous?.type === "strength" ? previous.sets : undefined;
  const sets = Array.from({ length: exercise.sets }, (_, index) => ({
    id: `${exercise.id}-${Date.now()}-${index}`,
    weight: priorSets?.[index]?.weight ?? null,
    reps: priorSets?.[index]?.reps ?? exercise.minReps,
    done: false,
  }));
  return {
    type: "strength",
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    sets,
    completed: false,
    updatedAt,
  };
};

export const getOrCreateWorkout = (
  data: GymAppData,
  date: string,
  dayId: string,
  dayName: string,
  focus: string,
): WorkoutRecord =>
  data.workoutHistory[date] ?? {
    date,
    dayId,
    dayName,
    focus,
    exercises: {},
  };

export const recordSummary = (record?: ExerciseRecord) => {
  if (!record) return null;
  if (record.type === "cardio") {
    return record.duration ? `${record.duration} min` : null;
  }
  const usable = record.sets.filter(
    (set) => set.weight !== null || set.reps !== null,
  );
  if (!usable.length) return null;
  const last = usable.at(-1)!;
  return `${last.weight ?? "—"} kg × ${last.reps ?? "—"}`;
};

export const isWorkoutComplete = (
  workout: WorkoutRecord,
  exerciseIds: string[],
) =>
  exerciseIds.length > 0 &&
  exerciseIds.every((id) => workout.exercises[id]?.completed);

export const exportCsv = (history: GymAppData["workoutHistory"]) => {
  const rows = [
    [
      "date",
      "exercise",
      "type",
      "set",
      "weight_kg",
      "reps",
      "duration_min",
      "distance_km",
      "speed_kph",
      "incline",
      "completed",
    ],
  ];
  Object.values(history)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((workout) => {
      Object.values(workout.exercises).forEach((record) => {
        if (record.type === "strength") {
          record.sets.forEach((set, index) => {
            rows.push([
              workout.date,
              record.exerciseName,
              "strength",
              `${index + 1}`,
              `${set.weight ?? ""}`,
              `${set.reps ?? ""}`,
              "",
              "",
              "",
              "",
              `${set.done}`,
            ]);
          });
        } else {
          rows.push([
            workout.date,
            record.exerciseName,
            "cardio",
            "",
            "",
            "",
            `${record.duration ?? ""}`,
            `${record.distance ?? ""}`,
            `${record.speed ?? ""}`,
            `${record.incline ?? ""}`,
            `${record.completed}`,
          ]);
        }
      });
    });
  return rows
    .map((row) =>
      row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
};

export const bestStrengthSet = (records: StrengthExerciseRecord[]) =>
  records
    .flatMap((record) => record.sets)
    .filter((set) => set.done && set.weight !== null)
    .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))[0];
