/* ==========================================================================
   Module 3 — Behavior
   ========================================================================== */
(window.RAP_COACH_CONTENT = window.RAP_COACH_CONTENT || []).push({
  id: 'm3',
  title: 'Behavior',
  tagline: 'The contract and the code: CRUD, determinations, validations, actions, draft, unmanaged.',
  description: 'The behavior layer is where a RAP BO becomes transactional. Learn to read a behavior definition fluently, then implement each extension point.',
  lessons: [

    /* ------------------------------------------------------------------ */
    {
      id: 'bdef-tour',
      title: 'Reading a behavior definition top to bottom',
      level: 'intermediate',
      minutes: 12,
      summary: 'A complete managed BDEF, every clause explained, and the mental checklist for reviewing one.',
      tags: ['behavior', 'bdef', 'syntax'],
      sections: [
        { t: 'p', cls: 'lead', text: 'A behavior definition is a contract, not code. If you can read one line by line, you can predict most of what the BO will do — and most of what will go wrong.' },
        { t: 'code', lang: 'abap', title: 'A realistic managed BDEF (travel with bookings)', code: `managed implementation in class zbp_i_travel unique;
strict ( 2 );
with draft;

define behavior for ZI_Travel alias Travel
persistent table ztravel
draft table ztravel_d
etag master LastChangedAt
lock master total etag LastChangedAt
authorization master ( instance )
{
  create;
  update;
  delete;

  field ( readonly ) TravelID, LastChangedAt;
  field ( mandatory ) AgencyID, CustomerID, BeginDate, EndDate;

  determination setTravelID on save { create; }
  determination setTimestamps on save { create; update; }
  validation validateDates on save { field BeginDate, EndDate; create; update; }

  action ( features : instance ) acceptTravel result [1] $self;
  action ( features : instance ) rejectTravel result [1] $self;

  association _Booking { create; }

  draft action Activate optimized;
  draft action Discard;
  draft action Edit;
  draft action Resume;
  draft determine action Prepare;

  mapping for ztravel {
    TravelID       = travel_id;
    AgencyID       = agency_id;
    CustomerID     = customer_id;
    BeginDate      = begin_date;
    EndDate        = end_date;
    TotalPrice     = total_price;
    CurrencyCode   = currency_code;
    LastChangedAt  = last_changed_at;
  }
}

define behavior for ZI_Booking alias Booking
persistent table zbooking
draft table zbooking_d
etag dependent by _Travel
lock dependent by _Travel
authorization dependent by _Travel
{
  update;
  delete;

  field ( readonly ) BookingID, TravelID;
  field ( mandatory ) BookingDate, CustomerID;

  association _Travel;
}` },

        { t: 'h', text: 'Header: who implements it' },
        { t: 'table', head: ['Clause', 'Meaning'], rows: [
          ['`managed implementation in class zbp_i_travel`', 'The framework implements standard CRUD and save; the class holds your extension logic.'],
          ['`unmanaged implementation in class …`', 'You implement create/update/delete/lock and the save.'],
          ['`strict ( 2 )`', 'Stricter syntax checks: explicit mapping, no implicit conversions. Recommended.'],
          ['`with draft;`', 'Enables draft for this BO. Requires draft tables and draft actions.'],
          ['`unique`', 'Declares that the implementation class serves one behavior definition.']
        ] },
        { t: 'callout', tone: 'info', title: 'Where the code lives', text: 'The implementation class is referenced in the header, but the handlers live in the generated `lcl_handler` inside the CCIMP include — you rarely edit the global class directly.' },

        { t: 'h', text: 'Entity block: what it is and how it persists' },
        { t: 'table', head: ['Clause', 'Meaning'], rows: [
          ['`define behavior for ZI_Travel alias Travel`', 'Binds the behavior to the CDS entity; `Travel` is the alias used in code and EML.'],
          ['`persistent table ztravel`', 'The transparent table that stores active data.'],
          ['`draft table ztravel_d`', 'Storage for in-progress edits. Required with draft.'],
          ['`etag master LastChangedAt`', 'Field used for optimistic locking on this entity.'],
          ['`lock master total etag LastChangedAt`', 'This entity owns the lock; the total ETag covers the whole BO instance.'],
          ['`authorization master ( instance )`', 'Instance-level authorization is checked; implement `get_instance_authorizations`.'],
          ['`authorization dependent by _Travel`', 'Child inherits authorization from the parent.']
        ] },

        { t: 'h', text: 'Body: operations and extension points' },
        { t: 'list', items: [
          '**`create; update; delete;`** — enable standard operations. Omit an operation and the API returns "not allowed".',
          '**`field ( readonly )`** — cannot be changed by consumers; internal logic may still set it.',
          '**`field ( mandatory )`** — required on create/update; enforced by the runtime.',
          '**`determination … on save`** — derived values (IDs, totals, timestamps), runs once before save.',
          '**`validation … on save`** — business rules; failures block the save and return messages.',
          '**`action ( features : instance ) …`** — explicit operations the user or API can trigger.',
          '**`function …`** — read-only operation that returns data without changing state.',
          '**`association _Booking { create; }`** — allow creating children through the parent.',
          '**`draft action …`** — the standard draft lifecycle operations.',
          '**`mapping for …`** — maps CDS names to table column names. Required when they differ in strict mode.'
        ] },

        { t: 'callout', tone: 'warn', title: 'Alias discipline', text: 'The alias (`Travel`, `Booking`) is what you use in handler signatures, EML and `failed-<alias>` structures. Renaming an alias is a breaking change for the class and for tests. Choose it once and keep it.' },

        { t: 'h', text: 'Review checklist' },
        { t: 'list', checked: true, items: [
          'Every persisted CDS field that differs from the table column appears in `mapping`.',
          'Keys are `readonly`; mandatory fields are declared, not just annotated.',
          'Each determination has the right trigger (`on save` vs `on modify`) and the right operations in braces.',
          'Every validation is `on save` and names the fields it depends on.',
          'Draft is either fully configured (table + actions + total etag) or absent.',
          'Children have `lock dependent by` and `authorization dependent by`.',
          'No `create`/`update`/`delete` is enabled on an entity that should be read-only.'
        ] }
      ],
      keyPoints: [
        { front: 'What does the `alias` in `define behavior for ZI_Travel alias Travel` control?', back: 'It is the name used in handler method signatures, EML statements, `failed-<alias>`/`reported-<alias>` structures and action references. It must be unique within the BO.' },
        { front: 'Difference between `etag master` and `lock master total etag`?', back: '`etag master` names the field backing the entity ETag used for optimistic locking. `lock master total etag` makes the entity the lock owner and defines a BO-wide ETag that changes with any child change.' },
        { front: 'When is `mapping for <table>` required?', back: 'When CDS field names differ from table column names — especially with `strict ( 2 )`. It maps each persisted field to its column.' },
        { front: 'What does `field ( readonly )` actually prevent?', back: 'It prevents consumers (UI/API and EML from outside) from changing the field. The framework or a determination can still set it internally via local mode.' },
        { front: 'How do draft actions differ from normal actions?', back: 'They are the framework-managed draft lifecycle operations (`Edit`, `Activate`, `Discard`, `Resume`, `Prepare`) rather than business operations. `Activate` is usually declared `optimized`.' },
        { front: 'What is required for a child entity in a draft-enabled BO?', back: '`etag dependent by _Parent`, `lock dependent by _Parent`, `authorization dependent by _Parent`, its own draft table, and typically `update; delete;` without `create` (creation goes through the parent association).' }
      ],
      quiz: [
        { q: 'What does `determination setTravelID on save { create; }` mean?', options: ['Before saving a new entity, the runtime calls setTravelID', 'Every time a field changes, the runtime calls setTravelID', 'The field is validated on save', 'The action is available on the UI'], answer: 0, why: '`on save` runs once before the save for the listed operations. `on modify` would run on each modification.' },
        { q: 'Which declaration allows creating a booking through its travel?', options: ['`association _Booking { create; }` in the travel behavior', '`create;` in the booking behavior only', '`composition [0..*] of` in the CDS view', '`with draft;` in the header'], answer: 0, why: 'The root behavior must enable create for the association; the child normally does not declare `create` itself.' },
        { q: 'What does `strict ( 2 )` force you to be explicit about?', options: ['Field-to-column mapping and type conversions', 'The OData version', 'The service definition name', 'The draft table name'], answer: 0, why: 'Strict mode removes implicit mapping/conversion conveniences, so mistakes surface at activation rather than runtime.' },
        { q: 'Which clause makes the BO instance lockable as a whole?', options: ['`lock master total etag LastChangedAt`', '`etag master LastChangedAt`', '`persistent table ztravel`', '`authorization master ( instance )`'], answer: 0, why: '`lock master` declares lock ownership; `total etag` adds BO-wide conflict detection, essential with draft.' }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'managed-crud',
      title: 'Managed CRUD and field mapping',
      level: 'intermediate',
      minutes: 10,
      summary: 'Exactly what the managed runtime does on create, update and delete, and how mapping + admin fields fit in.',
      tags: ['behavior', 'managed', 'crud', 'mapping'],
      sections: [
        { t: 'p', cls: 'lead', text: 'In the managed scenario, "CRUD is free" is true but not magic. Knowing the steps the runtime performs tells you where to hook in — and why your timestamps are empty.' },
        { t: 'h', text: 'What happens on create' },
        { t: 'steps', items: [
          { title: 'Request enters the behavior', body: 'The OData layer (or EML in local mode) calls `create` on the entity.' },
          { title: 'Determinations on save run', body: 'Calculated fields (IDs, totals, timestamps) are filled before persistence.' },
          { title: 'Validations on save run', body: 'Rules are checked; a `failed` entry stops the save and returns messages.' },
          { title: 'Buffer → database', body: 'The managed runtime inserts into `ztravel` inside the RAP transaction.' },
          { title: 'Commit and response', body: 'On commit, keys and ETag are returned to the caller. On error, `ROLLBACK ENTITIES` or an implicit rollback applies.' }
        ] },
        { t: 'callout', tone: 'why', title: 'Admin fields are not automatic', text: 'CreatedBy, CreatedAt, LastChangedBy, LastChangedAt are not populated by the managed runtime for your own tables. Add a determination (or a database default/exit) — otherwise your ETag field stays empty and locking breaks.' },

        { t: 'code', lang: 'abap', title: 'Field mapping and admin determination', code: `" BDEF (excerpt)
determination setTimestamps on save { create; update; }

mapping for ztravel {
  TravelID      = travel_id;
  AgencyID      = agency_id;
  CustomerID    = customer_id;
  BeginDate     = begin_date;
  EndDate       = end_date;
  TotalPrice    = total_price;
  CurrencyCode  = currency_code;
  CreatedBy     = created_by;
  CreatedAt     = created_at;
  LastChangedBy = last_changed_by;
  LastChangedAt = last_changed_at;
}

" Handler
METHOD setTimestamps.
  GET TIME STAMP FIELD DATA(now).

  MODIFY ENTITIES OF zi_travel IN LOCAL MODE
    ENTITY Travel
    UPDATE FIELDS ( LastChangedAt LastChangedBy )
    WITH VALUE #( FOR key IN keys
                  ( %tky          = key-%tky
                    LastChangedAt = now
                    LastChangedBy = sy-uname ) ).
ENDMETHOD.` },
        { t: 'p', text: 'For created fields, use `%is_draft` or `%control-CreatedAt IS INITIAL` logic — simplest is a separate determination `setCreatedData` triggered only on `create`.' },

        { t: 'h', text: 'What happens on update and delete' },
        { t: 'table', head: ['Operation', 'Runtime behaviour', 'Your hook'], rows: [
          ['`update`', 'Only changed fields are written; ETag is compared first.', 'Validation / determination / action logic'],
          ['`delete`', 'Row is removed; children of a composition are removed too (if modelled).', 'Before-delete logic via validation or unmanaged handler'],
          ['`create` (child)', 'Inserted with the parent key; deep insert supported via navigation.', 'Parent association must allow `create`'],
          ['`Activate` (draft)', 'Draft data is validated and moved to active tables.', 'Validations and determinations run during activation']
        ] },
        { t: 'callout', tone: 'warn', title: 'Partial updates are the norm', text: 'A PATCH sends only changed fields. Never assume all fields are present in a handler; read the current state with `READ ENTITIES` and merge deliberately.' },

        { t: 'h', text: 'What "free" does not include' },
        { t: 'list', items: [
          'Key generation — write a determination.',
          'Timestamps and user stamps — write a determination.',
          'Totals and denormalised values — write a determination.',
          'Business rules — write validations.',
          'Anything that must happen in another system/API — unmanaged save or events.',
          'Authorizations — DCL plus instance authorization.'
        ] },
        { t: 'callout', tone: 'tip', title: 'Debug the mapping first', text: 'If fields are empty after a successful save, check `mapping for` before anything else. A missing or wrong mapping writes to the wrong column or silently drops the value in strict mode.' }
      ],
      keyPoints: [
        { front: 'Which runtime step fills keys and timestamps?', back: 'Determinations declared `on save` (or `on modify`) — not the managed runtime automatically. You implement them in the behavior pool.' },
        { front: 'What does `mapping for ztravel { … }` do?', back: 'Maps each CDS element name to its database column, required when names differ (and enforced in strict mode).' },
        { front: 'Does a PATCH always contain all fields?', back: 'No. OData PATCH is partial. Handlers must read existing data and only touch what changed, using `%control` where relevant.' },
        { front: 'What happens to composition children on delete?', back: 'They are deleted with the root if they are part of the composition and the behavior allows the delete; that is the point of the composition lifecycle.' }
      ],
      quiz: [
        { q: 'After a successful POST, `LastChangedAt` is empty. Most likely reason?', options: ['No determination fills it', 'The ETag annotation is missing', 'The service uses OData V4', 'The key is not readonly'], answer: 0, why: 'The managed runtime does not populate admin fields; add a determination (or a table default).' },
        { q: 'When is a `mapping for` block needed?', options: ['When CDS field names differ from table columns', 'Always, even if names match', 'Only for draft tables', 'Only in unmanaged BOs'], answer: 0, why: 'Mapping translates semantic CDS names to physical columns. With identical names it is optional; in strict mode mismatches must be mapped.' },
        { q: 'What does an update write?', options: ['Only the changed fields', 'All fields of the entity', 'Only key fields', 'Nothing until Activate'], answer: 0, why: 'Updates are partial by design. The runtime writes changed fields and checks the ETag first.' }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'determinations',
      title: 'Determinations: derived values done right',
      level: 'intermediate',
      minutes: 12,
      summary: 'on save vs on modify, trigger syntax, local-mode updates, and the recursion traps to avoid.',
      tags: ['behavior', 'determination', 'abap'],
      sections: [
        { t: 'p', cls: 'lead', text: 'A determination is "when X happens, compute Y". It is the clean replacement for scattering setter code through the UI and save logic. The two decisions that matter: *when* it runs and *what* it may change.' },
        { t: 'h', text: 'Declaring the trigger' },
        { t: 'code', lang: 'abap', title: 'Both trigger types', code: `" Runs once before save — best for IDs, totals, timestamps
determination setTravelID on save { create; }

" Runs whenever the entity is modified — best for dependent fields in the UI
determination calcTotalPrice on modify { field TotalPrice, CurrencyCode; }

" Multiple operations and fields
determination deriveStatus on modify { create; update; field BeginDate, EndDate; }` },
        { t: 'table', head: ['Trigger', 'Runs', 'Use for'], rows: [
          ['`on save`', 'Once per save request, before validations/persistence', 'Key generation, timestamps, aggregates needed for persistence'],
          ['`on modify`', 'Whenever the listed fields/operations change during the request', 'UI-driven recalculation, dependent fields, draft edits'],
          ['`field …`', 'Restricts the trigger to specific field changes', 'Avoiding unnecessary recalculation']
        ] },
        { t: 'callout', tone: 'warn', title: '`on modify` can run many times', text: 'It is triggered per modify request — including each keystroke-driven draft update. Keep it cheap and idempotent. If the value only matters at save time, use `on save`.' },

        { t: 'h', text: 'Implementation pattern' },
        { t: 'code', lang: 'abap', title: 'Generate the next ID for new travels', code: `CLASS lcl_handler DEFINITION INHERITING FROM cl_abap_behavior_handler.
  PRIVATE SECTION.
    METHODS setTravelID FOR DETERMINE ON SAVE
      IMPORTING keys FOR Travel~setTravelID.
ENDCLASS.

CLASS lcl_handler IMPLEMENTATION.
  METHOD setTravelID.
    " 1. Read only the keys we were asked about
    READ ENTITIES OF zi_travel IN LOCAL MODE
      ENTITY Travel
        FIELDS ( TravelID )
        WITH CORRESPONDING #( keys )
      RESULT DATA(travels).

    " 2. Determine the current maximum (single point of truth)
    SELECT MAX( travel_id ) FROM ztravel INTO @DATA(max_id).

    " 3. Build the update set
    DATA update TYPE TABLE FOR UPDATE zi_travel\\\\Travel.
    LOOP AT travels INTO DATA(travel) WHERE TravelID IS INITIAL.
      max_id += 1.
      APPEND VALUE #( %tky     = travel-%tky
                      TravelID = max_id ) TO update.
    ENDLOOP.

    " 4. Write through the BO, not the table
    MODIFY ENTITIES OF zi_travel IN LOCAL MODE
      ENTITY Travel
        UPDATE FIELDS ( TravelID )
        WITH update.
  ENDMETHOD.
ENDCLASS.` },
        { t: 'callout', tone: 'why', title: 'Why not UPDATE ztravel directly?', text: 'Writing straight to the table bypasses the transactional buffer, draft handling, ETags and tests. `MODIFY ENTITIES … IN LOCAL MODE` keeps every change inside the BO so the runtime stays consistent.' },

        { t: 'h', text: 'Recursion and ordering traps' },
        { t: 'list', items: [
          'A determination that modifies the same entity and field it is triggered by can loop. Guard with a condition (`WHERE field IS INITIAL`) or use `on save`.',
          'Determination order inside one BDEF is not a contract. Do not build chains that depend on another determination having run.',
          'If two determinations both set the same field, the last writer wins silently — assign ownership of each field.',
          'Validations should not depend on a determination if you can avoid it; compute the value in both places or validate the raw inputs.',
          'Changing a key in a determination after a child was created needs care: update the child foreign key too.'
        ] },
        { t: 'h', text: 'Testing a determination quickly' },
        { t: 'steps', items: [
          { title: 'Call the BO via EML', body: '`MODIFY ENTITIES … CREATE …` with only the user-provided fields, then `COMMIT ENTITIES`.' },
          { title: 'Read the result', body: 'Read the created entity and assert the derived field. This is faster than clicking through Fiori.' },
          { title: 'Test the edge cases', body: 'Empty table, concurrent creates, existing max ID, draft create vs activate.' }
        ] }
      ],
      keyPoints: [
        { front: 'When does an `on save` determination run?', back: 'Once per save request, before validations and persistence — ideal for keys, timestamps and aggregates that must be stored.' },
        { front: 'When does an `on modify` determination run?', back: 'On every relevant modify request (including draft edits), as often as the fields/operations are triggered. It must be cheap and idempotent.' },
        { front: 'How should a determination write data?', back: 'With `MODIFY ENTITIES OF … IN LOCAL MODE`, so the transactional buffer, draft and ETag logic stay consistent — not with direct SQL UPDATE/INSERT.' },
        { front: 'What are the ID-generation steps?', back: 'Read the affected entities, compute the next ID from the persisted max (or a number range), build the update table with `%tky`, then modify via local mode.' },
        { front: 'How can a determination recurse, and how do you prevent it?', back: 'By modifying a field that triggers the same determination again. Prevent it with guards (`WHERE field IS INITIAL`), field-specific triggers, or by using `on save`.' }
      ],
      quiz: [
        { q: 'Which trigger is right for setting `LastChangedAt`?', options: ['`on save`', '`on modify`', '`on read`', '`on activate`'], answer: 0, why: 'A timestamp only needs to be correct at persistence time; `on save` runs once and avoids repeated updates.' },
        { q: 'What should a determination use to persist derived data?', options: ['`MODIFY ENTITIES … IN LOCAL MODE`', 'Direct `UPDATE ztravel`', '`COMMIT WORK`', 'A database trigger'], answer: 0, why: 'Local-mode EML keeps changes in the BO buffer with draft/ETag handling; direct SQL bypasses the framework.' },
        { q: 'Your determination loops the same entity it is triggered by. What is the first fix?', options: ['Guard the update so it only runs on initial values', 'Move it to a validation', 'Disable draft', 'Add `strict ( 2 )`'], answer: 0, why: 'An idempotent guard stops repeated triggering; restructuring the trigger (field-specific or on save) also helps.' }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'validations',
      title: 'Validations, messages and failed entities',
      level: 'intermediate',
      minutes: 12,
      summary: 'Write rules that block the save, attach messages to fields, and behave correctly in the UI and API.',
      tags: ['behavior', 'validation', 'messages', 'abap'],
      sections: [
        { t: 'p', cls: 'lead', text: 'A validation is a *veto*, not a transformation. It answers one question: is this instance allowed to be saved? The answer travels back as messages and a `failed` entry.' },
        { t: 'code', lang: 'abap', title: 'Declaration', code: `validation validateDates on save
  { field BeginDate, EndDate; create; update; }

validation validateAgency on save
  { field AgencyID; create; update; }` },
        { t: 'callout', tone: 'info', title: 'Validations are always `on save`', text: 'Unlike determinations, validations do not support `on modify`. They run during the save/activation sequence. For immediate UI feedback you use the same validation via draft activation or feature control — not a per-keystroke validation.' },

        { t: 'h', text: 'Implementation' },
        { t: 'code', lang: 'abap', title: 'Date validation with field-level message', code: `CLASS lcl_handler DEFINITION INHERITING FROM cl_abap_behavior_handler.
  PRIVATE SECTION.
    METHODS validateDates FOR VALIDATE ON SAVE
      IMPORTING keys FOR Travel~validateDates.
ENDCLASS.

CLASS lcl_handler IMPLEMENTATION.
  METHOD validateDates.
    READ ENTITIES OF zi_travel IN LOCAL MODE
      ENTITY Travel
        FIELDS ( BeginDate EndDate )
        WITH CORRESPONDING #( keys )
      RESULT DATA(travels).

    LOOP AT travels INTO DATA(travel).
      IF travel-BeginDate IS INITIAL
         OR travel-EndDate IS INITIAL
         OR travel-EndDate < travel-BeginDate.

        APPEND VALUE #( %tky = travel-%tky ) TO failed-travel.

        APPEND VALUE #(
          %tky        = travel-%tky
          %element-BeginDate = if_abap_behv=>mk-on
          %element-EndDate   = if_abap_behv=>mk-on
          %msg = new_message_with_text(
            severity = if_abap_behv_message=>severity-error
            text     = 'End date must be on or after the begin date' )
        ) TO reported-travel.
      ENDIF.
    ENDLOOP.
  ENDMETHOD.
ENDCLASS.` },
        { t: 'h', text: 'Anatomy of the result' },
        { t: 'table', head: ['Part', 'Purpose'], rows: [
          ['`failed-travel`', 'Marks the instance as failed. The save is blocked and the API returns an error response.'],
          ['`reported-travel`', 'Carries the message(s) to the UI/log. A message can exist without a failure (warning/info).'],
          ['`%tky`', 'The technical key of the instance — always copy it from the read result.'],
          ['`%element-…`', 'Attaches the message to specific fields (highlighted in Fiori).'],
          ['`severity`', '`error` blocks, `warning` informs, `info` is neutral.'],
          ['`new_message_with_text( … )`', 'Creates a message from text. Use `new_message( id = … number = … )` for message classes.']
        ] },
        { t: 'callout', tone: 'warn', title: 'A message alone does not block', text: 'If you only append to `reported`, the save proceeds. Add the corresponding `failed` entry for every error that must veto the transaction.' },

        { t: 'h', text: 'Validation or determination?' },
        { t: 'compare', left: { title: 'Validation', items: [
          'Checks a business rule',
          'Never modifies data',
          'Blocks the save on error',
          'Runs on save only'
        ] }, right: { title: 'Determination', items: [
          'Computes or derives data',
          'Writes via local-mode EML',
          'Cannot reject by itself (use messages carefully)',
          'Can run on save or modify'
        ] } },

        { t: 'h', text: 'Message quality that saves support tickets' },
        { t: 'list', items: [
          'Say what is wrong **and** what to do: "End date must be on or after begin date", not "Invalid dates".',
          'Attach messages to fields so the user can see them in context.',
          'Include the key in text only when it helps: "Travel 00000042 overlaps an existing booking".',
          'Do not leak technical details (table names, SQL errors) to end users.',
          'Use message classes for translatable texts in production; inline text is fine for prototypes.'
        ] },
        { t: 'callout', tone: 'tip', title: 'Test through EML', text: 'Call the failing create via EML and inspect `failed` and `reported`. It reproduces the exact behavior without the UI, and you can assert on `%msg` severity and text.' }
      ],
      keyPoints: [
        { front: 'Can a validation run on modify instead of save?', back: 'No. Validations are always `on save`. For immediate feedback you rely on draft activation, feature control, or UI-side checks — not a per-keystroke validation.' },
        { front: 'What is the difference between `failed` and `reported`?', back: '`failed` marks the instance as failed and blocks the save; `reported` carries messages (including warnings/infos) back to the consumer.' },
        { front: 'How do you attach a message to a specific field?', back: 'Set `%element-<Field> = if_abap_behv=>mk-on` in the reported entry, alongside `%tky` and `%msg`.' },
        { front: 'Does an error message alone block the save?', back: 'No — you must also append the instance key to `failed-<alias>`. Messages without failure entries are informational.' },
        { front: 'When should you use `new_message` instead of `new_message_with_text`?', back: '`new_message` is for messages from a message class (translatable, numbered); `new_message_with_text` is for dynamic text, typically prototypes or details that are not reusable.' }
      ],
      quiz: [
        { q: 'Which declaration is valid?', options: ['`validation checkX on save { field A; create; update; }`', '`validation checkX on modify { field A; }`', '`validation checkX on read { field A; }`', '`validation checkX on delete { field A; }`'], answer: 0, why: 'Validations support `on save` only, with field/operation triggers in braces.' },
        { q: 'You append an error message to `reported-travel` but the save succeeds. Why?', options: ['You did not add the key to `failed-travel`', 'The message severity was info', 'Draft is disabled', 'The field has no UI annotation'], answer: 0, why: 'Only `failed` blocks the save. `reported` transports messages.' },
        { q: 'How do you make a message appear on the EndDate field in Fiori?', options: ['Set `%element-EndDate = if_abap_behv=>mk-on`', 'Name the message text EndDate', 'Add `@UI.lineItem`', 'Use severity warning'], answer: 0, why: 'The `%element` structure marks which fields the message belongs to.' }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'actions-functions',
      title: 'Actions and functions',
      level: 'advanced',
      minutes: 13,
      summary: 'Business operations beyond CRUD: declaration, parameters, results, feature control, and calling them from the UI and EML.',
      tags: ['behavior', 'actions', 'functions', 'abap'],
      sections: [
        { t: 'p', cls: 'lead', text: 'CRUD changes fields. An action changes the *state of the business object* — accept a travel, reject it, copy it, recalculate. Actions are first-class API operations, not hidden side effects of an update.' },
        { t: 'h', text: 'Declaration' },
        { t: 'code', lang: 'abap', title: 'Instance actions with a result', code: `action ( features : instance ) acceptTravel result [1] $self;
action ( features : instance ) rejectTravel result [1] $self;

" with a parameter
action ( features : instance ) deductDiscount
  parameter ZD_Discount
  result [1] $self;` },
        { t: 'table', head: ['Element', 'Meaning'], rows: [
          ['`action`', 'A modifying operation callable from UI/API.'],
          ['`( features : instance )`', 'Feature control decides per instance whether it is enabled.'],
          ['`result [1] $self`', 'Returns the updated entity. `$self` is the BO entity itself.'],
          ['`parameter ZD_Discount`', 'Input structure; define an abstract CDS entity for complex parameters.'],
          ['Static and internal actions', 'Static actions are not instance-bound; internal actions are callable only from other behavior logic. Both are advanced, release-dependent variants.']
        ] },
        { t: 'h', text: 'Implementation' },
        { t: 'code', lang: 'abap', title: 'acceptTravel', code: `CLASS lcl_handler DEFINITION INHERITING FROM cl_abap_behavior_handler.
  PRIVATE SECTION.
    METHODS acceptTravel FOR MODIFY
      IMPORTING keys FOR ACTION Travel~acceptTravel RESULT result.
ENDCLASS.

CLASS lcl_handler IMPLEMENTATION.
  METHOD acceptTravel.
    " Guard: only open travels may be accepted
    READ ENTITIES OF zi_travel IN LOCAL MODE
      ENTITY Travel
        FIELDS ( TravelStatus )
        WITH CORRESPONDING #( keys )
      RESULT DATA(travels).

    DATA update TYPE TABLE FOR UPDATE zi_travel\\\\Travel.
    LOOP AT travels INTO DATA(travel).
      IF travel-TravelStatus = 'O'.
        APPEND VALUE #( %tky         = travel-%tky
                        TravelStatus = 'A' ) TO update.
      ELSE.
        APPEND VALUE #( %tky = travel-%tky ) TO failed-travel.
        APPEND VALUE #( %tky = travel-%tky
                        %msg = new_message_with_text(
                          severity = if_abap_behv_message=>severity-error
                          text     = 'Only open travels can be accepted' )
                      ) TO reported-travel.
      ENDIF.
    ENDLOOP.

    MODIFY ENTITIES OF zi_travel IN LOCAL MODE
      ENTITY Travel
        UPDATE FIELDS ( TravelStatus )
        WITH update.

    " Return the new state for result [1] $self
    READ ENTITIES OF zi_travel IN LOCAL MODE
      ENTITY Travel
        ALL FIELDS WITH CORRESPONDING #( keys )
      RESULT DATA(updated).

    result = VALUE #( FOR t IN updated
                      ( %tky = t-%tky
                        %param = t ) ).
  ENDMETHOD.
ENDCLASS.` },
        { t: 'callout', tone: 'why', title: 'Why guard inside the action and not only in the UI', text: 'The UI can be bypassed. The action must enforce its own preconditions; feature control only greys out buttons, it does not secure the operation.' },

        { t: 'h', text: 'Calling an action' },
        { t: 'code', lang: 'abap', title: 'EML call (also what the UI does behind the scenes)', code: `MODIFY ENTITIES OF zi_travel
  ENTITY Travel
    EXECUTE acceptTravel
    FROM VALUE #( ( %tky-TravelID = '00000042' ) )
  MAPPED DATA(mapped)
  FAILED DATA(failed)
  REPORTED DATA(reported).

IF failed IS NOT INITIAL.
  " inspect reported for messages
ELSE.
  COMMIT ENTITIES.
ENDIF.` },
        { t: 'p', text: 'In Fiori elements, an action appears as a button when it is declared in the BDEF and annotated for the UI. OData exposes it as bound action `POST /Travel(ID)/acceptTravel`.' },

        { t: 'h', text: 'Functions' },
        { t: 'p', text: 'A function is the read-only sibling of an action. Use it for computed values that are too expensive or too dynamic to store.' },
        { t: 'code', lang: 'abap', title: 'Function declaration', code: `function getBookingCount result [0..1] $self;

" Handler
METHODS getBookingCount FOR READ
  IMPORTING keys FOR FUNCTION Travel~getBookingCount RESULT result.` },
        { t: 'list', items: [
          'The result must correspond to fields the runtime can return (entity fields or an abstract result entity).',
          'Functions do not change data and do not need `COMMIT`.',
          'Prefer a stored total + determination if the value is needed for filtering/sorting; functions are for on-demand display logic.',
          'Expose functions to the UI through annotations or a dedicated action/button.'
        ] },
        { t: 'callout', tone: 'tip', title: 'Action vs update', text: 'If the operation is "set a field to a value the user picks", a normal update is enough. If it is a business decision with preconditions and side effects, make it an action — it shows up in the audit trail, API and UI as a meaningful operation.' }
      ],
      keyPoints: [
        { front: 'What does `result [1] $self` mean in an action declaration?', back: 'The action returns exactly one entity that is the BO instance itself (`$self`), typically the updated state so the UI can refresh without another round trip.' },
        { front: 'Where must business preconditions for an action be enforced?', back: 'Inside the action implementation. UI feature control only disables buttons; it is not a security or correctness boundary.' },
        { front: 'How do you call an action from ABAP?', back: 'With EML: `MODIFY ENTITIES OF <bo> ENTITY <Alias> EXECUTE <action> FROM ... MAPPED/FAILED/REPORTED`, followed by `COMMIT ENTITIES` on success.' },
        { front: 'Action or function — what is the difference?', back: 'An action modifies data and needs a commit; a function is read-only, returns a result and changes nothing.' },
        { front: 'What is the difference between an instance action and a static action?', back: 'An instance action operates on specific entity instances (keys); a static action is not bound to an instance and is used for BO-wide operations.' }
      ],
      quiz: [
        { q: 'Which declaration returns the updated travel after accepting it?', options: ['`action ( features : instance ) acceptTravel result [1] $self;`', '`function acceptTravel result [1] $self;`', '`determination acceptTravel on save;`', '`validation acceptTravel on save;`'], answer: 0, why: 'Actions modify and can return a result; `$self` returns the entity instance. Functions are read-only.' },
        { q: 'What is the correct EML verb for an action?', options: ['`EXECUTE`', '`CALL`', '`RUN`', '`UPDATE`'], answer: 0, why: 'EML uses `MODIFY ENTITIES … ENTITY … EXECUTE <action> FROM ...`.' },
        { q: 'A user calls the action directly via API even though the button is disabled. What should happen?', options: ['The action implementation rejects the precondition', 'The service binding blocks it automatically', 'The UI re-enables the button', 'The ETag prevents it'], answer: 0, why: 'Feature control is a UI hint. The implementation must validate preconditions and fail with messages.' }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'draft',
      title: 'Draft: the full lifecycle',
      level: 'advanced',
      minutes: 13,
      summary: 'How draft storage, Edit/Activate/Discard, total ETags and validation interplay — plus the pitfalls that break it.',
      tags: ['behavior', 'draft', 'ux', 'etag'],
      sections: [
        { t: 'p', cls: 'lead', text: 'Draft is a framework feature with a surprisingly sharp contract: the draft table must mirror the active table, the total ETag must change on every child change, and activation is a save with validations. Understand the lifecycle and it becomes predictable.' },
        { t: 'h', text: 'The lifecycle' },
        { t: 'steps', items: [
          { title: 'Edit', body: 'Creates a draft instance from the active data. The user now owns a lock; other users can still read the active version.' },
          { title: 'Modify (draft)', body: 'PATCH/POST/DELETE go to the draft tables. Determinations with `on modify` can run. Validations do not run yet.' },
          { title: 'Activate', body: 'The runtime runs validations and save determinations, then writes the draft to the active tables and deletes the draft.' },
          { title: 'Discard', body: 'Deletes the draft, releasing the lock. Active data is untouched.' },
          { title: 'Resume / Prepare', body: 'Resume continues an existing draft; Prepare runs `draft determine action Prepare` logic (e.g. recalculation) before display/save.' }
        ] },
        { t: 'code', lang: 'abap', title: 'Required draft declarations', code: `with draft;

define behavior for ZI_Travel alias Travel
persistent table ztravel
draft table ztravel_d
etag master LastChangedAt
lock master total etag LastChangedAt
authorization master ( instance )
{
  create; update; delete;

  draft action Activate optimized;
  draft action Discard;
  draft action Edit;
  draft action Resume;
  draft determine action Prepare;

  association _Booking { create; }
}

define behavior for ZI_Booking alias Booking
persistent table zbooking
draft table zbooking_d
etag dependent by _Travel
lock dependent by _Travel
authorization dependent by _Travel
{
  update; delete;
  association _Travel;
}` },
        { t: 'h', text: 'What the draft table contains' },
        { t: 'list', items: [
          'All persisted business fields of the entity (same types as the active table).',
          'Draft administration fields: `draftentityinstance`, `draftaccessibility`, `draftcreatedby`, `draftcreatedat`, `draftlastchangedby`, `draftlastchangedat`.',
          'A key that combines the business key with the draft instance identifier (generated by ADT).',
          'The draft table must be kept in sync with the active table — regenerate or adjust it when fields change, or activation will fail.'
        ] },
        { t: 'callout', tone: 'warn', title: 'Total ETag is not optional in draft', text: 'Without `total etag`, a change to a child (a booking) may not invalidate a stale UI editing the parent. That is how users silently overwrite each other. Declare it on the root and update it in a determination whenever the BO instance changes.' },

        { t: 'h', text: 'Validations and activation' },
        { t: 'p', text: 'Draft edits are not validated on every keystroke. Validations run at activation (and at save for non-draft). That is deliberate: the user should be able to have an incomplete draft. If you need immediate feedback, add feature control or UI-level checks — but keep the authoritative validation at activation.' },
        { t: 'code', lang: 'abap', title: 'Common activation failure pattern', code: `" Validation: booking date must be in the future
METHOD validateBookingDate.
  READ ENTITIES OF zi_travel IN LOCAL MODE
    ENTITY Booking
      FIELDS ( BookingDate )
      WITH CORRESPONDING #( keys )
    RESULT DATA(bookings).

  LOOP AT bookings INTO DATA(booking).
    IF booking-BookingDate <= sy-datum.
      APPEND VALUE #( %tky = booking-%tky ) TO failed-booking.
      APPEND VALUE #(
        %tky = booking-%tky
        %element-BookingDate = if_abap_behv=>mk-on
        %msg = new_message_with_text(
          severity = if_abap_behv_message=>severity-error
          text = 'Booking date must be in the future' )
      ) TO reported-booking.
    ENDIF.
  ENDLOOP.
ENDMETHOD.` },

        { t: 'h', text: 'Pitfalls that cost the most time' },
        { t: 'table', head: ['Symptom', 'Likely cause', 'Fix'], rows: [
          ['Edit button does nothing / 403', 'Draft actions missing or not activated', 'Declare Edit/Activate/Discard/Resume; activate BDEF'],
          ['Activate fails with "draft table" error', 'Draft table out of sync with CDS fields', 'Regenerate/adjust draft table'],
          ['Changes to children do not invalidate parent edit', 'No `total etag` on root', 'Add `total etag` and update it'],
          ['Draft data disappears after activation', 'Field missing from draft table or mapping', 'Align tables and mapping'],
          ['UI shows active data while editing', 'Wrong `%is_draft` handling in custom read', 'Remove custom read or handle draft keys'],
          ['Validations never fire in draft', 'Expected: they run on activate', 'Activate the draft to trigger them']
        ] },
        { t: 'callout', tone: 'tip', title: 'Test the flow, not just the endpoint', text: 'Use the Fiori preview to Edit → change a child → Activate, then check both `ztravel` and `ztravel_d`. A correct draft leaves no row behind in the draft table after activation.' }
      ],
      keyPoints: [
        { front: 'What does Activate do?', back: 'Runs validations and save determinations on the draft data, writes it to the active tables, and removes the draft instance (releasing the lock).' },
        { front: 'Why is a total ETag required with draft?', back: 'It represents the state of the whole BO instance including children, so a change anywhere invalidates stale edits. Without it, parent edits can overwrite child changes.' },
        { front: 'When do validations run in draft mode?', back: 'At activation (and at save for active data), not per keystroke. Drafts may be incomplete on purpose.' },
        { front: 'What happens on Discard?', back: 'The draft is deleted and the lock released; active data is unchanged.' },
        { front: 'How do child entities participate in draft?', back: 'With their own draft table, `etag dependent by`, `lock dependent by` and `authorization dependent by` referencing the root, and `create` enabled through the parent association.' },
        { front: 'What is `draft determine action Prepare` for?', back: 'A framework draft action that lets you run preparation logic (e.g. recalculations) before the draft is displayed or activated.' }
      ],
      quiz: [
        { q: 'Which pair is required for draft locking?', options: ['`lock master total etag` on the root and `lock dependent by` on children', '`etag master` on every child', 'Only `with draft;`', 'A DCL role per entity'], answer: 0, why: 'The root owns the lock and the total ETag; children are dependent so they are locked through the root.' },
        { q: 'A user edits a travel, leaves, and comes back. What restores the unsaved state?', options: ['Edit/Resume on the existing draft', 'The active table', 'A new draft created from scratch each time', 'The service binding cache'], answer: 0, why: 'The draft instance persists until activation or discard; Resume/Edit reopens it.' },
        { q: 'Validations are not firing while the user types in draft mode. Is this a bug?', options: ['No, validations run on activation', 'Yes, add `on modify`', 'Yes, enable strict mode', 'No, drafts never validate'], answer: 0, why: 'Draft editing intentionally allows incomplete data; validations run when the draft is activated.' }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'unmanaged-save',
      title: 'Unmanaged BOs and the save sequence',
      level: 'advanced',
      minutes: 14,
      summary: 'When you must own create/update/delete/save, how save_modified works, and how to keep the transactional buffer consistent.',
      tags: ['behavior', 'unmanaged', 'save', 'bapi'],
      sections: [
        { t: 'p', cls: 'lead', text: 'Unmanaged exists for the real world: persistence behind a BAPI, an RFC, a legacy function module, or logic the managed runtime cannot express. The framework still provides the buffer, OData and messages — you provide the write and save.' },
        { t: 'code', lang: 'abap', title: 'Unmanaged BDEF header and required operations', code: `unmanaged implementation in class zbp_i_travel_u unique;
strict ( 2 );

define behavior for ZI_Travel alias Travel
persistent table ztravel
lock master
authorization master ( instance )
{
  create; update; delete;
  field ( readonly ) TravelID;
  validation validateAgency on save { field AgencyID; create; update; }
}` },
        { t: 'h', text: 'The methods you implement' },
        { t: 'table', head: ['Method', 'Signature direction', 'Job'], rows: [
          ['`create`', '`FOR MODIFY IMPORTING entities FOR CREATE Travel`', 'Persist new instances (call the BAPI/FM)'],
          ['`update`', '`FOR MODIFY IMPORTING entities FOR UPDATE Travel`', 'Persist changed fields'],
          ['`delete`', '`FOR MODIFY IMPORTING keys FOR DELETE Travel`', 'Remove instances'],
          ['`lock`', '`FOR LOCK IMPORTING keys FOR LOCK Travel`', 'Enqueue/dequeue and fill lock result'],
          ['`read`', '`FOR READ … RESULT result`', 'Only if CDS-based read is not enough'],
          ['`save_modified`', '`REDEFINITION`', 'Decide what to persist and when to commit']
        ] },
        { t: 'callout', tone: 'info', title: 'Let ADT generate the skeleton', text: 'Exact signatures are long and release-dependent. Create the unmanaged behavior definition and let ADT generate the class and handler methods, then fill the bodies. Do not type signatures from memory.' },

        { t: 'h', text: 'A save_modified skeleton' },
        { t: 'code', lang: 'abap', title: 'Persist in the right order, then commit', code: `CLASS lcl_handler IMPLEMENTATION.
  METHOD save_modified.
    " 1. Create the parent first, then the children
    IF create-travel IS NOT INITIAL.
      LOOP AT create-travel INTO DATA(new_travel).
        " e.g. call a BAPI / function module here
        " collect mapped keys if the persistence generates IDs
        APPEND VALUE #( %cid      = new_travel-%cid
                        %key-TravelID = lv_generated_id )
          TO mapped-travel.
      ENDLOOP.
    ENDIF.

    " 2. Updates
    IF update-travel IS NOT INITIAL.
      " call the update API for each entry
    ENDIF.

    " 3. Deletes (children before parent)
    IF delete-booking IS NOT INITIAL.
      " delete children first
    ENDIF.
    IF delete-travel IS NOT INITIAL.
      " then the parent
    ENDIF.

    " 4. Commit once, at the end of the save
    IF failed-travel IS INITIAL AND failed-booking IS INITIAL.
      COMMIT WORK.
    ELSE.
      ROLLBACK WORK.
    ENDIF.
  ENDMETHOD.
ENDCLASS.` },
        { t: 'callout', tone: 'warn', title: 'Commit rules', text: 'Never `COMMIT WORK` inside create/update/delete handlers. Buffer everything and commit once in `save_modified` — otherwise a later failure cannot roll back the earlier writes.' },

        { t: 'h', text: 'Mapped, failed, reported' },
        { t: 'list', items: [
          '**mapped** — tell the runtime which technical keys correspond to the request (`%cid` → new key). Without it, the caller cannot see the created instance.',
          '**failed** — mark instances that could not be persisted. The framework rolls back the save for them.',
          '**reported** — transport messages, especially those returned by the BAPI (use `BAPIRET2` conversion).',
          '**%pid / %cid** — request identity; use `%cid` from the input when mapping generated keys.'
        ] },
        { t: 'h', text: 'When unmanaged is the right call' },
        { t: 'compare', left: { title: 'Choose unmanaged', items: [
          'Persistence must call a BAPI/RFC/legacy FM',
          'Save order spans systems or non-RAP tables',
          'You need fine-grained control over commit/rollback',
          'Wrapping an existing API without copying it'
        ] }, right: { title: 'Avoid unmanaged when', items: [
          'Standard managed CRUD fits',
          'You would only reimplement INSERT/UPDATE',
          'You want draft with minimal effort',
          'Your team is new to RAP: more code, more failure modes'
        ] } },
        { t: 'callout', tone: 'tip', title: 'Migration path', text: 'You can start unmanaged to wrap an existing API, then move to managed once the persistence is replaced. The behavior definition header changes, but the CDS model, service and UI survive.' }
      ],
      keyPoints: [
        { front: 'Which handlers must an unmanaged BO implement?', back: '`create`, `update`, `delete`, `lock`, and `save_modified` (plus `read` if CDS-based reads are insufficient). Managed supplies these in the runtime.' },
        { front: 'Where must `COMMIT WORK` happen?', back: 'Once in `save_modified`, after all persistence steps succeeded — never inside the create/update/delete handlers.' },
        { front: 'What is the `mapped` structure for?', back: 'Returning generated keys to the caller, mapping `%cid` from the request to the newly created technical key so the UI/API can continue working with the instance.' },
        { front: 'Why not implement unmanaged just to avoid learning managed?', back: 'It multiplies code and failure modes. Unmanaged is justified by a real persistence constraint (BAPI, RFC, legacy save), not by preference.' },
        { front: 'How should BAPI errors reach the UI?', back: 'Convert BAPIRET2 entries into `reported` messages (with severity) and add failed instances to `failed`, so the OData response carries a proper error.' }
      ],
      quiz: [
        { q: 'Where does the commit belong in an unmanaged BO?', options: ['`save_modified`, after all persistence succeeded', 'In `create`, immediately', 'In the OData service binding', 'In `lock`'], answer: 0, why: 'One commit at the end allows rollback if any part fails; committing earlier breaks transactionality.' },
        { q: 'Which structure maps a request `%cid` to a newly generated key?', options: ['`mapped`', '`failed`', '`reported`', '`keys`'], answer: 0, why: '`mapped` returns the generated technical keys to the caller; `failed` and `reported` handle errors and messages.' },
        { q: 'Which is a legitimate reason for unmanaged?', options: ['Persistence must go through an existing BAPI', 'You want draft automatically', 'You want less ABAP code', 'You dislike strict mode'], answer: 0, why: 'Unmanaged is for persistence that cannot use managed standard CRUD, such as BAPI/RFC-backed writes.' }
      ]
    }
  ]
});
