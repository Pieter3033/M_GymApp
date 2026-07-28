"use client";

import { useMemo, useState } from "react";
import {
  CalendarCheck2,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  Medal,
  TrendingUp,
} from "lucide-react";
import type {
  ExerciseRecord,
  GymAppData,
  StrengthExerciseRecord,
} from "@/lib/types";
import { bestStrengthSet, parseDateKey } from "@/lib/storage";

interface ProgressScreenProps {
  data: GymAppData;
}

export function ProgressScreen({ data }: ProgressScreenProps) {
  const exerciseOptions = useMemo(() => {
    const options = new Map<string, string>();
    data.program.days.forEach((day) =>
      day.exercises.forEach((exercise) =>
        options.set(exercise.id, exercise.name),
      ),
    );
    Object.values(data.workoutHistory).forEach((workout) =>
      Object.values(workout.exercises).forEach((record) =>
        options.set(record.exerciseId, record.exerciseName),
      ),
    );
    return [...options.entries()].map(([id, name]) => ({ id, name }));
  }, [data]);

  const [selectedExercise, setSelectedExercise] = useState(
    () => exerciseOptions[0]?.id ?? "",
  );
  const selectedName =
    exerciseOptions.find((option) => option.id === selectedExercise)?.name ??
    "Exercise";
  const sessions = Object.values(data.workoutHistory)
    .flatMap((workout) => {
      const record = workout.exercises[selectedExercise];
      return record ? [{ date: workout.date, record }] : [];
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  const strengthRecords = sessions
    .map(({ record }) => record)
    .filter(
      (record): record is StrengthExerciseRecord => record.type === "strength",
    );
  const latest = sessions[0];
  const bestSet = bestStrengthSet(strengthRecords);
  const completedDays = Object.values(data.workoutHistory).filter((workout) => {
    const scheduledDay = data.program.days.find(
      (day) => day.id === workout.dayId,
    );
    const scheduledIds = scheduledDay?.exercises.map((exercise) => exercise.id);
    if (scheduledIds?.length) {
      return scheduledIds.every(
        (exerciseId) => workout.exercises[exerciseId]?.completed,
      );
    }
    const records = Object.values(workout.exercises);
    return records.length > 0 && records.every((record) => record.completed);
  }).length;
  const totalCompletedExercises = Object.values(data.workoutHistory).reduce(
    (count, workout) =>
      count +
      Object.values(workout.exercises).filter((record) => record.completed)
        .length,
    0,
  );
  const recentActivity = Object.values(data.workoutHistory)
    .filter((workout) => Object.keys(workout.exercises).length)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  return (
    <div className="screen progress-screen">
      <header className="page-header">
        <div>
          <span className="eyebrow">YOUR MOMENTUM</span>
          <h1>Progress</h1>
          <p>Simple signals that show the work adding up.</p>
        </div>
      </header>

      <section className="metric-grid">
        <article className="metric-card card accent-metric">
          <span><CalendarCheck2 size={18} /> TRAINING DAYS</span>
          <strong>{completedDays}</strong>
          <p>fully completed</p>
        </article>
        <article className="metric-card card">
          <span><ChartNoAxesColumnIncreasing size={18} /> EXERCISES</span>
          <strong>{totalCompletedExercises}</strong>
          <p>logged complete</p>
        </article>
        <article className="metric-card card">
          <span><TrendingUp size={18} /> ACTIVE DATES</span>
          <strong>{Object.keys(data.workoutHistory).length}</strong>
          <p>with saved data</p>
        </article>
      </section>

      <div className="progress-layout">
        <section className="history-panel card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">EXERCISE HISTORY</span>
              <h2>{selectedName}</h2>
            </div>
            <label className="select-wrap">
              <span className="sr-only">Choose exercise</span>
              <select
                value={selectedExercise}
                onChange={(event) => setSelectedExercise(event.target.value)}
              >
                {exerciseOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} />
            </label>
          </div>

          <div className="history-highlights">
            <div>
              <span>LATEST</span>
              <strong>
                {latest?.record.type === "strength"
                  ? `${latest.record.sets.at(-1)?.weight ?? "—"} kg`
                  : latest?.record.type === "cardio"
                    ? `${latest.record.duration ?? "—"} min`
                    : "—"}
              </strong>
            </div>
            <div>
              <span>BEST</span>
              <strong>
                {bestSet
                  ? `${bestSet.weight ?? "—"} kg`
                  : sessions
                      .filter(
                        (
                          item,
                        ): item is {
                          date: string;
                          record: Extract<ExerciseRecord, { type: "cardio" }>;
                        } => item.record.type === "cardio",
                      )
                      .reduce(
                        (best, item) =>
                          Math.max(best, item.record.duration ?? 0),
                        0,
                      ) || "—"}
                {sessions[0]?.record.type === "cardio" && " min"}
              </strong>
            </div>
            <div>
              <span>SESSIONS</span>
              <strong>{sessions.length}</strong>
            </div>
          </div>

          <div className="history-list">
            {sessions.length ? (
              sessions.map(({ date, record }) => (
                <article key={date}>
                  <time dateTime={date}>
                    <strong>
                      {parseDateKey(date).toLocaleDateString("en", {
                        day: "numeric",
                        month: "short",
                      })}
                    </strong>
                    <span>
                      {parseDateKey(date).toLocaleDateString("en", {
                        year: "numeric",
                      })}
                    </span>
                  </time>
                  <div>
                    {record.type === "strength" ? (
                      <>
                        <strong>
                          {Math.max(
                            0,
                            ...record.sets.map((set) => set.weight ?? 0),
                          )}{" "}
                          kg
                        </strong>
                        <span>
                          {record.sets
                            .map((set) => set.reps ?? "—")
                            .join(" / ")}{" "}
                          reps
                        </span>
                      </>
                    ) : (
                      <>
                        <strong>{record.duration ?? "—"} min</strong>
                        <span>
                          {record.distance
                            ? `${record.distance} km`
                            : "Duration logged"}
                        </span>
                      </>
                    )}
                  </div>
                  <span className={record.completed ? "status-complete" : "status-partial"}>
                    {record.completed ? "Complete" : "In progress"}
                  </span>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <Medal size={25} />
                <strong>Your history starts with the first set.</strong>
                <span>Log this exercise from Today to see it here.</span>
              </div>
            )}
          </div>
        </section>

        <section className="recent-panel card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">RECENT ACTIVITY</span>
              <h2>Latest sessions</h2>
            </div>
          </div>
          <div className="recent-list">
            {recentActivity.length ? (
              recentActivity.map((workout) => {
                const complete = Object.values(workout.exercises).filter(
                  (record) => record.completed,
                ).length;
                return (
                  <article key={workout.date}>
                    <span className="activity-dot" />
                    <div>
                      <strong>
                        {workout.dayName} — {workout.focus}
                      </strong>
                      <span>
                        {parseDateKey(workout.date).toLocaleDateString("en", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <small>
                      {complete}/{Object.keys(workout.exercises).length}
                    </small>
                  </article>
                );
              })
            ) : (
              <p className="empty-copy">
                Your latest workout dates will collect here.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
