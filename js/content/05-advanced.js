/* ==========================================================================
   Module 5 — Level up
   ========================================================================== */
(window.RAP_COACH_CONTENT = window.RAP_COACH_CONTENT || []).push({
  id: 'm5',
  title: 'Level up',
  tagline: 'EML, feature control, locking, strict mode, testing, events.',
  description: 'The details that separate a demo BO from a production BO: programmatic access, per-instance behaviour, concurrency, and verification.',
  lessons: [

    /* ------------------------------------------------------------------ */
    {
      id: 'eml',
      title: 'EML: using your BO from ABAP',
      level: 'advanced',
      minutes: 14,
      summary: 'READ/MODIFY/COMMIT ENTITIES, local mode, mapped/failed/reported, and why EML beats direct table access.',
      tags: ['eml', 'abap', 'testing', 'integration'],
      sections: [
        { t: 'p', cls: 'lead', text: 'EML — Entity Manipulation Language — is the ABAP syntax for calling a RAP BO. It is how other BOs, background jobs and tests use your logic without duplicating it.' },
        { t: 'h', text: 'The four statements' },
        { t: 'table', head: ['Statement', 'Purpose'], rows: [
          ['`READ ENTITIES OF <bo>`', 'Read entities through the BO (respecting the model, not raw tables)'],
          ['`MODIFY ENTITIES OF <bo>`', 'Create, update, delete, execute actions'],
          ['`COMMIT ENTITIES`', 'Persist the buffered changes in a RAP-managed LUW'],
          ['`ROLLBACK ENTITIES`', 'Discard buffered changes']
        ] },
        { t: 'code', lang: 'abap', title: 'Read', code: `READ ENTITIES OF zi_travel
  ENTITY Travel
    FIELDS ( TravelID AgencyID BeginDate EndDate TotalPrice )
    WITH VALUE #( ( TravelID = '00000042' ) )
  RESULT DATA(travels).

LOOP AT travels INTO DATA(travel).
  WRITE: / travel-TravelID, travel-AgencyID, travel-TotalPrice.
ENDLOOP.` },
        { t: 'p', text: '`ALL FIELDS` reads everything the entity exposes. `FIELDS ( … )` is better: less data, clearer intent, and faster.' },

        { t: 'h', text: 'Create, with result handling' },
        { t: 'code', lang: 'abap', title: 'A complete write', code: `MODIFY ENTITIES OF zi_travel
  ENTITY Travel
    CREATE FIELDS ( AgencyID CustomerID BeginDate EndDate
                    TotalPrice CurrencyCode Description )
    WITH VALUE #( (
      %cid        = 'travel1'
      AgencyID    = '070001'
      CustomerID  = '000042'
      BeginDate   = '20260110'
      EndDate     = '20260114'
      TotalPrice  = '1200.00'
      CurrencyCode = 'EUR'
      Description  = 'Conference trip' ) )
  MAPPED   DATA(mapped)
  FAILED   DATA(failed)
  REPORTED DATA(reported).

IF failed IS NOT INITIAL.
  " reported contains the messages; log or rethrow
  RETURN.
ENDIF.

COMMIT ENTITIES
  RESPONSE OF zi_travel
    FAILED   DATA(commit_failed)
    REPORTED DATA(commit_reported).` },
        { t: 'callout', tone: 'warn', title: 'COMMIT ENTITIES, not COMMIT WORK', text: 'The RAP runtime owns the LUW. Use `COMMIT ENTITIES` / `ROLLBACK ENTITIES` so the transactional buffer, drafts and messages are handled correctly. Mixing in `COMMIT WORK` inside EML code is a common source of inconsistent state.' },

        { t: 'h', text: 'Update, delete and actions' },
        { t: 'code', lang: 'abap', title: 'The other operations', code: `" Update selected fields
MODIFY ENTITIES OF zi_travel
  ENTITY Travel
    UPDATE FIELDS ( EndDate )
    WITH VALUE #( ( TravelID = '00000042' EndDate = '20260120' ) ).

" Delete
MODIFY ENTITIES OF zi_travel
  ENTITY Travel
    DELETE FROM VALUE #( ( TravelID = '00000042' ) ).

" Execute an action
MODIFY ENTITIES OF zi_travel
  ENTITY Travel
    EXECUTE acceptTravel
    FROM VALUE #( ( TravelID = '00000042' ) )
  RESULT DATA(action_result)
  FAILED DATA(action_failed)
  REPORTED DATA(action_reported).` },

        { t: 'h', text: 'Local mode' },
        { t: 'p', text: 'Inside a behavior implementation you call the same BO with `IN LOCAL MODE`. It skips the authorization checks that would otherwise run for an external caller, because the behavior layer is already inside the trusted boundary.' },
        { t: 'code', lang: 'abap', title: 'Local mode in a handler', code: `READ ENTITIES OF zi_travel IN LOCAL MODE
  ENTITY Travel
    FIELDS ( TravelStatus )
    WITH CORRESPONDING #( keys )
  RESULT DATA(travels).` },
        { t: 'callout', tone: 'why', title: 'Use local mode only inside the behavior layer', text: 'External callers must go through the normal (non-local) path so authorizations, features and draft rules apply. Local mode in an application class bypasses security checks — a defect, not an optimisation.' },

        { t: 'h', text: 'Mapped, failed, reported' },
        { t: 'list', items: [
          '**mapped** — technical keys for created entities. In EML, `%cid` identifies the request row and `mapped-travel[ %cid = … ]` gives the generated key.',
          '**failed** — operations that failed; inspect before committing.',
          '**reported** — messages with severity, field targets and text. Do not swallow these; surface them.',
          '**result** — only exists for reads and actions/functions; most modify statements return mapped/failed/reported.'
        ] },
        { t: 'h', text: 'Why not SELECT from the table?' },
        { t: 'list', items: [
          'Direct SQL skips validations, draft state, instance authorization and feature control.',
          'It couples caller and persistence; a managed→unmanaged change breaks every SELECT.',
          'BO logic and side effects (determinations, events) do not run.',
          'EML code reads like the business operation, which makes reviews and tests meaningful.'
        ] },
        { t: 'callout', tone: 'tip', title: 'EML is your test harness', text: 'A 20-line EML program can create, modify, act on and delete a BO instance. Keep one per BO as a smoke test — it is faster and more precise than clicking through the UI.' }
      ],
      keyPoints: [
        { front: 'Which EML statement persists changes?', back: '`COMMIT ENTITIES` (with `RESPONSE OF <bo>` to capture commit failures/messages). `ROLLBACK ENTITIES` discards.' },
        { front: 'What does `IN LOCAL MODE` change?', back: 'It skips authorization checks for the call. It is intended for behavior-layer internal calls, not for application code.' },
        { front: 'What are mapped, failed and reported used for?', back: '`mapped` returns generated keys, `failed` lists failed instances, and `reported` carries messages and field targets back to the caller.' },
        { front: 'Why is EML better than direct SQL for reading BO data?', back: 'It respects the model, behavior, draft state, authorizations and any later persistence changes — direct SQL bypasses all of that.' },
        { front: 'Which EML statement executes a business action?', back: '`MODIFY ENTITIES … ENTITY <Alias> EXECUTE <action> FROM ...`, optionally capturing `RESULT`, `FAILED` and `REPORTED`.' }
      ],
      quiz: [
        { q: 'What should follow a successful MODIFY ENTITIES?', options: ['`COMMIT ENTITIES`', '`COMMIT WORK`', '`WAIT UP TO 1 SECONDS`', '`ROLLBACK ENTITIES`'], answer: 0, why: 'The RAP runtime manages the LUW; committing entities flushes the buffer consistently.' },
        { q: 'Where is `IN LOCAL MODE` appropriate?', options: ['Inside behavior implementations', 'In any report that needs speed', 'In the service binding', 'In CDS views'], answer: 0, why: 'It bypasses authorization, so only trusted behavior-layer code should use it.' },
        { q: 'How do you obtain the key generated for a created instance?', options: ['From the `mapped` response, using `%cid`', 'From `reported`', 'From the CDS view definition', 'By querying the table directly'], answer: 0, why: '`mapped` links the request `%cid` to the generated technical key.' }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'feature-control',
      title: 'Feature control and side effects',
      level: 'advanced',
      minutes: 11,
      summary: 'Enable, disable or lock fields and actions per instance — and tell the UI what to refresh.',
      tags: ['behavior', 'features', 'ui', 'side-effects'],
      sections: [
        { t: 'p', cls: 'lead', text: 'Feature control answers "may this user, on this instance, right now, change this field or press this button?" It is a UX rule engine, not a security mechanism — but it makes a BO feel intelligent.' },
        { t: 'h', text: 'Declare the hook' },
        { t: 'code', lang: 'abap', title: 'Per-instance features in the BDEF', code: `define behavior for ZI_Travel alias Travel
{
  field ( features : instance ) TravelStatus;
  action ( features : instance ) acceptTravel result [1] $self;
  action ( features : instance ) rejectTravel result [1] $self;
}` },
        { t: 'h', text: 'Implement it' },
        { t: 'code', lang: 'abap', title: 'get_instance_features', code: `CLASS lcl_handler DEFINITION INHERITING FROM cl_abap_behavior_handler.
  PRIVATE SECTION.
    METHODS get_instance_features FOR INSTANCE FEATURES
      IMPORTING keys FOR Travel RESULT result.
ENDCLASS.

CLASS lcl_handler IMPLEMENTATION.
  METHOD get_instance_features.
    READ ENTITIES OF zi_travel IN LOCAL MODE
      ENTITY Travel
        FIELDS ( TravelStatus )
        WITH CORRESPONDING #( keys )
      RESULT DATA(travels).

    result = VALUE #( FOR travel IN travels
      ( %tky                 = travel-%tky
        %field-TravelStatus  = if_abap_behv=>fc-f-readonly
        %action-acceptTravel = COND #(
          WHEN travel-TravelStatus = 'O'
          THEN if_abap_behv=>fc-o-enabled
          ELSE if_abap_behv=>fc-o-disabled )
        %action-rejectTravel = COND #(
          WHEN travel-TravelStatus = 'O'
          THEN if_abap_behv=>fc-o-enabled
          ELSE if_abap_behv=>fc-o-disabled )
        %delete = COND #(
          WHEN travel-TravelStatus = 'A'
          THEN if_abap_behv=>fc-o-disabled
          ELSE if_abap_behv=>fc-o-enabled ) ) ).
  ENDMETHOD.
ENDCLASS.` },
        { t: 'table', head: ['Constant', 'Effect on a field'], rows: [
          ['`fc-f-enabled`', 'Editable (default)'],
          ['`fc-f-readonly`', 'Display only'],
          ['`fc-f-disabled`', 'Hidden/disabled'],
          ['`fc-f-mandatory`', 'Required in the UI']
        ] },
        { t: 'table', head: ['Constant', 'Effect on an action/operation'], rows: [
          ['`fc-o-enabled`', 'Button/operation enabled'],
          ['`fc-o-disabled`', 'Button/operation disabled'],
          ['`fc-o-readonly`', 'Available but not as a modifying button (context-dependent)']
        ] },

        { t: 'callout', tone: 'warn', title: 'Feature control is not security', text: 'A disabled action can still be called via API. Always enforce the same rule inside the action/validation. Feature control only improves the UI experience.' },

        { t: 'h', text: 'Global features' },
        { t: 'p', text: 'Instance features vary per row. Global features apply to the whole entity or BO — for example, hiding the Create button for a read-only use case. Declare `field ( features : global )` or `action ( features : global )` and implement `get_global_features`. Use it sparingly: instance logic is usually the right granularity.' },

        { t: 'h', text: 'Side effects: what to refresh' },
        { t: 'p', text: 'When an action or field change makes other values stale, the UI needs to know what to reload. Side effects declare that relationship so Fiori can refresh precisely instead of reloading everything.' },
        { t: 'list', items: [
          'Declare side effects in the behavior definition for the fields/actions that change data.',
          'Typical case: `acceptTravel` changes `TravelStatus`; the status field and dependent actions must refresh.',
          'For calculated or aggregated values, a side effect on the action that triggers the recalculation avoids a stale display.',
          'Over-declaring side effects causes chatty UIs; declare only what actually changes.'
        ] },
        { t: 'callout', tone: 'why', title: 'Why this matters in practice', text: 'Without side effects, a user can press Accept and still see an enabled Accept button on an accepted travel. The data is right; the screen is stale. That is a feature-control/side-effect bug, not a data bug.' },

        { t: 'h', text: 'Checklist' },
        { t: 'list', checked: true, items: [
          'Every action that depends on state declares `features : instance`.',
          'Feature logic mirrors (but does not replace) the action precondition.',
          'Readonly fields that are computed are marked readonly in the BDEF or via `@ObjectModel.readOnly`.',
          'Side effects cover the fields the UI displays after an action.',
          'Tests call the action directly to prove the backend rejects invalid states.'
        ] }
      ],
      keyPoints: [
        { front: 'Where is feature control declared and implemented?', back: 'Declared per field/action in the behavior definition with `( features : instance )`, implemented in `get_instance_features` returning `%field-…` and `%action-…` entries.' },
        { front: 'Does disabling an action in the UI prevent API calls?', back: 'No. Feature control is a UX hint. The action implementation must enforce the same preconditions for API callers.' },
        { front: 'What are side effects for?', back: 'They tell the UI which fields or entities to refresh after a change/action, so displayed state does not become stale.' },
        { front: 'When would you use global features instead of instance features?', back: 'When the rule applies to the whole entity/BO regardless of instance — e.g. hiding create entirely for a read-only scenario.' },
        { front: 'Which constant makes a field display-only?', back: '`if_abap_behv=>fc-f-readonly`.' }
      ],
      quiz: [
        { q: 'Which constant disables an action for one instance?', options: ['`if_abap_behv=>fc-o-disabled`', '`if_abap_behv=>fc-f-disabled`', '`if_abap_behv=>auth-unauthorized`', '`if_abap_behv=>mk-off`'], answer: 0, why: '`fc-o-*` constants control operations/actions; `fc-f-*` control fields.' },
        { q: 'A user can still call a disabled action via Postman. Why?', options: ['Feature control is UI-only; the action must validate preconditions itself', 'The service binding is wrong', 'The ETag is missing', 'The action was not exposed'], answer: 0, why: 'Feature control changes rendering, not authorization or execution. Backend checks are mandatory.' },
        { q: 'What problem do side effects solve?', options: ['Stale UI values after an action or field change', 'Missing database indexes', 'Draft table mismatches', 'Authorization gaps'], answer: 0, why: 'They declare what must be refreshed so Fiori shows current data after an operation.' }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'locking-etag',
      title: 'Locking, ETags and concurrent edits',
      level: 'advanced',
      minutes: 11,
      summary: 'Optimistic vs pessimistic locking, entity vs total ETag, 412 conflicts, and what draft changes about all of it.',
      tags: ['behavior', 'locking', 'etag', 'concurrency'],
      sections: [
        { t: 'p', cls: 'lead', text: 'Two users, one travel, two browser tabs. Without a locking strategy, the last save wins silently. RAP gives you the primitives — you choose the policy.' },
        { t: 'h', text: 'Two ETag levels' },
        { t: 'table', head: ['Level', 'Declaration', 'Covers'], rows: [
          ['Entity ETag', '`etag master LastChangedAt`', 'One entity\'s fields'],
          ['Dependent ETag', '`etag dependent by _Travel`', 'Child inherits the root\'s ETag'],
          ['Total ETag', '`lock master total etag LastChangedAt`', 'The whole BO instance including children']
        ] },
        { t: 'p', text: 'With draft, the total ETag is what protects a multi-entity edit. A booking change must invalidate a stale travel edit, and only a BO-wide ETag can express that.' },
        { t: 'code', lang: 'abap', title: 'Declarations', code: `define behavior for ZI_Travel alias Travel
persistent table ztravel
draft table ztravel_d
etag master LastChangedAt
lock master total etag LastChangedAt
authorization master ( instance )
{ ... }

define behavior for ZI_Booking alias Booking
persistent table zbooking
draft table zbooking_d
etag dependent by _Travel
lock dependent by _Travel
authorization dependent by _Travel
{ ... }` },

        { t: 'h', text: 'What the runtime does' },
        { t: 'steps', items: [
          { title: 'Client reads and receives an ETag', body: 'The response carries `ETag: W/"…"` based on the declared field.' },
          { title: 'Client sends it back', body: 'PATCH/DELETE with `If-Match: W/"…"`.' },
          { title: 'Runtime compares', body: 'If the current ETag differs, the request fails with 412 and a conflict message.' },
          { title: 'Client resolves', body: 'Re-read the current state, merge or ask the user, then retry with the new ETag.' },
          { title: 'Draft holds a lock', body: 'While a draft exists, the owner keeps editing; others can read but conflict on activate if the active data changed.' }
        ] },

        { t: 'h', text: 'Optimistic vs pessimistic' },
        { t: 'compare', left: { title: 'Optimistic (ETag)', items: [
          'No lock held during editing',
          'Conflicts detected on write (412)',
          'Scales well, best for web apps',
          'Requires the client to send If-Match'
        ] }, right: { title: 'Pessimistic (lock)', items: [
          'Lock held while editing (typically draft)',
          'Others are blocked or read-only',
          'Prevents conflicts upfront',
          'Costs concurrency; must release reliably'
        ] } },
        { t: 'callout', tone: 'why', title: 'Draft is a UX lock, not a database lock', text: 'A draft gives the editor a private copy and ownership of the instance, not a DB enqueue on every row. Activation reconciles against the active data using the total ETag — that is where a conflict can still appear.' },

        { t: 'h', text: 'Designing for conflict' },
        { t: 'list', items: [
          'Choose an ETag field that actually changes on every relevant update — usually `last_changed_at` maintained by a determination.',
          'Never derive the ETag from a field the user can set arbitrarily.',
          'For child changes to invalidate the parent, use a total ETag and touch the parent timestamp on child changes.',
          'Return 412 with a clear message; the UI should offer reload, not a generic error.',
          'For unmanaged BOs, implement `lock` with the appropriate enqueue/dequeue and fill the lock result.',
          'Test two sessions: read in both, save in one, save in the other. The second must fail with 412.'
        ] },
        { t: 'callout', tone: 'warn', title: 'A blank ETag field breaks everything', text: 'If `LastChangedAt` is never populated, every ETag is identical or empty and conflict detection becomes meaningless. Populate it in a determination from day one.' }
      ],
      keyPoints: [
        { front: 'What does a 412 response mean?', back: 'The `If-Match` ETag sent by the client no longer matches the current ETag — someone changed the record (or the total BO instance) since it was read.' },
        { front: 'When do you need a total ETag?', back: 'With draft and/or composed BOs, so a change to any child invalidates stale edits of the parent instance.' },
        { front: 'How is an entity ETag declared?', back: '`etag master <Field>` on the entity behavior; children use `etag dependent by _Parent`.' },
        { front: 'Is draft a pessimistic database lock?', back: 'No. It is a UX-level private working copy with ownership; conflicts are reconciled at activation using the total ETag.' },
        { front: 'What breaks ETag conflict detection?', back: 'An ETag field that is empty or never updated, or clients that omit `If-Match`. Both make stale writes possible.' }
      ],
      quiz: [
        { q: 'Which declaration gives a BO-wide ETag for draft?', options: ['`lock master total etag LastChangedAt`', '`etag master LastChangedAt`', '`etag dependent by _Travel`', '`with draft`'], answer: 0, why: '`total etag` on the lock master defines the BO-instance-wide ETag.' },
        { q: 'A PATCH without If-Match succeeds and overwrites another user\'s change. What is the diagnosis?', options: ['The client did not use optimistic locking', 'The BO has no draft table', 'The service binding is V4', 'The validation is missing'], answer: 0, why: 'Optimistic locking depends on the client sending the ETag; without it the server cannot detect the conflict (or is configured to allow it).' },
        { q: 'Why must `LastChangedAt` be maintained by a determination?', options: ['Otherwise ETags never change and conflicts go undetected', 'Otherwise the table cannot be activated', 'Otherwise draft is disabled', 'Otherwise the key is not unique'], answer: 0, why: 'The ETag is derived from that field; if it never changes, every version looks identical.' }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'strict-and-numbering',
      title: 'Strict mode, numbering, and clean-core habits',
      level: 'advanced',
      minutes: 10,
      summary: 'Why `strict ( 2 )` makes life easier later, how ID assignment really works, and the rules that keep a BO upgrade-safe.',
      tags: ['behavior', 'strict', 'numbering', 'clean-core'],
      sections: [
        { t: 'p', cls: 'lead', text: 'You can write RAP that activates but ages badly. This lesson is about the small discipline that keeps a BO maintainable for years.' },
        { t: 'h', text: 'What strict mode buys you' },
        { t: 'p', text: '`strict ( 2 )` removes implicit conveniences: no silent type conversions, no implicit field-to-column matching, no ambiguous aliases. The cost is a few extra declarations. The benefit is that mistakes fail at activation, not at 2 a.m. in production.' },
        { t: 'code', lang: 'abap', title: 'Header and the declarations it forces', code: `managed implementation in class zbp_i_travel unique;
strict ( 2 );
with draft;

define behavior for ZI_Travel alias Travel
persistent table ztravel
draft table ztravel_d
etag master LastChangedAt
lock master total etag LastChangedAt
authorization master ( instance )
{
  ...
  mapping for ztravel {
    TravelID      = travel_id;
    AgencyID      = agency_id;
    BeginDate     = begin_date;
    EndDate       = end_date;
    LastChangedAt = last_changed_at;
  }
}` },
        { t: 'list', items: [
          'Explicit `mapping` for every persisted field whose name differs.',
          'Explicit types in handler signatures and EML structures.',
          'No reliance on implicit conversion between numeric/character fields.',
          'Clearer error messages when a declaration is missing.',
          'Better forward compatibility with new runtime checks.'
        ] },

        { t: 'h', text: 'Numbering: where keys come from' },
        { t: 'p', text: 'A RAP BO needs unique keys before it can persist, especially with draft. There are three practical approaches:' },
        { t: 'table', head: ['Approach', 'How', 'Good for'], rows: [
          ['Number range / sequence', 'Determination reads the next number', 'Business-readable IDs (travel 00000042)'],
          ['MAX + 1 in a determination', 'Simple, but watch concurrency', 'Prototypes and low-volume BOs'],
          ['Managed numbering clause', 'The runtime assigns numbers (release-dependent)', 'When available and the ID format is irrelevant'],
          ['UUID / GUID', 'Generated at creation', 'Technical keys, high volume']
        ] },
        { t: 'callout', tone: 'warn', title: 'MAX + 1 is not concurrency-safe by itself', text: 'Two parallel creates can read the same maximum. Use a number range object, a UUID, or the runtime numbering feature for production. If you keep MAX + 1, document the risk and add a uniqueness check.' },

        { t: 'h', text: 'Clean-core habits in RAP' },
        { t: 'list', items: [
          'Use released CDS views and APIs instead of SELECTing SAP tables directly.',
          'Keep custom logic in your own Z/Y namespace and in behavior classes, not in modifications.',
          'Do not copy SAP BOs — extend them via the documented extension points.',
          'Keep the projection clean and expose only what consumers need.',
          'Use `@AccessControl.authorizationCheck: #CHECK` or `#MANDATORY`, never leave production entities at `#NOT_REQUIRED`.',
          'Put reusable logic in helper classes with tests, not in the handler methods.',
          'Name things consistently (see the reference page) so the next developer can navigate.'
        ] },

        { t: 'h', text: 'Naming that survives a code review' },
        { t: 'table', head: ['Artifact', 'Convention', 'Example'], rows: [
          ['Interface view', '`ZI_` + entity', '`ZI_Travel`'],
          ['Projection view', '`ZC_` + entity', '`ZC_Travel`'],
          ['Behavior definition', 'Same as interface view', '`ZI_Travel`'],
          ['Behavior pool', '`ZBP_I_` + entity', '`ZBP_I_Travel`'],
          ['Service definition', '`ZUI_` + area', '`ZUI_Travel`'],
          ['Service binding', '`ZUI_` + area + protocol', '`ZUI_TRAVEL_O4`'],
          ['DCL role', '`ZI_` + entity + `_ROLE`', '`ZI_TRAVEL_ROLE`'],
          ['Metadata extension', 'Same as projection', '`ZC_Travel`']
        ] },
        { t: 'callout', tone: 'tip', title: 'Consistency beats cleverness', text: 'The compiler will not check your names. Your team will. Pick one convention, document it in the repo, and review against it — this is the cheapest long-term quality lever in RAP.' }
      ],
      keyPoints: [
        { front: 'What is the main practical effect of `strict ( 2 )`?', back: 'It removes implicit mapping and conversions, so you must declare `mapping` and exact types; errors surface at activation instead of runtime.' },
        { front: 'Why is MAX+1 ID generation risky?', back: 'Concurrent creates can read the same maximum and produce duplicate keys. Use number ranges, UUIDs, or managed numbering for production.' },
        { front: 'Which authorization annotation value should production entities use?', back: '`#CHECK` (with a DCL) or `#MANDATORY` (DCL required). `#NOT_REQUIRED` is for prototypes/public data only.' },
        { front: 'What is a clean-core habit when reading SAP data?', back: 'Use released CDS views or APIs instead of selecting SAP database tables directly, so upgrades do not break your code.' },
        { front: 'Why does naming consistency matter more in RAP than in a small report?', back: 'A BO spans many artifacts (views, BDEF, class, service, DCL, extensions). Consistent prefixes make navigation, search and reviews possible at scale.' }
      ],
      quiz: [
        { q: 'Why does strict mode require explicit mapping?', options: ['It disables implicit field-to-column matching', 'It enables draft', 'It changes the OData version', 'It removes the need for keys'], answer: 0, why: 'Strict mode removes implicit conveniences so name mismatches are caught at activation.' },
        { q: 'Which ID strategy is safest under concurrency?', options: ['Number range object or UUID', 'SELECT MAX + 1 in a determination', 'A fixed constant', 'The user name'], answer: 0, why: 'Number ranges/UUIDs avoid the race condition inherent in read-max-then-increment.' },
        { q: 'Which is a clean-core practice?', options: ['Use released CDS views instead of direct SAP table access', 'Modify SAP standard code', 'Copy SAP BOs into Z namespace', 'Disable authorization checks'], answer: 0, why: 'Released APIs/CDS views are upgrade-stable; direct table access and modifications are not.' }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'testing-debugging',
      title: 'Testing and debugging a RAP BO',
      level: 'advanced',
      minutes: 13,
      summary: 'ABAP Unit with EML, test doubles, and the tool-by-symptom map for when things go wrong.',
      tags: ['testing', 'debugging', 'abap-unit', 'tools'],
      sections: [
        { t: 'p', cls: 'lead', text: 'RAP gives you a clean test seam: the BO API. Test through EML, not through the UI. When something fails, use the symptom-to-tool map instead of guessing.' },
        { t: 'h', text: 'A unit test that proves the behaviour' },
        { t: 'code', lang: 'abap', title: 'ABAP Unit with EML', code: `CLASS ltcl_travel DEFINITION FOR TESTING
  DURATION SHORT
  RISK LEVEL HARMLESS.

  PRIVATE SECTION.
    METHODS create_requires_dates FOR TESTING.
ENDCLASS.

CLASS ltcl_travel IMPLEMENTATION.
  METHOD create_requires_dates.
    MODIFY ENTITIES OF zi_travel
      ENTITY Travel
        CREATE FIELDS ( AgencyID CustomerID )
        WITH VALUE #( ( %cid       = 't1'
                        AgencyID   = '070001'
                        CustomerID = '000042' ) )
      FAILED   DATA(failed)
      REPORTED DATA(reported).

    cl_abap_unit_assert=>assert_not_initial(
      act = failed-travel
      msg = 'Create without dates must fail' ).

    cl_abap_unit_assert=>assert_not_initial(
      act = reported-travel
      msg = 'A validation message must be reported' ).

    ROLLBACK ENTITIES.
  ENDMETHOD.
ENDCLASS.` },
        { t: 'callout', tone: 'warn', title: 'Clean up after tests', text: 'Use `ROLLBACK ENTITIES` or run against a test double. A test that leaves data behind makes the next run flaky and can pollute a shared development system.' },

        { t: 'h', text: 'What to test' },
        { t: 'list', items: [
          '**Validations** — each rule passes and fails, with the expected severity and field target.',
          '**Determinations** — keys, timestamps, totals; especially edge cases (empty table, existing max).',
          '**Actions** — allowed and forbidden states; check `result` and `failed`.',
          '**Authorization** — with a restricted user or a mocked authorization result.',
          '**Draft** — edit/activate/discard leaves active and draft tables in the expected state.',
          '**Deep insert** — parent + children in one request.'
        ] },

        { t: 'h', text: 'Test doubles instead of real persistence' },
        { t: 'p', text: 'For complex tests, the RAP BO test double framework lets you replace dependencies and run behaviour without a real database commit. Use it when a test must be deterministic or when the BO calls another BO/API. For straightforward CRUD and validation logic, EML plus `ROLLBACK ENTITIES` is enough.' },

        { t: 'h', text: 'Debugging by symptom' },
        { t: 'table', head: ['Symptom', 'First tool', 'Then'], rows: [
          ['OData 404', '`$metadata`, service definition', 'Binding published? Entity exposed? Alias correct?'],
          ['OData 403', 'STAUTHTRACE, DCL, instance auth', 'Restricted test user; PFCG values; `get_instance_authorizations`'],
          ['400 with message', 'Response body, `reported`', 'Validation logic or mandatory fields'],
          ['412', 'ETag values, `LastChangedAt` determination', 'Client sends stale If-Match'],
          ['500', '`/IWFND/ERROR_LOG`, ST22', 'Behavior handler, mapping, type conversion'],
          ['Empty list', 'DCL / authorization trace', 'Filter values, `@AccessControl` setting'],
          ['Field not saved', '`mapping for`, CDS field, table column', 'Strict mode activation warnings'],
          ['Draft actions missing', 'BDEF draft actions, binding type', 'OData V4 UI binding, activated BDEF'],
          ['Action not visible', 'BDEF exposure, feature control, annotations', '`get_instance_features` result, UI annotation'],
          ['Determination not running', 'BDEF trigger clause, EML test', '`on save` vs `on modify`, operation in braces']
        ] },

        { t: 'h', text: 'A debugging order that saves time' },
        { t: 'steps', items: [
          { title: 'Reproduce via EML or a direct OData call', body: 'Remove the UI from the equation. If it fails there, it is the BO/service, not annotations.' },
          { title: 'Read the error bottom-up', body: 'The last message is often the cause; earlier ones are cascades. Check `reported` for field targets.' },
          { title: 'Check the request', body: 'Payload fields, keys, ETag, client parameter, content type. Most 400s are payload problems.' },
          { title: 'Check the model', body: 'Is the field in the projection? Is the association exposed? Does the mapping exist?' },
          { title: 'Check authorization', body: 'Try a developer user; if it works, it is DCL/instance auth. Then trace with the restricted user.' },
          { title: 'Only then look at the UI', body: 'If the API works and the UI does not, it is annotations, facets or feature control.' }
        ] },
        { t: 'callout', tone: 'tip', title: 'Keep a symptom log', text: 'Every time a bug costs you more than 30 minutes, add one line to the troubleshooting page in this app: symptom, cause, fix. Your future self will thank you — and it is the highest-value note you can keep while learning RAP.' }
      ],
      keyPoints: [
        { front: 'What is the cleanest test seam for a RAP BO?', back: 'The BO API via EML: create/modify/read/act and assert on results, failed and reported — independent of the UI.' },
        { front: 'How do you test a validation failure?', back: 'Call the operation with invalid data via EML, then assert that `failed-<alias>` is not initial and that `reported` contains the expected message and field target.' },
        { front: 'Why roll back at the end of a unit test?', back: 'To avoid polluting the database and making later test runs flaky; `ROLLBACK ENTITIES` discards buffered changes.' },
        { front: 'Which tool first for a 500 error?', back: '`/IWFND/ERROR_LOG` (and `/IWBEP/ERROR_LOG`) plus ST22 — the response body often hides the real runtime error.' },
        { front: 'The API works but the UI shows nothing. Where do you look?', back: 'UI annotations: `@UI.lineItem`, `@UI.headerInfo`, `@UI.facet`/`targetElement`, `@UI.hidden` — not the service.' }
      ],
      quiz: [
        { q: 'What is the best assertion for a failed validation?', options: ['`failed-<alias>` is not initial and a message is reported', 'The HTTP status is 200', 'The table row count is zero', 'The ETag changed'], answer: 0, why: 'A validation failure manifests as a failed instance plus reported messages; the save is blocked.' },
        { q: 'A field is saved as empty although the payload contains it. First check?', options: ['`mapping for` and the table column', 'The OData version', 'The draft table', 'The DCL role'], answer: 0, why: 'A missing or wrong mapping silently drops or misroutes the field.' },
        { q: 'Which tool shows why an authorization check returns an empty list?', options: ['STAUTHTRACE / authorization trace', '`$metadata`', 'ST22', 'The Fiori preview'], answer: 0, why: 'The authorization trace shows the objects and values checked, which is exactly what silent DCL filtering hides.' }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'events-extensibility',
      title: 'Business events and extensibility',
      level: 'advanced',
      minutes: 9,
      summary: 'Decouple with RAP business events, and extend a BO without forking it.',
      tags: ['events', 'extensibility', 'clean-core', 'architecture'],
      sections: [
        { t: 'p', cls: 'lead', text: 'Two architecture questions every mature BO faces: how do other systems learn that something happened, and how do partners/customers add fields without breaking upgrades? RAP has answers for both.' },
        { t: 'h', text: 'RAP business events' },
        { t: 'p', text: 'A business event is a meaningful fact — "travel accepted", "booking cancelled". Instead of calling every consumer synchronously, the BO raises an event that interested parties consume asynchronously.' },
        { t: 'steps', items: [
          { title: 'Declare the event', body: 'Business events are declared in the behaviour definition and typed with an event entity/parameter structure.' },
          { title: 'Raise it from behavior logic', body: 'Use the RAP event statement (for example `RAISE ENTITY EVENT …`) inside an action, determination or save phase. The syntax depends on your release.' },
          { title: 'Publish it', body: 'The event is emitted through SAP Business Events / Event Mesh, or consumed by an event handler.' },
          { title: 'Consume it', body: 'Downstream services subscribe and react — without the BO knowing who they are.' }
        ] },
        { t: 'callout', tone: 'why', title: 'Event vs action call', text: 'Use an action when the caller needs the result now and the operation is part of the transaction. Use an event when other systems should react later and must not block or break the save.' },

        { t: 'h', text: 'What makes a good event' },
        { t: 'list', items: [
          'Past tense and business meaning: `TravelAccepted`, not `UpdateTravelStatus`.',
          'Minimal, stable payload: keys + relevant business data, not the whole BO.',
          'Idempotent consumers: events can be retried or delivered more than once.',
          'Raised after the state change is valid, typically in the save phase or the action.',
          'Documented contract: event name, payload, version.',
          'Do not use events as a replacement for validations — they are notifications, not vetoes.'
        ] },

        { t: 'h', text: 'Extensibility without forking' },
        { t: 'p', text: 'SAP BOs and your own BOs can be marked `extensible` so others add fields, logic and UI without modifying the original artifacts. This is the clean-core alternative to copying a BO and maintaining a fork.' },
        { t: 'table', head: ['Extension type', 'What it adds', 'Where'], rows: [
          ['Data/field extension', 'Extra fields on an entity', 'Extension include views / append structures'],
          ['Behavior extension', 'New validations, determinations, actions', 'Extension implementation class'],
          ['UI extension', 'Extra fields/sections in Fiori', 'Metadata extension in the customer layer'],
          ['Service extension', 'Additional exposed entities/fields', 'Separate service definition/binding or extension']
        ] },
        { t: 'code', lang: 'abap', title: 'Marking a BO extensible', code: `define behavior for ZI_Travel alias Travel
extensible
{
  ...
}` },
        { t: 'callout', tone: 'warn', title: 'Extensible is a contract', text: 'Once consumers extend your BO, renaming fields or removing extension points breaks them. Treat the extension surface as API: version it, document it, and test with an extension active.' },

        { t: 'h', text: 'Decision guide' },
        { t: 'compare', left: { title: 'Use events when', items: [
          'Consumers are decoupled and asynchronous',
          'No immediate response is needed',
          'Multiple systems must react',
          'Failure of a consumer must not fail the save'
        ] }, right: { title: 'Use extensions when', items: [
          'A customer needs extra fields/logic',
          'You must not modify the original BO',
          'Upgrade stability matters',
          'The addition is additive, not a redesign'
        ] } },
        { t: 'callout', tone: 'tip', title: 'Learn the concepts now, the syntax per release', text: 'Event and extension syntax has evolved across releases. The architecture (declare → raise → consume; extend → don\'t fork) is stable. Check the ABAP release documentation for the exact statements before you build production code.' }
      ],
      keyPoints: [
        { front: 'When should you use a business event instead of an action?', back: 'When other systems should react asynchronously and must not block or fail the transaction — events decouple producers from consumers.' },
        { front: 'What belongs in an event payload?', back: 'A stable, minimal contract: keys and the business data consumers need, not the full BO. Consumers must be idempotent because delivery can repeat.' },
        { front: 'What does the `extensible` keyword enable?', back: 'It marks the BO as extendable by partners/customers (fields, behavior, UI) without modifying the original artifacts — the clean-core alternative to copying.' },
        { front: 'Why is extensibility a contract?', back: 'Consumers depend on the extension points and names. Removing or renaming them breaks their extensions; treat them like public APIs.' },
        { front: 'Are events a substitute for validations?', back: 'No. Validations veto a save synchronously; events notify after the fact. Events cannot prevent an invalid state.' }
      ],
      quiz: [
        { q: 'Which problem do business events solve best?', options: ['Notifying other systems asynchronously after a business fact', 'Blocking invalid saves', 'Rendering Fiori columns', 'Generating draft tables'], answer: 0, why: 'Events decouple producers and consumers; validations handle blocking rules.' },
        { q: 'What is the clean-core way to add customer-specific fields to a BO?', options: ['Use the extensibility mechanism instead of modifying the BO', 'Copy the BO into Z namespace', 'Add fields directly to the SAP table', 'Modify the service binding'], answer: 0, why: 'Extensions are additive and upgrade-safe; copies and direct modifications are not.' },
        { q: 'Why must event consumers be idempotent?', options: ['Events may be delivered more than once', 'Events are always synchronous', 'Events replace transactions', 'Events carry no payload'], answer: 0, why: 'Messaging systems can retry delivery, so handling the same event twice must not corrupt data.' }
      ]
    }
  ]
});
