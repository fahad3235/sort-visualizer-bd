// sort-visualizer-bd — UI: playback, i18n (EN/বাংলা), rendering. No network calls.
(function () {
  'use strict';
  var L = SortLogic;

  var BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  function bn(n) {
    return String(n).replace(/[0-9]/g, function (d) { return BN_DIGITS[+d]; });
  }
  function fmt(n, lang) { return lang === 'bn' ? bn(n) : String(n); }

  var I18N = {
    en: {
      title: 'Sort Visualizer BD', sub: 'Watch sorting algorithms work, step by step.',
      algo: 'Algorithm', size: 'Array size', speed: 'Speed', gen: 'New array:',
      random: 'Random', nearly: 'Nearly sorted', reversed: 'Reversed', few: 'Few unique',
      custom: 'Custom array (comma-separated numbers)', useCustom: 'Use custom array',
      play: '▶ Play', pause: '⏸ Pause', step: 'Step', reset: 'Reset', skip: 'Skip to end',
      ready: 'Ready — press Play.', running: 'Sorting…', paused: 'Paused.',
      done: 'Sorted! {c} comparisons, {s} swaps / writes.',
      comparisons: 'Comparisons', swaps: 'Swaps / writes', stepLbl: 'Step',
      learn: 'How it works', case: 'Case', time: 'Time', best: 'Best', avg: 'Average',
      worst: 'Worst', space: 'Extra space', stable: 'Stable', yes: 'Yes', no: 'No',
      legend: 'Teal = unsorted · Amber = comparing · Red = swapping / writing · Purple = pivot · Green = in final place',
      foot: 'Offline learning tool. No data leaves your device. Built for students learning data structures — complexity figures are the standard textbook values for each algorithm.',
      errEmpty: 'Type an array first.', errBad: 'Use whole numbers only, separated by commas.',
      errFew: 'Enter at least 2 numbers.', errMany: 'At most 100 numbers allowed.',
      errRange: 'Each number must be from 1 to 999.',
      names: { bubble: 'Bubble Sort', selection: 'Selection Sort', insertion: 'Insertion Sort', merge: 'Merge Sort', quick: 'Quick Sort' },
      blurbs: {
        bubble: 'Bubble Sort compares neighbours and swaps them when they are in the wrong order. The largest value "bubbles up" to the end on every pass.',
        selection: 'Selection Sort finds the smallest value in the unsorted part and moves it to the front, once per pass.',
        insertion: 'Insertion Sort works like sorting playing cards: it takes each new value and slides it into the right place in the sorted part.',
        merge: 'Merge Sort splits the array in half, sorts each half, then merges the sorted halves back together.',
        quick: 'Quick Sort picks a pivot, moves smaller values left and larger values right, then repeats on both sides.'
      }
    },
    bn: {
      title: 'সর্ট ভিজ্যুয়ালাইজার বিডি', sub: 'ধাপে ধাপে দেখুন সর্টিং অ্যালগরিদম কীভাবে কাজ করে।',
      algo: 'অ্যালগরিদম', size: 'অ্যারের আকার', speed: 'গতি', gen: 'নতুন অ্যারে:',
      random: 'এলোমেলো', nearly: 'প্রায় সাজানো', reversed: 'উল্টো', few: 'কম ভিন্ন মান',
      custom: 'নিজের অ্যারে (কমা দিয়ে আলাদা সংখ্যা)', useCustom: 'নিজের অ্যারে ব্যবহার করুন',
      play: '▶ চালান', pause: '⏸ থামান', step: 'এক ধাপ', reset: 'রিসেট', skip: 'শেষে যান',
      ready: 'প্রস্তুত — চালান চাপুন।', running: 'সাজানো চলছে…', paused: 'থেমে আছে।',
      done: 'সাজানো সম্পন্ন! {c} তুলনা, {s} অদলবদল/লেখা।',
      comparisons: 'তুলনা', swaps: 'অদলবদল / লেখা', stepLbl: 'ধাপ',
      learn: 'কীভাবে কাজ করে', case: 'ক্ষেত্র', time: 'সময়', best: 'সেরা', avg: 'গড়',
      worst: 'সবচেয়ে খারাপ', space: 'অতিরিক্ত জায়গা', stable: 'স্থিতিশীল', yes: 'হ্যাঁ', no: 'না',
      legend: 'টিল = অসাজানো · অ্যাম্বার = তুলনা · লাল = অদলবদল / লেখা · বেগুনি = পিভট · সবুজ = চূড়ান্ত স্থানে',
      foot: 'অফলাইন শেখার টুল। কোনো তথ্য আপনার ডিভাইস ছাড়ে না। ডেটা স্ট্রাকচার শেখা শিক্ষার্থীদের জন্য তৈরি — জটিলতার মানগুলো প্রতিটি অ্যালগরিদমের প্রমিত পাঠ্যবই মান।',
      errEmpty: 'একটি অ্যারে লিখুন।', errBad: 'শুধু পূর্ণসংখ্যা দিন (কমা দিয়ে আলাদা করুন)।',
      errFew: 'কমপক্ষে ২টি সংখ্যা দিন।', errMany: 'সর্বোচ্চ ১০০টি সংখ্যা দেওয়া যাবে।',
      errRange: 'প্রতিটি সংখ্যা ১ থেকে ৯৯৯ এর মধ্যে হতে হবে।',
      names: { bubble: 'বাবল সর্ট', selection: 'সিলেকশন সর্ট', insertion: 'ইনসারশন সর্ট', merge: 'মার্জ সর্ট', quick: 'কুইক সর্ট' },
      blurbs: {
        bubble: 'বাবল সর্ট পাশাপাশি দুটি উপাদান তুলনা করে এবং ভুল ক্রমে থাকলে অদলবদল করে। সবচেয়ে বড় মান প্রতিবার শেষে "বুদবুদের মতো" ভেসে ওঠে।',
        selection: 'সিলেকশন সর্ট প্রতিবার অসাজানো অংশের সবচেয়ে ছোট মান খুঁজে সামনে আনে।',
        insertion: 'ইনসারশন সর্ট তাস সাজানোর মতো: প্রতিটি নতুন মানকে আগের সাজানো অংশে সঠিক জায়গায় বসায়।',
        merge: 'মার্জ সর্ট অ্যারেকে অর্ধেক করে ভাগ করে, প্রতিটি অংশ সাজায়, তারপর সাজানো অংশগুলো জোড়া দেয়।',
        quick: 'কুইক সর্ট একটি পিভট বেছে নেয়, ছোট মানগুলো বামে ও বড় মানগুলো ডানে পাঠায়, তারপর দুই পাশে একই কাজ পুনরাবৃত্তি করে।'
      }
    }
  };
  var ERR_KEY = { empty: 'errEmpty', 'bad-number': 'errBad', 'too-few': 'errFew', 'too-many': 'errMany', 'out-of-range': 'errRange' };

  var $ = function (id) { return document.getElementById(id); };
  var lang = 'en';
  try { lang = localStorage.getItem('sortviz-lang') || 'en'; } catch (e) { /* private mode */ }
  if (lang !== 'bn') lang = 'en';

  var input = [], working = [], trace = null, stepIdx = 0;
  var counts = { cmp: 0, swap: 0 };
  var doneSet = {}, hl = null, timer = null, state = 'ready', isCustom = false;

  function t() { return I18N[lang]; }

  function buildTrace() {
    trace = L.sortTrace($('algoSel').value, input);
  }

  function render() {
    var max = Math.max.apply(null, working.concat([1]));
    var bars = $('bars');
    bars.innerHTML = '';
    working.forEach(function (v, i) {
      var d = document.createElement('div');
      d.className = 'bar';
      if (doneSet[i]) d.className += ' done';
      else if (hl && (hl.i === i || hl.j === i)) d.className += hl.cls;
      d.style.height = Math.max(4, Math.round((v / max) * 100)) + '%';
      d.title = fmt(v, lang);
      bars.appendChild(d);
    });
    $('arrayLine').textContent = working.map(function (v) { return fmt(v, lang); }).join(', ');
    $('statCmp').textContent = fmt(counts.cmp, lang);
    $('statSwap').textContent = fmt(counts.swap, lang);
    $('statStep').textContent = fmt(stepIdx, lang) + ' / ' + fmt(trace ? trace.ops.length : 0, lang);
    $('playBtn').textContent = (state === 'running') ? t().pause : t().play;
    $('playBtn').disabled = state === 'done';
    $('stepBtn').disabled = state === 'done' || state === 'running';
    $('skipBtn').disabled = state === 'done';
    var s = t();
    $('status').textContent = state === 'done'
      ? s.done.replace('{c}', fmt(counts.cmp, lang)).replace('{s}', fmt(counts.swap, lang))
      : state === 'running' ? s.running : state === 'paused' ? s.paused : s.ready;
  }

  function applyOp(op) {
    if (op.type === 'cmp') { counts.cmp++; hl = { i: op.i, j: op.j, cls: 'cmp' }; }
    else if (op.type === 'swap') {
      counts.swap++;
      var tmp = working[op.i]; working[op.i] = working[op.j]; working[op.j] = tmp;
      hl = { i: op.i, j: op.j, cls: 'swap' };
    } else if (op.type === 'set') {
      counts.swap++; working[op.i] = op.value;
      hl = { i: op.i, j: op.i, cls: 'swap' };
    } else if (op.type === 'pivot') { hl = { i: op.i, j: op.i, cls: 'pivot' }; }
    else if (op.type === 'sorted') { doneSet[op.i] = true; }
  }

  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

  function resetPlayback() {
    stopTimer();
    working = input.slice();
    stepIdx = 0; counts = { cmp: 0, swap: 0 }; doneSet = {}; hl = null; state = 'ready';
    buildTrace();
    render();
  }

  function finish() {
    stopTimer();
    state = 'done';
    render();
  }

  function stepOnce() {
    if (!trace || stepIdx >= trace.ops.length) { finish(); return; }
    applyOp(trace.ops[stepIdx]);
    stepIdx++;
    if (stepIdx >= trace.ops.length) { finish(); return; }
    render();
  }

  function playPause() {
    if (state === 'done') return;
    if (state === 'running') { stopTimer(); state = 'paused'; render(); return; }
    state = 'running';
    render();
    var speed = parseInt($('speedRange').value, 10);
    var delay = Math.max(40, Math.round(600 / speed));
    timer = setInterval(stepOnce, delay);
  }

  function newArray(kind) {
    var size = parseInt($('sizeRange').value, 10);
    input = L.generateArray(kind, size);
    isCustom = false;
    $('customErr').hidden = true;
    $('customInput').value = '';
    resetPlayback();
  }

  function applyLang() {
    var s = t();
    document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
    $('appTitle').textContent = s.title;
    $('appSub').textContent = s.sub;
    $('langBtn').textContent = lang === 'bn' ? 'English' : 'বাংলা';
    $('lblAlgo').textContent = s.algo;
    $('lblSize').textContent = s.size;
    $('lblSpeed').textContent = s.speed;
    $('lblGen').textContent = s.gen;
    $('genRandom').textContent = s.random;
    $('genNearly').textContent = s.nearly;
    $('genReversed').textContent = s.reversed;
    $('genFew').textContent = s.few;
    $('lblCustom').textContent = s.custom;
    $('customBtn').textContent = s.useCustom;
    $('stepBtn').textContent = s.step;
    $('resetBtn').textContent = s.reset;
    $('skipBtn').textContent = s.skip;
    $('statCmpLbl').textContent = s.comparisons;
    $('statSwapLbl').textContent = s.swaps;
    $('statStepLbl').textContent = s.stepLbl;
    $('learnTitle').textContent = s.learn;
    $('thCase').textContent = s.case;
    $('thTime').textContent = s.time;
    $('tdBest').textContent = s.best;
    $('tdAvg').textContent = s.avg;
    $('tdWorst').textContent = s.worst;
    $('tdSpace').textContent = s.space;
    $('tdStable').textContent = s.stable;
    $('legend').textContent = s.legend;
    $('footNote').textContent = s.foot;
    var sel = $('algoSel');
    ['bubble', 'selection', 'insertion', 'merge', 'quick'].forEach(function (k, i) {
      sel.options[i].textContent = s.names[k];
    });
    var algo = sel.value;
    $('algoBlurb').textContent = s.blurbs[algo];
    var cx = L.ALGOS[algo];
    $('cxBest').textContent = cx.best;
    $('cxAvg').textContent = cx.avg;
    $('cxWorst').textContent = cx.worst;
    $('cxSpace').textContent = cx.space;
    $('cxStable').textContent = cx.stable ? s.yes : s.no;
    $('sizeVal').textContent = fmt($('sizeRange').value, lang);
    $('speedVal').textContent = fmt($('speedRange').value, lang);
    try { localStorage.setItem('sortviz-lang', lang); } catch (e) { /* ignore */ }
    render();
  }

  // Events
  $('langBtn').addEventListener('click', function () {
    lang = lang === 'bn' ? 'en' : 'bn';
    applyLang();
  });
  document.querySelectorAll('.gen-btn').forEach(function (b) {
    b.addEventListener('click', function () { newArray(b.getAttribute('data-kind')); });
  });
  $('sizeRange').addEventListener('input', function () {
    $('sizeVal').textContent = fmt(this.value, lang);
  });
  $('sizeRange').addEventListener('change', function () {
    if (!isCustom) newArray('random');
  });
  $('speedRange').addEventListener('input', function () {
    $('speedVal').textContent = fmt(this.value, lang);
    if (state === 'running') { stopTimer(); playPause(); playPause(); }
  });
  $('algoSel').addEventListener('change', function () { resetPlayback(); applyLang(); });
  $('playBtn').addEventListener('click', playPause);
  $('stepBtn').addEventListener('click', function () {
    if (state === 'running' || state === 'done') return;
    state = 'paused';
    stepOnce();
  });
  $('resetBtn').addEventListener('click', resetPlayback);
  $('skipBtn').addEventListener('click', function () {
    if (!trace || state === 'done') return;
    while (stepIdx < trace.ops.length) { applyOp(trace.ops[stepIdx]); stepIdx++; }
    finish();
  });
  $('customBtn').addEventListener('click', function () {
    var res = L.parseCustom($('customInput').value);
    if (!res.ok) {
      $('customErr').textContent = t()[ERR_KEY[res.error]];
      $('customErr').hidden = false;
      return;
    }
    $('customErr').hidden = true;
    input = res.arr;
    isCustom = true;
    resetPlayback();
  });

  // Init (resetPlayback sets working = input, builds the trace, and renders)
  input = L.generateArray('random', 24, 42);
  resetPlayback();
  applyLang();
})();
