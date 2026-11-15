/* ==========================================================================
   RAP Coach — views
   Every route returns { html, meta, mount }. Mount binds events to the
   already-rendered markup; nothing here re-renders on store changes.
   ========================================================================== */
(function () {
  'use strict';

  var RC = window.RC;
  var esc = RC.ui.esc;
  var inline = RC.ui.inline;
  var icon = RC.ui.icon;

  /* ---------------- small helpers ---------------- */
  function id(x) { return document.getElementById(x); }
  function attr(s) { return esc(String(s == null ? '' : s)); }
  function num(n) { return Number(n) || 0; }
  function plural(n, one, many) { return n === 1 ? one : (many || one + 's'); }
  function minutes(n) { return n ? n + ' min' : ''; }

  function meta(active, title, crumbs) {
    return { active: active, title: title, crumbs: crumbs || [{ label: title }] };
  }

  function pageHead(o) {
    return '<div class="page-head">' +
      (o.eyebrow ? '<div class="eyebrow">' + esc(o.eyebrow) + '</div>' : '') +
      '<h1 class="page-title">' + esc(o.title || '') + '</h1>' +
      (o.sub ? '<p class="page-sub">' + inline(o.sub) + '</p>' : '') +
      (o.actions ? '<div class="page-actions">' + o.actions + '</div>' : '') +
      '</div>';
  }

  function tabsHtml(name, items, active) {
    return '<div class="tabs" data-tabs role="tablist" aria-label="' + attr(name) + '">' +
      items.map(function (it) {
        return '<button class="tab' + (it.id === active ? ' active' : '') + '" type="button" role="tab" ' +
          'aria-selected="' + (it.id === active ? 'true' : 'false') + '" data-tab="' + attr(it.id) + '">' +
          esc(it.label) + (it.n != null ? '<span class="n">' + esc(it.n) + '</span>' : '') +
          '</button>';
      }).join('') + '</div>';
  }

  function bindTabs(root, storageKey, refresh) {
    var wrap = root.querySelector('[data-tabs]');
    if (!wrap) return;
    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-tab]');
      if (!btn) return;
      RC.views[storageKey] = btn.getAttribute('data-tab');
      if (refresh) refresh();
      else RC.app.refresh();
    });
  }

  function notFound(message) {
    return {
      html: '<div style="padding-top:40px">' + RC.ui.empty({
        icon: '◇',
        title: 'Nothing here',
        text: message || 'That page does not exist. Try the dashboard or the command palette.',
        action: '<a class="btn btn-primary" href="#/home" style="margin-top:16px">Back to dashboard</a>'
      }) + '</div>',
      meta: meta('home', 'Not found', [{ label: 'Not found' }]),
      mount: function () {}
    };
  }

  function allLessons() { return RC.content.lessons; }

  function levelBadge(level) { return level ? RC.ui.badge(level) : ''; }

  function questionPool(lesson) {
    return (lesson.quiz || []).map(function (q, i) {
      return {
        q: q.q, options: q.options, answer: q.answer, why: q.why,
        lessonId: lesson.id, lessonTitle: lesson.title, n: i
      };
    });
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ====================================================================== */
  /* HOME                                                                   */
  /* ====================================================================== */
  function home() {
    var st = RC.store.state;
    var p = RC.store.progress();
    var cards = RC.store.cardStats();
    var next = RC.store.nextLesson();
    var streak = st.streak.current || 0;
    var today = RC.dates.today();
    var act = st.activity[today] || { reviews: 0, quizzes: 0, lessons: 0 };
    var goal = st.settings.dailyGoal || 10;
    var doneToday = num(act.reviews) + num(act.quizzes) + num(act.lessons);

    var hello = st.profile.name ? ('Welcome back, ' + st.profile.name.split(/\s+/)[0] + '.') : 'Welcome back.';

    /* week chart */
    var days = [];
    for (var i = 6; i >= 0; i--) days.push(RC.dates.addDays(today, -i));
    var weekBars = days.map(function (d) {
      var a = st.activity[d] || {};
      var n = num(a.reviews) + num(a.quizzes) + num(a.lessons);
      var cls = n > 0 ? 'on' : '';
      if (d === today) cls += ' today';
      return '<i class="' + cls.trim() + '" title="' + attr(d + ' · ' + n + ' activities') + '"></i>';
    }).join('');
    var weekDays = days.map(function (d) {
      var label = RC.dates.parseKey(d).toLocaleDateString(undefined, { weekday: 'narrow' });
      return '<span>' + esc(label) + '</span>';
    }).join('');

    var nextCard = '';
    if (next) {
      nextCard = '<a class="next-card" href="#/lesson/' + attr(next.id) + '" style="text-decoration:none;color:inherit">' +
        '<div class="card-icon" style="width:44px;height:44px;font-size:18px">' + icon('play') + '</div>' +
        '<div class="nc-body"><div class="card-kicker">' + (p.done === p.total ? 'Revisit the weakest area' : 'Up next') + '</div>' +
        '<div class="nc-title">' + esc(next.title) + '</div>' +
        '<div class="nc-sub">' + esc(next.moduleTitle) + ' · ' + minutes(next.minutes) + ' · ' + esc(next.summary) + '</div></div>' +
        '<span class="btn btn-primary btn-sm">' + (p.done === p.total ? 'Review' : 'Continue') + '</span></a>';
    }

    var moduleCards = RC.content.modules.map(function (m, idx) {
      var mp = RC.store.moduleProgress(m.id);
      return '<a class="card card-link" href="#/learn" data-module="' + attr(m.id) + '">' +
        '<div class="card-kicker">Module ' + pad2(idx + 1) + '</div>' +
        '<div class="card-title">' + esc(m.title) + '</div>' +
        '<div class="card-sub">' + esc(m.tagline || '') + '</div>' +
        '<div class="meta-row" style="margin-top:12px"><span>' + mp.done + '/' + mp.total + ' lessons</span><span class="mono">' + mp.pct + '%</span></div>' +
        RC.ui.progress(mp.pct, 'sm') + '</a>';
    }).join('');

    var html =
      '<div class="hero">' +
        '<div>' +
          '<div class="eyebrow">SAP RAP BO · local-first trainer</div>' +
          '<h1>' + esc(hello) + ' Build the mental model, then build the BO.</h1>' +
          '<p>Twenty-seven short lessons, spaced-repetition cards, quizzes, a RAP scaffolder and a place for your own code. Everything is stored in this browser.</p>' +
          '<div class="page-actions">' +
            (next ? '<a class="btn btn-primary" href="#/lesson/' + attr(next.id) + '">' + icon('play') + ' Continue studying</a>' : '') +
            '<a class="btn" href="#/practice">' + icon('cards') + ' Review ' + cards.due + ' ' + plural(cards.due, 'card') + '</a>' +
            '<a class="btn btn-ghost" href="#/lab">' + icon('lab') + ' Open the lab</a>' +
          '</div>' +
        '</div>' +
        '<div class="hero-side">' +
          '<div class="ring-wrap">' + RC.ui.ring(p.pct, '<b>' + p.done + ' of ' + p.total + ' lessons</b>complete') + '</div>' +
          '<div class="grid grid-2">' +
            '<div class="stat"><span class="stat-value">' + streak + '</span><span class="stat-label">day streak</span></div>' +
            '<div class="stat"><span class="stat-value">' + cards.due + '</span><span class="stat-label">cards due</span></div>' +
            '<div class="stat"><span class="stat-value">' + (p.avgScore == null ? '—' : p.avgScore + '%') + '</span><span class="stat-label">avg quiz</span></div>' +
            '<div class="stat"><span class="stat-value">' + st.examples.length + '</span><span class="stat-label">your examples</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="dash-grid">' +
        '<div>' +
          '<div class="sec-title">Pick up where you left off <span class="count">' + doneToday + ' activities today</span></div>' +
          (nextCard || RC.ui.empty({ icon: '✓', title: 'Curriculum complete', text: 'Everything is marked done. Use Practice to keep it fresh.' })) +
          '<div class="cont">' +
            '<a class="card card-link" href="#/practice"><div class="card-top"><div class="card-icon">' + icon('cards') + '</div>' +
              '<div><div class="card-title">Spaced repetition</div><div class="card-sub">' + cards.due + ' cards ready · ' + cards.total + ' in your deck</div></div></div></a>' +
            '<a class="card card-link" href="#/lab"><div class="card-top"><div class="card-icon">' + icon('lab') + '</div>' +
              '<div><div class="card-title">Scaffold a BO</div><div class="card-sub">Generate CDS, behavior, service and table skeletons in seconds</div></div></div></a>' +
            '<a class="card card-link" href="#/examples"><div class="card-top"><div class="card-icon">' + icon('folder') + '</div>' +
              '<div><div class="card-title">Your examples</div><div class="card-sub">' + (st.examples.length ? st.examples.length + ' saved · turn them into cards' : 'Save your own BO code and notes') + '</div></div></div></a>' +
            '<a class="card card-link" href="#/troubleshoot"><div class="card-top"><div class="card-icon">' + icon('lifebuoy') + '</div>' +
              '<div><div class="card-title">Troubleshooting</div><div class="card-sub">' + RC.reference.troubleshooting.length + ' symptoms, causes and fixes</div></div></div></a>' +
          '</div>' +
        '</div>' +
        '<div class="grid">' +
          '<div class="panel goal-card">' +
            '<div class="goal-head"><div><div class="card-kicker">Daily goal</div><b style="font-size:16px">' + doneToday + ' / ' + goal + '</b></div>' +
              '<span class="badge accent">' + Math.min(100, Math.round((doneToday / goal) * 100)) + '%</span></div>' +
            '<div class="week">' + weekBars + '</div>' +
            '<div class="week-days">' + weekDays + '</div>' +
            '<div class="tiny muted">Reviews, quizzes and completed lessons all count. Small sessions win.</div>' +
            '<a class="btn btn-primary btn-sm" href="#/practice">Start a review</a>' +
          '</div>' +
          '<div class="panel">' +
            '<div class="goal-head"><div class="card-kicker">Today</div><span class="badge">' + RC.ui.relDay(today) + '</span></div>' +
            '<div class="kv"><span>Card reviews</span><b>' + num(act.reviews) + '</b></div>' +
            '<div class="kv"><span>Quizzes</span><b>' + num(act.quizzes) + '</b></div>' +
            '<div class="kv"><span>Lessons completed</span><b>' + num(act.lessons) + '</b></div>' +
            '<div class="kv"><span>Best streak</span><b>' + (st.streak.best || 0) + ' days</b></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="sec-title">The curriculum <span class="count">6 modules · ' + allLessons().length + ' lessons</span></div>' +
      '<div class="grid grid-3">' + moduleCards + '</div>';

    return {
      html: html,
      meta: meta('home', 'Dashboard', [{ label: 'Dashboard' }]),
      mount: function (root) {
        root.querySelectorAll('[data-module]').forEach(function (a) {
          a.addEventListener('click', function (e) {
            e.preventDefault();
            RC.views.learnFocus = a.getAttribute('data-module');
            RC.ui.go('learn');
          });
        });
      }
    };
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /* ====================================================================== */
  /* LEARN                                                                  */
  /* ====================================================================== */
  function learn() {
    var modules = RC.content.modules;
    var html = pageHead({
      eyebrow: 'Curriculum',
      title: 'Learn RAP from the model up',
      sub: 'Six modules, ordered so every lesson only needs the ones before it. Filter by topic, level or keyword.',
      actions: '<a class="btn" href="#/practice">' + icon('cards') + ' Practice deck</a>' +
        '<a class="btn btn-ghost" href="#/reference">' + icon('openbook') + ' Reference</a>'
    }) +
      '<div class="panel" style="padding:14px;margin-bottom:22px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">' +
        '<input class="input" id="learnSearch" type="search" placeholder="Search lessons, tags, summaries…" style="max-width:380px" aria-label="Search lessons">' +
        '<select class="select" id="learnLevel" style="max-width:170px" aria-label="Filter by level">' +
          '<option value="">All levels</option><option value="beginner">Beginner</option>' +
          '<option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select>' +
        '<span class="spacer"></span><span class="tiny muted" id="learnCount"></span>' +
      '</div>' +
      '<div id="learnList">' + renderLearnList(modules, '', '') + '</div>';

    return {
      html: html,
      meta: meta('learn', 'Learn', [{ label: 'Learn' }]),
      mount: function (root) {
        var search = id('learnSearch');
        var level = id('learnLevel');
        function apply() {
          var q = (search.value || '').toLowerCase().trim();
          var lv = level.value;
          var list = id('learnList');
          list.innerHTML = renderLearnList(modules, q, lv);
          var visible = list.querySelectorAll('.lesson-row').length;
          id('learnCount').textContent = visible + ' of ' + allLessons().length + ' lessons';
        }
        search.addEventListener('input', apply);
        level.addEventListener('change', apply);
        apply();

        if (RC.views.learnFocus) {
          var target = root.querySelector('[data-module-block="' + RC.views.learnFocus + '"]');
          RC.views.learnFocus = null;
          if (target) setTimeout(function () { target.scrollIntoView({ block: 'start' }); }, 0);
        }
      }
    };
  }

  function renderLearnList(modules, q, level) {
    var out = '';
    modules.forEach(function (mod, idx) {
      var lessons = (mod.lessons || []).filter(function (l) {
        if (level && l.level !== level) return false;
        if (!q) return true;
        var blob = [l.title, l.summary, (l.tags || []).join(' '), mod.title].join(' ').toLowerCase();
        return blob.indexOf(q) >= 0;
      });
      if (!lessons.length) return;
      var mp = RC.store.moduleProgress(mod.id);
      out += '<div class="module" data-module-block="' + attr(mod.id) + '">' +
        '<div class="module-head">' +
          '<div class="module-num">' + pad2(idx + 1) + '</div>' +
          '<div style="min-width:0"><div class="module-title">' + esc(mod.title) + '</div>' +
            '<div class="module-sub">' + esc(mod.tagline || '') + '</div></div>' +
          '<div class="module-progress"><div class="meta-row"><span>' + mp.done + '/' + mp.total + ' done</span><span class="mono">' + mp.pct + '%</span></div>' +
            RC.ui.progress(mp.pct, 'sm') + '</div>' +
        '</div>' +
        '<div class="lesson-list">' + lessons.map(function (l) {
          var st = RC.store.state.lessons[l.id] || {};
          var done = !!st.done;
          return '<a class="lesson-row' + (done ? ' done' : '') + '" href="#/lesson/' + attr(l.id) + '">' +
            '<span class="dot">' + (done ? '✓' : '') + '</span>' +
            '<span class="l-main"><span class="l-title">' + esc(l.title) + '</span>' +
              '<span class="l-sub">' + esc(l.summary) + '</span></span>' +
            '<span class="l-right">' +
              (st.quizBest != null ? '<span class="quiz-score">' + st.quizBest + '%</span>' : '') +
              levelBadge(l.level) +
              '<span class="tiny muted nowrap">' + minutes(l.minutes) + '</span>' +
            '</span></a>';
        }).join('') + '</div></div>';
    });
    if (!out) {
      return RC.ui.empty({
        icon: '⌕', title: 'No lessons match',
        text: 'Try a broader search term, or clear the level filter.',
        action: '<button class="btn btn-sm" type="button" onclick="document.getElementById(\'learnSearch\').value=\'\';document.getElementById(\'learnLevel\').value=\'\';document.getElementById(\'learnSearch\').dispatchEvent(new Event(\'input\'))" style="margin-top:12px">Clear filters</button>'
      });
    }
    return out;
  }

  /* ====================================================================== */
  /* LESSON                                                                 */
  /* ====================================================================== */
  function lessonView(param) {
    var lesson = RC.content.lesson(param);
    if (!lesson) return notFound('That lesson does not exist. It may have been renamed.');

    var st = RC.store.lessonState(lesson.id);
    var rendered = RC.ui.renderSections(lesson.sections);
    var nav = RC.content.prevNext(lesson.id);
    var cards = RC.store.lessonCards(lesson);
    var mod = RC.content.module(lesson.moduleId);

    var toc = rendered.toc.length
      ? '<div class="aside-card"><h3>On this page</h3><div class="toc">' +
        rendered.toc.map(function (t) {
          return '<a href="#' + t.id + '" data-scroll="' + t.id + '">' + esc(t.text) + '</a>';
        }).join('') + '</div></div>'
      : '';

    var resources = (lesson.resources || []).length
      ? '<div class="aside-card"><h3>Go deeper</h3><ul class="aside-list">' +
        lesson.resources.map(function (r) {
          return '<li><a href="' + attr(r.url) + '" target="_blank" rel="noopener">' + esc(r.label) + ' ↗</a></li>';
        }).join('') + '</ul></div>'
      : '';

    var aside =
      toc +
      '<div class="aside-card"><h3>Study this lesson</h3>' +
        '<div class="kv"><span>Recall cards</span><b>' + cards.length + '</b></div>' +
        '<div class="kv"><span>Quiz best</span><b>' + (st.quizBest == null ? '—' : st.quizBest + '%') + '</b></div>' +
        '<div class="kv"><span>Visits</span><b>' + (st.visits || 0) + '</b></div>' +
        '<a class="btn btn-primary btn-sm" style="margin-top:11px;width:100%" href="#/practice">Review cards</a>' +
        '<a class="btn btn-sm" style="margin-top:7px;width:100%" href="#/quiz/' + attr(lesson.id) + '">Take the quiz</a>' +
      '</div>' +
      '<div class="aside-card"><h3>Your note</h3>' +
        '<textarea class="textarea mono" id="lessonNote" style="min-height:120px;font-size:12px" placeholder="Explain this in your own words. What surprised you? What will you try at work?">' + esc(st.note || '') + '</textarea>' +
        '<div class="hint tiny" style="margin-top:6px">Saved locally when you leave the field. Your note becomes part of your example recall later.</div>' +
      '</div>' +
      resources;

    var prevNext =
      '<div class="lesson-nav">' +
        (nav.prev ? '<a href="#/lesson/' + attr(nav.prev.id) + '"><span class="dir">← Previous</span>' + esc(nav.prev.title) + '</a>' : '<span></span>') +
        (nav.next ? '<a class="next" href="#/lesson/' + attr(nav.next.id) + '"><span class="dir">Next →</span>' + esc(nav.next.title) + '</a>' : '<span></span>') +
      '</div>';

    var html =
      '<div class="lesson-head">' +
        '<div class="eyebrow"><a href="#/learn">' + esc(lesson.moduleTitle) + '</a></div>' +
        '<h1>' + esc(lesson.title) + '</h1>' +
        '<div class="lesson-meta">' +
          levelBadge(lesson.level) +
          '<span>' + icon('clock') + ' ' + minutes(lesson.minutes) + '</span>' +
          (lesson.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') +
          (st.done ? '<span class="badge" style="color:var(--green);border-color:rgba(98,211,146,.3)">Completed</span>' : '') +
        '</div>' +
        '<p class="page-sub">' + inline(lesson.summary) + '</p>' +
      '</div>' +
      '<div class="lesson-layout">' +
        '<div><div class="lesson-body prose">' + rendered.html + '</div>' +
          '<div class="complete-bar"><div class="txt"><b>' + (st.done ? 'You have completed this lesson.' : 'Finished reading?') + '</b>' +
            '<p>' + (st.done ? 'Nice. Keep it by reviewing the cards, not by re-reading.' : 'Mark it done to track progress — then retrieve it with the cards.') + '</p></div>' +
            '<button class="btn ' + (st.done ? 'btn-ghost' : 'btn-primary') + '" type="button" id="lessonDone">' +
              (st.done ? 'Undo completion' : 'Mark as complete') + '</button>' +
            '<a class="btn" href="#/quiz/' + attr(lesson.id) + '">' + icon('quiz') + ' Quiz</a>' +
          '</div>' +
          prevNext +
        '</div>' +
        '<aside class="lesson-aside">' + aside + '</aside>' +
      '</div>';

    return {
      html: html,
      meta: meta('learn', lesson.title, [
        { label: 'Learn', href: '#/learn' },
        { label: lesson.moduleTitle || mod.title, href: '#/learn' },
        { label: lesson.title }
      ]),
      mount: function (root) {
        var last = RC.store.lessonState(lesson.id).lastVisit;
        if (last !== RC.dates.today()) RC.store.visitLesson(lesson.id);

        var doneBtn = id('lessonDone');
        if (doneBtn) {
          doneBtn.addEventListener('click', function () {
            var cur = RC.store.lessonState(lesson.id);
            RC.store.completeLesson(lesson.id, !cur.done);
            RC.app.refresh();
            RC.ui.toast(cur.done ? 'Lesson marked complete' : 'Marked as not complete');
          });
        }

        var note = id('lessonNote');
        if (note) {
          note.addEventListener('change', function () {
            RC.store.lessonState(lesson.id).note = note.value;
            RC.store.save();
            RC.ui.toast('Note saved');
          });
        }

        root.querySelectorAll('[data-scroll]').forEach(function (a) {
          a.addEventListener('click', function (e) {
            e.preventDefault();
            var el = document.getElementById(a.getAttribute('data-scroll'));
            if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
          });
        });
      }
    };
  }

  /* ====================================================================== */
  /* QUIZ                                                                   */
  /* ====================================================================== */
  function quizView(param) {
    var mix = !param || param === 'mix';
    var lesson = mix ? null : RC.content.lesson(param);
    if (!mix && !lesson) return notFound('That lesson has no quiz.');

    var questions;
    if (mix) {
      var pool = [];
      allLessons().forEach(function (l) { pool = pool.concat(questionPool(l)); });
      questions = shuffle(pool).slice(0, 12);
    } else {
      questions = questionPool(lesson);
    }

    if (!questions.length) {
      return {
        html: '<div style="padding-top:40px">' + RC.ui.empty({
          icon: '?', title: 'No quiz yet',
          text: 'This lesson has no quiz questions. Try the mixed quiz instead.',
          action: '<a class="btn btn-primary" href="#/quiz/mix" style="margin-top:16px">Mixed quiz</a>'
        }) + '</div>',
        meta: meta('learn', 'Quiz', [{ label: 'Learn', href: '#/learn' }, { label: 'Quiz' }]),
        mount: function () {}
      };
    }

    var target = mix ? 'mix' : lesson.id;
    var title = mix ? 'Mixed quiz · 12 questions' : 'Quiz · ' + lesson.title;

    var html =
      '<div class="quiz-wrap">' +
        '<div class="practice-top">' +
          '<a class="btn btn-ghost btn-sm" href="' + (mix ? '#/practice' : '#/lesson/' + attr(lesson.id)) + '">← Exit quiz</a>' +
          '<span class="muted tiny">' + esc(mix ? 'Questions from every module' : lesson.moduleTitle) + '</span>' +
          '<span class="spacer"></span><span class="tiny muted" id="quizCounter"></span>' +
        '</div>' +
        '<div class="quiz-progress" id="quizProgress"></div>' +
        '<div id="quizBody"></div>' +
      '</div>';

    return {
      html: html,
      meta: meta('learn', mix ? 'Mixed quiz' : 'Quiz', [
        { label: 'Learn', href: '#/learn' },
        { label: mix ? 'Mixed quiz' : lesson.title, href: mix ? '#/quiz/mix' : '#/lesson/' + lesson.id },
        { label: 'Quiz' }
      ]),
      mount: function () {
        var idx = 0;
        var answered = false;
        var answers = questions.map(function () { return null; });
        var recorded = false;

        function progressHtml() {
          return questions.map(function (q, i) {
            var cls = '';
            if (answers[i] == null) cls = i === idx ? 'now' : '';
            else cls = answers[i] === q.answer ? 'ok' : 'miss';
            return '<i class="' + cls + '"></i>';
          }).join('');
        }

        function counter() {
          var c = id('quizCounter');
          if (c) c.textContent = 'Question ' + Math.min(idx + 1, questions.length) + ' of ' + questions.length;
        }

        function current() { return questions[idx]; }

        function renderQuestion() {
          answered = answers[idx] != null;
          var q = current();
          var body = id('quizBody');
          var prog = id('quizProgress');
          if (prog) prog.innerHTML = progressHtml();
          counter();

          var opts = q.options.map(function (o, i) {
            var cls = 'option' + (answered ? ' locked' : '');
            if (answered) {
              if (i === q.answer) cls += ' correct';
              else if (i === answers[idx]) cls += ' wrong';
            }
            return '<button type="button" class="' + cls + '" data-opt="' + i + '">' +
              '<span class="letter">' + String.fromCharCode(65 + i) + '</span><span>' + inline(o) + '</span></button>';
          }).join('');

          var feedback = '';
          if (answered) {
            var ok = answers[idx] === q.answer;
            feedback = '<div class="quiz-explain ' + (ok ? 'good' : 'bad') + '">' +
              '<b>' + (ok ? 'Correct' : 'Not quite') + '</b>' +
              inline(q.why || '') +
              (ok ? '' : '<div style="margin-top:6px;color:var(--muted)">Correct answer: <strong>' + inline(q.options[q.answer]) + '</strong></div>') +
              '</div>';
          }

          body.innerHTML =
            '<div class="card">' +
              '<div class="quiz-q">' + inline(q.q) + '</div>' +
              '<div class="options">' + opts + '</div>' +
              feedback +
            '</div>' +
            '<div class="quiz-foot">' +
              '<span class="tiny muted">' + (answered ? (idx === questions.length - 1 ? 'Last question — finish when ready.' : 'Ready for the next one?') : 'Pick one answer. Keyboard: 1–4.') + '</span>' +
              '<span class="spacer"></span>' +
              (answered ? '<button class="btn btn-primary" type="button" id="quizNext">' + (idx === questions.length - 1 ? 'See result' : 'Next question') + '</button>' : '') +
            '</div>';

          body.querySelectorAll('[data-opt]').forEach(function (b) {
            b.addEventListener('click', function () {
              if (answered) return;
              answers[idx] = Number(b.getAttribute('data-opt'));
              renderQuestion();
            });
          });
          var next = id('quizNext');
          if (next) next.addEventListener('click', goNext);
        }

        function goNext() {
          if (idx < questions.length - 1) {
            idx++;
            renderQuestion();
          } else {
            finish();
          }
        }

        function finish() {
          var right = 0;
          questions.forEach(function (q, i) { if (answers[i] === q.answer) right++; });
          var pct = Math.round((right / questions.length) * 100);
          if (!recorded) {
            recorded = true;
            RC.store.recordQuiz(target, pct);
          }
          var tone = pct >= 80 ? 'Strong recall.' : pct >= 50 ? 'Close — review the misses.' : 'Re-read, then retry in a day.';
          var wrong = questions.map(function (q, i) {
            if (answers[i] === q.answer) return '';
            return '<div class="ref-item" style="margin-top:8px"><div style="padding:12px 14px">' +
              '<div style="font-weight:650;color:var(--text)">' + inline(q.q) + '</div>' +
              '<div class="tiny" style="margin-top:5px">Your answer: <span style="color:var(--red)">' + inline(q.options[answers[i]] || '—') + '</span> · ' +
              'Correct: <span style="color:var(--green)">' + inline(q.options[q.answer]) + '</span></div>' +
              '<div class="tiny muted" style="margin-top:4px">' + inline(q.why || '') + '</div>' +
              (mix ? '<div class="tiny" style="margin-top:4px"><a href="#/lesson/' + attr(q.lessonId) + '">' + esc(q.lessonTitle) + '</a></div>' : '') +
              '</div></div>';
          }).join('');

          id('quizBody').innerHTML =
            '<div class="card score-hero">' +
              '<div class="big">' + pct + '<small>%</small></div>' +
              '<h2>' + esc(tone) + '</h2>' +
              '<p>' + right + ' of ' + questions.length + ' correct' + (mix ? ' · answers saved to your history' : '') + '</p>' +
              '<div class="page-actions" style="justify-content:center">' +
                '<button class="btn btn-primary" type="button" id="quizRetry">Try again</button>' +
                '<a class="btn" href="' + (mix ? '#/practice' : '#/lesson/' + attr(lesson.id)) + '">' + (mix ? 'Back to practice' : 'Back to lesson') + '</a>' +
                '<a class="btn btn-ghost" href="#/learn">Curriculum</a>' +
              '</div>' +
            '</div>' +
            (wrong ? '<h3 class="sec-title">Review the misses</h3>' + wrong : '<div class="callout tip" style="margin-top:16px"><div class="c-ico">✦</div><div class="c-body"><div class="c-title">Clean sweep</div>Every answer correct. The cards will still resurface this material — retrieval at intervals is what makes it stick.</div></div>');

          var prog = id('quizProgress');
          if (prog) prog.innerHTML = questions.map(function (q, i) {
            return '<i class="' + (answers[i] === q.answer ? 'ok' : 'miss') + '"></i>';
          }).join('');
          var c = id('quizCounter');
          if (c) c.textContent = 'Result';

          var retry = id('quizRetry');
          if (retry) {
            retry.addEventListener('click', function () {
              var pool = mix ? shuffle(questions.map(function (q) { return q; })) : questions;
              questions = pool;
              answers = questions.map(function () { return null; });
              idx = 0; answered = false; recorded = false;
              renderQuestion();
            });
          }
        }

        renderQuestion();
      }
    };
  }

  /* ====================================================================== */
  /* PRACTICE                                                               */
  /* ====================================================================== */
  RC.views = RC.views || {};
  RC.views.practiceTab = RC.views.practiceTab || 'cards';

  function practice() {
    var tab = RC.views.practiceTab || 'cards';
    var stats = RC.store.cardStats();

    var html = pageHead({
      eyebrow: 'Practice',
      title: 'Retrieve it before you forget it',
      sub: 'Due cards first, then new ones within your daily limit. Grade honestly — the schedule adapts to you.',
      actions: '<a class="btn btn-ghost" href="#/settings">' + icon('gear') + ' Study settings</a>'
    }) +
      tabsHtml('Practice', [
        { id: 'cards', label: 'Flashcards', n: stats.due },
        { id: 'quiz', label: 'Quiz' },
        { id: 'my', label: 'My cards', n: RC.store.state.customCards.length }
      ], tab) +
      '<div id="practiceBody"></div>';

    return {
      html: html,
      meta: meta('practice', 'Practice', [{ label: 'Practice' }]),
      mount: function (root) {
        bindTabs(root, 'practiceTab', null);
        var body = id('practiceBody');
        if (tab === 'quiz') renderQuizTab(body);
        else if (tab === 'my') renderMyCards(body);
        else renderFlashcards(body);
      }
    };
  }

  function renderQuizTab(body) {
    var log = (RC.store.state.quizLog || []).slice(0, 12);
    var p = RC.store.progress();
    body.innerHTML =
      '<div class="grid grid-2">' +
        '<div class="panel">' +
          '<div class="panel-head"><div><h2>Mixed quiz</h2><p>Twelve questions drawn from all modules.</p></div></div>' +
          '<p class="tiny muted">Best for finding gaps once you have covered a few modules. Each run is different.</p>' +
          '<div class="form-actions"><a class="btn btn-primary" href="#/quiz/mix">Start mixed quiz</a>' +
          '<a class="btn" href="#/learn">Pick a lesson</a></div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-head"><div><h2>Your scores</h2><p>Average across lessons you have quizzed.</p></div></div>' +
          '<div class="kv"><span>Average best score</span><b>' + (p.avgScore == null ? '—' : p.avgScore + '%') + '</b></div>' +
          '<div class="kv"><span>Lessons with a score</span><b>' + p.quizzes + ' / ' + p.total + '</b></div>' +
          '<div class="kv"><span>Quiz attempts</span><b>' + (RC.store.state.quizLog || []).length + '</b></div>' +
        '</div>' +
      '</div>' +
      '<div class="sec-title">Recent attempts <span class="count">' + log.length + '</span></div>' +
      (log.length
        ? '<div class="lesson-list">' + log.map(function (q) {
          var l = RC.content.lesson(q.lesson);
          var label = l ? l.title : 'Mixed quiz';
          var href = l ? '#/lesson/' + attr(l.id) : '#/quiz/mix';
          return '<a class="lesson-row" href="' + href + '"><span class="dot" style="color:transparent;border-color:var(--line)">·</span>' +
            '<span class="l-main"><span class="l-title">' + esc(label) + '</span>' +
            '<span class="l-sub">' + RC.ui.fmtDate(q.at) + '</span></span>' +
            '<span class="l-right"><span class="badge ' + (q.pct >= 80 ? 'beginner' : q.pct >= 50 ? 'intermediate' : 'advanced') + '">' + q.pct + '%</span></span></a>';
        }).join('') + '</div>'
        : RC.ui.empty({ icon: '?', title: 'No quiz attempts yet', text: 'Take a mixed quiz to establish a baseline.' }));
  }

  function renderFlashcards(body) {
    var due = RC.store.dueQueue();
    var queue = due;
    var idx = 0;
    var revealed = false;
    var reviewed = 0;

    body.innerHTML = '<div class="flash-wrap"><div id="flashStage"></div></div>';
    var stage = id('flashStage');

    function emptyStage(message, allowAll) {
      var live = RC.store.cardStats();
      var hint = live.fresh > live.due
        ? 'You have reached today’s new-card limit (' + (RC.store.state.settings.newPerDay || 0) + '). Reviewing existing cards still works; raise the limit in Settings if you want more.'
        : 'Spaced repetition works best when you stop. Come back when cards are due, or deliberately over-practice below.';
      stage.innerHTML = RC.ui.empty({
        icon: '✓',
        title: message || 'Nothing due right now',
        text: hint,
        action: '<div class="page-actions" style="justify-content:center">' +
          (allowAll ? '<button class="btn btn-primary" type="button" id="flashAll">Practice all ' + live.total + ' cards</button>' : '') +
          '<a class="btn" href="#/lab">Open the lab</a></div>'
      });
      var all = id('flashAll');
      if (all) {
        all.addEventListener('click', function () {
          queue = shuffle(RC.store.allCards());
          idx = 0; reviewed = 0; revealed = false;
          renderCard();
        });
      }
    }

    function renderCard() {
      if (!queue.length || idx >= queue.length) {
        RC.views.flashKey = null;
        emptyStage(reviewed ? 'Session complete — ' + reviewed + ' ' + plural(reviewed, 'review') : 'Nothing due right now', true);
        RC.ui.setShell('practice', { crumbs: [{ label: 'Practice' }] });
        return;
      }
      var card = queue[idx];
      var live = RC.store.cardStats();
      revealed = false;
      var tags = (card.tags || []).slice(0, 4).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('');
      var source = card.lessonTitle
        ? '<span class="tag" style="color:var(--accent)">' + esc(card.lessonTitle) + '</span>'
        : (card.kind === 'custom' ? '<span class="tag" style="color:var(--accent)">My card</span>' : '');

      stage.innerHTML =
        '<div class="flash-meter"><span>Card ' + (idx + 1) + ' of ' + queue.length + '</span>' +
          '<span class="spacer"></span><span>' + reviewed + ' reviewed · ' + live.due + ' due today</span></div>' +
        '<div class="progress" style="margin-bottom:16px"><i style="width:' + Math.round((idx / queue.length) * 100) + '%"></i></div>' +
        '<div class="flash-card" id="flashCard">' +
          '<div class="flash-tags">' + source + tags + '</div>' +
          '<div class="flash-q" style="white-space:pre-line">' + inline(card.front) + '</div>' +
          '<div class="flash-a" id="flashAnswer" hidden>' + inline(card.back || 'No answer written yet. Say it out loud, then grade yourself.') + '</div>' +
          '<div class="flash-hint" id="flashHint">Think of the answer, then press <kbd>Space</kbd> to reveal.</div>' +
        '</div>' +
        '<div class="grade-row" id="flashGrades" hidden>' +
          '<button class="grade-btn" type="button" data-grade="0">Again<small>1</small></button>' +
          '<button class="grade-btn" type="button" data-grade="1">Hard<small>2</small></button>' +
          '<button class="grade-btn" type="button" data-grade="2">Good<small>3</small></button>' +
          '<button class="grade-btn" type="button" data-grade="3">Easy<small>4</small></button>' +
        '</div>' +
        '<div class="practice-top" style="margin-top:14px;justify-content:space-between">' +
          '<button class="btn btn-ghost btn-sm" type="button" id="flashSkip">Skip card</button>' +
          '<span class="tiny muted">Grading updates the due date immediately.</span>' +
        '</div>';

      function reveal() {
        if (revealed) return;
        revealed = true;
        var a = id('flashAnswer');
        var g = id('flashGrades');
        var h = id('flashHint');
        if (a) a.hidden = false;
        if (g) g.hidden = false;
        if (h) h.innerHTML = 'How did that feel? <kbd>1</kbd> again · <kbd>2</kbd> hard · <kbd>3</kbd> good · <kbd>4</kbd> easy';
        RC.views.flashKey = function (key) { grade(Number(key)); };
      }

      function grade(g) {
        if (!revealed) return;
        RC.store.gradeCard(card.id, g);
        reviewed++;
        idx++;
        RC.views.flashKey = null;
        renderCard();
        RC.ui.setShell('practice', { crumbs: [{ label: 'Practice' }] });
      }

      RC.views.flashKey = function (key) {
        if (key === 'space') reveal();
        else if (revealed && /^[1-4]$/.test(String(key))) grade(Number(key) - 1);
      };

      id('flashCard').addEventListener('click', function (e) {
        if (e.target.closest('button')) return;
        reveal();
      });
      stage.querySelectorAll('[data-grade]').forEach(function (b) {
        b.addEventListener('click', function () { grade(Number(b.getAttribute('data-grade'))); });
      });
      var skip = id('flashSkip');
      if (skip) skip.addEventListener('click', function () {
        idx++;
        RC.views.flashKey = null;
        renderCard();
      });
    }

    renderCard();
  }

  function renderMyCards(body) {
    var editId = null;

    function draw() {
      var cards = RC.store.state.customCards;
      body.innerHTML =
        '<div class="split">' +
          '<div class="split-side">' +
            '<div class="panel">' +
              '<div class="panel-head"><div><h2 id="cardFormTitle">' + (editId ? 'Edit card' : 'New card') + '</h2><p>Front prompts recall; back is the answer.</p></div></div>' +
              '<div class="field"><label for="cardFront">Front</label>' +
                '<textarea class="textarea" id="cardFront" style="min-height:80px" placeholder="e.g. Which BDEF statement enables draft?"></textarea></div>' +
              '<div class="field" style="margin-top:10px"><label for="cardBack">Back</label>' +
                '<textarea class="textarea" id="cardBack" style="min-height:90px" placeholder="The answer, in your own words."></textarea></div>' +
              '<div class="field" style="margin-top:10px"><label for="cardTags">Tags</label>' +
                '<input class="input" id="cardTags" placeholder="draft, bdef (comma separated)"></div>' +
              '<div class="form-actions"><button class="btn btn-primary" type="button" id="cardSave">' + (editId ? 'Save changes' : 'Add card') + '</button>' +
                (editId ? '<button class="btn btn-ghost" type="button" id="cardCancel">Cancel</button>' : '') + '</div>' +
              '<div class="field-error" id="cardError" style="margin-top:8px" role="alert"></div>' +
              '<div class="hint tiny" style="margin-top:8px">Cards join the same spaced-repetition queue as lesson cards.</div>' +
            '</div>' +
          '</div>' +
          '<div>' +
            (cards.length
              ? '<div class="grid">' + cards.map(function (c) {
                var info = RC.store.cardInfo('uc:' + c.id);
                return '<div class="card">' +
                  '<div class="card-top"><div style="min-width:0;flex:1"><div class="card-title" style="white-space:pre-line">' + inline(c.front) + '</div>' +
                    '<div class="card-sub" style="white-space:pre-line">' + inline(c.back) + '</div></div>' +
                    '<span class="badge ' + (info.status === 'due' ? 'accent' : '') + '">' + esc(info.status === 'due' ? 'due' : info.status === 'later' ? 'scheduled' : 'new') + '</span>' +
                  '</div>' +
                  '<div class="tag-row">' + (c.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div>' +
                  '<div class="form-actions">' +
                    '<button class="btn btn-sm" type="button" data-edit="' + attr(c.id) + '">' + icon('edit') + ' Edit</button>' +
                    '<button class="btn btn-sm btn-ghost" type="button" data-del="' + attr(c.id) + '">' + icon('trash') + ' Delete</button>' +
                  '</div></div>';
              }).join('') + '</div>'
              : RC.ui.empty({ icon: '✎', title: 'No personal cards yet', text: 'Write cards from your own mistakes. That is usually the highest-value deck you will ever own.' })) +
          '</div>' +
        '</div>';

      if (editId) {
        var c = cards.find(function (x) { return x.id === editId; });
        if (c) {
          id('cardFront').value = c.front;
          id('cardBack').value = c.back;
          id('cardTags').value = (c.tags || []).join(', ');
        }
      }

      id('cardSave').addEventListener('click', save);
      var cancel = id('cardCancel');
      if (cancel) cancel.addEventListener('click', function () { editId = null; draw(); });

      body.querySelectorAll('[data-edit]').forEach(function (b) {
        b.addEventListener('click', function () { editId = b.getAttribute('data-edit'); draw(); });
      });
      body.querySelectorAll('[data-del]').forEach(function (b) {
        b.addEventListener('click', function () {
          var cid = b.getAttribute('data-del');
          RC.ui.confirm({ title: 'Delete this card?', message: 'The card and its review history will be removed.', confirmLabel: 'Delete', danger: true })
            .then(function (ok) {
              if (!ok) return;
              RC.store.deleteCustomCard(cid);
              if (editId === cid) editId = null;
              draw();
              RC.ui.toast('Card deleted');
            });
        });
      });
    }

    function save() {
      var front = id('cardFront').value.trim();
      var back = id('cardBack').value.trim();
      var tags = id('cardTags').value.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
      var err = id('cardError');
      if (!front) { err.textContent = 'The front needs a question or prompt.'; return; }
      if (!back) { err.textContent = 'Add an answer — even a short one.'; return; }
      if (editId) {
        RC.store.updateCustomCard(editId, { front: front, back: back, tags: tags });
        RC.ui.toast('Card updated');
      } else {
        RC.store.addCustomCard(front, back, tags);
        RC.ui.toast('Card added');
      }
      editId = null;
      draw();
      RC.ui.setShell('practice', { crumbs: [{ label: 'Practice' }] });
    }

    draw();
  }

  /* ====================================================================== */
  /* LAB                                                                    */
  /* ====================================================================== */
  RC.views.labTab = RC.views.labTab || 'gen';

  function lab() {
    var tab = RC.views.labTab || 'gen';
    var html = pageHead({
      eyebrow: 'Lab',
      title: 'Build faster, break less',
      sub: 'Generate a consistent RAP skeleton from a field list, or paste code and let the heuristic doctor look for the usual RAP mistakes.',
      actions: '<a class="btn btn-ghost" href="#/reference">' + icon('openbook') + ' Reference</a>'
    }) + tabsHtml('Lab', [
      { id: 'gen', label: 'RAP scaffolder' },
      { id: 'doctor', label: 'Code doctor' }
    ], tab) + '<div id="labBody"></div>';

    return {
      html: html,
      meta: meta('lab', 'Lab', [{ label: 'Lab' }]),
      mount: function (root) {
        bindTabs(root, 'labTab', null);
        var body = id('labBody');
        if (tab === 'doctor') renderDoctor(body);
        else renderGenerator(body);
      }
    };
  }

  function renderGenerator(body) {
    var g = RC.store.state.generator || {};
    var defaults = {
      entity: g.entity || 'Travel',
      childEntity: g.childEntity || 'Booking',
      table: g.table || 'ztravel',
      childTable: g.childTable || 'zbooking',
      mode: g.mode || 'managed',
      draft: g.draft !== false,
      auth: g.auth !== false,
      child: !!g.child,
      validation: g.validation !== false,
      action: g.action !== false,
      ui: g.ui !== false,
      tableDdl: g.tableDdl !== false,
      fields: g.fields || ''
    };

    body.innerHTML =
      '<div class="split">' +
        '<div class="split-side">' +
          '<div class="panel">' +
            '<div class="panel-head"><div><h2>BO specification</h2><p>Names, scenario and field list.</p></div></div>' +
            '<div class="field"><label for="genEntity">Entity</label><input class="input" id="genEntity" value="' + attr(defaults.entity) + '"></div>' +
            '<div class="field" style="margin-top:10px"><label for="genTable">Database table</label><input class="input mono" id="genTable" value="' + attr(defaults.table) + '"></div>' +
            '<div class="grid grid-2" style="margin-top:10px;gap:10px">' +
              '<div class="field"><label for="genMode">Scenario</label><select class="select" id="genMode">' +
                '<option value="managed"' + (defaults.mode === 'managed' ? ' selected' : '') + '>Managed</option>' +
                '<option value="unmanaged"' + (defaults.mode === 'unmanaged' ? ' selected' : '') + '>Unmanaged</option></select></div>' +
              '<div class="field"><label for="genAuth">Authorization</label><select class="select" id="genAuth">' +
                '<option value="instance"' + (defaults.auth ? ' selected' : '') + '>Instance</option>' +
                '<option value="none"' + (!defaults.auth ? ' selected' : '') + '>None</option></select></div>' +
            '</div>' +
            '<label class="check"><input type="checkbox" id="genDraft"' + (defaults.draft ? ' checked' : '') + '> Draft enabled</label>' +
            '<label class="check"><input type="checkbox" id="genChild"' + (defaults.child ? ' checked' : '') + '> Add a composition child</label>' +
            '<div class="grid grid-2" style="gap:10px">' +
              '<div class="field"><label for="genChildEntity">Child entity</label><input class="input" id="genChildEntity" value="' + attr(defaults.childEntity) + '"></div>' +
              '<div class="field"><label for="genChildTable">Child table</label><input class="input mono" id="genChildTable" value="' + attr(defaults.childTable) + '"></div>' +
            '</div>' +
            '<label class="check"><input type="checkbox" id="genValidation"' + (defaults.validation ? ' checked' : '') + '> Validation skeleton</label>' +
            '<label class="check"><input type="checkbox" id="genAction"' + (defaults.action ? ' checked' : '') + '> Action skeleton</label>' +
            '<label class="check"><input type="checkbox" id="genUi"' + (defaults.ui ? ' checked' : '') + '> Metadata extension (UI)</label>' +
            '<label class="check"><input type="checkbox" id="genTableDdl"' + (defaults.tableDdl ? ' checked' : '') + '> Table DDL</label>' +
          '</div>' +
          '<div class="panel">' +
            '<div class="panel-head"><div><h2>Fields</h2><p>One per line: <span class="mono">Name:type:flags</span></p></div></div>' +
            '<textarea class="textarea mono" id="genFields" style="min-height:150px" placeholder="TravelID:abap.numc(10):key,readonly\nAgencyID:abap.char(6):mandatory\nBeginDate:abap.dats:mandatory">' + esc(defaults.fields) + '</textarea>' +
            '<div class="hint tiny" style="margin-top:6px">Flags: <span class="mono">key, readonly, mandatory, etag</span>. Leave empty for a sensible travel default.</div>' +
            '<div class="form-actions"><button class="btn" type="button" id="genSample">Load sample fields</button>' +
              '<button class="btn btn-primary" type="button" id="genRun">Generate BO</button></div>' +
          '</div>' +
        '</div>' +
        '<div id="genOut"></div>' +
      '</div>';

    var out = id('genOut');

    function readForm() {
      return {
        entity: id('genEntity').value,
        childEntity: id('genChildEntity').value,
        table: id('genTable').value,
        childTable: id('genChildTable').value,
        mode: id('genMode').value,
        draft: id('genDraft').checked,
        auth: id('genAuth').value === 'instance',
        child: id('genChild').checked,
        validation: id('genValidation').checked,
        action: id('genAction').checked,
        ui: id('genUi').checked,
        tableDdl: id('genTableDdl').checked,
        fields: id('genFields').value
      };
    }

    function run(save) {
      var opts = readForm();
      var result;
      try { result = RC.code.generate(opts); }
      catch (e) { out.innerHTML = '<div class="callout danger"><div class="c-ico">×</div><div class="c-body"><div class="c-title">Could not generate</div>' + esc(e.message) + '</div></div>'; return; }
      if (save) {
        RC.store.set(function (st) { st.generator = opts; });
      }
      renderResult(out, result);
    }

    id('genRun').addEventListener('click', function () { run(true); RC.ui.toast('Skeleton generated'); });
    id('genSample').addEventListener('click', function () {
      id('genFields').value = 'TravelID:abap.numc(10):key,readonly\nAgencyID:abap.char(6):mandatory\nCustomerID:abap.char(8):mandatory\nBeginDate:abap.dats:mandatory\nEndDate:abap.dats:mandatory\nTotalPrice:abap.curr(15,2)\nCurrencyCode:abap.cuky\nDescription:abap.char(255)\nLastChangedAt:timestampl:readonly,etag';
    });

    if (RC.store.state.generator) run(false);
    else out.innerHTML = '<div class="empty" style="height:100%;display:grid;place-items:center;min-height:320px"><div>' +
      '<div class="e-ico">' + icon('lab') + '</div><h3>Your skeleton appears here</h3>' +
      '<p>Set the names and fields, then press <b>Generate BO</b>. You get CDS, behavior, service, class and optional table DDL.</p></div></div>';
  }

  function renderResult(out, result) {
    var combined = result.artifacts.map(function (a) {
      return '" ===== ' + a.title + ' =====\n' + a.code;
    }).join('\n\n');
    out.innerHTML =
      '<div class="panel">' +
        '<div class="panel-head"><div><h2>Generated artifacts</h2><p>' + esc(result.base) + ' · ' + esc(result.table) +
          (result.names.childZi ? ' + ' + esc(result.childBase) : '') + '</p></div>' +
          '<span class="spacer"></span><button class="btn btn-sm copy-all" type="button" id="genCopyAll">Copy all</button>' +
          '<button class="btn btn-sm" type="button" id="genDownload">Download</button></div>' +
        '<div class="form-actions" style="margin-top:0;margin-bottom:6px">' +
          '<span class="chip">' + esc(result.names.zi) + '</span><span class="chip">' + esc(result.names.zc) + '</span>' +
          '<span class="chip">' + esc(result.names.bimp) + '</span><span class="chip">' + esc(result.names.svc) + '</span>' +
        '</div>' +
        '<div class="gen-out">' + result.artifacts.map(function (a) {
          return RC.code.codeBlock({ code: a.code, lang: a.lang, title: a.title });
        }).join('') + '</div>' +
        '<h3 class="sec-title">Build notes</h3>' +
        '<ol class="tiny" style="padding-left:20px;color:var(--muted);line-height:1.8">' +
          result.notes.map(function (n) { return '<li>' + inline(n) + '</li>'; }).join('') +
        '</ol>' +
        '<div class="callout warn" style="margin-top:14px"><div class="c-ico">!</div><div class="c-body">' +
          '<div class="c-title">Read before you activate</div>The generator produces a consistent starting point, not a finished BO. Align the <code>mapping for</code> block with your real table, fill the TODOs, then activate from the table upwards.</div></div>' +
      '</div>';

    id('genCopyAll').addEventListener('click', function () { RC.ui.copyText(combined, 'All artifacts copied'); });
    id('genDownload').addEventListener('click', function () {
      RC.ui.download('rap-bo-' + result.base.toLowerCase() + '.txt', combined, 'text/plain');
    });
  }

  RC.views.doctorSrc = RC.views.doctorSrc || '';

  function renderDoctor(body) {
    var snippets = RC.reference.snippets;
    body.innerHTML =
      '<div class="split">' +
        '<div class="split-side">' +
          '<div class="panel">' +
            '<div class="panel-head"><div><h2>Paste code</h2><p>BDEF, CDS view entity or behavior class.</p></div></div>' +
            '<textarea class="textarea mono" id="lintSrc" style="min-height:320px" placeholder="managed implementation in class zbp_i_travel unique;\nstrict ( 2 );\n...">' + esc(RC.views.doctorSrc) + '</textarea>' +
            '<div class="form-actions"><button class="btn btn-primary" type="button" id="lintRun">Check code</button>' +
              '<button class="btn btn-ghost" type="button" id="lintClear">Clear</button></div>' +
          '</div>' +
          '<div class="panel"><div class="panel-head"><div><h2>Load a sample</h2><p>See what the checks look for.</p></div></div>' +
            '<div class="form-actions" style="margin-top:0">' +
              '<button class="btn btn-sm" type="button" data-sample="0">BDEF</button>' +
              '<button class="btn btn-sm" type="button" data-sample="4">EML</button>' +
              '<button class="btn btn-sm" type="button" data-sample="1">Handler</button></div>' +
          '</div>' +
        '</div>' +
        '<div id="lintOut">' + RC.ui.empty({ icon: '⚕', title: 'Nothing checked yet', text: 'Paste a RAP artifact, then run the doctor. It is heuristic — it catches common mistakes, not everything.' }) + '</div>' +
      '</div>';

    var src = id('lintSrc');
    var out = id('lintOut');

    function run() {
      var code = src.value;
      RC.views.doctorSrc = code;
      if (!code.trim()) {
        out.innerHTML = RC.ui.empty({ icon: '⚕', title: 'Paste some code first', text: 'The doctor needs a BDEF, a CDS view entity or a handler class.' });
        return;
      }
      var results = RC.code.lint(code);
      var icons = { ok: '✓', warn: '!', bad: '×', info: 'i' };
      out.innerHTML = '<div class="panel"><div class="panel-head"><div><h2>Findings</h2><p>' +
        results.length + ' ' + plural(results.length, 'check') + ' · ' + results.filter(function (r) { return r.level === 'bad'; }).length + ' blocking</p></div></div>' +
        '<ul class="lint-list">' + results.map(function (r) {
          return '<li class="' + attr(r.level) + '"><span class="li-ico">' + icons[r.level] + '</span><span>' + inline(r.text) + '</span></li>';
        }).join('') + '</ul>' +
        '<div class="hint tiny" style="margin-top:12px">This is a teaching heuristic. Always activate in ADT and read the real compiler errors.</div></div>';
    }

    id('lintRun').addEventListener('click', run);
    id('lintClear').addEventListener('click', function () { src.value = ''; RC.views.doctorSrc = ''; out.innerHTML = ''; src.focus(); });
    body.querySelectorAll('[data-sample]').forEach(function (b) {
      b.addEventListener('click', function () {
        var s = snippets[Number(b.getAttribute('data-sample'))];
        if (s) { src.value = s.code; RC.views.doctorSrc = s.code; run(); }
      });
    });
  }

  /* ====================================================================== */
  /* EXAMPLES                                                               */
  /* ====================================================================== */
  function examplesView(param) {
    var parts = String(param || '').split('/').filter(Boolean);
    if (parts[0] === 'new') return exampleForm(null);
    if (parts.length >= 2 && parts[1] === 'edit') return exampleForm(parts[0]);
    if (parts[0]) return exampleDetail(parts[0]);
    return exampleList();
  }

  function exampleList() {
    var html = pageHead({
      eyebrow: 'Your library',
      title: 'Your own examples',
      sub: 'Drop in the code you write at work. Add a note explaining why it works — that note becomes a recall card.',
      actions: '<a class="btn btn-primary" href="#/examples/new">' + icon('plus') + ' New example</a>'
    }) +
      '<div class="panel" style="padding:14px;margin-bottom:20px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">' +
        '<input class="input" id="exSearch" type="search" placeholder="Filter by title, tag or note…" style="max-width:380px" aria-label="Filter examples">' +
        '<span class="spacer"></span><span class="tiny muted" id="exCount"></span>' +
      '</div>' +
      '<div id="exList"></div>';

    return {
      html: html,
      meta: meta('examples', 'My examples', [{ label: 'My examples' }]),
      mount: function () {
        var search = id('exSearch');
        function draw() {
          var q = (search.value || '').toLowerCase().trim();
          var list = RC.store.state.examples.filter(function (ex) {
            if (!q) return true;
            return (ex.title + ' ' + (ex.tags || []).join(' ') + ' ' + ex.notes + ' ' + ex.code).toLowerCase().indexOf(q) >= 0;
          });
          var box = id('exList');
          if (!list.length) {
            box.innerHTML = RC.store.state.examples.length
              ? RC.ui.empty({ icon: '⌕', title: 'No examples match', text: 'Try a different tag or title fragment.' })
              : RC.ui.empty({
                icon: '✎', title: 'No examples yet',
                text: 'Save the first BO you build. Include the code, a short note and the tags you will search for later.',
                action: '<a class="btn btn-primary" href="#/examples/new" style="margin-top:14px">Add your first example</a>'
              });
          } else {
            box.innerHTML = '<div class="grid grid-2">' + list.map(function (ex) {
              var l = ex.lessonId ? RC.content.lesson(ex.lessonId) : null;
              var preview = String(ex.code || '').split('\n').slice(0, 3).join('\n');
              return '<a class="card card-link" href="#/examples/' + attr(ex.id) + '">' +
                '<div class="card-kicker">' + (l ? esc(l.moduleTitle) : 'My example') + ' · ' + esc(RC.ui.fmtDate(ex.updatedAt)) + '</div>' +
                '<div class="card-title">' + esc(ex.title) + '</div>' +
                '<div class="card-sub">' + (ex.notes ? esc(ex.notes.slice(0, 130)) + (ex.notes.length > 130 ? '…' : '') : 'No note yet — add one when you edit.') + '</div>' +
                (preview ? '<pre class="code" style="margin:11px 0 0;border:1px solid var(--line);border-radius:8px;font-size:11px;max-height:76px;overflow:hidden">' + esc(preview) + '</pre>' : '') +
                '<div class="tag-row">' + (ex.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div>' +
                '</a>';
            }).join('') + '</div>';
          }
          id('exCount').textContent = list.length + ' of ' + RC.store.state.examples.length + ' examples';
        }
        search.addEventListener('input', draw);
        draw();
      }
    };
  }

  function exampleDetail(exId) {
    var ex = RC.store.example(exId);
    if (!ex) return notFound('That example no longer exists.');
    var l = ex.lessonId ? RC.content.lesson(ex.lessonId) : null;
    var info = RC.store.cardInfo('ex:' + ex.id);

    var html = pageHead({
      eyebrow: 'My example',
      title: ex.title,
      sub: l ? 'Linked to “' + l.title + '”.' : 'Standalone example.',
      actions: '<a class="btn" href="#/examples/' + attr(ex.id) + '/edit">' + icon('edit') + ' Edit</a>' +
        '<button class="btn btn-danger" type="button" id="exDelete">' + icon('trash') + ' Delete</button>' +
        '<a class="btn btn-ghost" href="#/examples">← All examples</a>'
    }) +
      '<div class="lesson-layout">' +
        '<div>' +
          '<div class="tag-row" style="margin-bottom:12px">' +
            (ex.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') +
            '<span class="badge ' + (info.status === 'due' ? 'accent' : '') + '">card: ' + esc(info.status) + '</span>' +
          '</div>' +
          (ex.code ? RC.code.codeBlock({ code: ex.code, lang: 'abap', title: ex.title }) : '<div class="empty"><h3>No code saved</h3><p>Edit this example and paste the code you want to remember.</p></div>') +
          '<h2 class="sec-title">Why it works</h2>' +
          (ex.notes
            ? '<div class="prose" style="white-space:pre-wrap">' + inline(ex.notes) + '</div>'
            : '<div class="callout warn"><div class="c-ico">!</div><div class="c-body"><div class="c-title">Write the note</div>Two or three sentences about the structure, the key statement and why it works. That is what makes the example learnable.</div></div>') +
        '</div>' +
        '<aside class="lesson-aside">' +
          '<div class="aside-card"><h3>Details</h3>' +
            '<div class="kv"><span>Created</span><b>' + esc(RC.ui.fmtDate(ex.createdAt)) + '</b></div>' +
            '<div class="kv"><span>Updated</span><b>' + esc(RC.ui.fmtDate(ex.updatedAt)) + '</b></div>' +
            '<div class="kv"><span>Recall card</span><b>' + (ex.makeCard === false ? 'off' : 'on') + '</b></div>' +
            (l ? '<a class="btn btn-sm" style="margin-top:10px;width:100%" href="#/lesson/' + attr(l.id) + '">Open lesson</a>' : '') +
            '<a class="btn btn-sm" style="margin-top:7px;width:100%" href="#/practice">Practice cards</a>' +
          '</div>' +
          '<div class="aside-card"><h3>Tags</h3><div class="tag-row" style="margin-top:0">' +
            ((ex.tags || []).length ? (ex.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') : '<span class="tiny muted">No tags</span>') +
          '</div></div>' +
        '</aside>' +
      '</div>';

    return {
      html: html,
      meta: meta('examples', ex.title, [{ label: 'My examples', href: '#/examples' }, { label: ex.title }]),
      mount: function () {
        var del = id('exDelete');
        if (del) del.addEventListener('click', function () {
          RC.ui.confirm({ title: 'Delete this example?', message: 'The code, note and its recall card will be removed.', confirmLabel: 'Delete', danger: true })
            .then(function (ok) {
              if (!ok) return;
              RC.store.deleteExample(ex.id);
              RC.ui.toast('Example deleted');
              RC.ui.go('examples');
            });
        });
      }
    };
  }

  function exampleForm(exId) {
    var existing = exId ? RC.store.example(exId) : null;
    if (exId && !existing) return notFound('That example no longer exists.');
    var lessonOpts = '<option value="">No lesson</option>' + allLessons().map(function (l) {
      var sel = existing && existing.lessonId === l.id ? ' selected' : '';
      return '<option value="' + attr(l.id) + '"' + sel + '>' + esc(l.moduleTitle + ' · ' + l.title) + '</option>';
    }).join('');

    var html = pageHead({
      eyebrow: existing ? 'Edit example' : 'New example',
      title: existing ? 'Edit “' + existing.title + '”' : 'Save a new example',
      sub: 'Code plus a note in your own words. The note is the recall answer; without it the card is much weaker.',
      actions: '<a class="btn btn-ghost" href="' + (existing ? '#/examples/' + attr(existing.id) : '#/examples') + '">Cancel</a>'
    }) +
      '<div class="panel" style="max-width:900px">' +
        '<div class="form-grid">' +
          '<div class="field full"><label for="exTitle">Title <span style="color:var(--red)">*</span></label>' +
            '<input class="input" id="exTitle" value="' + attr(existing ? existing.title : '') + '" placeholder="e.g. Managed travel BDEF with draft and child"></div>' +
          '<div class="field"><label for="exTags">Tags</label><input class="input" id="exTags" value="' + attr(existing ? (existing.tags || []).join(', ') : '') + '" placeholder="bdEF, draft, composition"></div>' +
          '<div class="field"><label for="exLesson">Linked lesson</label><select class="select" id="exLesson">' + lessonOpts + '</select></div>' +
          '<div class="field full"><label for="exCode">Code</label>' +
            '<textarea class="textarea mono" id="exCode" style="min-height:300px" placeholder="managed implementation in class zbp_i_travel unique;&#10;strict ( 2 );&#10;...">' + esc(existing ? existing.code : '') + '</textarea></div>' +
          '<div class="field full"><label for="exNotes">Why it works — your note</label>' +
            '<textarea class="textarea" id="exNotes" style="min-height:120px" placeholder="What problem does this solve? Which statements matter? What would you change next time?">' + esc(existing ? existing.notes : '') + '</textarea>' +
            '<div class="hint">This note becomes the back of an automatic recall card.</div></div>' +
          '<div class="field full"><label class="check"><input type="checkbox" id="exCard"' + (!existing || existing.makeCard !== false ? ' checked' : '') + '> Create a recall card from this example</label></div>' +
        '</div>' +
        '<div class="field-error" id="exError" style="margin-top:10px" role="alert"></div>' +
        '<div class="form-actions"><button class="btn btn-primary" type="button" id="exSave">' + (existing ? 'Save changes' : 'Save example') + '</button>' +
          '<a class="btn btn-ghost" href="' + (existing ? '#/examples/' + attr(existing.id) : '#/examples') + '">Cancel</a></div>' +
      '</div>';

    return {
      html: html,
      meta: meta('examples', existing ? 'Edit example' : 'New example', [
        { label: 'My examples', href: '#/examples' },
        { label: existing ? existing.title : 'New example' }
      ]),
      mount: function () {
        id('exSave').addEventListener('click', function () {
          var title = id('exTitle').value.trim();
          var code = id('exCode').value;
          var notes = id('exNotes').value;
          var tags = id('exTags').value.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
          var lessonId = id('exLesson').value;
          var makeCard = id('exCard').checked;
          var err = id('exError');
          if (!title) { err.textContent = 'Give the example a title so you can find it later.'; id('exTitle').focus(); return; }
          if (!code.trim()) { err.textContent = 'Paste at least a few lines of code — that is the example.'; id('exCode').focus(); return; }

          var data = { title: title, code: code, notes: notes, tags: tags, lessonId: lessonId, makeCard: makeCard };
          var saved;
          if (existing) {
            saved = RC.store.updateExample(existing.id, data);
            RC.ui.toast('Example updated');
          } else {
            saved = RC.store.addExample(data);
            RC.ui.toast('Example saved');
          }
          RC.ui.go('examples/' + saved.id);
        });
      }
    };
  }

  /* ====================================================================== */
  /* REFERENCE                                                              */
  /* ====================================================================== */
  RC.views.referenceTab = RC.views.referenceTab || 'annotations';

  function reference() {
    var tab = RC.views.referenceTab || 'annotations';
    var tabs = [
      { id: 'annotations', label: 'Annotations', n: RC.reference.annotations.length },
      { id: 'bdef', label: 'BDEF keywords', n: RC.reference.bdef.length },
      { id: 'eml', label: 'EML', n: RC.reference.eml.length },
      { id: 'naming', label: 'Naming', n: RC.reference.naming.length },
      { id: 'snippets', label: 'Snippets', n: RC.reference.snippets.length },
      { id: 'glossary', label: 'Glossary', n: RC.reference.glossary.length },
      { id: 'resources', label: 'Resources', n: RC.reference.resources.length }
    ];
    var html = pageHead({
      eyebrow: 'Reference',
      title: 'The twenty percent you actually use',
      sub: 'Annotations, behavioral keywords, EML, naming and working snippets. Filter the active tab with the search box.',
      actions: '<a class="btn btn-ghost" href="#/troubleshoot">' + icon('lifebuoy') + ' Troubleshooting</a>'
    }) +
      tabsHtml('Reference', tabs, tab) +
      '<div class="panel" style="padding:12px;margin-bottom:16px;display:flex;gap:10px;align-items:center">' +
        '<input class="input" id="refSearch" type="search" placeholder="Filter this tab…" style="max-width:340px" aria-label="Filter reference">' +
        '<span class="spacer"></span><span class="tiny muted" id="refCount"></span>' +
      '</div>' +
      '<div id="refBody"></div>';

    return {
      html: html,
      meta: meta('reference', 'Reference', [{ label: 'Reference' }]),
      mount: function (root) {
        bindTabs(root, 'referenceTab', null);
        var search = id('refSearch');
        function draw() {
          var q = (search.value || '').toLowerCase().trim();
          var res = renderReferenceTab(tab, q);
          id('refBody').innerHTML = res.html;
          id('refCount').textContent = res.count + ' ' + plural(res.count, 'entry', 'entries') + (q ? ' matching “' + q + '”' : '');
        }
        search.addEventListener('input', draw);
        draw();
      }
    };
  }

  function matches(obj, q) {
    if (!q) return true;
    return JSON.stringify(obj).toLowerCase().indexOf(q) >= 0;
  }

  function detail(title, summary, body) {
    return '<details class="ref-item"><summary>' + title + (summary ? ' ' + summary : '') + '</summary>' +
      '<div class="ref-body">' + body + '</div></details>';
  }

  function renderReferenceTab(tab, q) {
    var html = '', count = 0;

    if (tab === 'annotations') {
      var anns = RC.reference.annotations.filter(function (a) { return matches(a, q); });
      count = anns.length;
      html = anns.map(function (a) {
        return detail('<code>' + esc(a.name) + '</code>', '<span class="tag">' + esc(a.target) + '</span>',
          '<div>' + inline(a.effect) + '</div><pre class="db-code" style="margin-top:9px">' + esc(a.example) + '</pre>');
      }).join('');
    } else if (tab === 'bdef') {
      var bdefs = RC.reference.bdef.filter(function (b) { return matches(b, q); });
      count = bdefs.length;
      html = bdefs.map(function (b) {
        return detail('<code>' + esc(b.kw) + '</code>', '',
          '<div>' + inline(b.meaning) + '</div><pre class="db-code" style="margin-top:9px">' + esc(b.example) + '</pre>');
      }).join('');
    } else if (tab === 'eml') {
      var eml = RC.reference.eml.filter(function (e) { return matches(e, q); });
      count = eml.length;
      html = eml.map(function (e) {
        return detail('<code>' + esc(e.stmt) + '</code>', '',
          '<div>' + inline(e.purpose) + '</div><pre class="db-code" style="margin-top:9px">' + esc(e.example) + '</pre>');
      }).join('');
    } else if (tab === 'naming') {
      var names = RC.reference.naming.filter(function (n) { return matches(n, q); });
      count = names.length;
      html = '<div class="table-wrap"><table class="data"><thead><tr><th>Artifact</th><th>Convention</th><th>Example</th></tr></thead><tbody>' +
        names.map(function (n) {
          return '<tr><td>' + esc(n.artifact) + '</td><td><code>' + esc(n.convention) + '</code></td><td class="mono">' + esc(n.example) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    } else if (tab === 'snippets') {
      var snips = RC.reference.snippets.filter(function (s) { return matches(s, q); });
      count = snips.length;
      html = snips.map(function (s) {
        return '<div class="panel" style="margin-bottom:14px"><div class="panel-head"><div><h2>' + esc(s.title) + '</h2>' +
          (s.note ? '<p>' + inline(s.note) + '</p>' : '') + '</div></div>' +
          RC.code.codeBlock({ code: s.code, lang: s.lang || 'abap', title: s.title }) + '</div>';
      }).join('');
    } else if (tab === 'glossary') {
      var gl = RC.reference.glossary.filter(function (g) { return matches(g, q); });
      count = gl.length;
      html = gl.map(function (g) {
        return detail('<b>' + esc(g.term) + '</b>', '', '<div>' + inline(g.def) + '</div>');
      }).join('');
    } else {
      var res = RC.reference.resources.filter(function (r) { return matches(r, q); });
      count = res.length;
      html = '<div class="grid grid-2">' + res.map(function (r) {
        return '<a class="card card-link" href="' + attr(r.url) + '" target="_blank" rel="noopener">' +
          '<div class="card-kicker">External</div><div class="card-title">' + esc(r.label) + ' ↗</div>' +
          '<div class="card-sub">' + inline(r.note) + '</div></a>';
      }).join('') + '</div>';
    }

    if (!html) html = RC.ui.empty({ icon: '⌕', title: 'No matching entries', text: 'Clear the filter or switch tabs.' });
    return { html: html, count: count };
  }

  /* ====================================================================== */
  /* TROUBLESHOOT                                                           */
  /* ====================================================================== */
  function troubleshoot() {
    var data = RC.reference.troubleshooting;
    var html = pageHead({
      eyebrow: 'Troubleshooting',
      title: 'Symptom → cause → fix',
      sub: 'The twenty errors that consume the most RAP time, with the smallest fix that actually works.',
      actions: '<a class="btn btn-ghost" href="#/reference">' + icon('openbook') + ' Reference</a>'
    }) +
      '<div class="panel" style="padding:12px;margin-bottom:18px;display:flex;gap:10px;align-items:center">' +
        '<input class="input" id="tsSearch" type="search" placeholder="Search symptom, error text, tool or fix…" style="max-width:460px" aria-label="Search troubleshooting">' +
        '<span class="spacer"></span><span class="tiny muted" id="tsCount"></span>' +
      '</div>' +
      '<div id="tsList"></div>';

    return {
      html: html,
      meta: meta('troubleshoot', 'Troubleshooting', [{ label: 'Troubleshooting' }]),
      mount: function () {
        var search = id('tsSearch');
        function draw() {
          var q = (search.value || '').toLowerCase().trim();
          var list = data.filter(function (t) { return matches(t, q); });
          var box = id('tsList');
          if (!list.length) {
            box.innerHTML = RC.ui.empty({ icon: '⌕', title: 'No match', text: 'Try the error code (412, 403, 500) or a tool name (ST22, STAUTHTRACE).' });
          } else {
            box.innerHTML = '<div style="display:flex;flex-direction:column;gap:10px">' + list.map(function (t, i) {
              return '<div class="db-item">' +
                '<h3><span class="sym">' + pad2(i + 1) + '</span><span>' + esc(t.title) + '</span></h3>' +
                '<div class="cause"><b>Symptom:</b> ' + inline(t.symptom) + '</div>' +
                '<div class="cause"><b>Cause:</b> ' + inline(t.cause) + '</div>' +
                '<div class="fix"><b>Fix:</b> ' + inline(t.fix) + '</div>' +
                (t.code ? '<pre class="db-code">' + esc(t.code) + '</pre>' : '') +
                '</div>';
            }).join('') + '</div>';
          }
          id('tsCount').textContent = list.length + ' of ' + data.length + ' entries';
        }
        search.addEventListener('input', draw);
        draw();
      }
    };
  }

  /* ====================================================================== */
  /* SETTINGS                                                               */
  /* ====================================================================== */
  function settings() {
    var st = RC.store.state;
    var p = RC.store.progress();
    var cs = RC.store.cardStats();
    var bytes = 0;
    try { bytes = new Blob([JSON.stringify(st)]).size; } catch (e) { bytes = JSON.stringify(st).length; }
    var kb = (bytes / 1024).toFixed(1);

    var html = pageHead({
      eyebrow: 'Settings',
      title: 'Make the coach yours',
      sub: 'Everything lives in this browser. Export a backup before clearing site data or switching machines.',
      actions: '<a class="btn btn-ghost" href="#/home">← Dashboard</a>'
    }) +
      '<div class="grid grid-2">' +
        '<div class="panel">' +
          '<div class="panel-head"><div><h2>Profile & goals</h2><p>Used for the greeting and the daily target.</p></div></div>' +
          '<div class="form-grid">' +
            '<div class="field full"><label for="setName">Your name</label><input class="input" id="setName" value="' + attr(st.profile.name || '') + '" placeholder="Optional"></div>' +
            '<div class="field"><label for="setGoal">Daily activity goal</label><input class="input" id="setGoal" type="number" min="1" max="200" value="' + attr(st.settings.dailyGoal || 10) + '"><div class="hint">Reviews, quizzes and lessons.</div></div>' +
            '<div class="field"><label for="setNew">New cards per day</label><input class="input" id="setNew" type="number" min="0" max="100" value="' + attr(st.settings.newPerDay == null ? 12 : st.settings.newPerDay) + '"><div class="hint">Protects you from a 300-card day.</div></div>' +
          '</div>' +
          '<div class="form-actions"><button class="btn btn-primary" type="button" id="setSave">Save settings</button></div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-head"><div><h2>Appearance</h2><p>Theme and reading aids.</p></div></div>' +
          '<div class="form-actions" style="margin-top:0">' +
            '<button class="btn ' + (st.settings.theme !== 'light' ? 'btn-primary' : '') + '" type="button" id="setDark">' + icon('moon') + ' Dark</button>' +
            '<button class="btn ' + (st.settings.theme === 'light' ? 'btn-primary' : '') + '" type="button" id="setLight">' + icon('sun') + ' Light</button>' +
          '</div>' +
          '<label class="check" style="margin-top:14px"><input type="checkbox" id="setHints"' + (st.settings.codeHints !== false ? ' checked' : '') + '> Show extra code hints in the lab</label>' +
          '<div class="hr-label">Keyboard</div>' +
          '<div class="kv"><span>Command palette</span><b>Ctrl / ⌘ + K</b></div>' +
          '<div class="kv"><span>Reveal flashcard</span><b>Space</b></div>' +
          '<div class="kv"><span>Grade flashcard</span><b>1 – 4</b></div>' +
          '<div class="kv"><span>Answer quiz option</span><b>1 – 4</b></div>' +
          '<div class="kv"><span>Next quiz question</span><b>Enter</b></div>' +
          '<div class="kv"><span>Close overlays</span><b>Esc</b></div>' +
        '</div>' +
      '</div>' +

      '<div class="grid grid-2" style="margin-top:14px">' +
        '<div class="panel">' +
          '<div class="panel-head"><div><h2>Your stats</h2><p>Stored locally under <span class="mono">rapcoach.v1</span>.</p></div></div>' +
          '<div class="kv"><span>Lessons complete</span><b>' + p.done + ' / ' + p.total + ' (' + p.pct + '%)</b></div>' +
          '<div class="kv"><span>Average quiz best</span><b>' + (p.avgScore == null ? '—' : p.avgScore + '%') + '</b></div>' +
          '<div class="kv"><span>Cards in deck</span><b>' + cs.total + '</b></div>' +
          '<div class="kv"><span>Due now</span><b>' + cs.due + '</b></div>' +
          '<div class="kv"><span>Scheduled later</span><b>' + cs.later + '</b></div>' +
          '<div class="kv"><span>Examples</span><b>' + st.examples.length + '</b></div>' +
          '<div class="kv"><span>Custom cards</span><b>' + st.customCards.length + '</b></div>' +
          '<div class="kv"><span>Streak / best</span><b>' + (st.streak.current || 0) + ' / ' + (st.streak.best || 0) + ' days</b></div>' +
          '<div class="kv"><span>Stored size</span><b>' + kb + ' KB</b></div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-head"><div><h2>Backup & restore</h2><p>One JSON file holds everything.</p></div></div>' +
          '<p class="tiny muted">Export before clearing browser data. Import merges over the current state — it replaces progress, cards and examples with the backup.</p>' +
          '<div class="form-actions">' +
            '<button class="btn btn-primary" type="button" id="btnExport">' + icon('down') + ' Export JSON</button>' +
            '<button class="btn" type="button" id="btnImport">' + icon('up') + ' Import JSON</button>' +
            '<input type="file" id="importFile" accept="application/json,.json" hidden>' +
          '</div>' +
          '<div class="hr-label">Danger zone</div>' +
          '<div class="form-actions" style="margin-top:0">' +
            '<button class="btn" type="button" id="btnResetProgress">Reset progress</button>' +
            '<button class="btn btn-danger" type="button" id="btnResetAll">Erase everything</button>' +
          '</div>' +
          '<div class="hint tiny" style="margin-top:8px">Reset progress keeps your examples and notes. Erase everything returns the app to first run.</div>' +
        '</div>' +
      '</div>' +

      '<div class="panel" style="margin-top:14px">' +
        '<div class="panel-head"><div><h2>About this coach</h2></div></div>' +
        '<p class="tiny muted">RAP Coach is a zero-install trainer: a static site with no accounts, no server and no tracking. It covers the ABAP RESTful Application Programming Model with 27 lessons, 6 modules, ' +
        allLessons().reduce(function (n, l) { return n + (l.keyPoints || []).length; }, 0) + ' recall cards, quizzes, a scaffolder and a personal example library. Content is a study aid — always verify against your release and the official SAP documentation.</p>' +
        '<div class="tag-row" style="margin-top:10px"><span class="tag">offline</span><span class="tag">localStorage</span><span class="tag">no build step</span><span class="tag">27 lessons</span></div>' +
      '</div>';

    return {
      html: html,
      meta: meta('settings', 'Settings', [{ label: 'Settings' }]),
      mount: function () {
        id('setSave').addEventListener('click', function () {
          var name = id('setName').value.trim();
          var goal = Math.max(1, Math.min(200, Number(id('setGoal').value) || 10));
          var newPer = Math.max(0, Math.min(100, Number(id('setNew').value) || 0));
          RC.store.setProfile({ name: name });
          RC.store.setSetting('dailyGoal', goal);
          RC.store.setSetting('newPerDay', newPer);
          RC.ui.toast('Settings saved');
        });

        id('setDark').addEventListener('click', function () {
          RC.store.setSetting('theme', 'dark');
          RC.store.applyTheme();
          RC.app.refresh();
        });
        id('setLight').addEventListener('click', function () {
          RC.store.setSetting('theme', 'light');
          RC.store.applyTheme();
          RC.app.refresh();
        });
        id('setHints').addEventListener('change', function (e) {
          RC.store.setSetting('codeHints', e.target.checked);
          RC.ui.toast(e.target.checked ? 'Code hints on' : 'Code hints off');
        });

        id('btnExport').addEventListener('click', function () {
          RC.ui.download('rap-coach-backup-' + RC.dates.today() + '.json', RC.store.exportData());
          RC.ui.toast('Backup downloaded');
        });

        var file = id('importFile');
        id('btnImport').addEventListener('click', function () { file.click(); });
        file.addEventListener('change', function () {
          var f = file.files && file.files[0];
          if (!f) return;
          var reader = new FileReader();
          reader.onload = function () {
            RC.ui.confirm({
              title: 'Replace with this backup?',
              message: 'Current progress, cards and examples will be replaced by the file contents.',
              confirmLabel: 'Import and replace'
            }).then(function (ok) {
              if (!ok) { file.value = ''; return; }
              try {
                RC.store.importData(String(reader.result));
                RC.store.applyTheme();
                RC.ui.toast('Backup imported');
                RC.app.refresh();
              } catch (e) {
                RC.ui.toast('Import failed: ' + e.message);
              }
              file.value = '';
            });
          };
          reader.onerror = function () { RC.ui.toast('Could not read that file'); file.value = ''; };
          reader.readAsText(f);
        });

        id('btnResetProgress').addEventListener('click', function () {
          RC.ui.confirm({
            title: 'Reset all progress?',
            message: 'Lesson completion, quiz scores, review history and streaks are cleared. Examples, custom cards and settings stay.',
            confirmLabel: 'Reset progress',
            danger: true
          }).then(function (ok) {
            if (!ok) return;
            RC.store.resetProgress();
            RC.ui.toast('Progress reset');
            RC.app.refresh();
          });
        });

        id('btnResetAll').addEventListener('click', function () {
          RC.ui.confirm({
            title: 'Erase everything?',
            message: 'This removes progress, cards, examples, notes and settings from this browser. It cannot be undone — export a backup first if you might want it.',
            confirmLabel: 'Erase everything',
            danger: true
          }).then(function (ok) {
            if (!ok) return;
            RC.store.resetAll();
            RC.store.applyTheme();
            RC.ui.toast('Everything erased');
            RC.app.refresh();
          });
        });
      }
    };
  }

  /* ---------------- export ---------------- */
  RC.views = RC.views || {};
  RC.views.home = home;
  RC.views.learn = learn;
  RC.views.lesson = lessonView;
  RC.views.quiz = quizView;
  RC.views.practice = practice;
  RC.views.lab = lab;
  RC.views.examples = examplesView;
  RC.views.reference = reference;
  RC.views.troubleshoot = troubleshoot;
  RC.views.settings = settings;
  RC.views.notFound = notFound;
})();
