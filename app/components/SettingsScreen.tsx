"use client";

import { useRef } from "react";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  RotateCcw,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { createDefaultData } from "@/lib/defaultData";
import type { GymAppData } from "@/lib/types";
import { exportCsv, isGymAppData } from "@/lib/storage";

interface SettingsScreenProps {
  data: GymAppData;
  setData: React.Dispatch<React.SetStateAction<GymAppData>>;
  notify: (message: string) => void;
}

const download = (content: string, type: string, filename: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export function SettingsScreen({
  data,
  setData,
  notify,
}: SettingsScreenProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  const importData = async (file?: File) => {
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isGymAppData(parsed)) {
        notify("That file isn’t a valid Form backup");
        return;
      }
      if (
        window.confirm(
          "Importing will replace your current program and workout history on this device. Continue?",
        )
      ) {
        setData(parsed);
        notify("Backup imported");
      }
    } catch {
      notify("We couldn’t read that backup file");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

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

        <section className="settings-card card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">DATA MANAGEMENT</span>
              <h2>Your workout data</h2>
            </div>
            <ShieldCheck size={21} />
          </div>
          <p className="section-intro">
            Everything stays in this browser unless you export it. Make a
            backup before clearing browser storage or moving devices.
          </p>
          <div className="settings-actions">
            <button
              onClick={() =>
                download(
                  JSON.stringify(data, null, 2),
                  "application/json",
                  `form-backup-${new Date().toISOString().slice(0, 10)}.json`,
                )
              }
            >
              <span className="action-icon"><FileJson size={19} /></span>
              <span>
                <strong>Export data</strong>
                <small>Program, preferences and full history</small>
              </span>
              <Download size={18} />
            </button>
            <button onClick={() => fileInput.current?.click()}>
              <span className="action-icon"><Upload size={19} /></span>
              <span>
                <strong>Import data</strong>
                <small>Restore from a Form JSON backup</small>
              </span>
              <Upload size={18} />
            </button>
            <input
              className="sr-only"
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              onChange={(event) => importData(event.target.files?.[0])}
            />
            <button
              onClick={() =>
                download(
                  exportCsv(data.workoutHistory),
                  "text/csv",
                  `form-history-${new Date().toISOString().slice(0, 10)}.csv`,
                )
              }
            >
              <span className="action-icon"><FileSpreadsheet size={19} /></span>
              <span>
                <strong>Export history as CSV</strong>
                <small>Use your workout records in a spreadsheet</small>
              </span>
              <Download size={18} />
            </button>
          </div>
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

