"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import type {
  CardioExerciseRecord,
  Exercise,
  ExerciseRecord,
  GymAppData,
  StrengthExerciseRecord,
  WorkoutDay,
} from "@/lib/types";
import {
  createExerciseRecord,
  findPreviousRecord,
  getOrCreateWorkout,
  parseDateKey,
} from "@/lib/storage";

interface ExerciseScreenProps {
  data: GymAppData;
  setData: React.Dispatch<React.SetStateAction<GymAppData>>;
  dateKey: string;
  day: WorkoutDay;
  exercise: Exercise;
  onBack: () => void;
  onOpenExercise: (exercise: Exercise) => void;
  onReturnToday: () => void;
}

const numericValue = (value: string) =>
  value === "" ? null : Number.isFinite(Number(value)) ? Number(value) : null;

const formatTimer = (seconds: number) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

export function ExerciseScreen({
  data,
  setData,
  dateKey,
  day,
  exercise,
  onBack,
  onOpenExercise,
  onReturnToday,
}: ExerciseScreenProps) {
  const previous = useMemo(
    () => findPreviousRecord(data.workoutHistory, exercise.id, dateKey),
    [data.workoutHistory, exercise.id, dateKey],
  );
  const existing = data.workoutHistory[dateKey]?.exercises[exercise.id];
  const [record, setRecord] = useState<ExerciseRecord>(() =>
    existing ?? createExerciseRecord(exercise, previous?.record),
  );
  const restDefault = exercise.type === "strength" ? exercise.restSeconds : 0;
  const [timerSeconds, setTimerSeconds] = useState(restDefault);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    setRecord(existing ?? createExerciseRecord(exercise, previous?.record));
    setTimerSeconds(exercise.type === "strength" ? exercise.restSeconds : 0);
    setTimerRunning(false);
    // Exercise navigation intentionally resets the ephemeral timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id, dateKey]);

  useEffect(() => {
    const workout = getOrCreateWorkout(
      data,
      dateKey,
      day.id,
      day.name,
      day.focus,
    );
    setData((current) => ({
      ...current,
      workoutHistory: {
        ...current.workoutHistory,
        [dateKey]: {
          ...workout,
          exercises: { ...workout.exercises, [exercise.id]: record },
        },
      },
    }));
    // Persist only when the locally controlled record changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record]);

  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return;
    const timer = window.setInterval(
      () =>
        setTimerSeconds((seconds) => {
          if (seconds <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return seconds - 1;
        }),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [timerRunning, timerSeconds]);

  const previousLabel = previous
    ? parseDateKey(previous.date).toLocaleDateString("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No earlier session";

  const currentIndex = day.exercises.findIndex((item) => item.id === exercise.id);
  const nextExercise = day.exercises[currentIndex + 1];

  const updateStrength = (
    updater: (current: StrengthExerciseRecord) => StrengthExerciseRecord,
  ) => {
    if (record.type !== "strength") return;
    const next = updater(record);
    const completed =
      next.sets.length > 0 && next.sets.every((set) => set.done);
    setRecord({
      ...next,
      exerciseName: exercise.name,
      completed,
      updatedAt: new Date().toISOString(),
    });
  };

  const updateCardio = (patch: Partial<CardioExerciseRecord>) => {
    if (record.type !== "cardio") return;
    setRecord({
      ...record,
      ...patch,
      exerciseName: exercise.name,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="screen exercise-screen">
      <header className="exercise-header">
        <button className="icon-button" onClick={onBack} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <div>
          <span className="eyebrow">
            {day.name.toUpperCase()} · {day.focus.toUpperCase()}
          </span>
          <h1>{exercise.name}</h1>
          {exercise.notes && <p>{exercise.notes}</p>}
        </div>
        <button className="icon-button" aria-label="More options">
          <MoreHorizontal size={21} />
        </button>
      </header>

      <div className="autosave-label">
        <CheckCircle2 size={16} />
        Saved automatically
      </div>

      <section className="previous-card card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PREVIOUS WORKOUT</span>
            <h2>{previousLabel}</h2>
          </div>
        </div>
        {previous?.record.type === "strength" ? (
          <div className="previous-stats">
            <div>
              <strong>{previous.record.sets.length}</strong>
              <span>sets</span>
            </div>
            <div>
              <strong>
                {Math.max(
                  0,
                  ...previous.record.sets.map((set) => set.weight ?? 0),
                )}
              </strong>
              <span>kg max</span>
            </div>
            <div>
              <strong>
                {Math.max(
                  0,
                  ...previous.record.sets.map((set) => set.reps ?? 0),
                )}
              </strong>
              <span>reps max</span>
            </div>
          </div>
        ) : previous?.record.type === "cardio" ? (
          <div className="previous-stats">
            <div>
              <strong>{previous.record.duration ?? "—"}</strong>
              <span>minutes</span>
            </div>
            <div>
              <strong>{previous.record.distance ?? "—"}</strong>
              <span>km</span>
            </div>
            <div>
              <strong>{previous.record.speed ?? "—"}</strong>
              <span>km/h</span>
            </div>
          </div>
        ) : (
          <p className="empty-copy">
            Your first completed session will appear here next time.
          </p>
        )}
      </section>

      {exercise.type === "strength" && record.type === "strength" ? (
        <>
          <section className="sets-card card">
            <div className="sets-head">
              <span>SET</span>
              <span>WEIGHT (KG)</span>
              <span>REPS</span>
              <span>DONE</span>
              <span />
            </div>
            {record.sets.map((set, index) => (
              <div className="set-row" key={set.id}>
                <strong>{index + 1}</strong>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.5"
                  value={set.weight ?? ""}
                  aria-label={`Set ${index + 1} weight in kilograms`}
                  onChange={(event) =>
                    updateStrength((current) => ({
                      ...current,
                      sets: current.sets.map((item) =>
                        item.id === set.id
                          ? { ...item, weight: numericValue(event.target.value) }
                          : item,
                      ),
                    }))
                  }
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={set.reps ?? ""}
                  aria-label={`Set ${index + 1} repetitions`}
                  onChange={(event) =>
                    updateStrength((current) => ({
                      ...current,
                      sets: current.sets.map((item) =>
                        item.id === set.id
                          ? { ...item, reps: numericValue(event.target.value) }
                          : item,
                      ),
                    }))
                  }
                />
                <button
                  className={`set-check ${set.done ? "done" : ""}`}
                  aria-label={`${set.done ? "Unmark" : "Mark"} set ${index + 1} complete`}
                  onClick={() => {
                    updateStrength((current) => ({
                      ...current,
                      sets: current.sets.map((item) =>
                        item.id === set.id
                          ? { ...item, done: !item.done }
                          : item,
                      ),
                    }));
                    if (!set.done && data.settings.autoStartTimer) {
                      setTimerSeconds(exercise.restSeconds);
                      setTimerRunning(true);
                    }
                  }}
                >
                  {set.done && <Check size={17} strokeWidth={3} />}
                </button>
                <button
                  className="remove-set"
                  aria-label={`Remove set ${index + 1}`}
                  disabled={record.sets.length === 1}
                  onClick={() =>
                    updateStrength((current) => ({
                      ...current,
                      sets: current.sets.filter((item) => item.id !== set.id),
                    }))
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              className="text-action add-set"
              onClick={() =>
                updateStrength((current) => ({
                  ...current,
                  sets: [
                    ...current.sets,
                    {
                      id: `${exercise.id}-${Date.now()}`,
                      weight: current.sets.at(-1)?.weight ?? null,
                      reps: current.sets.at(-1)?.reps ?? exercise.minReps,
                      done: false,
                    },
                  ],
                }))
              }
            >
              <Plus size={17} /> Add set
            </button>
          </section>

          <section className="timer-card">
            <div>
              <span className="eyebrow">
                <Clock3 size={16} /> REST TIMER
              </span>
              <strong>{formatTimer(timerSeconds)}</strong>
            </div>
            <div className="timer-actions">
              <button
                className="timer-play"
                onClick={() => setTimerRunning((running) => !running)}
                aria-label={timerRunning ? "Pause timer" : "Resume timer"}
              >
                {timerRunning ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                className="bare-icon"
                onClick={() => {
                  setTimerSeconds(exercise.restSeconds);
                  setTimerRunning(false);
                }}
                aria-label="Reset timer"
              >
                <RotateCcw size={18} />
              </button>
              <button
                className="secondary-button"
                onClick={() => {
                  setTimerSeconds(0);
                  setTimerRunning(false);
                }}
              >
                Skip rest
              </button>
            </div>
          </section>
        </>
      ) : exercise.type === "cardio" && record.type === "cardio" ? (
        <section className="cardio-card card">
          <div className="cardio-target">
            <Clock3 size={20} />
            <div>
              <span>Target</span>
              <strong>{exercise.targetMinutes} minutes</strong>
            </div>
          </div>
          <div className="form-grid cardio-fields">
            <label className="wide-field">
              <span>Duration (minutes)</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder={`${exercise.targetMinutes}`}
                value={record.duration ?? ""}
                onChange={(event) =>
                  updateCardio({ duration: numericValue(event.target.value) })
                }
              />
            </label>
            <label>
              <span>Distance (km) <small>Optional</small></span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                value={record.distance ?? ""}
                onChange={(event) =>
                  updateCardio({ distance: numericValue(event.target.value) })
                }
              />
            </label>
            <label>
              <span>Speed (km/h) <small>Optional</small></span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                value={record.speed ?? ""}
                onChange={(event) =>
                  updateCardio({ speed: numericValue(event.target.value) })
                }
              />
            </label>
            <label>
              <span>Incline (%) <small>Optional</small></span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.5"
                value={record.incline ?? ""}
                onChange={(event) =>
                  updateCardio({ incline: numericValue(event.target.value) })
                }
              />
            </label>
          </div>
          <button
            className={`complete-cardio ${record.completed ? "done" : ""}`}
            onClick={() => updateCardio({ completed: !record.completed })}
          >
            <span>{record.completed ? <Check size={18} /> : null}</span>
            {record.completed ? "Treadmill complete" : "Mark treadmill complete"}
          </button>
        </section>
      ) : null}

      <button
        className="next-exercise"
        onClick={() =>
          nextExercise ? onOpenExercise(nextExercise) : onReturnToday()
        }
      >
        <span>
          <small>{nextExercise ? "UP NEXT" : "SESSION"}</small>
          <strong>
            {nextExercise ? `Next: ${nextExercise.name}` : "Return to Today"}
          </strong>
          {nextExercise?.notes && <em>{nextExercise.notes}</em>}
        </span>
        <ArrowRight size={21} />
      </button>
    </div>
  );
}
