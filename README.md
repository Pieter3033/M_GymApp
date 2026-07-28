# Form

Form is a mobile-first weekly gym program and workout tracker. It opens directly
to the selected day, saves workout input automatically, and keeps all program,
history, and preference data in the browser.

## What it includes

- Date-specific strength and cardio logging
- Previous-workout prefill and preserved exercise history
- Automatic daily progress and completion tracking
- Configurable rest timer
- Fully editable, reorderable weekly program
- Exercise history, recent activity, and simple personal bests
- JSON backup/restore, CSV history export, and confirmed reset
- Responsive phone, tablet, and desktop layouts

## Local development

Node.js `>=22.13.0` is required.

```bash
npm install
npm run dev
npm run build
npm test
```

The application has no backend, database, authentication, or external API.
Persistent data is stored under the versioned `gym-app-data-v1` localStorage
key.

