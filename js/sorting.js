// sort-visualizer-bd — pure sorting logic (no DOM). Works in Node and browsers.
// Ops replay: start from the input array, apply ops in order, end sorted.
//   {type:'cmp', i, j}  — compare positions i and j (no array change)
//   {type:'swap', i, j} — exchange positions i and j
//   {type:'set', i, value} — write value at position i
//   {type:'pivot', i}   — mark position i as the pivot (no array change)
//   {type:'sorted', i}  — position i is in its final place (no array change)
(function (root) {
  'use strict';

  var ALGOS = {
    bubble:    { best: 'O(n)',   avg: 'O(n^2)', worst: 'O(n^2)', space: 'O(1)', stable: true },
    selection: { best: 'O(n^2)', avg: 'O(n^2)', worst: 'O(n^2)', space: 'O(1)', stable: false },
    insertion: { best: 'O(n)',   avg: 'O(n^2)', worst: 'O(n^2)', space: 'O(1)', stable: true },
    merge:     { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', stable: true },
    quick:     { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n^2)', space: 'O(log n)', stable: false }
  };

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // kind: 'random' | 'nearly' | 'reversed' | 'few' ; size 2..100
  function generateArray(kind, size, seed) {
    if (size < 2 || size > 100 || Math.floor(size) !== size) {
      throw new Error('size must be an integer from 2 to 100');
    }
    var rnd = mulberry32(seed == null ? (Date.now() % 2147483647) : seed);
    var arr = [], i, j, tmp;
    if (kind === 'reversed') {
      for (i = size; i >= 1; i--) arr.push(i);
      return arr;
    }
    if (kind === 'few') {
      var vals = [10, 30, 50, 70, 90];
      for (i = 0; i < size; i++) arr.push(vals[Math.floor(rnd() * vals.length)]);
      return arr;
    }
    for (i = 1; i <= size; i++) arr.push(i);
    // Fisher-Yates shuffle (values 1..size scaled to bar heights later)
    for (i = size - 1; i > 0; i--) {
      j = Math.floor(rnd() * (i + 1));
      tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    if (kind === 'nearly') {
      // Sort, then disturb with a few random swaps (about 10% of size).
      arr.sort(function (a, b) { return a - b; });
      var swaps = Math.max(1, Math.floor(size / 10));
      for (var s = 0; s < swaps; s++) {
        i = Math.floor(rnd() * size); j = Math.floor(rnd() * size);
        tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
      }
    }
    return arr;
  }

  // Parse a custom array: comma/space separated integers, 2..100 values, each 1..999.
  // Returns {ok:true, arr:[...]} or {ok:false, error:'empty'|'bad-number'|'too-few'|'too-many'|'out-of-range'}
  function parseCustom(text) {
    if (text == null || String(text).trim() === '') return { ok: false, error: 'empty' };
    var parts = String(text).split(/[,\s]+/).filter(function (p) { return p !== ''; });
    if (parts.length < 2) return { ok: false, error: 'too-few' };
    if (parts.length > 100) return { ok: false, error: 'too-many' };
    var arr = [];
    for (var i = 0; i < parts.length; i++) {
      if (!/^-?\d+$/.test(parts[i])) return { ok: false, error: 'bad-number' };
      var v = parseInt(parts[i], 10);
      if (v < 1 || v > 999) return { ok: false, error: 'out-of-range' };
      arr.push(v);
    }
    return { ok: true, arr: arr };
  }

  function replay(ops, input) {
    var a = input.slice();
    ops.forEach(function (op) {
      if (op.type === 'swap') { var t = a[op.i]; a[op.i] = a[op.j]; a[op.j] = t; }
      else if (op.type === 'set') { a[op.i] = op.value; }
    });
    return a;
  }

  function isSorted(a) {
    for (var i = 1; i < a.length; i++) if (a[i - 1] > a[i]) return false;
    return true;
  }

  function sortTrace(algo, input) {
    if (!ALGOS[algo]) throw new Error('unknown algorithm: ' + algo);
    var a = input.slice();
    var ops = [];
    var cmp = 0, swaps = 0, writes = 0;
    function doCmp(i, j) { ops.push({ type: 'cmp', i: i, j: j }); cmp++; }
    function doSwap(i, j) {
      if (i === j) return;
      ops.push({ type: 'swap', i: i, j: j }); swaps++;
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    function doSet(i, v) { ops.push({ type: 'set', i: i, value: v }); writes++; a[i] = v; }
    function markSorted(i) { ops.push({ type: 'sorted', i: i }); }

    if (algo === 'bubble') {
      for (var end = a.length - 1; end > 0; end--) {
        var changed = false;
        for (var i = 0; i < end; i++) {
          doCmp(i, i + 1);
          if (a[i] > a[i + 1]) { doSwap(i, i + 1); changed = true; }
        }
        markSorted(end);
        if (!changed) break;
      }
      if (a.length > 0) markSorted(0);
    } else if (algo === 'selection') {
      for (var s = 0; s < a.length - 1; s++) {
        var min = s;
        for (var k = s + 1; k < a.length; k++) { doCmp(k, min); if (a[k] < a[min]) min = k; }
        doSwap(s, min);
        markSorted(s);
      }
      if (a.length > 0) markSorted(a.length - 1);
    } else if (algo === 'insertion') {
      for (var ins = 1; ins < a.length; ins++) {
        var key = a[ins];
        var j = ins - 1;
        while (j >= 0) {
          doCmp(j, ins); // compares a[j] against the held key conceptually; value tracked below
          if (a[j] > key) { doSet(j + 1, a[j]); j--; }
          else break;
        }
        doSet(j + 1, key);
        // Note: cmp ops reference (j, ins) only as a highlight pair; replay ignores cmp.
      }
      for (var m = 0; m < a.length; m++) markSorted(m);
    } else if (algo === 'merge') {
      (function mergeSort(lo, hi) {
        if (hi - lo < 2) return;
        var mid = Math.floor((lo + hi) / 2);
        mergeSort(lo, mid); mergeSort(mid, hi);
        var left = a.slice(lo, mid), right = a.slice(mid, hi);
        var li = 0, ri = 0, p = lo;
        while (li < left.length && ri < right.length) {
          doCmp(lo + li, mid + ri);
          if (left[li] <= right[ri]) doSet(p++, left[li++]);
          else doSet(p++, right[ri++]);
        }
        while (li < left.length) doSet(p++, left[li++]);
        while (ri < right.length) doSet(p++, right[ri++]);
      })(0, a.length);
      for (var mm = 0; mm < a.length; mm++) markSorted(mm);
    } else if (algo === 'quick') {
      (function quickSort(lo, hi) {
        if (lo >= hi) return;
        var pivot = a[hi];
        ops.push({ type: 'pivot', i: hi });
        var p = lo;
        for (var q = lo; q < hi; q++) {
          doCmp(q, hi);
          if (a[q] < pivot) { doSwap(p, q); p++; }
        }
        doSwap(p, hi);
        markSorted(p);
        quickSort(lo, p - 1);
        quickSort(p + 1, hi);
      })(0, a.length - 1);
      if (a.length === 0) { /* nothing */ }
    }
    return { ops: ops, sorted: a, stats: { comparisons: cmp, swaps: swaps, writes: writes } };
  }

  var api = {
    ALGOS: ALGOS, generateArray: generateArray, parseCustom: parseCustom,
    replay: replay, isSorted: isSorted, sortTrace: sortTrace
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SortLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
