# Spanish–German Vocabulary Trainer

A mobile-first vocabulary trainer that works in the browser and keeps vocabulary and learning progress on the device.

## Features

- Import two-column Spanish–German CSV files
- Flashcard and multiple-choice practice
- Spanish and German text-to-speech through the browser
- Local progress storage
- Progressive Web App support for offline use and home-screen installation

## Application architecture

The application is a client-focused Progressive Web App (PWA). It has no application backend and does not send imported vocabulary or learning progress to a server.

### Main components

| Layer | Technology | Responsibility |
| --- | --- | --- |
| User interface | React 19, TypeScript, Next.js App Router | Renders the mobile interface, flashcards, quiz mode and progress display |
| Runtime and build | Vinext and Vite | Builds the Next.js-compatible application for a Cloudflare Worker runtime |
| UI primitives | shadcn-style Button and Progress components, Tailwind CSS | Provides accessible controls and responsive styling |
| CSV import | Browser File API and client-side parser | Reads CSV files locally and converts the first two columns into vocabulary entries |
| Local persistence | Browser `localStorage` | Stores imported vocabulary, scores and learning progress on the current device |
| Speech | Web Speech API (`speechSynthesis`) | Pronounces Spanish with `es-ES` and German with `de-DE` |
| Offline support | Service Worker and Cache API | Caches the application shell and serves cached resources when the network is unavailable |
| Installation | Web App Manifest | Enables installation on an Android home screen as a PWA |
| Hosting runtime | Cloudflare Worker entry point | Serves the built Vinext application and static assets |

### Data flow

1. The user selects a CSV file in the browser.
2. The browser reads the file locally; it is not uploaded.
3. The parser detects semicolon, tab or comma as the delimiter and maps the first two columns to Spanish and German.
4. React stores the resulting vocabulary list in component state.
5. Changes are persisted in `localStorage` under the key `palabras-words`.
6. Flashcard and quiz answers adjust each word's score between 0 and 3.
7. Words with a score of at least 2 count as learned.

### Project structure

```text
app/
  page.tsx          Main client application and learning logic
  layout.tsx        HTML metadata, PWA manifest and theme configuration
  globals.css       Mobile-first presentation
components/ui/      Reusable Button and Progress primitives
public/
  manifest.webmanifest
  sw.js             Offline service worker
worker/index.ts     Cloudflare Worker/Vinext entry point
vite.config.ts      Vinext, Vite and Cloudflare build configuration
```

### Privacy and storage limitations

Vocabulary and progress remain inside the browser profile on one device. Clearing site data removes them, and they are not automatically synchronized between devices. Speech output depends on voices supplied by the browser or operating system.

## CSV format

Use a semicolon between the Spanish and German text:

```csv
"la manzana";"der Apfel"
"el durazno";"der Pfirsich"
```

A header row is optional. Tab- and comma-separated input is also recognized, although semicolon-separated CSV is recommended because sentences may contain commas.

## Development

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```
