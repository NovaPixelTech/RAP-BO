/* ==========================================================================
   RAP Coach — UI utilities
   Shell, markdown-lite renderer, palette, modal, toast, copy.
   ========================================================================== */
(function () {
  'use strict';
  var RC = (window.RC = window.RC || {});
  var esc = RC.code.escape;

  /* ---------------- icons ---------------- */
  var PATHS = {
    home: 'M12 3 2 11h3v9h6v-6h2v6h6v-9h3z',
    book: 'M5 3h12a3 3 0 0 1 3 3v15H7a3 3 0 0 1-3-3zm3 2v11h9V6a1 1 0 0 0-1-1z',
    cards: 'M4 7h10v9H4zm2-4h12v2H8v9H6zM17 5h2v12h-2z',
    lab: 'M9 3h6v2h-1v4l5 9a2 2 0 0 1-1.8 3H6.8A2 2 0 0 1 5 18l5-9V5H9zm0 13h6l-3-5.4z',
    folder: 'M3 5h7l2 2h9v12H3z',
    openbook: 'M3 5h7a3 3 0 0 1 3 3v11a3 3 0 0 0-3-3H3zm18 0h-7a3 3 0 0 0-3 3v11a3 3 0 0 1 3-3h7z',
    lifebuoy: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 0 1 3.3 1l-2 2a3.5 3.5 0 0 0-2.6 0l-2-2A6 6 0 0 1 12 6zm-6 6a6 6 0 0 1 1-3.3l2 2a3.5 3.5 0 0 0 0 2.6l-2 2A6 6 0 0 1 6 12zm6 6a6 6 0 0 1-3.3-1l2-2a3.5 3.5 0 0 0 2.6 0l2 2A6 6 0 0 1 12 18zm6-6a6 6 0 0 1-1 3.3l-2-2a3.5 3.5 0 0 0 0-2.6l2-2A6 6 0 0 1 18 12z',
    gear: 'M4 5h9v2H4zm13 0h3v2h-3zM4 11h3v2H4zm7 0h9v2h-9zM4 17h9v2H4zm13 0h3v2h-3z',
    search: 'M10 4a6 6 0 1 0 3.5 10.9l4.8 4.8 1.4-1.4-4.8-4.8A6 6 0 0 0 10 4Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z',
    flame: 'M12 2c4 5 6 7 6 10a6 6 0 0 1-12 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3 1-6 2-9z',
    check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
    arrow: 'M13 5l7 7-7 7-1.4-1.4 4.6-4.6H4v-2h12.2l-4.6-4.6z',
    plus: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z',
    down: 'M11 3h2v9l3-3 1.4 1.4L12 16 6.6 10.4 8 9l3 3zM5 18h14v2H5z',
    up: 'M11 21h2v-9l3 3 1.4-1.4L12 8 6.6 13.6 8 15l3-3zM5 4h14V2H5z',
    trash: 'M9 3h6l1 2h4v2H4V5h4zM6 8h12v13H6z',
    edit: 'M4 17.2V20h2.8L18 8.8 15.2 6zM20.7 6.3l-1-1a1 1 0 0 0-1.4 0L17 6.6l2.8 2.8 1.4-1.4a1 1 0 0 0 0-1.4z',
    play: 'M8 5v14l11-7z',
    clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5h-2v6l5 3 1-1.7-4-2.3z',
    target: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z',
    sun: 'M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0-4h-1v3h2V2zm0 17h-1v3h2v-3zM2 11v2h3v-2zm17 0v2h3v-2zM4.2 5.6 2.8 7l2.1 2.1 1.4-1.4zm13 13L15.8 20l2.1 2.1 1.4-1.4zM19.8 5.6l-2.1 2.1 1.4 1.4L21.2 7zM5 16.9l-2.2 2.1 1.4 1.4 2.1-2.1z',
    moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
    menu: 'M3 5h18v2H3zm0 6h18v2H3zm0 6h18v2H3z',
    x: 'M6 4 4 6l6 6-6 6 2 2 6-6 6 6 2-2-6-6 6-6-2-2-6 6z',
    copy: 'M8 4h10a2 2 0 0 1 2 2v10h-2V6H8zM4 8h10a2 2 0 0 1 2 2v10H4z',
    quiz: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2zm1.8-6.2-.9.9c-.7.7-.9 1.1-.9 2.3h-2c0-1.7.4-2.4 1.3-3.3l1.2-1.2a1.8 1.8 0 0 0-1.4-3 2 2 0 0 0-2 2H8a4 4 0 1 1 6.8 2.9z',
    spark: 'M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z'
  };
  function icon(name, cls) {
    var p = PATHS[name] || PATHS.spark;
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + p + '"/></svg>';
  }

  /* ---------------- basics ---------------- */
  function inline(text) {
    var s = esc(String(text == null ? '' : text));
    s = s.replace(/`([^`]+)`/g, '<code class="inline">$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    return s;
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  function relDay(key) {
    if (!key) return '—';
    var t = RC.dates.today();
    var diff = RC.dates.diffDays(key, t);
    if (diff === 0) return 'today';
    if (diff === 1) return 'yesterday';
    if (diff > 1 && diff < 7) return diff + ' days ago';
    if (diff === -1) return 'tomorrow';
    if (diff < -1 && diff > -7) return 'in ' + (-diff) + ' days';
    return key;
  }
  function initials(name) {
    var n = String(name || '').trim();
    if (!n) return 'RC';
    var parts = n.split(/\s+/).slice(0, 2);
    return parts.map(function (p) { return p.charAt(0).toUpperCase(); }).join('');
  }
  function badge(level) {
    if (!level) return '';
    return '<span class="badge ' + esc(level) + '">' + esc(level) + '</span>';
  }
  function progress(pct, cls) {
    var p = Math.max(0, Math.min(100, Math.round(pct || 0)));
    return '<div class="progress ' + (cls || '') + '" role="progressbar" aria-valuenow="' + p +
      '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + p + '%"></i></div>';
  }
  function ring(pct, label) {
    var p = Math.max(0, Math.min(100, Math.round(pct || 0)));
    return '<div class="ring" style="--p:' + p + '"><span>' + p + '%</span></div>' +
      (label ? '<div class="ring-label">' + label + '</div>' : '');
  }
  function empty(opts) {
    return '<div class="empty"><div class="e-ico">' + (opts.icon || '◇') + '</div>' +
      '<h3>' + esc(opts.title || 'Nothing here yet') + '</h3>' +
      '<p>' + inline(opts.text || '') + '</p>' +
      (opts.action || '') + '</div>';
  }

  /* ---------------- sections renderer ---------------- */
  function renderSections(sections) {
    var html = '', hCount = 0, toc = [];
    (sections || []).forEach(function (s) {
      if (!s || !s.t) {
        if (s && s.text) html += '<p>' + inline(s.text) + '</p>';
        return;
      }
      switch (s.t) {
        case 'h': {
          hCount++;
          var id = 'sec-' + hCount;
          toc.push({ id: id, text: s.text });
          html += '<h2 id="' + id + '"><span class="h-num">' + pad2(hCount) + '</span>' +
            '<span>' + inline(s.text) + '</span></h2>';
          break;
        }
        case 'p':
          html += '<p' + (s.cls ? ' class="' + esc(s.cls) + '"' : '') + '>' + inline(s.text) + '</p>';
          break;
        case 'list': {
          if (s.checked) {
            html += '<ul class="checklist">' + s.items.map(function (it) {
              return '<li>' + inline(it) + '</li>';
            }).join('') + '</ul>';
          } else {
            var tag = s.ordered ? 'ol' : 'ul';
            html += '<' + tag + '>' + s.items.map(function (it) {
              return '<li>' + inline(it) + '</li>';
            }).join('') + '</' + tag + '>';
          }
          break;
        }
        case 'code':
          html += RC.code.codeBlock({ code: s.code, lang: s.lang, title: s.title });
          break;
        case 'callout': {
          var tone = s.tone || 'info';
          var ico = tone === 'warn' ? '!' : tone === 'tip' ? '✦' : tone === 'danger' ? '×' : tone === 'why' ? '?' : 'i';
          var title = s.title || ({ tip: 'Tip', warn: 'Watch out', danger: 'Danger', why: 'Why' }[tone] || 'Note');
          html += '<div class="callout ' + esc(tone) + '"><div class="c-ico">' + ico + '</div>' +
            '<div class="c-body"><div class="c-title">' + esc(title) + '</div>' +
            '<div>' + inline(s.text || '') + '</div></div></div>';
          break;
        }
        case 'table': {
          html += '<div class="table-wrap"><table class="data"><thead><tr>' +
            (s.head || []).map(function (h) { return '<th>' + inline(h) + '</th>'; }).join('') +
            '</tr></thead><tbody>' +
            (s.rows || []).map(function (r) {
              return '<tr>' + r.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>';
            }).join('') + '</tbody></table></div>';
          break;
        }
        case 'steps': {
          html += '<div class="steps">' + (s.items || []).map(function (it, i) {
            return '<div class="step"><div class="step-num">' + (i + 1) + '</div>' +
              '<div><div class="step-title">' + inline(it.title) + '</div>' +
              '<div class="step-body">' + inline(it.body) + '</div></div></div>';
          }).join('') + '</div>';
          break;
        }
        case 'compare': {
          html += '<div class="compare">' + [s.left, s.right].map(function (col) {
            if (!col) return '';
            return '<div class="compare-col"><h4>' + inline(col.title) + '</h4><ul>' +
              (col.items || []).map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') +
              '</ul></div>';
          }).join('') + '</div>';
          break;
        }
        default:
          if (s.text) html += '<p>' + inline(s.text) + '</p>';
      }
    });
    return { html: html, toc: toc };
  }

  /* ---------------- copy / toast / modal ---------------- */
  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2600);
  }
  function copyText(text, okMsg) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); toast(okMsg || 'Copied to clipboard'); }
      catch (e) { toast('Could not copy — select it manually'); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast(okMsg || 'Copied to clipboard'); }, fallback);
    } else fallback();
  }

  var modalActions = [];
  function openModal(opts) {
    var modal = document.getElementById('modal');
    var title = document.getElementById('modalTitle');
    var body = document.getElementById('modalBody');
    var foot = document.getElementById('modalFoot');
    if (!modal) return;
    title.textContent = opts.title || 'Dialog';
    body.innerHTML = opts.body || '';
    foot.innerHTML = '';
    modalActions = opts.actions || [];
    modalActions.forEach(function (a, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn ' + (a.class || 'btn-ghost');
      b.textContent = a.label;
      b.addEventListener('click', function () {
        if (a.onClick) a.onClick();
        else closeModal();
      });
      foot.appendChild(b);
    });
    if (!modalActions.length) {
      var close = document.createElement('button');
      close.type = 'button';
      close.className = 'btn btn-ghost';
      close.textContent = 'Close';
      close.addEventListener('click', closeModal);
      foot.appendChild(close);
    }
    modal.hidden = false;
    setTimeout(function () {
      var first = foot.querySelector('button');
      if (first) first.focus();
    }, 20);
  }
  function closeModal() {
    var m = document.getElementById('modal');
    if (m) m.hidden = true;
    modalActions = [];
  }
  function confirm(opts) {
    return new Promise(function (resolve) {
      openModal({
        title: opts.title || 'Are you sure?',
        body: '<p>' + inline(opts.message || '') + '</p>',
        actions: [
          { label: opts.cancelLabel || 'Cancel', class: 'btn-ghost', onClick: function () { closeModal(); resolve(false); } },
          {
            label: opts.confirmLabel || 'Confirm',
            class: opts.danger ? 'btn-danger' : 'btn-primary',
            onClick: function () { closeModal(); resolve(true); }
          }
        ]
      });
    });
  }

  /* ---------------- shell ---------------- */
  var NAV_MAIN = [
    { route: 'home', label: 'Dashboard', icon: 'home' },
    { route: 'learn', label: 'Learn', icon: 'book' },
    { route: 'practice', label: 'Practice', icon: 'cards', badge: 'due' },
    { route: 'lab', label: 'Lab', icon: 'lab' }
  ];
  var NAV_LIB = [
    { route: 'examples', label: 'My examples', icon: 'folder', badge: 'examples' },
    { route: 'reference', label: 'Reference', icon: 'openbook' },
    { route: 'troubleshoot', label: 'Troubleshooting', icon: 'lifebuoy' },
    { route: 'settings', label: 'Settings', icon: 'gear' }
  ];

  function navItem(item, active) {
    var badge = '';
    if (item.badge === 'due') {
      var n = RC.store.cardStats().due;
      if (n > 0) badge = '<span class="nav-badge hot">' + n + '</span>';
    } else if (item.badge === 'examples') {
      var ex = RC.store.state.examples.length;
      if (ex) badge = '<span class="nav-badge">' + ex + '</span>';
    }
    return '<a class="nav-item' + (active === item.route ? ' active' : '') + '" href="#/' + item.route + '">' +
      '<span class="nav-ico">' + icon(item.icon) + '</span>' +
      '<span>' + esc(item.label) + '</span>' + badge + '</a>';
  }

  function sidebarHTML(active) {
    var st = RC.store.state;
    var p = RC.store.progress();
    var next = RC.store.nextLesson();
    var due = RC.store.cardStats().due;
    var goal = st.settings.dailyGoal || 10;
    var todayReviews = (st.activity[RC.dates.today()] || {}).reviews || 0;

    var upNext = next
      ? '<div class="side-block">' +
        '<div class="side-block-head"><span>Up next</span><span class="mono">' + p.pct + '%</span></div>' +
        '<strong>' + esc(next.title) + '</strong>' +
        progress(p.pct, 'sm') +
        '<a class="btn btn-primary btn-sm" href="#/lesson/' + esc(next.id) + '">Continue study</a>' +
        '</div>'
      : '';

    return '<a class="brand" href="#/home" aria-label="RAP Coach home">' +
      '<span class="brand-mark">{}</span>' +
      '<span><span class="brand-name">RAP Coach</span><br><span class="brand-sub">SAP RAP BO trainer</span></span>' +
      '</a>' +
      '<nav class="nav" aria-label="Primary">' +
      '<div class="nav-label">Study</div>' +
      NAV_MAIN.map(function (i) { return navItem(i, active); }).join('') +
      '<div class="nav-label">Library</div>' +
      NAV_LIB.map(function (i) { return navItem(i, active); }).join('') +
      '</nav>' +
      '<div class="side-foot">' +
      (due > 0
        ? '<a class="side-block" href="#/practice" style="margin-bottom:9px;text-decoration:none">' +
          '<div class="side-block-head"><span>Due today</span><span class="badge accent">' + due + '</span></div>' +
          '<strong>' + (due === 1 ? '1 card to review' : due + ' cards to review') + '</strong>' +
          '<div class="side-block-head"><span>Goal ' + goal + '/day</span><span class="mono">' +
          Math.min(100, Math.round((todayReviews / goal) * 100)) + '%</span></div>' +
          progress(Math.min(100, (todayReviews / goal) * 100), 'sm') +
          '</a>'
        : '') +
      upNext +
      '<div class="side-block-head" style="padding:12px 8px 0;font-size:11px;color:var(--muted-2)">' +
      '<span>' + (st.profile.name ? esc(st.profile.name) : 'Local-first · no account') + '</span>' +
      '<span class="mono">v1</span></div>' +
      '</div>';
  }

  function topbarHTML(meta) {
    var st = RC.store.state;
    var streak = st.streak.current || 0;
    var theme = st.settings.theme === 'light' ? 'sun' : 'moon';
    return '<button class="icon-btn mobile-only" type="button" id="menuBtn" aria-label="Open navigation" aria-expanded="false">' + icon('menu') + '</button>' +
      '<div class="crumbs">' +
      (meta.crumbs || []).map(function (c, i, arr) {
        var part = c.href
          ? '<a href="' + esc(c.href) + '">' + esc(c.label) + '</a>'
          : '<span class="now">' + esc(c.label) + '</span>';
        return (i ? '<span class="sep">/</span>' : '') + part;
      }).join('') +
      '</div>' +
      '<div class="topbar-actions">' +
      '<button class="search-trigger" type="button" id="searchBtn" aria-label="Search everything (Ctrl+K)">' +
      icon('search') + '<span class="st-label">Search or jump to…</span>' +
      '<span class="kbd-wrap"><kbd>Ctrl</kbd><kbd>K</kbd></span></button>' +
      '<span class="streak-pill" title="Study streak">' + icon('flame', '') +
      '<b>' + streak + '</b><span>day' + (streak === 1 ? '' : 's') + '</span></span>' +
      '<button class="icon-btn" type="button" id="themeBtn" aria-label="Toggle light/dark theme">' + icon(theme) + '</button>' +
      '<a class="avatar" href="#/settings" title="' + esc(st.profile.name || 'Settings') + '" aria-label="Settings">' +
      esc(initials(st.profile.name)) + '</a>' +
      '</div>';
  }

  function shell() {
    return '<div class="app">' +
      '<aside class="sidebar" id="sidebar" aria-label="Sidebar"></aside>' +
      '<div class="main">' +
      '<header class="topbar" id="topbar"></header>' +
      '<main class="view" id="view" tabindex="-1"><div class="view-inner" id="viewInner"></div></main>' +
      '</div>' +
      '</div>';
  }

  var currentRoute = { name: 'home', param: '' };

  function route() {
    var raw = (location.hash || '#/home').replace(/^#\/?/, '');
    var q = '';
    var qi = raw.indexOf('?');
    if (qi >= 0) { q = raw.slice(qi + 1); raw = raw.slice(0, qi); }
    var parts = raw.split('/').filter(Boolean);
    var name = parts[0] || 'home';
    var param = parts.slice(1).join('/');
    return { name: name, param: decodeURIComponent(param), query: q };
  }
  function go(path) {
    if (location.hash === '#/' + path) {
      RC.app && RC.app.refresh && RC.app.refresh();
    } else {
      location.hash = '#/' + path;
    }
  }

  function setShell(active, meta) {
    var sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.innerHTML = sidebarHTML(active);
    var topbar = document.getElementById('topbar');
    if (topbar) topbar.innerHTML = topbarHTML(meta || {});
    var themeBtn = document.getElementById('themeBtn');
    if (themeBtn) themeBtn.addEventListener('click', function () { RC.store.toggleTheme(); });
    var menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
      menuBtn.addEventListener('click', function () {
        var sb = document.getElementById('sidebar');
        var open = sb.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        var scrim = document.querySelector('.sidebar-scrim');
        if (open && !scrim) {
          scrim = document.createElement('div');
          scrim.className = 'sidebar-scrim';
          scrim.addEventListener('click', function () {
            sb.classList.remove('open');
            menuBtn.setAttribute('aria-expanded', 'false');
            scrim.remove();
          });
          document.body.appendChild(scrim);
        } else if (!open && scrim) scrim.remove();
      });
    }
    var searchBtn = document.getElementById('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', openPalette);
  }

  /* ---------------- palette ---------------- */
  var paletteSource = function () { return []; };
  var paletteState = { items: [], filtered: [], sel: 0 };

  function setPaletteSource(fn) { paletteSource = fn; }

  function normalize(s) { return String(s || '').toLowerCase(); }

  function filterPalette(query) {
    var items = paletteState.items;
    var q = normalize(query).trim();
    var onlyCommands = q.charAt(0) === '>';
    if (onlyCommands) q = q.slice(1).trim();
    if (!q) {
      var base = onlyCommands ? items.filter(function (it) { return it.kind === 'Command'; }) : items;
      return base.slice(0, 30);
    }
    var tokens = q.split(/\s+/).filter(Boolean);
    var scored = [];
    items.forEach(function (it) {
      if (onlyCommands && it.kind !== 'Command') return;
      var title = normalize(it.title);
      var blob = normalize(it.title + ' ' + (it.sub || '') + ' ' + (it.keywords || ''));
      var ok = tokens.every(function (t) { return blob.indexOf(t) >= 0; });
      if (!ok) return;
      var score = 0;
      if (title === q) score += 100;
      if (title.indexOf(q) === 0) score += 40;
      else if (title.indexOf(q) > -1) score += 20;
      tokens.forEach(function (t) { if (title.indexOf(t) >= 0) score += 8; });
      if (it.kind === 'Command') score += 2;
      scored.push({ it: it, score: score });
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, 40).map(function (x) { return x.it; });
  }

  function renderPaletteResults(query) {
    var box = document.getElementById('paletteResults');
    if (!box) return;
    var list = filterPalette(query);
    paletteState.filtered = list;
    if (!list.length) {
      box.innerHTML = '<div class="palette-empty">No matches. Try "behavior", "draft", "actions", or ">" for commands.</div>';
      return;
    }
    if (paletteState.sel >= list.length) paletteState.sel = 0;
    var html = '', lastGroup = '';
    list.forEach(function (it, idx) {
      if (it.kind !== lastGroup) {
        html += '<div class="p-group">' + esc(it.kind) + '</div>';
        lastGroup = it.kind;
      }
      html += '<button class="p-result' + (idx === paletteState.sel ? ' sel' : '') + '" type="button" role="option" aria-selected="' + (idx === paletteState.sel) + '" data-idx="' + idx + '">' +
        '<span class="p-ico">' + (it.icon || '›') + '</span>' +
        '<span class="p-body"><span class="p-title">' + esc(it.title) + '</span>' +
        '<span class="p-sub">' + esc(it.sub || '') + '</span></span>' +
        '<span class="p-kind">' + esc(it.tag || '') + '</span></button>';
    });
    box.innerHTML = html;
    box.querySelectorAll('.p-result').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var it = paletteState.filtered[Number(btn.dataset.idx)];
        if (it) runPaletteItem(it);
      });
    });
  }

  function runPaletteItem(it) {
    closePalette();
    if (it && typeof it.run === 'function') it.run();
  }

  function openPalette() {
    paletteState.items = paletteSource() || [];
    paletteState.sel = 0;
    var p = document.getElementById('palette');
    var input = document.getElementById('paletteInput');
    if (!p || !input) return;
    p.hidden = false;
    input.value = '';
    renderPaletteResults('');
    setTimeout(function () { input.focus(); }, 20);
  }
  function closePalette() {
    var p = document.getElementById('palette');
    if (p) p.hidden = true;
  }

  function movePalette(delta) {
    var n = paletteState.filtered.length;
    if (!n) return;
    paletteState.sel = (paletteState.sel + delta + n) % n;
    var box = document.getElementById('paletteResults');
    if (!box) return;
    box.querySelectorAll('.p-result').forEach(function (b, i) {
      b.classList.toggle('sel', i === paletteState.sel);
      b.setAttribute('aria-selected', i === paletteState.sel ? 'true' : 'false');
    });
    var sel = box.querySelector('.p-result.sel');
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  /* ---------------- export helper ---------------- */
  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime || 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  RC.ui = {
    icon: icon,
    inline: inline,
    esc: esc,
    badge: badge,
    progress: progress,
    ring: ring,
    empty: empty,
    renderSections: renderSections,
    toast: toast,
    copyText: copyText,
    modal: openModal,
    closeModal: closeModal,
    confirm: confirm,
    shell: shell,
    setShell: setShell,
    route: route,
    go: go,
    get currentRoute() { return currentRoute; },
    set currentRoute(v) { currentRoute = v; },
    setPaletteSource: setPaletteSource,
    openPalette: openPalette,
    closePalette: closePalette,
    renderPaletteResults: renderPaletteResults,
    movePalette: movePalette,
    runPaletteItem: runPaletteItem,
    paletteFilter: filterPalette,
    fmtDate: fmtDate,
    relDay: relDay,
    initials: initials,
    download: download
  };
})();
