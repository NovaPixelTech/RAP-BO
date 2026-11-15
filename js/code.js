/* ==========================================================================
   RAP Coach — code utilities
   A small ABAP highlighter, a RAP artifact generator, and a heuristic linter.
   ========================================================================== */
(function () {
  'use strict';
  var RC = (window.RC = window.RC || {});
  var blocks = {};
  var seq = 0;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ------------------------------------------------------------------ */
  /* ABAP highlighter                                                    */
  /* ------------------------------------------------------------------ */
  var KW = {};
  ('ABSTRACT ADD ALIAS ALL AND APPEND AS ASCENDING ASSOCIATION AUTHORIZATION BEGIN BETWEEN BINARY ' +
   'BY CASE CAST CLASS CLIENT COMMIT COMPONENTS COMPOSITION COND CONSTANTS CREATE DATA DEFINE ' +
   'DELETE DEPENDENT DESCENDING DETERMINE DETERMINATION DIV DO DRAFT ELSE ELSEIF END ENDCLASS ' +
   'ENDIF ENDLOOP ENDMETHOD ENDSELECT ENTITY EQ ETAG EXECUTE EXTENSIBLE FAILED FIELD FIELDS FINAL ' +
   'FOR FROM FUNCTION GET GRANT GROUP HAVING IF IMPLEMENTATION IMPORTING IN INHERITING INITIAL ' +
   'INNER INSERT INTO IS JOIN KEY LATE LOCK LOOP MANDATORY MAPPING MASTER METHOD METHODS MODIFY ' +
   'NEW NOT NULL NUMBERING OF ON OPTIMIZED OR ORDER OUTER PARAMETER PERSISTENT PRIVATE PUBLIC ' +
   'RAISE READ READONLY REDEFINITION REFERENCE REPORTED RESULT RETURN ROLLBACK SELECT SET STATIC ' +
   'STRICT TABLE THEN TO TYPE TYPES UNION UNIQUE UPDATE VALUE VALUES VIEW WHEN WHERE WHILE WITH ' +
   'XOR')
    .split(' ').forEach(function (k) { KW[k] = 1; });

  function span(cls, text) { return '<span class="tok-' + cls + '">' + esc(text) + '</span>'; }

  function highlightAbap(src) {
    var out = '', i = 0, n = src.length;
    while (i < n) {
      var ch = src[i];

      // comment to end of line
      if (ch === '"') {
        var e = src.indexOf('\n', i);
        if (e === -1) e = n;
        out += span('com', src.slice(i, e));
        i = e;
        continue;
      }

      // string literal '...' ('' escapes a quote)
      if (ch === "'") {
        var j = i + 1;
        while (j < n) {
          if (src[j] === "'" && src[j + 1] === "'") { j += 2; continue; }
          if (src[j] === "'") { j++; break; }
          if (src[j] === '\n') break;
          j++;
        }
        out += span('str', src.slice(i, j));
        i = j;
        continue;
      }

      // text literal |...|
      if (ch === '|') {
        var k = i + 1;
        while (k < n && src[k] !== '|' && src[k] !== '\n') k++;
        if (k < n && src[k] === '|') k++;
        out += span('str', src.slice(i, k));
        i = k;
        continue;
      }

      // annotation / pseudo value
      if (ch === '@' || ch === '#') {
        var m = src.slice(i).match(ch === '@' ? /^@[A-Za-z_][A-Za-z0-9_.]*/ : /^#[A-Za-z_][A-Za-z0-9_.]*/);
        if (m) {
          out += span('anno', m[0]);
          i += m[0].length;
          continue;
        }
      }

      // field symbol / pseudo variable
      if (ch === '$') {
        var mm = src.slice(i).match(/^\$[A-Za-z_][A-Za-z0-9_]*/);
        if (mm) { out += span('type', mm[0]); i += mm[0].length; continue; }
      }

      // number
      if (/[0-9]/.test(ch) && !/[A-Za-z0-9_]/.test(src[i - 1] || '')) {
        var num = src.slice(i).match(/^[0-9][0-9.]*/);
        if (num) { out += span('num', num[0]); i += num[0].length; continue; }
      }

      // identifier
      if (/[A-Za-z_]/.test(ch)) {
        var w = src.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/)[0];
        var upper = w.toUpperCase();
        var rest = src.slice(i + w.length);
        var isCall = /^\s*\(/.test(rest);
        var isType = /^(abap|sy|syst|ximsk|if_|cl_|cx_|zi_|zc_|zbp_|zui_|zd_|lt|ltcl|ty_|z[a-z_]*)/i.test(w);
        if (KW[upper]) out += span('kw', w);
        else if (isType) out += span('type', w);
        else if (isCall) out += span('fn', w);
        else out += esc(w);
        i += w.length;
        continue;
      }

      // operators
      if (ch === '=' && src[i + 1] === '>') { out += span('op', '=>'); i += 2; continue; }
      if (ch === '-' && src[i + 1] === '>') { out += span('op', '->'); i += 2; continue; }
      if (ch === '<' && (src[i + 1] === '>' || src[i + 1] === '=')) { out += span('op', src.substr(i, 2)); i += 2; continue; }
      if (ch === '>' && src[i + 1] === '=') { out += span('op', '>='); i += 2; continue; }

      out += esc(ch);
      i++;
    }
    return out;
  }

  function highlightJson(src) {
    var out = '', i = 0, n = src.length;
    while (i < n) {
      var ch = src[i];
      if (ch === '"') {
        var j = i + 1;
        while (j < n) {
          if (src[j] === '\\') { j += 2; continue; }
          if (src[j] === '"') { j++; break; }
          j++;
        }
        var str = src.slice(i, j);
        var after = src.slice(j);
        var isKey = /^\s*:/.test(after);
        out += span(isKey ? 'type' : 'str', str);
        i = j;
        continue;
      }
      if (/[0-9]/.test(ch) && !/[A-Za-z0-9_]/.test(src[i - 1] || '')) {
        var num = src.slice(i).match(/^-?[0-9][0-9.eE+-]*/);
        if (num) { out += span('num', num[0]); i += num[0].length; continue; }
      }
      if (/[A-Za-z]/.test(ch)) {
        var w = src.slice(i).match(/^[A-Za-z_]+/)[0];
        out += (w === 'true' || w === 'false' || w === 'null') ? span('kw', w) : esc(w);
        i += w.length;
        continue;
      }
      out += esc(ch);
      i++;
    }
    return out;
  }

  function highlight(src, lang) {
    if (!src) return '';
    if (!lang || /^(abap|cds|sql|text|console|bash)$/.test(lang)) {
      return lang === 'text' || lang === 'bash' ? esc(src) : highlightAbap(src);
    }
    if (lang === 'json') return highlightJson(src);
    return esc(src);
  }

  function codeBlock(opts) {
    opts = opts || {};
    var id = 'cb' + (++seq);
    var lang = opts.lang || 'abap';
    blocks[id] = opts.code || '';
    var title = opts.title
      ? '<span class="code-title">' + esc(opts.title) + '</span>'
      : '';
    return '' +
      '<div class="code-card">' +
      '<div class="code-head">' +
      '<span class="code-lang">' + esc(lang) + '</span>' + title +
      '<button class="copy-btn" type="button" data-copy="' + id + '">Copy</button>' +
      '</div>' +
      '<div class="code-scroll"><pre class="code" id="' + id + '"><code>' + highlight(opts.code, lang) + '</code></pre></div>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Generator                                                           */
  /* ------------------------------------------------------------------ */
  function cleanBase(input, fallback) {
    var s = String(input || '').trim().replace(/[^A-Za-z0-9_]/g, '');
    s = s.replace(/^(ZBP_I_|ZUI_|ZI_|ZC_|ZD_)/i, '');
    if (s.length > 1 && /^Z[A-Z]/.test(s)) s = s.slice(1);
    if (!s) s = fallback || 'Travel';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function snake(name) {
    return String(name)
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .replace(/__+/g, '_')
      .replace(/^_+/, '')
      .toLowerCase();
  }
  function validName(name) {
    return /^[A-Za-z][A-Za-z0-9_]*$/.test(String(name || ''));
  }
  function parseFields(text, base) {
    var fallback = [
      { name: base + 'ID', type: 'abap.numc(10)', flags: 'key, readonly', key: true, readonly: true },
      { name: 'Description', type: 'abap.char(255)', flags: '', key: false, readonly: false },
      { name: 'CreatedAt', type: 'timestampl', flags: '', key: false, readonly: false },
      { name: 'LastChangedAt', type: 'timestampl', flags: 'etag', key: false, readonly: true, etag: true }
    ];
    var lines = String(text || '').split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    if (!lines.length) return fallback;

    var out = [];
    lines.forEach(function (line) {
      var parts = line.split(':').map(function (p) { return p.trim(); });
      var name = parts[0].replace(/[^A-Za-z0-9_]/g, '');
      if (!validName(name)) return;
      var type = parts[1] || 'abap.char(40)';
      var flags = (parts.slice(2).join(':') || '').toLowerCase();
      var isKey = /(^|[,\s])key([,\s]|$)/.test(flags);
      out.push({
        name: name,
        type: type,
        flags: flags,
        key: isKey,
        readonly: isKey || /readonly|(^|[,\s])ro([,\s]|$)/.test(flags),
        mandatory: /mandatory|required|(^|[,\s])mand([,\s]|$)/.test(flags),
        etag: /etag/.test(flags)
      });
    });
    if (!out.length) return fallback;
    if (!out.some(function (f) { return f.key; })) out[0].key = out[0].readonly = true;
    return out;
  }

  function generate(opts) {
    opts = opts || {};
    var base = cleanBase(opts.entity, 'Travel');
    var childBase = cleanBase(opts.childEntity, 'Booking');
    if (childBase === base) childBase = base + 'Item';
    var table = (opts.table || '').trim().replace(/[^A-Za-z0-9_]/g, '').toLowerCase() || 'z' + base.toLowerCase();
    var childTable = (opts.childTable || '').trim().replace(/[^A-Za-z0-9_]/g, '').toLowerCase() || 'z' + childBase.toLowerCase();
    var mode = opts.mode === 'unmanaged' ? 'unmanaged' : 'managed';
    var draft = !!opts.draft && mode === 'managed';
    var auth = opts.auth !== 'none';
    var withChild = !!opts.child;
    var withValidation = !!opts.validation;
    var withAction = !!opts.action;
    var withUI = !!opts.ui;
    var withTable = !!opts.tableDdl;
    var fields = parseFields(opts.fields, base);
    var keyField = fields.filter(function (f) { return f.key; })[0] || fields[0];
    if (!keyField.key) { keyField.key = true; keyField.readonly = true; }

    var etagField = fields.filter(function (f) { return f.etag; })[0];
    if (!etagField) {
      etagField = fields.filter(function (f) { return /lastchanged/i.test(f.name); })[0];
    }
    if (!etagField) {
      etagField = { name: 'LastChangedAt', type: 'timestampl', key: false, readonly: true, mandatory: false, etag: true };
      fields.push(etagField);
    }

    var alias = base;
    var childAlias = childBase;
    var zi = 'ZI_' + base, zc = 'ZC_' + base, bdef = 'ZI_' + base;
    var bimp = 'ZBP_I_' + base, svc = 'ZUI_' + base;
    var childZi = 'ZI_' + childBase, childZc = 'ZC_' + childBase;
    var compName = '_' + childBase;

    /* ---- interface view ---- */
    var viewLines = fields.map(function (f, idx) {
      return (f.key ? '  key ' : '      ') + snake(f.name) + ' as ' + f.name + (idx === fields.length - 1 && !withChild ? '' : ',');
    });
    if (withChild) viewLines.push('      ' + compName);
    var view =
      '@AccessControl.authorizationCheck: #NOT_REQUIRED\n' +
      "@EndUserText.label: '" + base + " - interface'\n" +
      'define view entity ' + zi + '\n' +
      '  as select from ' + table + '\n' +
      (withChild ? '  composition [0..*] of ' + childZi + ' as ' + compName + '\n' : '') +
      '{\n' + viewLines.join('\n') + '\n}';

    /* ---- child interface view ---- */
    var childFields = [
      childBase + 'ID',
      base + 'ID',
      childBase + 'Date',
      'Description',
      'LastChangedAt'
    ];
    var childView =
      '@AccessControl.authorizationCheck: #NOT_REQUIRED\n' +
      "@EndUserText.label: '" + childBase + " - interface'\n" +
      'define view entity ' + childZi + '\n' +
      '  as select from ' + childTable + '\n' +
      '  association to parent ' + zi + ' as _' + base + '\n' +
      '    on $projection.' + base + 'ID = _' + base + '.' + base + 'ID\n' +
      '{\n' +
      '  key ' + snake(childFields[0]) + ' as ' + childFields[0] + ',\n' +
      '      ' + snake(childFields[1]) + ' as ' + childFields[1] + ',\n' +
      '      ' + snake(childFields[2]) + ' as ' + childFields[2] + ',\n' +
      '      ' + snake(childFields[3]) + ' as ' + childFields[3] + ',\n' +
      '      ' + snake(childFields[4]) + ' as ' + childFields[4] + ',\n' +
      '      _' + base + '\n}';

    /* ---- projections ---- */
    var projLines = fields.map(function (f, idx) {
      return (f.key ? '  key ' : '      ') + f.name + (idx === fields.length - 1 && !withChild ? '' : ',');
    });
    if (withChild) projLines.push('      ' + compName);
    var proj =
      '@AccessControl.authorizationCheck: #NOT_REQUIRED\n' +
      "@EndUserText.label: '" + base + " - consumption'\n" +
      '@Search.searchable: true\n' +
      'define view entity ' + zc + '\n' +
      '  as select from ' + zi + '\n' +
      '{\n' + projLines.join('\n') + '\n}';

    var childProj =
      '@AccessControl.authorizationCheck: #NOT_REQUIRED\n' +
      "@EndUserText.label: '" + childBase + " - consumption'\n" +
      'define view entity ' + childZc + '\n' +
      '  as select from ' + childZi + '\n{\n' +
      childFields.map(function (f) { return '  ' + (f.endsWith('ID') && f.startsWith(childBase) ? 'key ' : '    ') + f; }).join(',\n') +
      ',\n  _' + base + '\n}';

    /* ---- behavior definition ---- */
    var readOnlyFields = fields.filter(function (f) { return f.readonly; }).map(function (f) { return f.name; });
    if (readOnlyFields.indexOf(etagField.name) === -1) readOnlyFields.push(etagField.name);
    if (readOnlyFields.indexOf(keyField.name) === -1) readOnlyFields.push(keyField.name);
    var mandatoryFields = fields.filter(function (f) { return f.mandatory && !f.key; }).map(function (f) { return f.name; });

    var bdefLines = [];
    bdefLines.push(mode + ' implementation in class ' + bimp.toLowerCase() + ' unique;');
    bdefLines.push('strict ( 2 );');
    if (draft) bdefLines.push('with draft;');
    bdefLines.push('');
    bdefLines.push('define behavior for ' + bdef + ' alias ' + alias);
    bdefLines.push('persistent table ' + table);
    if (draft) bdefLines.push('draft table ' + table + '_d');
    bdefLines.push('etag master ' + etagField.name);
    bdefLines.push(draft
      ? 'lock master total etag ' + etagField.name
      : 'lock master');
    if (auth) bdefLines.push('authorization master ( instance )');
    bdefLines.push('{');
    bdefLines.push('  create;');
    bdefLines.push('  update;');
    bdefLines.push('  delete;');
    bdefLines.push('');
    bdefLines.push('  field ( readonly ) ' + readOnlyFields.join(', ') + ';');
    if (mandatoryFields.length) bdefLines.push('  field ( mandatory ) ' + mandatoryFields.join(', ') + ';');
    bdefLines.push('');
    bdefLines.push('  determination set' + base + 'ID on save { create; }');
    bdefLines.push('  determination setTimestamps on save { create; update; }');
    if (withValidation) {
      bdefLines.push('  validation validate' + base + ' on save { field ' +
        (mandatoryFields.length ? mandatoryFields.join(', ') : keyField.name) +
        '; create; update; }');
    }
    if (withAction) bdefLines.push('  action ( features : instance ) accept' + base + ' result [1] $self;');
    if (withChild) {
      bdefLines.push('');
      bdefLines.push('  association ' + compName + ' { create; }');
    }
    if (draft) {
      bdefLines.push('');
      bdefLines.push('  draft action Activate optimized;');
      bdefLines.push('  draft action Discard;');
      bdefLines.push('  draft action Edit;');
      bdefLines.push('  draft action Resume;');
      bdefLines.push('  draft determine action Prepare;');
    }
    bdefLines.push('');
    bdefLines.push('  mapping for ' + table + ' {');
    fields.forEach(function (f, idx) {
      bdefLines.push('    ' + f.name + ' = ' + snake(f.name) + (idx === fields.length - 1 ? '' : ';'));
    });
    bdefLines.push('  }');
    bdefLines.push('}');

    if (withChild) {
      bdefLines.push('');
      bdefLines.push('define behavior for ' + childZi + ' alias ' + childAlias);
      bdefLines.push('persistent table ' + childTable);
      if (draft) bdefLines.push('draft table ' + childTable + '_d');
      bdefLines.push('etag dependent by _' + base);
      bdefLines.push('lock dependent by _' + base);
      if (auth) bdefLines.push('authorization dependent by _' + base);
      bdefLines.push('{');
      bdefLines.push('  update;');
      bdefLines.push('  delete;');
      bdefLines.push('');
      bdefLines.push('  field ( readonly ) ' + childBase + 'ID, ' + base + 'ID, LastChangedAt;');
      bdefLines.push('  field ( mandatory ) ' + childBase + 'Date;');
      bdefLines.push('  association _' + base + ';');
      bdefLines.push('}');
    }
    var bdefCode = bdefLines.join('\n');

    /* ---- behavior class ---- */
    var handlerMethods = [];
    var handlerBodies = [];
    handlerMethods.push('    METHODS set' + base + 'ID FOR DETERMINE ON SAVE\n      IMPORTING keys FOR ' + alias + '~set' + base + 'ID.');
    handlerBodies.push(
      '  METHOD set' + base + 'ID.\n' +
      '    " TODO: implement key generation (number range, UUID, or MAX+1)\n' +
      '    " See the Determination lesson for a complete implementation.\n' +
      '  ENDMETHOD.'
    );
    handlerMethods.push('    METHODS setTimestamps FOR DETERMINE ON SAVE\n      IMPORTING keys FOR ' + alias + '~setTimestamps.');
    handlerBodies.push(
      '  METHOD setTimestamps.\n' +
      '    GET TIME STAMP FIELD DATA(now).\n\n' +
      '    MODIFY ENTITIES OF ' + bdef.toLowerCase() + ' IN LOCAL MODE\n' +
      '      ENTITY ' + alias + '\n' +
      '        UPDATE FIELDS ( ' + etagField.name + ' )\n' +
      '        WITH VALUE #( FOR key IN keys\n' +
      '                      ( %tky = key-%tky\n' +
      '                        ' + etagField.name + ' = now ) ).\n' +
      '  ENDMETHOD.'
    );
    if (withValidation) {
      handlerMethods.push('    METHODS validate' + base + ' FOR VALIDATE ON SAVE\n      IMPORTING keys FOR ' + alias + '~validate' + base + '.');
      handlerBodies.push(
        '  METHOD validate' + base + '.\n' +
        '    READ ENTITIES OF ' + bdef.toLowerCase() + ' IN LOCAL MODE\n' +
        '      ENTITY ' + alias + '\n' +
        '        FIELDS ( ' + (mandatoryFields[0] || keyField.name) + ' )\n' +
        '        WITH CORRESPONDING #( keys )\n' +
        '      RESULT DATA(entities).\n\n' +
        '    LOOP AT entities INTO DATA(entity).\n' +
        '      IF entity-' + (mandatoryFields[0] || keyField.name) + ' IS INITIAL.\n' +
        '        APPEND VALUE #( %tky = entity-%tky ) TO failed-' + alias.toLowerCase() + '.\n' +
        '        APPEND VALUE #( %tky = entity-%tky\n' +
        '                        %msg = new_message_with_text(\n' +
        '                          severity = if_abap_behv_message=>severity-error\n' +
        '                          text = \'Required field is empty\' ) )\n' +
        '          TO reported-' + alias.toLowerCase() + '.\n' +
        '      ENDIF.\n' +
        '    ENDLOOP.\n' +
        '  ENDMETHOD.'
      );
    }
    if (withAction) {
      handlerMethods.push('    METHODS accept' + base + ' FOR MODIFY\n      IMPORTING keys FOR ACTION ' + alias + '~accept' + base + ' RESULT result.');
      handlerBodies.push(
        '  METHOD accept' + base + '.\n' +
        '    " TODO: enforce preconditions, then update the status field\n' +
        '    READ ENTITIES OF ' + bdef.toLowerCase() + ' IN LOCAL MODE\n' +
        '      ENTITY ' + alias + '\n' +
        '        ALL FIELDS WITH CORRESPONDING #( keys )\n' +
        '      RESULT DATA(entities).\n\n' +
        '    result = VALUE #( FOR entity IN entities\n' +
        '                      ( %tky   = entity-%tky\n' +
        '                        %param = entity ) ).\n' +
        '  ENDMETHOD.'
      );
    }
    if (auth) {
      handlerMethods.push('    METHODS get_instance_authorizations FOR INSTANCE AUTHORIZATION\n      IMPORTING keys FOR ' + alias + ' RESULT result.');
      handlerBodies.push(
        '  METHOD get_instance_authorizations.\n' +
        '    " TODO: decide %create / %update / %delete per instance\n' +
        '    result = VALUE #( FOR key IN keys\n' +
        '                      ( %tky = key-%tky\n' +
        '                        %update = if_abap_behv=>auth-allowed ) ).\n' +
        '  ENDMETHOD.'
      );
    }
    if (mode === 'unmanaged') {
      handlerMethods.push('    METHODS create FOR MODIFY\n      IMPORTING entities FOR CREATE ' + alias + '.');
      handlerMethods.push('    METHODS update FOR MODIFY\n      IMPORTING entities FOR UPDATE ' + alias + '.');
      handlerMethods.push('    METHODS delete FOR MODIFY\n      IMPORTING keys FOR DELETE ' + alias + '.');
      handlerMethods.push('    METHODS lock FOR LOCK\n      IMPORTING keys FOR LOCK ' + alias + '.');
      handlerMethods.push('    METHODS save_modified REDEFINITION.');
      handlerBodies.push('  METHOD create.\n    " TODO: persist through the existing API (BAPI/FM)\n  ENDMETHOD.');
      handlerBodies.push('  METHOD update.\n    " TODO: persist changes through the existing API\n  ENDMETHOD.');
      handlerBodies.push('  METHOD delete.\n    " TODO: delete through the existing API\n  ENDMETHOD.');
      handlerBodies.push('  METHOD lock.\n    " TODO: enqueue/dequeue and fill the lock result\n  ENDMETHOD.');
      handlerBodies.push('  METHOD save_modified.\n    " TODO: persist in the right order, fill mapped, then COMMIT WORK once\n  ENDMETHOD.');
    }

    var classCode =
      'CLASS ' + bimp.toLowerCase() + ' DEFINITION PUBLIC ABSTRACT FINAL\n' +
      '  FOR BEHAVIOR OF ' + bdef.toLowerCase() + '.\n' +
      'ENDCLASS.\n\n' +
      'CLASS ' + bimp.toLowerCase() + ' IMPLEMENTATION.\n' +
      'ENDCLASS.\n\n' +
      '" --- generated in the CCIMP include ---\n' +
      'CLASS lcl_handler DEFINITION INHERITING FROM cl_abap_behavior_handler.\n' +
      '  PRIVATE SECTION.\n' +
      handlerMethods.join('\n') + '\n' +
      'ENDCLASS.\n\n' +
      'CLASS lcl_handler IMPLEMENTATION.\n' +
      handlerBodies.join('\n\n') + '\n' +
      'ENDCLASS.';

    /* ---- service ---- */
    var svcCode =
      "@EndUserText.label: '" + base + " service'\n" +
      'define service ' + svc + ' {\n' +
      '  expose ' + zc + ' as ' + base + ';' +
      (withChild ? '\n  expose ' + childZc + ' as ' + childBase + ';' : '') +
      '\n}';

    /* ---- metadata extension ---- */
    var metaFields = fields.slice(0, Math.min(fields.length, 6));
    var metaLines = [];
    fields.slice(0, Math.min(fields.length, 6)).forEach(function (f, idx) {
      metaLines.push('  @UI.lineItem: [ { position: ' + ((idx + 1) * 10) + ' } ]');
      if (idx < 3) metaLines.push('  @UI.selectionField: [ { position: ' + ((idx + 1) * 10) + ' } ]');
      metaLines.push('  ' + f.name + ';');
      metaLines.push('');
    });
    var meta =
      '@Metadata.layer: #CORE\n' +
      'annotate entity ' + zc + ' with\n{\n' +
      '  @UI.headerInfo: {\n' +
      "    typeName: '" + base + "',\n" +
      "    typeNamePlural: '" + base + "s',\n" +
      "    title: { type: #STANDARD, value: '" + keyField.name + "' }\n" +
      '  }\n' +
      (withChild
        ? '  @UI.facet: [ {\n' +
          "    id: '" + childBase + "s',\n" +
          '    purpose: #STANDARD,\n' +
          '    type: #LINEITEM_REFERENCE,\n' +
          "    label: '" + childBase + "s',\n" +
          '    position: 20,\n' +
          "    targetElement: '" + compName + "'\n" +
          '  } ]\n'
        : '') +
      '\n' + metaLines.join('\n') +
      '}';

    /* ---- table DDL ---- */
    var tableCode =
      "@EndUserText.label: '" + base + "'\n" +
      'define table ' + table + ' {\n' +
      '  key client : abap.clnt not null;\n' +
      fields.map(function (f) {
        return '  ' + (f.key ? 'key ' : '    ') + snake(f.name) + ' : ' + f.type + (f.key ? ' not null' : '') + ';';
      }).join('\n') + '\n}';

    var artifacts = [
      { key: 'view', title: zi + ' — interface view', lang: 'abap', code: view },
      { key: 'proj', title: zc + ' — projection view', lang: 'abap', code: proj },
      { key: 'bdef', title: bdef + ' — behavior definition', lang: 'abap', code: bdefCode },
      { key: 'class', title: bimp + ' — behavior pool skeleton', lang: 'abap', code: classCode },
      { key: 'svc', title: svc + ' — service definition', lang: 'abap', code: svcCode },
      { key: 'meta', title: zc + ' — metadata extension', lang: 'abap', code: meta }
    ];
    if (withChild) {
      artifacts.splice(1, 0, { key: 'childview', title: childZi + ' — child interface view', lang: 'abap', code: childView });
      artifacts.splice(3, 0, { key: 'childproj', title: childZc + ' — child projection view', lang: 'abap', code: childProj });
    }
    if (withTable) artifacts.unshift({ key: 'table', title: table + ' — DDL table', lang: 'abap', code: tableCode });

    var notes = [
      'Create the objects in ADT in this order: table → interface view → projection → behavior definition → behavior class (quick fix) → service definition → binding.',
      'Replace the snake_case table columns if your table uses different names; the `mapping for` block must match.',
      'Activate the CDS entities before the behavior definition, and the behavior definition before the service definition.',
      'Add a service binding (OData V4 – UI) to publish the service.',
      draft ? 'Regenerate or create the draft tables after the first activation (ADT quick fix).' : 'Draft is disabled in this generation; add it later with `with draft;`, a draft table and the draft actions.',
      mode === 'unmanaged' ? 'Unmanaged: implement create/update/delete/lock and save_modified, and commit once in save_modified.' : 'Managed: fill in the determination and validation TODOs, then test via EML or the preview.'
    ];

    return {
      base: base,
      childBase: childBase,
      table: table,
      names: { zi: zi, zc: zc, bdef: bdef, bimp: bimp, svc: svc, childZi: childZi, childZc: childZc, draftTable: table + '_d', childTable: childTable, etag: etagField.name },
      artifacts: artifacts,
      notes: notes,
      fields: fields
    };
  }

  /* ------------------------------------------------------------------ */
  /* Linter                                                              */
  /* ------------------------------------------------------------------ */
  function lint(src) {
    var code = String(src || '');
    var results = [];
    var lower = code.toLowerCase();
    var recognized = false;

    function add(level, text) { results.push({ level: level, text: text }); }
    function has(re) { return re.test(code); }

    /* BDEF */
    if (/define\s+behavior\s+for/i.test(code)) {
      recognized = true;
      if (!/(managed|unmanaged)\s+implementation\s+in\s+class/i.test(code)) {
        add('bad', 'No `managed`/`unmanaged implementation in class ...` header. A behavior definition needs an implementation class.');
      }
      if (!/strict\s*\(\s*2\s*\)/i.test(code)) {
        add('warn', 'No `strict ( 2 )`. Strict mode catches mapping/type mistakes at activation instead of at runtime.');
      } else {
        add('ok', 'Strict mode is enabled.');
      }
      var hasDraft = /with\s+draft\s*;/i.test(code);
      var hasDraftTable = /draft\s+table\s+\w+/i.test(code);
      var hasTotalEtag = /total\s+etag\s+\w+/i.test(code);
      var hasEtag = /etag\s+(master|dependent)/i.test(code);
      var hasLock = /lock\s+(master|dependent)/i.test(code);
      var hasDraftActions = /draft\s+action\s+activate/i.test(code);

      if (hasDraft) {
        add('ok', 'Draft is enabled (`with draft;`).');
        if (!hasDraftTable) add('bad', 'Draft is enabled but no `draft table` is declared.');
        if (!hasTotalEtag) add('warn', 'Draft is enabled but there is no `total etag` on the lock master. Child changes may not invalidate stale edits.');
        if (!hasDraftActions) add('bad', 'Draft is enabled but `draft action Activate optimized;` (and Edit/Discard/Resume) are missing.');
      } else if (hasDraftTable) {
        add('bad', 'A `draft table` is declared but `with draft;` is missing — the draft table will never be used.');
      }
      if (!hasEtag) add('warn', 'No `etag master` / `etag dependent by`. Without an ETag, optimistic locking cannot detect stale writes.');
      if (!hasLock) add('warn', 'No `lock master` / `lock dependent by`. Transactional BOs should declare lock ownership.');
      if (!/authorization\s+(master|dependent)/i.test(code)) {
        add('warn', 'No `authorization master ( instance )` / `authorization dependent by`. Write operations will not have instance-level checks.');
      }
      if (/validation\s+\w+\s+on\s+modify/i.test(code)) {
        add('bad', 'A validation is declared `on modify`. Validations only run `on save`.');
      }
      var dets = code.match(/determination\s+\w+\s+on\s+\w+/gi) || [];
      dets.forEach(function (d) {
        if (!/on\s+(save|modify)/i.test(d)) add('bad', 'Determination without a valid trigger: ' + d + ' (use `on save` or `on modify`).');
      });
      if (/determination\s+\w+\s+on\s+save/i.test(code) && !/determination\s+\w+\s+on\s+save\s*\{[^}]*create/i.test(code)) {
        add('warn', 'An `on save` determination does not list `create` in its trigger. It will not run for new entities.');
      }
      if (/association\s+_\w+\s*\{\s*create\s*;/i.test(code) && /with\s+draft\s*;/i.test(code)) {
        add('ok', 'Child create through a composition association is enabled.');
      }
      if (/lock\s+dependent\s+by/i.test(code) && /^\s*create\s*;/im.test(code)) {
        add('warn', 'A dependent child declares `create;` itself. Normally children are created through the parent association (`association _Child { create; }`).');
      }
      if (/field\s*\(\s*mandatory\s*\)/i.test(code) && !/validation/i.test(code)) {
        add('ok', 'Mandatory fields are declared (framework-enforced).');
      }
      if (!/mapping\s+for\s+\w+/i.test(code)) {
        add('warn', 'No `mapping for <table>` block. Required when CDS names differ from table columns, and enforced by strict mode.');
      }
      if (/field\s*\(\s*readonly\s*\)/i.test(code) && /lastchangedat/i.test(code)) {
        // fine
      }
    }

    /* CDS */
    if (/define\s+view\s+entity/i.test(code)) {
      recognized = true;
      var entityBlocks = code.split(/define\s+view\s+entity/i).slice(1);
      if (!/\bkey\b/i.test(code)) {
        add('bad', 'No `key` element. A view entity used as a BO root needs a key for OData identity and draft.');
      } else {
        add('ok', 'The view entity declares a key.');
      }
      if (!/@AccessControl\.authorizationCheck/i.test(code)) {
        add('warn', 'No `@AccessControl.authorizationCheck` annotation. Production entities should use `#CHECK` or `#MANDATORY`.');
      } else if (/#NOT_REQUIRED/i.test(code)) {
        add('warn', '`@AccessControl.authorizationCheck: #NOT_REQUIRED` disables the check. Fine for prototypes, not for production data.');
      } else {
        add('ok', 'An authorization check is configured.');
      }
      if (!/@EndUserText\.label/i.test(code)) {
        add('info', 'No `@EndUserText.label`. Labels are what users and tools see; add one.');
      }
      if (/composition\s+\[\s*0\s*\.\.\s*\*\s*\]\s+of/i.test(code)) {
        add('ok', 'A composition is declared. Remember to expose the association in the select list (`_Booking`).');
      }
      if (/association\s+to\s+parent/i.test(code)) {
        add('ok', '`association to parent` is present — required for composition children.');
      }
      if (/define\s+view\s+\w+\s+as\s+select/i.test(code) && !/@AbapCatalog\.sqlViewName/i.test(code)) {
        add('bad', 'Classic `define view` without `@AbapCatalog.sqlViewName`. Use `define view entity` for new RAP work.');
      }
      if (/define\s+view\s+entity/i.test(code) && /@AbapCatalog\.sqlViewName/i.test(code)) {
        add('info', '`@AbapCatalog.sqlViewName` is not needed for view entities.');
      }
      if (entityBlocks.length && !/@ObjectModel\.|@Semantics\./i.test(code)) {
        add('info', 'No semantics annotations. Consider `@Semantics.amount.currencyCode` for amounts and text associations for IDs.');
      }
    }

    /* Behavior class */
    if (/for\s+behavior\s+of/i.test(code)) {
      recognized = true;
      if (!/inheriting\s+from\s+cl_abap_behavior_handler/i.test(code)) {
        add('warn', 'No handler class inheriting from `cl_abap_behavior_handler` in this source. Handlers usually live in the CCIMP include.');
      } else {
        add('ok', 'A handler class inheriting from `cl_abap_behavior_handler` is present.');
      }
    }
    if (/modify\s+entities/i.test(code) && /commit\s+work/i.test(code)) {
      add('bad', '`COMMIT WORK` appears together with EML. Use `COMMIT ENTITIES` / `ROLLBACK ENTITIES` for RAP transactional consistency.');
    }
    if (/modify\s+entities/i.test(code) && /in\s+local\s+mode/i.test(code)) {
      add('info', '`IN LOCAL MODE` skips authorization checks. Only use it inside behavior implementations.');
    }
    if (/(update|insert\s+into|delete\s+from|modify)\s+z[a-z0-9_]+\s/i.test(code) && !/create\s+data|type\s+table/i.test(code)) {
      add('warn', 'Direct database write to a Z table found. Prefer `MODIFY ENTITIES ... IN LOCAL MODE` inside a BO; direct SQL bypasses the transactional buffer.');
    }
    if (/select\s+\*/i.test(code)) {
      add('info', '`SELECT *` found. Selecting explicit fields is safer and faster.');
    }
    if (/accesscontrol\.authorizationcheck\s*:\s*#not_required/i.test(code) && /authorization\s+master/i.test(code)) {
      add('info', 'Instance authorization is declared, but the CDS check is `#NOT_REQUIRED`. Ensure the combination is intentional.');
    }

    if (!recognized) {
      add('info', 'No RAP-specific structure detected. Paste a behavior definition, a CDS view entity, or a behavior class.');
    }
    if (!results.length) add('ok', 'No obvious issues detected by the heuristic checks.');
    return results;
  }

  RC.code = {
    escape: esc,
    highlight: highlight,
    codeBlock: codeBlock,
    blocks: blocks,
    generate: generate,
    lint: lint,
    snake: snake,
    cleanBase: cleanBase,
    parseFields: parseFields
  };
})();
