# Spanish–German Vocabulary Trainer

A mobile-first vocabulary trainer written with plain HTML, CSS and JavaScript.
The browser application has no framework, Node.js runtime, build step or
third-party dependency.

## Features

- Import two-column Spanish–German CSV files
- Organize vocabulary in categories
- Import categories from an optional third CSV column
- Create categories directly in the application
- Train exactly one selected category at a time
- Flashcard and multiple-choice practice
- Spanish and German pronunciation using the Web Speech API
- Local progress storage
- Offline use and home-screen installation as a Progressive Web App

## Architecture

The application is a fully static client-side PWA. A web server only delivers
the files from `dist/`; all vocabulary processing happens in the browser.

| File | Responsibility |
| --- | --- |
| `dist/index.html` | Semantic application structure and controls |
| `dist/styles.css` | Responsive mobile presentation |
| `dist/app.js` | CSV parsing, learning modes, scores, speech and persistence |
| `dist/sw.js` | Offline cache and network fallback |
| `dist/manifest.webmanifest` | Installation metadata |

Imported data and scores are stored in `localStorage` under
`palabras-words`. The category list and current selection use
`palabras-categories` and `palabras-selected-category`. Older saved entries
without a category are migrated to `Allgemein`. Files are read locally with
the Browser File API and are never uploaded. Speech uses
`window.speechSynthesis`; no audio service is contacted by the application.

## CSV format

```csv
"la manzana";"der Apfel"
"el durazno";"der Pfirsich"
"patinar";"Schlittschuh laufen";"Sport"
```

The first column contains Spanish, the second German and the optional third
column a category. Semicolon, tab and comma delimiters are recognized. A
header row is optional. When the category column is missing or empty, the app
asks which existing category should receive those entries.

## Run locally

Serve the `dist` directory with any static HTTP server. No installation or
compilation is required.

```bash
python3 -m http.server 8080 --directory dist
```

Then open `http://localhost:8080`.

The repository contains a minimal `package.json` only because the deployment
platform requires a build command. It declares no dependencies and creates no
application bundle.
