# TEST_RESULTS — sort-visualizer-bd (2026-10-28, 11:00 slot)

## Unit tests — 166/166 passed (`node tests/logic.test.js`)

- Replay sortedness for all 5 algorithms × 7 inputs (sorted, reversed,
  duplicates, single element, mixed): every trace replays to exactly the
  sorted input, and `trace.sorted` matches.
- Stats/op-count consistency for every trace (comparisons == cmp ops;
  swaps + writes == swap + set ops).
- Hand-verified exact counts: Bubble [3,2,1] → 3 comparisons / 3 swaps;
  Bubble sorted [1,2,3] → 2 comparisons / 0 swaps (early exit);
  Selection [3,2,1] → 3 comparisons / 1 swap; Insertion [3,2,1] → 3
  comparisons; Insertion sorted → 2 comparisons.
- Generators: seeded random is deterministic and a true permutation of
  1..10; reversed(5) = [5,4,3,2,1]; few-unique uses only {10,30,50,70,90};
  nearly-sorted (n=50) differs from sorted in at most 10 positions (5 swaps).
- Custom parser: all 6 error classes verified (empty, bad-number, too-few,
  too-many, out-of-range) plus comma- and space-separated success cases.
- Complexity table: all 5 algorithms carry best/avg/worst/space/stable;
  Merge worst = O(n log n), Quick worst = O(n²).

## Smoke tests — 12/12 passed (`node tests/smoke.js`, raw CDP headless Chromium)

- Title, 24 default bars, Ready status.
- EN → বাংলা title toggle and back.
- Size slider to 12 regenerates 12 bars.
- Skip to end: status "Sorted" and array line ascending (12 values).
- Invalid custom array ("5, x, 3") shows an inline error.
- Valid custom array (5, 2, 9) loads 3 bars and sorts to "2, 5, 9".
- Merge Sort on the same custom array also sorts to "2, 5, 9".
- 390px mobile: no horizontal overflow.
- Zero console/page errors.

## Repairs

- 1 real app bug found by smoke tests: the first paint rendered 0 bars
  because `working` was only assigned inside `resetPlayback()`, which the
  init path never called. Fixed: init now calls `resetPlayback()`. Smoke
  re-run green (12/12).
- 1 test-expectation fix: the nearly-sorted test first asserted "at most 30
  inversions", which is false for distant swaps (one swap can create ~n
  inversions). Replaced with the true property: at most 2 moved positions
  per swap. No app change.
- 0 repairs in the final green runs (unit 166/166, smoke 12/12).
