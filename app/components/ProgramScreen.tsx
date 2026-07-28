"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Dumbbell,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type {
  CardioExercise,
  Exercise,
  ExerciseType,
  GymAppData,
  Program,
  StrengthExercise,
  WorkoutDay,
} from "@/lib/types";

interface ProgramScreenProps {
  data: GymAppData;
  setData: React.Dispatch<React.SetStateAction<GymAppData>>;
  notify: (message: string) => void;
}

const move = <T,>(list: T[], from: number, to: number) => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const exerciseSummary = (exercise: Exercise) => {
  if (exercise.type === "cardio") return `${exercise.targetMinutes} min`;
  return `${exercise.sets} sets · ${exercise.minReps}–${exercise.maxReps} reps`;
};

const newId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function ExerciseEditor({
  initial,
  onSave,
  onClose,
}: {
  initial?: Exercise;
  onSave: (exercise: Exercise) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<ExerciseType>(initial?.type ?? "strength");
  const [name, setName] = useState(initial?.name ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [sets, setSets] = useState(
    initial?.type === "strength" ? initial.sets : 3,
  );
  const [minReps, setMinReps] = useState(
    initial?.type === "strength" ? initial.minReps : 8,
  );
  const [maxReps, setMaxReps] = useState(
    initial?.type === "strength" ? initial.maxReps : 12,
  );
  const [restSeconds, setRestSeconds] = useState(
    initial?.type === "strength" ? initial.restSeconds : 75,
  );
  const [targetMinutes, setTargetMinutes] = useState(
    initial?.type === "cardio" ? initial.targetMinutes : 30,
  );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    const base = {
      id: initial?.id ?? newId("exercise"),
      name: name.trim(),
      notes: notes.trim(),
    };
    if (type === "strength") {
      onSave({
        ...base,
        type,
        sets: Math.max(1, sets),
        minReps: Math.max(1, minReps),
        maxReps: Math.max(minReps, maxReps),
        restSeconds: Math.max(0, restSeconds),
      } satisfies StrengthExercise);
    } else {
      onSave({
        ...base,
        type,
        targetMinutes: Math.max(1, targetMinutes),
      } satisfies CardioExercise);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="editor-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-editor-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="drawer-handle" />
        <header>
          <div>
            <span className="eyebrow">PROGRAM BUILDER</span>
            <h2 id="exercise-editor-title">
              {initial ? "Edit exercise" : "Add exercise"}
            </h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>
        <form onSubmit={submit}>
          <label>
            <span>Exercise name</span>
            <input
              autoFocus
              required
              value={name}
              placeholder="e.g. Goblet Squat"
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <fieldset>
            <legend>Exercise type</legend>
            <div className="segmented-control">
              <button
                type="button"
                className={type === "strength" ? "active" : ""}
                onClick={() => setType("strength")}
              >
                Strength
              </button>
              <button
                type="button"
                className={type === "cardio" ? "active" : ""}
                onClick={() => setType("cardio")}
              >
                Cardio
              </button>
            </div>
          </fieldset>
          <label>
            <span>Notes <small>Optional</small></span>
            <input
              value={notes}
              placeholder="Technique cue or setup"
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>

          {type === "strength" ? (
            <div className="form-grid">
              <label>
                <span>Number of sets</span>
                <input
                  type="number"
                  min="1"
                  value={sets}
                  onChange={(event) => setSets(Number(event.target.value))}
                />
              </label>
              <label>
                <span>Minimum reps</span>
                <input
                  type="number"
                  min="1"
                  value={minReps}
                  onChange={(event) => setMinReps(Number(event.target.value))}
                />
              </label>
              <label>
                <span>Maximum reps</span>
                <input
                  type="number"
                  min="1"
                  value={maxReps}
                  onChange={(event) => setMaxReps(Number(event.target.value))}
                />
              </label>
              <label>
                <span>Rest (seconds)</span>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={restSeconds}
                  onChange={(event) => setRestSeconds(Number(event.target.value))}
                />
              </label>
            </div>
          ) : (
            <label>
              <span>Target duration (minutes)</span>
              <input
                type="number"
                min="1"
                value={targetMinutes}
                onChange={(event) =>
                  setTargetMinutes(Number(event.target.value))
                }
              />
            </label>
          )}
          <button className="primary-button" type="submit">
            {initial ? "Update exercise" : "Add to program"}
          </button>
        </form>
      </section>
    </div>
  );
}

export function ProgramScreen({
  data,
  setData,
  notify,
}: ProgramScreenProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Program>(() =>
    structuredClone(data.program),
  );
  const [expanded, setExpanded] = useState<string[]>(["monday"]);
  const [editor, setEditor] = useState<{
    dayId: string;
    exercise?: Exercise;
  } | null>(null);
  const [dragDay, setDragDay] = useState<number | null>(null);
  const [dragExercise, setDragExercise] = useState<{
    dayId: string;
    index: number;
  } | null>(null);

  const beginEditing = () => {
    setDraft(structuredClone(data.program));
    setEditing(true);
  };

  const saveProgram = () => {
    setData((current) => ({ ...current, program: draft }));
    setEditing(false);
    notify("Program saved");
  };

  const updateDay = (dayId: string, patch: Partial<WorkoutDay>) =>
    setDraft((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.id === dayId ? { ...day, ...patch } : day,
      ),
    }));

  const saveExercise = (dayId: string, exercise: Exercise) => {
    setDraft((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              isRest: false,
              exercises: day.exercises.some((item) => item.id === exercise.id)
                ? day.exercises.map((item) =>
                    item.id === exercise.id ? exercise : item,
                  )
                : [...day.exercises, exercise],
            }
          : day,
      ),
    }));
    setEditor(null);
    setExpanded((current) =>
      current.includes(dayId) ? current : [...current, dayId],
    );
  };

  if (!editing) {
    return (
      <div className="screen program-screen">
        <header className="page-header">
          <div>
            <span className="eyebrow">YOUR ROUTINE</span>
            <h1>Weekly program</h1>
            <p>A clear rhythm for every training day.</p>
          </div>
          <button className="secondary-button" onClick={beginEditing}>
            <Pencil size={16} /> Edit program
          </button>
        </header>
        <section className="program-overview">
          {data.program.days.map((day, index) => (
            <article className={`program-day card ${day.isRest ? "rest" : ""}`} key={day.id}>
              <div className="day-number">{`${index + 1}`.padStart(2, "0")}</div>
              <div>
                <span>{day.name}</span>
                <h2>{day.focus}</h2>
                <p>
                  {day.isRest
                    ? "Recovery day"
                    : `${day.exercises.length} exercise${day.exercises.length === 1 ? "" : "s"}`}
                </p>
              </div>
              {!day.isRest && (
                <div className="day-preview">
                  {day.exercises.slice(0, 3).map((exercise) => (
                    <span key={exercise.id}>{exercise.name}</span>
                  ))}
                  {day.exercises.length > 3 && (
                    <span>+{day.exercises.length - 3} more</span>
                  )}
                </div>
              )}
            </article>
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="screen edit-program-screen">
      <header className="edit-program-header">
        <button
          className="text-action"
          onClick={() => {
            setEditing(false);
            setEditor(null);
          }}
        >
          Cancel
        </button>
        <div>
          <h1>Edit program</h1>
          <p>Drag to reorder days</p>
        </div>
        <button className="text-action" onClick={saveProgram}>
          Save
        </button>
      </header>

      <div className="edit-day-list">
        {draft.days.map((day, dayIndex) => {
          const isExpanded = expanded.includes(day.id);
          return (
            <article
              className="edit-day-card"
              key={day.id}
              draggable
              onDragStart={() => setDragDay(dayIndex)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragDay !== null) {
                  setDraft((current) => ({
                    ...current,
                    days: move(current.days, dragDay, dayIndex),
                  }));
                }
                setDragDay(null);
              }}
            >
              <div className="edit-day-title">
                <GripVertical className="drag-handle" size={19} />
                <div>
                  <strong>{day.name}</strong>
                  <span> — {day.focus}</span>
                </div>
                <button
                  className="bare-icon"
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} ${day.name}`}
                  onClick={() =>
                    setExpanded((current) =>
                      isExpanded
                        ? current.filter((id) => id !== day.id)
                        : [...current, day.id],
                    )
                  }
                >
                  {isExpanded ? <ChevronUp size={19} /> : <ChevronDown size={19} />}
                </button>
              </div>

              {isExpanded && (
                <div className="edit-day-body">
                  <div className="form-grid day-fields">
                    <label>
                      <span>Day name</span>
                      <input
                        value={day.name}
                        onChange={(event) =>
                          updateDay(day.id, { name: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      <span>Workout focus</span>
                      <input
                        value={day.focus}
                        onChange={(event) =>
                          updateDay(day.id, { focus: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label className="toggle-row">
                    <span>
                      <strong>Rest day</strong>
                      <small>Hide exercises for this day</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={day.isRest}
                      onChange={(event) =>
                        updateDay(day.id, { isRest: event.target.checked })
                      }
                    />
                  </label>
                  {!day.isRest && (
                    <div className="editable-exercises">
                      {day.exercises.map((exercise, exerciseIndex) => (
                        <div
                          className="editable-exercise"
                          key={exercise.id}
                          draggable
                          onDragStart={(event) => {
                            event.stopPropagation();
                            setDragExercise({
                              dayId: day.id,
                              index: exerciseIndex,
                            });
                          }}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.stopPropagation();
                            if (dragExercise?.dayId === day.id) {
                              updateDay(day.id, {
                                exercises: move(
                                  day.exercises,
                                  dragExercise.index,
                                  exerciseIndex,
                                ),
                              });
                            }
                            setDragExercise(null);
                          }}
                        >
                          <GripVertical size={17} className="drag-handle" />
                          <div>
                            <strong>{exercise.name}</strong>
                            <span>
                              {exercise.notes
                                ? `${exercise.notes} · `
                                : ""}
                              {exerciseSummary(exercise)}
                            </span>
                          </div>
                          <button
                            className="bare-icon"
                            onClick={() =>
                              setEditor({ dayId: day.id, exercise })
                            }
                            aria-label={`Edit ${exercise.name}`}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="bare-icon danger"
                            aria-label={`Delete ${exercise.name}`}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Remove ${exercise.name} from this program? Its workout history will be kept.`,
                                )
                              ) {
                                updateDay(day.id, {
                                  exercises: day.exercises.filter(
                                    (item) => item.id !== exercise.id,
                                  ),
                                });
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        className="text-action add-exercise"
                        onClick={() => setEditor({ dayId: day.id })}
                      >
                        <Plus size={17} /> Add exercise
                      </button>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <button
        className="add-day-button"
        onClick={() => {
          const id = newId("day");
          setDraft((current) => ({
            ...current,
            days: [
              ...current.days,
              {
                id,
                name: `Day ${current.days.length + 1}`,
                focus: "Training",
                isRest: false,
                exercises: [],
              },
            ],
          }));
          setExpanded((current) => [...current, id]);
        }}
      >
        <Plus size={18} /> Add day
      </button>

      {editor && (
        <ExerciseEditor
          initial={editor.exercise}
          onClose={() => setEditor(null)}
          onSave={(exercise) => saveExercise(editor.dayId, exercise)}
        />
      )}
    </div>
  );
}

