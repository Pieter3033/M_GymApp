"use client";

import { RotateCcw } from "lucide-react";
import { createDefaultData } from "@/lib/defaultData";
import type { GymAppData } from "@/lib/types";

interface SettingsScreenProps {
  data: GymAppData;
  setData: React.Dispatch<React.SetStateAction<GymAppData>>;
  notify: (message: string) => void;
}

export function SettingsScreen({
  data,
  setData,
  notify,
}: SettingsScreenProps) {
  return (
    <div className="screen settings-screen">
      <header className="page-header">
        <div>
          <span className="eyebrow">APP PREFERENCES</span>
          <h1>Settings</h1>
          <p>Keep your data portable and your training uninterrupted.</p>
        </div>
      </header>

      <div className="settings-layout">
        <section className="settings-card card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">WORKOUT</span>
              <h2>Rest timer</h2>
            </div>
          </div>
          <label className="toggle-row">
            <span>
              <strong>Start timer automatically</strong>
              <small>Begin the rest countdown when a set is completed.</small>
            </span>
            <input
              type="checkbox"
              checked={data.settings.autoStartTimer}
              onChange={(event) =>
                setData((current) => ({
                  ...current,
                  settings: {
                    ...current.settings,
                    autoStartTimer: event.target.checked,
                  },
                }))
              }
            />
          </label>
        </section>

        <section className="settings-card card danger-zone">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FRESH START</span>
              <h2>Reset all data</h2>
            </div>
          </div>
          <p className="section-intro">
            This restores the original weekly program and removes all workout
            history saved in this browser.
          </p>
          <button
            className="danger-button"
            onClick={() => {
              if (
                window.confirm(
                  "Reset all program settings and workout history? This can’t be undone unless you have an export.",
                )
              ) {
                setData(createDefaultData());
                notify("All data reset");
              }
            }}
          >
            <RotateCcw size={17} /> Reset all data
          </button>
        </section>
      </div>
    </div>
  );
}
