# Spanish–German Vocabulary Trainer

A mobile-first vocabulary trainer that works in the browser and keeps vocabulary and learning progress on the device.

## Features

- Import two-column Spanish–German CSV files
- Flashcard and multiple-choice practice
- Spanish and German text-to-speech through the browser
- Local progress storage
- Progressive Web App support for offline use and home-screen installation

## CSV format

Use a semicolon between the Spanish and German text:

```csv
"la manzana";"der Apfel"
"el durazno";"der Pfirsich"
```

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
