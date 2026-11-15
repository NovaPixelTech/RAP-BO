/* ==========================================================================
   RAP Coach — store
   Local-first state: progress, spaced repetition, examples, streaks.
   ========================================================================== */
(function () {
  'use strict';

  var RC = (window.RC = window.RC || {});
  window.RAP_COACH_CONTENT = window.RAP_COACH_CONTENT || [];

  /* ---------------- content index ---------------- */
  var modules = window.RAP_COACH_CONTENT.slice();
  var lessons = [];
  modules.forEach(function (mod) {
    (mod.lessons || []).forEach(function (lesson) {
      lesson.moduleId = mod.id;
      lesson.moduleTitle = mod.title;
      lesson.index = lessons.length;
      lessons.push(lesson);
    });
  });

  RC.content = {
    modules: modules,
    lessons: lessons,
    lesson: function (id) {
      for (var i = 0; i < lessons.length; i++) if (lessons[i].id === id) return lessons[i];
      return null;
    },
    module: function (id) {
      for (var i = 0; i < modules.length; i++) if (modules[i].id === id) return modules[i];
      return null;
    },
    prevNext: function (id) {
      for (var i = 0; i < lessons.length; i++) {
        if (lessons[i].id === id) {
          return { prev: lessons[i - 1] || null, next: lessons[i + 1] || null };
        }
      }
      return { prev: null, next: null };
    }
  };

  /* ---------------- date helpers ---------------- */
  var DAY = 86400000;
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dayKey(d) {
    var x = d ? new Date(d) : new Date();
    return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate());
  }
  function parseKey(key) {
    var p = String(key).split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function addDays(key, n) {
    var d = parseKey(key);
    d.setDate(d.getDate() + n);
    return dayKey(d);
  }
  function today() { return dayKey(); }
  function diffDays(a, b) { return Math.round((parseKey(b) - parseKey(a)) / DAY); }
  RC.dates = { today: today, dayKey: dayKey, addDays: addDays, diffDays: diffDays, parseKey: parseKey };

  /* ---------------- state ---------------- */
  var KEY = 'rapcoach.v1';
  var VERSION = 1;

  function defaultState() {
    return {
      version: VERSION,
      profile: { name: '' },
      settings: { theme: 'dark', dailyGoal: 10, codeHints: true, newPerDay: 12 },
      lessons: {},
      cards: {},
      customCards: [],
      examples: [],
      streak: { days: [], current: 0, best: 0, last: null },
      activity: {},
      quizLog: [],
      lastRoute: '',
      generator: null
    };
  }

  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

  function load() {
    var base = defaultState();
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
    if (!raw) return base;
    var saved;
    try { saved = JSON.parse(raw); } catch (e) { return base; }
    if (!isObj(saved)) return base;

    base.version = VERSION;
    if (isObj(saved.profile)) base.profile = Object.assign(base.profile, saved.profile);
    if (isObj(saved.settings)) base.settings = Object.assign(base.settings, saved.settings);
    if (isObj(saved.lessons)) base.lessons = saved.lessons;
    if (isObj(saved.cards)) base.cards = saved.cards;
    if (Array.isArray(saved.customCards)) base.customCards = saved.customCards;
    if (Array.isArray(saved.examples)) base.examples = saved.examples;
    if (isObj(saved.streak)) base.streak = Object.assign(base.streak, saved.streak);
    if (isObj(saved.activity)) base.activity = saved.activity;
    if (Array.isArray(saved.quizLog)) base.quizLog = saved.quizLog;
    if (typeof saved.lastRoute === 'string') base.lastRoute = saved.lastRoute;
    if (isObj(saved.generator)) base.generator = saved.generator;
    return base;
  }

  var state = load();
  var listeners = new Set();
  var saveTimer = null;

  function emit() {
    listeners.forEach(function (fn) { try { fn(state); } catch (e) { console.error(e); } });
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.warn('RAP Coach: could not save (storage full or blocked).', e); }
  }
  function save() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 60);
    emit();
  }
  function subscribe(fn) { listeners.add(fn); return function () { listeners.delete(fn); }; }
  function set(fn) { fn(state); save(); }

  /* ---------------- streaks & activity ---------------- */
  function touchActivity(kind) {
    var k = today();
    var act = state.activity[k] || { reviews: 0, quizzes: 0, lessons: 0, minutes: 0 };
    if (kind === 'review') act.reviews++;
    if (kind === 'quiz') act.quizzes++;
    if (kind === 'lesson') act.lessons++;
    state.activity[k] = act;

    var days = state.streak.days || [];
    if (days.indexOf(k) === -1) days.push(k);
    days.sort();
    state.streak.days = days.slice(-400);
    state.streak.last = k;
    state.streak.current = computeCurrent(days);
    state.streak.best = Math.max(state.streak.best || 0, state.streak.current);
  }
  function computeCurrent(days) {
    if (!days.length) return 0;
    var set = {};
    days.forEach(function (d) { set[d] = 1; });
    var k = today();
    if (!set[k]) {
      k = addDays(k, -1);
      if (!set[k]) return 0;
    }
    var n = 0;
    while (set[k]) { n++; k = addDays(k, -1); }
    return n;
  }

  /* ---------------- lessons ---------------- */
  function lessonState(id) {
    if (!state.lessons[id]) {
      state.lessons[id] = { done: false, doneAt: null, quizBest: null, quizAttempts: 0, visits: 0, lastVisit: null, note: '' };
    }
    return state.lessons[id];
  }
  function visitLesson(id) {
    var l = lessonState(id);
    l.visits++;
    l.lastVisit = today();
    save();
  }
  function completeLesson(id, done) {
    var l = lessonState(id);
    var was = l.done;
    l.done = done !== false;
    l.doneAt = l.done ? new Date().toISOString() : null;
    if (l.done && !was) touchActivity('lesson');
    save();
  }
  function recordQuiz(lessonId, pct) {
    var l = lessonState(lessonId);
    l.quizAttempts = (l.quizAttempts || 0) + 1;
    if (l.quizBest == null || pct > l.quizBest) l.quizBest = pct;
    state.quizLog.unshift({ lesson: lessonId, pct: pct, at: new Date().toISOString() });
    state.quizLog = state.quizLog.slice(0, 200);
    touchActivity('quiz');
    save();
  }
  function progress() {
    var done = 0, quizzes = 0, scoreSum = 0, scored = 0;
    lessons.forEach(function (l) {
      var s = state.lessons[l.id];
      if (s && s.done) done++;
      if (s && typeof s.quizBest === 'number') { scoreSum += s.quizBest; scored++; }
      if (s && s.quizBest != null) quizzes++;
    });
    return {
      done: done, total: lessons.length,
      pct: lessons.length ? Math.round((done / lessons.length) * 100) : 0,
      quizzes: quizzes, avgScore: scored ? Math.round(scoreSum / scored) : null
    };
  }
  function moduleProgress(modId) {
    var mod = RC.content.module(modId);
    if (!mod) return { done: 0, total: 0, pct: 0 };
    var total = mod.lessons.length, done = 0;
    mod.lessons.forEach(function (l) {
      if (state.lessons[l.id] && state.lessons[l.id].done) done++;
    });
    return { done: done, total: total, pct: total ? Math.round((done / total) * 100) : 0 };
  }
  function nextLesson() {
    for (var i = 0; i < lessons.length; i++) {
      var s = state.lessons[lessons[i].id];
      if (!s || !s.done) return lessons[i];
    }
    // everything done: revisit the weakest quiz score
    var weakest = null, low = 101;
    lessons.forEach(function (l) {
      var s = state.lessons[l.id];
      var v = s && typeof s.quizBest === 'number' ? s.quizBest : 0;
      if (v < low) { low = v; weakest = l; }
    });
    return weakest || lessons[0] || null;
  }

  /* ---------------- spaced repetition ---------------- */
  function newCard() {
    return { ease: 2.5, interval: 0, due: today(), reps: 0, lapses: 0, last: null };
  }
  function lessonCards(lesson) {
    var out = [];
    (lesson.keyPoints || []).forEach(function (kp, i) {
      var front = typeof kp === 'string' ? kp : kp.front;
      var back = typeof kp === 'string' ? '' : (kp.back || '');
      out.push({
        id: 'kp:' + lesson.id + ':' + i,
        front: front, back: back,
        tags: [lesson.moduleTitle],
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        kind: 'lesson'
      });
    });
    return out;
  }
  function allCards() {
    var out = [];
    lessons.forEach(function (l) { out = out.concat(lessonCards(l)); });
    state.customCards.forEach(function (c) {
      out.push({ id: 'uc:' + c.id, front: c.front, back: c.back, tags: c.tags || [], kind: 'custom', customId: c.id });
    });
    state.examples.forEach(function (ex) {
      if (ex.makeCard === false) return;
      out.push({
        id: 'ex:' + ex.id,
        front: 'Recall your example: “' + ex.title + '”\n\nExplain its structure, key statements, and why it works.',
        back: ex.notes || 'No notes yet. Open the example, read it, then write a 2–3 sentence explanation in Notes — that is your answer.',
        tags: (ex.tags || []).concat(['my example']),
        kind: 'example', exampleId: ex.id
      });
    });
    return out;
  }
  function cardState(id) { return state.cards[id] || null; }
  function cardInfo(id) {
    var c = state.cards[id];
    if (!c) return { status: 'new', due: null, interval: 0 };
    if (c.due <= today()) return { status: 'due', due: c.due, interval: c.interval };
    return { status: 'later', due: c.due, interval: c.interval };
  }
  function gradeCard(id, grade) {
    var c = state.cards[id];
    if (!c) { c = state.cards[id] = newCard(); }
    var g = Math.max(0, Math.min(3, Number(grade)));
    if (g === 0) {
      c.lapses++;
      c.reps = 0;
      c.ease = Math.max(1.3, c.ease - 0.2);
      c.interval = 0;
      c.due = today();
    } else if (g === 1) {
      c.reps++;
      c.ease = Math.max(1.3, c.ease - 0.15);
      c.interval = c.interval < 1 ? 1 : Math.max(2, Math.round(c.interval * 1.2));
      c.due = addDays(today(), c.interval);
    } else if (g === 2) {
      c.reps++;
      c.interval = c.interval < 1 ? 1 : Math.max(2, Math.round(c.interval * c.ease));
      c.due = addDays(today(), c.interval);
    } else {
      c.reps++;
      c.ease = Math.min(3.2, c.ease + 0.1);
      c.interval = c.interval < 1 ? 4 : Math.max(3, Math.round(c.interval * c.ease * 1.3));
      c.due = addDays(today(), c.interval);
    }
    c.last = today();
    touchActivity('review');
    save();
    return c;
  }
  function dueQueue(opts) {
    opts = opts || {};
    var t = today();
    var all = allCards().map(function (card) {
      var st = state.cards[card.id];
      card.srs = st || null;
      card.status = !st ? 'new' : (st.due <= t ? 'due' : 'later');
      return card;
    }).filter(function (c) {
      if (opts.kind && c.kind !== opts.kind) return false;
      if (opts.lessonId && c.lessonId !== opts.lessonId) return false;
      return c.status !== 'later';
    });
    var fresh = all.filter(function (c) { return c.status === 'new'; });
    var seen = all.filter(function (c) { return c.status === 'due'; });
    // new-card throttle for the day
    var limit = state.settings.newPerDay || 12;
    var introducedToday = 0;
    Object.keys(state.cards).forEach(function (id) {
      var c = state.cards[id];
      if (c && c.last === t && (c.reps || 0) === 0 && (c.lapses || 0) === 0) introducedToday++;
    });
    var allowance = Math.max(0, limit - introducedToday);
    var queue = seen.concat(fresh.slice(0, allowance));
    // deterministic but varied order
    queue.sort(function (a, b) {
      if (a.status !== b.status) return a.status === 'due' ? -1 : 1;
      var ad = a.srs ? a.srs.due : '0000-00-00';
      var bd = b.srs ? b.srs.due : '0000-00-00';
      if (ad !== bd) return ad < bd ? -1 : 1;
      return a.id < b.id ? -1 : 1;
    });
    return queue;
  }
  function cardStats() {
    var all = allCards();
    var t = today();
    var due = 0, fresh = 0, later = 0, learning = 0;
    all.forEach(function (c) {
      var s = state.cards[c.id];
      if (!s) fresh++;
      else if (s.due <= t) { due++; if (s.reps > 0) learning++; }
      else later++;
    });
    // New cards are throttled per day; report what is actually actionable now.
    var limit = state.settings.newPerDay == null ? 12 : state.settings.newPerDay;
    var introducedToday = 0;
    Object.keys(state.cards).forEach(function (id) {
      var c = state.cards[id];
      if (c && c.last === t && (c.reps || 0) === 0 && (c.lapses || 0) === 0) introducedToday++;
    });
    var allowance = Math.max(0, limit - introducedToday);
    return {
      total: all.length,
      due: due + Math.min(fresh, allowance),
      seenDue: due,
      fresh: fresh,
      later: later,
      learning: learning,
      allowance: allowance
    };
  }

  /* ---------------- custom cards ---------------- */
  function addCustomCard(front, back, tags) {
    var c = { id: uid('c'), front: front, back: back, tags: tags || [], createdAt: new Date().toISOString() };
    state.customCards.unshift(c);
    save();
    return c;
  }
  function updateCustomCard(id, patch) {
    var c = state.customCards.find(function (x) { return x.id === id; });
    if (!c) return;
    Object.assign(c, patch);
    save();
  }
  function deleteCustomCard(id) {
    state.customCards = state.customCards.filter(function (x) { return x.id !== id; });
    delete state.cards['uc:' + id];
    save();
  }

  /* ---------------- examples ---------------- */
  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function addExample(data) {
    var ex = {
      id: uid('ex'),
      title: (data.title || 'Untitled example').trim(),
      code: data.code || '',
      notes: data.notes || '',
      tags: data.tags || [],
      lessonId: data.lessonId || '',
      makeCard: data.makeCard !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    state.examples.unshift(ex);
    save();
    return ex;
  }
  function updateExample(id, patch) {
    var ex = state.examples.find(function (x) { return x.id === id; });
    if (!ex) return null;
    Object.assign(ex, patch, { updatedAt: new Date().toISOString() });
    if (ex.makeCard === false) delete state.cards['ex:' + id];
    save();
    return ex;
  }
  function deleteExample(id) {
    state.examples = state.examples.filter(function (x) { return x.id !== id; });
    delete state.cards['ex:' + id];
    save();
  }
  function example(id) {
    return state.examples.find(function (x) { return x.id === id; }) || null;
  }

  /* ---------------- data portability ---------------- */
  function exportData() {
    return JSON.stringify({
      app: 'RAP Coach',
      exportedAt: new Date().toISOString(),
      state: state
    }, null, 2);
  }
  function importData(text) {
    var parsed = JSON.parse(text);
    var incoming = parsed && parsed.state ? parsed.state : parsed;
    if (!isObj(incoming)) throw new Error('Not a RAP Coach backup.');
    var merged = defaultState();
    ['profile', 'settings', 'lessons', 'cards', 'activity', 'generator'].forEach(function (k) {
      if (isObj(incoming[k])) merged[k] = incoming[k];
    });
    ['customCards', 'examples', 'quizLog'].forEach(function (k) {
      if (Array.isArray(incoming[k])) merged[k] = incoming[k];
    });
    if (isObj(incoming.streak)) merged.streak = incoming.streak;
    state = merged;
    save();
    return true;
  }
  function resetProgress() {
    state.lessons = {};
    state.cards = {};
    state.quizLog = [];
    state.activity = {};
    state.streak = { days: [], current: 0, best: 0, last: null };
    save();
  }
  function resetAll() {
    state = defaultState();
    save();
  }
  function setSetting(key, value) {
    state.settings[key] = value;
    save();
  }
  function setProfile(patch) {
    Object.assign(state.profile, patch);
    save();
  }
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.settings.theme === 'light' ? 'light' : 'dark');
  }
  function toggleTheme() {
    state.settings.theme = state.settings.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    save();
  }

  RC.store = {
    get state() { return state; },
    subscribe: subscribe,
    save: save,
    persist: persist,
    set: set,
    touchActivity: touchActivity,
    // lessons
    lessonState: lessonState,
    visitLesson: visitLesson,
    completeLesson: completeLesson,
    recordQuiz: recordQuiz,
    progress: progress,
    moduleProgress: moduleProgress,
    nextLesson: nextLesson,
    // cards
    allCards: allCards,
    lessonCards: lessonCards,
    cardState: cardState,
    cardInfo: cardInfo,
    gradeCard: gradeCard,
    dueQueue: dueQueue,
    cardStats: cardStats,
    addCustomCard: addCustomCard,
    updateCustomCard: updateCustomCard,
    deleteCustomCard: deleteCustomCard,
    // examples
    addExample: addExample,
    updateExample: updateExample,
    deleteExample: deleteExample,
    example: example,
    uid: uid,
    // misc
    exportData: exportData,
    importData: importData,
    resetProgress: resetProgress,
    resetAll: resetAll,
    setSetting: setSetting,
    setProfile: setProfile,
    applyTheme: applyTheme,
    toggleTheme: toggleTheme
  };

  applyTheme();
})();
