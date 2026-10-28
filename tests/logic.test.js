// Node unit tests for sort-visualizer-bd logic. Run: node tests/logic.test.js
const assert = require('assert');
const L = require('../js/sorting.js');

let n = 0;
function ok(name, cond) { n++; assert.ok(cond, 'FAIL: ' + name); console.log('ok - ' + name); }
function eq(name, a, b) { n++; assert.deepStrictEqual(a, b, 'FAIL: ' + name); console.log('ok - ' + name); }

// --- Replay sortedness for every algorithm over several inputs ---
const INPUTS = [[3, 2, 1], [1, 2, 3], [5, 2, 9, 1, 7], [4, 4, 4], [9, 1], [7, 3, 7, 3, 7, 1], [42]];
Object.keys(L.ALGOS).forEach(function (algo) {
  INPUTS.forEach(function (inp) {
    const tr = L.sortTrace(algo, inp);
    eq(algo + ' sorts ' + JSON.stringify(inp), L.replay(tr.ops, inp), inp.slice().sort((a, b) => a - b));
    ok(algo + ' trace.sorted equals replay for ' + JSON.stringify(inp), JSON.stringify(tr.sorted) === JSON.stringify(inp.slice().sort((a, b) => a - b)));
    ok(algo + ' isSorted(trace.sorted)', L.isSorted(tr.sorted));
    ok(algo + ' stats match op counts', tr.stats.comparisons === tr.ops.filter(o => o.type === 'cmp').length
      && (tr.stats.swaps + tr.stats.writes) === tr.ops.filter(o => o.type === 'swap' || o.type === 'set').length);
  });
});

// --- Exact hand-verified counts ---
eq('bubble [3,2,1] comparisons', L.sortTrace('bubble', [3, 2, 1]).stats.comparisons, 3);
eq('bubble [3,2,1] swaps', L.sortTrace('bubble', [3, 2, 1]).stats.swaps, 3);
eq('bubble sorted [1,2,3] comparisons (early exit)', L.sortTrace('bubble', [1, 2, 3]).stats.comparisons, 2);
eq('bubble sorted [1,2,3] swaps', L.sortTrace('bubble', [1, 2, 3]).stats.swaps, 0);
eq('selection [3,2,1] comparisons', L.sortTrace('selection', [3, 2, 1]).stats.comparisons, 3);
eq('selection [3,2,1] swaps', L.sortTrace('selection', [3, 2, 1]).stats.swaps, 1);
eq('insertion [3,2,1] comparisons', L.sortTrace('insertion', [3, 2, 1]).stats.comparisons, 3);
eq('insertion sorted [1,2,3] comparisons', L.sortTrace('insertion', [1, 2, 3]).stats.comparisons, 2);

// --- Unknown algorithm throws ---
ok('unknown algorithm throws', (() => { try { L.sortTrace('bogus', [1]); return false; } catch (e) { return true; } })());

// --- Generators ---
eq('random seeded deterministic', L.generateArray('random', 10, 7), L.generateArray('random', 10, 7));
ok('random is a permutation of 1..10', JSON.stringify(L.generateArray('random', 10, 7).slice().sort((a, b) => a - b)) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
eq('reversed 5', L.generateArray('reversed', 5), [5, 4, 3, 2, 1]);
ok('few uses only the 5 values', L.generateArray('few', 20, 3).every(v => [10, 30, 50, 70, 90].includes(v)));
ok('nearly sorted differs from sorted in at most 2 positions per swap', (() => {
  const a = L.generateArray('nearly', 50, 11);
  const sorted = a.slice().sort((x, y) => x - y);
  let diff = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== sorted[i]) diff++;
  return diff <= 2 * Math.max(1, Math.floor(50 / 10)); // 5 swaps move at most 10 positions
})());
ok('bad size throws', (() => { try { L.generateArray('random', 1); return false; } catch (e) { return true; } })());

// --- Custom parser ---
eq('parse "5, 2, 9, 1, 7"', L.parseCustom('5, 2, 9, 1, 7'), { ok: true, arr: [5, 2, 9, 1, 7] });
eq('parse space-separated', L.parseCustom('3 1 2').arr, [3, 1, 2]);
eq('parse empty', L.parseCustom('').error, 'empty');
eq('parse bad-number', L.parseCustom('5, x, 3').error, 'bad-number');
eq('parse too-few', L.parseCustom('7').error, 'too-few');
eq('parse out-of-range', L.parseCustom('5, 1000').error, 'out-of-range');
eq('parse too-many', L.parseCustom(Array(101).fill('1').join(',')).error, 'too-many');

// --- Complexity table present for all 5 algorithms ---
ok('5 algorithms in table', Object.keys(L.ALGOS).length === 5);
ok('all have best/avg/worst/space/stable', Object.values(L.ALGOS).every(c => c.best && c.avg && c.worst && c.space && typeof c.stable === 'boolean'));
eq('merge worst', L.ALGOS.merge.worst, 'O(n log n)');
eq('quick worst', L.ALGOS.quick.worst, 'O(n^2)');

console.log(n + ' tests passed');
