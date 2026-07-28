import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Dumbbell,
  Footprints,
  Sparkles,
} from "lucide-react";
import type { Exercise, GymAppData, WorkoutDay } from "@/lib/types";
import { findPreviousRecord, recordSummary } from "@/lib/storage";

interface TodayScreenProps {
  data: GymAppData;
  week: Date[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  day: WorkoutDay;
  dateKey: string;
  onOpenExercise: (exercise: Exercise, day?: WorkoutDay) => void;
}

const weekLabel = (week: Date[]) => {
  const start = week[0];
  const end = week[6];
  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString("en", { month: "long" })} ${start.getFullYear()}`;
  }
  return `${start.toLocaleDateString("en", { month: "short" })} – ${end.toLocaleDateString("en", { month: "short", year: "numeric" })}`;
};

export function TodayScreen({
  data,
  week,
  selectedDate,
  setSelectedDate,
  day,
  dateKey,
  onOpenExercise,
}: TodayScreenProps) {
  const workout = data.workoutHistory[dateKey];
  const completed = day.exercises.filter(
    (exercise) => workout?.exercises[exercise.id]?.completed,
  ).length;
  const total = day.exercises.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  const shiftWeek = (amount: number) => {
    const next = new Date(selectedDate);
    next.setDate(selectedDate.getDate() + amount * 7);
    setSelectedDate(next);
  };

  return (
    <div className="screen today-screen">
      <header className="page-header today-header">
        <div>
          <span className="eyebrow">YOUR TRAINING</span>
          <h1>Today</h1>
          <p className="header-date">
            {selectedDate.toLocaleDateString("en", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button className="icon-button" aria-label="Open calendar">
          <CalendarDays size={20} />
        </button>
      </header>

      <section className="week-panel" aria-label="Week selector">
        <div className="week-toolbar">
          <button
            className="bare-icon"
            aria-label="Previous week"
            onClick={() => shiftWeek(-1)}
          >
            <ChevronLeft size={18} />
          </button>
          <strong>{weekLabel(week)}</strong>
          <button
            className="bare-icon"
            aria-label="Next week"
            onClick={() => shiftWeek(1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="week-days">
          {week.map((date, index) => {
            const active = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <button
                key={date.toISOString()}
                className={active ? "active" : ""}
                onClick={() => setSelectedDate(date)}
                aria-pressed={active}
              >
                <span>{date.toLocaleDateString("en", { weekday: "short" })}</span>
                <strong>{date.getDate()}</strong>
                {isToday && <i aria-label="Today" />}
              </button>
            );
          })}
        </div>
      </section>

      {day.isRest ? (
        <section className="rest-state card">
          <div className="rest-icon">
            <Coffee size={30} />
          </div>
          <span className="eyebrow">RECOVERY DAY</span>
          <h2>Rest. Reset. Return stronger.</h2>
          <p>
            Today is part of the plan too. Prioritise sleep, hydration and a
            little gentle movement.
          </p>
          <div className="rest-tip">
            <Sparkles size={17} />
            <span>Your next session is waiting when you’re ready.</span>
          </div>
        </section>
      ) : (
        <section className="workout-card card">
          <div className="workout-card-header">
            <div>
              <span className="eyebrow">TODAY’S SESSION</span>
              <h2>
                {day.name} <span>— {day.focus}</span>
              </h2>
              <p>
                <strong>{completed}</strong> of {total} exercises completed
              </p>
            </div>
            <div
              className="progress-ring"
              style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}
              aria-label={`${progress}% complete`}
            >
              <div>
                <strong>{progress}%</strong>
                <span>complete</span>
              </div>
            </div>
          </div>

          <div className="exercise-list">
            {day.exercises.map((exercise, index) => {
              const record = workout?.exercises[exercise.id];
              const previous = findPreviousRecord(
                data.workoutHistory,
                exercise.id,
                dateKey,
              );
              const summary = recordSummary(previous?.record);
              const done = !!record?.completed;
              const Icon = exercise.type === "cardio" ? Footprints : Dumbbell;
              return (
                <button
                  className={`exercise-card ${done ? "completed" : ""}`}
                  key={exercise.id}
                  onClick={() => onOpenExercise(exercise)}
                >
                  <span className="exercise-index">
                    <Icon size={18} />
                  </span>
                  <span className="exercise-copy">
                    <strong>
                      {exercise.name}
                      {exercise.type === "cardio" &&
                        ` — ${exercise.targetMinutes} min`}
                    </strong>
                    {exercise.notes && <small>{exercise.notes}</small>}
                    <span>
                      {exercise.type === "cardio"
                        ? `Target: ${exercise.targetMinutes} min`
                        : summary
                          ? `Previous: ${summary}`
                          : `${exercise.sets} sets · ${exercise.minReps}–${exercise.maxReps} reps`}
                    </span>
                  </span>
                  <span
                    className={`completion-control ${done ? "done" : ""}`}
                    aria-label={done ? "Complete" : "Not complete"}
                  >
                    {done ? <Check size={17} strokeWidth={3} /> : <ArrowRight size={17} />}
                  </span>
                  {index < day.exercises.length - 1 && (
                    <span className="exercise-connector" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="encouragement">
            <Sparkles size={17} />
            <span>
              {progress === 100
                ? `${day.name} complete. Beautiful work.`
                : progress > 0
                  ? "You’re in motion. Keep going."
                  : "Show up for yourself, one set at a time."}
            </span>
          </div>
        </section>
      )}
    </div>
  );
}

