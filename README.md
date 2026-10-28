# Sort Visualizer BD

Watch sorting algorithms sort bars step by step — in English or বাংলা, fully
offline. Built for students learning data structures (DIU CIS coursework and
beyond): pick an algorithm, pick an array, press Play, and see every
comparison, swap, and write happen.

## Features

1. **Animated bar visualization** — bars grow/shrink with value; colours show
   what is happening: teal = unsorted, amber = comparing, red = swapping /
   writing, purple = pivot, green = in its final place.
2. **Five algorithms** — Bubble, Selection, Insertion, Merge, and Quick sort,
   each with its textbook time/space complexity and a plain-language
   explanation (EN + বাংলা).
3. **Array controls** — size slider (8–60), four generators (Random, Nearly
   sorted, Reversed, Few unique values), and a custom-array input with strict
   validation (whole numbers, 2–100 values, each 1–999).
4. **Playback controls** — Play/Pause, single Step, Reset, Skip to end, and a
   1–10 speed control. Live counters for comparisons, swaps/writes, and steps.
5. **Bilingual UI** — EN/বাংলা toggle persisted in localStorage, with Bengali
   digits when বাংলা is active. No account, no network calls, no tracking.
6. **Responsive** — works at 390px mobile width with no horizontal overflow.

## Stack

Vanilla HTML + CSS + JavaScript. No build step, no dependencies, no CDN.
`js/sorting.js` is pure logic (step-trace generators) and runs unchanged in
Node for tests; `js/app.js` is the browser UI.

## Run it

Open `index.html` in any modern browser, or serve the folder:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Tests

```sh
node tests/logic.test.js   # pure-logic unit tests (replay sortedness, exact counts)
node tests/smoke.js        # headless-Chromium UI checks (raw CDP, no dependency)
```

See [TEST_RESULTS.md](TEST_RESULTS.md) for the real results of the latest run.

## How the trace works

Each algorithm produces a list of ops (`cmp`, `swap`, `set`, `pivot`,
`sorted`). The player applies them one at a time to a working array, so the
animation is exactly the algorithm — no hand-waved motion. Unit tests replay
every trace and assert the result equals the sorted input.

## Limitations

- Array values are display heights, not a data set: custom values are capped
  at 999 and the bar scale is relative to the largest value.
- Quick Sort uses the Lomuto partition scheme with the last element as pivot,
  so its worst case is O(n²) on already-sorted input — that is the point of
  the Reversed / Nearly sorted generators: try it and watch.
- Complexity figures are standard textbook values, not measured benchmarks.
- Step counts for Merge/Quick Sort include internal bookkeeping ops (`pivot`,
  `sorted` markers) in the step total; the comparisons and swaps/writes
  counters count only real comparisons and array writes.

## Status

Complete MVP. Offline static site; deployable to any static host or GitHub Pages.
