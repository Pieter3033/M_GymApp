"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Dumbbell,
  Settings as SettingsIcon,
} from "lucide-react";
import type {
  AppScreen,
  Exercise,
  GymAppData,
  WorkoutDay,
} from "@/lib/types";
import { createDefaultData } from "@/lib/defaultData";
import { formatDateKey, loadData, saveData } from "@/lib/storage";
import { ExerciseScreen } from "./ExerciseScreen";
import { ProgramScreen } from "./ProgramScreen";
import { ProgressScreen } from "./ProgressScreen";
import { SettingsScreen } from "./SettingsScreen";
import { TodayScreen } from "./TodayScreen";

const navItems: {
  id: AppScreen;
  label: string;
  icon: typeof CalendarDays;
}[] = [
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "program", label: "Program", icon: Dumbbell },
  { id: "progress", label: "Progress", icon: ChartNoAxesColumnIncreasing },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

const getWeek = (anchor: Date) => {
  const monday = new Date(anchor);
  const weekday = anchor.getDay();
  monday.setDate(anchor.getDate() - (weekday === 0 ? 6 : weekday - 1));
  monday.setHours(12, 0, 0, 0);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
};

export function GymApp() {
  const [data, setData] = useState<GymAppData>(() => createDefaultData());
  const [hydrated, setHydrated] = useState(false);
  const [screen, setScreen] = useState<AppScreen>("today");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [activeExercise, setActiveExercise] = useState<{
    exercise: Exercise;
    day: WorkoutDay;
  } | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setData(loadData());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveData(data);
  }, [data, hydrated]);

  useEffect(() => {
    document.documentElement.dataset.theme = data.settings.theme;
  }, [data.settings.theme]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const week = useMemo(() => getWeek(selectedDate), [selectedDate]);
  const dayIndex = Math.max(
    0,
    Math.min(6, selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1),
  );
  const selectedDay = data.program.days[dayIndex] ?? data.program.days[0];
  const dateKey = formatDateKey(selectedDate);

  const openExercise = (exercise: Exercise, day = selectedDay) => {
    setActiveExercise({ exercise, day });
  };

  const navigate = (next: AppScreen) => {
    setActiveExercise(null);
    setScreen(next);
  };

  const renderScreen = () => {
    if (activeExercise) {
      return (
        <ExerciseScreen
          data={data}
          setData={setData}
          dateKey={dateKey}
          day={activeExercise.day}
          exercise={activeExercise.exercise}
          onBack={() => setActiveExercise(null)}
          onOpenExercise={(exercise) =>
            setActiveExercise({ exercise, day: activeExercise.day })
          }
          onReturnToday={() => {
            setActiveExercise(null);
            setScreen("today");
          }}
        />
      );
    }

    if (screen === "program") {
      return (
        <ProgramScreen
          data={data}
          setData={setData}
          notify={setNotice}
        />
      );
    }
    if (screen === "progress") {
      return <ProgressScreen data={data} />;
    }
    if (screen === "settings") {
      return (
        <SettingsScreen
          data={data}
          setData={setData}
          notify={setNotice}
        />
      );
    }
    return (
      <TodayScreen
        data={data}
        week={week}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        day={selectedDay}
        dateKey={dateKey}
        onOpenExercise={openExercise}
      />
    );
  };

  return (
    <div className="app-shell" data-theme={data.settings.theme}>
      <aside className="desktop-rail" aria-label="Primary navigation">
        <div className="brand-mark" aria-label="Form">
          <Dumbbell size={23} strokeWidth={2.25} />
        </div>
        <div className="rail-copy">
          <span>FORM</span>
          <small>Move with intention.</small>
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={screen === item.id ? "active" : ""}
                onClick={() => navigate(item.id)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="rail-footer">
          <div className="rail-metric">
            <span>THIS WEEK</span>
            <strong>
              {
                Object.values(data.workoutHistory).filter((record) =>
                  week.some((date) => formatDateKey(date) === record.date),
                ).length
              }
              /5
            </strong>
          </div>
          <p>Small steps. Strong habits.</p>
        </div>
      </aside>

      <main className="main-stage">{renderScreen()}</main>

      {!activeExercise && (
        <nav className="mobile-nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={screen === item.id ? "active" : ""}
                aria-current={screen === item.id ? "page" : undefined}
                onClick={() => navigate(item.id)}
              >
                <Icon size={22} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}
