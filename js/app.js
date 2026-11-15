/* ==========================================================================
   RAP Coach — app
   Boot, routing, palette source, global keyboard and copy handling.
   ========================================================================== */
(function () {
  'use strict';

  var RC = window.RC;
  var esc = RC.ui.esc;

  var KNOWN = {
    home: 1, learn: 1, lesson: 1, quiz: 1, practice: 1,
    lab: 1, examples: 1, reference: 1, troubleshoot: 1, settings: 1
  };

  var currentMeta = null;
  var lastPath = null;

  /* ---------------- palette ---------------- */
  function paletteItems() {
    var items = [];

    items.push({ kind: 'Command', title: 'Continue studying', sub: 'Open the next unfinished lesson', tag: 'run', icon: '▸', keywords: 'lesson resume next', run: function () { var l = RC.store.nextLesson(); if (l) RC.ui.go('lesson/' + l.id); } });
    items.push({ kind: 'Command', title: 'Start a card review', sub: 'Practice due flashcards', tag: 'run', icon: '▸', keywords: 'practice srs study', run: function () { RC.views.practiceTab = 'cards'; RC.ui.go('practice'); } });
    items.push({ kind: 'Command', title: 'Take the mixed quiz', sub: 'Twelve questions from all modules', tag: 'run', icon: '▸', keywords: 'test exam questions', run: function () { RC.ui.go('quiz/mix'); } });
    items.push({ kind: 'Command', title: 'Scaffold a business object', sub: 'Open the RAP generator', tag: 'run', icon: '▸', keywords: 'generate bdef cds service', run: function () { RC.views.labTab = 'gen'; RC.ui.go('lab'); } });
    items.push({ kind: 'Command', title: 'Check code with the doctor', sub: 'Heuristic review of a BDEF or CDS view', tag: 'run', icon: '▸', keywords: 'lint validate check', run: function () { RC.views.labTab = 'doctor'; RC.ui.go('lab'); } });
    items.push({ kind: 'Command', title: 'Save a new example', sub: 'Your own code plus notes', tag: 'run', icon: '▸', keywords: 'note snippet code', run: function () { RC.ui.go('examples/new'); } });
    items.push({ kind: 'Command', title: 'Toggle theme', sub: 'Switch dark / light', tag: 'run', icon: '▸', keywords: 'dark light appearance', run: function () { RC.store.toggleTheme(); refreshShell(); } });
    items.push({ kind: 'Command', title: 'Export a backup', sub: 'Download all local data as JSON', tag: 'run', icon: '▸', keywords: 'save json download', run: function () { RC.ui.download('rap-coach-backup-' + RC.dates.today() + '.json', RC.store.exportData()); RC.ui.toast('Backup downloaded'); } });
    items.push({ kind: 'Command', title: 'Open settings', sub: 'Goals, theme, import/export', tag: 'run', icon: '▸', keywords: 'profile backup reset', run: function () { RC.ui.go('settings'); } });

    RC.content.lessons.forEach(function (l) {
      items.push({
        kind: 'Lesson', title: l.title, tag: l.level || 'lesson', icon: '§',
        sub: l.moduleTitle + ' · ' + l.minutes + ' min',
        keywords: [l.summary, (l.tags || []).join(' '), l.moduleTitle].join(' '),
        run: function () { RC.ui.go('lesson/' + l.id); }
      });
    });

    RC.store.state.examples.forEach(function (ex) {
      items.push({
        kind: 'Example', title: ex.title, tag: 'mine', icon: '✎',
        sub: (ex.tags || []).join(' · ') || 'My example',
        keywords: (ex.tags || []).join(' ') + ' ' + (ex.notes || ''),
        run: function () { RC.ui.go('examples/' + ex.id); }
      });
    });

    RC.reference.annotations.forEach(function (a) {
      items.push({
        kind: 'Reference', title: a.name, tag: 'annotation', icon: 'ƒ',
        sub: a.target, keywords: a.effect + ' ' + a.example,
        run: function () { RC.views.referenceTab = 'annotations'; RC.ui.go('reference'); }
      });
    });

    RC.reference.glossary.forEach(function (g) {
      items.push({
        kind: 'Glossary', title: g.term, tag: 'term', icon: '?',
        sub: g.def.slice(0, 110), keywords: g.def,
        run: function () { RC.views.referenceTab = 'glossary'; RC.ui.go('reference'); }
      });
    });

    RC.reference.snippets.forEach(function (s) {
      items.push({
        kind: 'Snippet', title: s.title, tag: 'code', icon: '{}',
        sub: s.note || 'Working example',
        keywords: s.note + ' ' + s.code.slice(0, 300),
        run: function () { RC.views.referenceTab = 'snippets'; RC.ui.go('reference'); }
      });
    });

    RC.reference.troubleshooting.forEach(function (t) {
      items.push({
        kind: 'Troubleshooting', title: t.title, tag: 'fix', icon: '⌕',
        sub: t.symptom.slice(0, 110),
        keywords: t.symptom + ' ' + t.cause + ' ' + t.fix + ' ' + (t.code || ''),
        run: function () { RC.ui.go('troubleshoot'); }
      });
    });

    return items;
  }

  /* ---------------- routing ---------------- */
  function render() {
    var route = RC.ui.route();
    RC.views.flashKey = null;
    RC.ui.currentRoute = route;

    var viewFn = KNOWN[route.name] ? RC.views[route.name] : RC.views.notFound;
    var out;
    try {
      out = viewFn(route.param, route.query);
    } catch (err) {
      if (window.console) console.error(err);
      out = RC.views.notFound('The view failed to render: ' + (err && err.message ? err.message : 'unknown error'));
      out.meta = { active: 'home', title: 'Error', crumbs: [{ label: 'Error' }] };
      out.html = '<div style="padding-top:30px"><div class="callout danger"><div class="c-ico">×</div><div class="c-body">' +
        '<div class="c-title">Something went wrong</div>' + esc(err && err.message ? err.message : 'Unknown error') +
        '</div></div>' + out.html + '</div>';
    }

    if (!out || typeof out.html !== 'string') {
      out = RC.views.notFound('That route is not available.');
    }

    currentMeta = out.meta || { active: 'home', title: 'RAP Coach', crumbs: [{ label: 'RAP Coach' }] };

    var view = document.getElementById('view');
    var inner = document.getElementById('viewInner');
    var samePath = lastPath === (location.hash || '#/home');
    var keepScroll = view ? view.scrollTop : 0;

    if (inner) {
      inner.className = 'view-inner' + (out.wide ? ' wide' : '');
      inner.innerHTML = out.html;
    }

    RC.ui.setShell(currentMeta.active, { crumbs: currentMeta.crumbs });

    document.title = (currentMeta.title && currentMeta.title !== 'RAP Coach'
      ? currentMeta.title + ' · RAP Coach'
      : 'RAP Coach — Learn SAP RAP Business Objects');

    if (typeof out.mount === 'function' && inner) {
      try { out.mount(inner); }
      catch (err2) {
        if (window.console) console.error(err2);
        RC.ui.toast('Part of this view failed to load');
      }
    }

    if (view) {
      if (samePath) view.scrollTop = keepScroll;
      else view.scrollTop = 0;
    }

    closeMobileNav();
    lastPath = location.hash || '#/home';

    if (KNOWN[route.name]) {
      RC.store.state.lastRoute = lastPath;
      try { RC.store.persist(); } catch (e) { /* ignore */ }
    }
  }

  function refreshShell() {
    if (!currentMeta) return;
    RC.ui.setShell(currentMeta.active, { crumbs: currentMeta.crumbs });
  }

  function closeMobileNav() {
    var sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
    var btn = document.getElementById('menuBtn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    var scrim = document.querySelector('.sidebar-scrim');
    if (scrim) scrim.remove();
  }

  function closeOverlays() {
    RC.ui.closePalette();
    RC.ui.closeModal();
  }

  /* ---------------- boot ---------------- */
  function boot() {
    var root = document.getElementById('root');
    if (!root) return;

    /* restore the last real route before the hashchange listener exists */
    if (!location.hash || location.hash === '#' || location.hash === '#/') {
      var last = RC.store.state.lastRoute;
      if (last && last.indexOf('#/') === 0) {
        try { location.hash = last; } catch (e) { /* ignore */ }
      }
    }

    root.innerHTML = RC.ui.shell();

    /* the palette source is called on open */
    RC.ui.setPaletteSource(paletteItems);

    /* keep the shell fresh when data changes; never touch the view */
    RC.store.subscribe(function () { refreshShell(); });

    /* ---- overlay input ---- */
    var paletteInput = document.getElementById('paletteInput');
    if (paletteInput) {
      paletteInput.addEventListener('input', function () {
        RC.ui.renderPaletteResults(paletteInput.value);
      });
    }

    var palette = document.getElementById('palette');
    if (palette) {
      palette.addEventListener('click', function (e) {
        if (e.target === palette) RC.ui.closePalette();
      });
    }

    var modal = document.getElementById('modal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) RC.ui.closeModal();
        var close = e.target.closest && e.target.closest('[data-close-modal]');
        if (close) RC.ui.closeModal();
      });
    }

    /* ---- copy delegation ---- */
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-copy]') : null;
      if (!btn) return;
      var key = btn.getAttribute('data-copy');
      var code = RC.code.blocks[key];
      if (code == null) return;
      RC.ui.copyText(code);
      btn.textContent = 'Copied';
      setTimeout(function () { btn.textContent = 'Copy'; }, 1400);
    });

    /* ---- global keyboard ---- */
    document.addEventListener('keydown', function (e) {
      var key = e.key;
      var mod = e.ctrlKey || e.metaKey;
      var palette = document.getElementById('palette');
      var paletteOpen = palette && !palette.hidden;

      /* command palette toggle */
      if (mod && (key === 'k' || key === 'K')) {
        e.preventDefault();
        if (paletteOpen) RC.ui.closePalette();
        else RC.ui.openPalette();
        return;
      }

      if (key === 'Escape') {
        if (paletteOpen) { RC.ui.closePalette(); return; }
        var modal = document.getElementById('modal');
        if (modal && !modal.hidden) { RC.ui.closeModal(); return; }
        closeMobileNav();
        return;
      }

      /* palette navigation while open */
      if (paletteOpen) {
        if (key === 'ArrowDown') { e.preventDefault(); RC.ui.movePalette(1); return; }
        if (key === 'ArrowUp') { e.preventDefault(); RC.ui.movePalette(-1); return; }
        if (key === 'Enter') {
          e.preventDefault();
          var sel = document.querySelector('#paletteResults .p-result.sel');
          if (sel) sel.click();
          return;
        }
        return;
      }

      if (mod || e.altKey) return;
      var tag = (e.target && e.target.tagName) || '';
      var editing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable);
      var route = RC.ui.currentRoute || RC.ui.route();

      /* quiz: 1–4 answers, Enter next */
      if (!editing && route.name === 'quiz') {
        if (/^[1-4]$/.test(key)) {
          var opts = document.querySelectorAll('#quizBody .option');
          var pick = opts[Number(key) - 1];
          if (pick && !pick.classList.contains('locked')) {
            e.preventDefault();
            pick.click();
          }
          return;
        }
        if (key === 'Enter') {
          var next = document.getElementById('quizNext');
          if (next) { e.preventDefault(); next.click(); return; }
          var retry = document.getElementById('quizRetry');
          if (retry && document.activeElement === document.body) { e.preventDefault(); retry.click(); return; }
        }
      }

      /* flashcards: Space reveals, 1–4 grade */
      if (!editing && route.name === 'practice' && RC.views.practiceTab === 'cards' && typeof RC.views.flashKey === 'function') {
        if (key === ' ' || key === 'Spacebar') {
          if (tag !== 'BUTTON' && tag !== 'A') { e.preventDefault(); RC.views.flashKey('space'); }
          return;
        }
        if (/^[1-4]$/.test(key)) {
          e.preventDefault();
          RC.views.flashKey(key);
          return;
        }
      }

      /* focus search with / */
      if (key === '/' && !editing) {
        e.preventDefault();
        RC.ui.openPalette();
        return;
      }
    });

    /* ---- lifecycle ---- */
    window.addEventListener('hashchange', render);
    window.addEventListener('beforeunload', function () { try { RC.store.persist(); } catch (e) { /* ignore */ } });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') { try { RC.store.persist(); } catch (e) { /* ignore */ } }
    });

    render();
  }

  RC.app = {
    refresh: function () { render(); },
    refreshShell: refreshShell,
    boot: boot,
    closeMobileNav: closeMobileNav
  };

  boot();
})();
