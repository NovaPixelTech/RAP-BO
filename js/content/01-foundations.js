/* ==========================================================================
   Module 1 — Foundations
   ========================================================================== */
(window.RAP_COACH_CONTENT = window.RAP_COACH_CONTENT || []).push({
  id: 'm1',
  title: 'Foundations',
  tagline: 'What RAP is, how the pieces fit, and why it is built this way.',
  description: 'Build an accurate mental model before touching the editor: the four layers, the artifacts, managed vs unmanaged, and the end-to-end build flow.',
  lessons: [

    /* ------------------------------------------------------------------ */
    {
      id: 'why-rap',
      title: 'RAP in one page',
      level: 'beginner',
      minutes: 9,
      summary: 'The four layers, what the framework does for you, and the request path from a Fiori app down to the database.',
      tags: ['architecture', 'overview'],
      sections: [
        { t: 'p', cls: 'lead', text: 'RAP — the **ABAP RESTful Application Programming Model** — is SAP\'s standard way to build transactional business apps on S/4HANA and ABAP Cloud. You describe a *business object* once, in layers, and the framework supplies the OData service, the draft handling, the locking, the Fiori UI plumbing and the save sequence.' },

        { t: 'h', text: 'One business object, four layers' },
        { t: 'p', text: 'A RAP BO is not one object. It is a stack of artifacts, each with a job. You always build from the bottom up, because every layer references the one below it.' },
        { t: 'table', head: ['Layer', 'What you create', 'What it is for'], rows: [
          ['Data model', 'CDS view entities: interface view (`ZI_…`) and projection view (`ZC_…`)', 'The semantic data model: fields, types, associations, compositions, value helps, access control.'],
          ['Behavior', 'Behavior definition (`ZI_…`) plus behavior pool class (`ZBP_I_…`)', 'What can happen to the data: create, update, delete, actions, validations, determinations, draft, locking.'],
          ['Business service', 'Service definition (`ZUI_…`) plus service binding (`ZUI_…_O4`)', 'Exposes chosen entities as an OData V4/V2 service or a Web API.'],
          ['Consumption', 'Fiori elements app, API client, integration', 'The UI or consumer that talks to the service over HTTP.']
        ] },

        { t: 'callout', tone: 'why', title: 'Why the layers exist', text: 'The interface view stays stable while consumption changes. The same BO can feed a Fiori list report, a mobile app, an integration API and in-app ABAP code (via EML) — without duplicating logic. Behavior lives in one place, so every consumer gets the same validations and actions.' },

        { t: 'h', text: 'What the framework gives you for free' },
        { t: 'list', items: [
          '**CRUD implementation** in the managed scenario — you declare `create; update; delete;` and the runtime writes to the database.',
          '**Draft handling** — edit-in-progress storage, activate/discard, lock conflicts, total ETag.',
          '**Optimistic locking** — ETag checks; a stale edit gets HTTP 412 instead of silently overwriting.',
          '**OData metadata** — `$metadata`, `$expand`, `$filter`, `$orderby`, deep inserts, batch requests.',
          '**Fiori elements UI** — list report and object page generated from UI annotations; no freestyle UI code needed for standard apps.',
          '**Messages and feature control** — validation messages reach the UI, fields and actions can be enabled or hidden per instance.',
          '**Authorization hooks** — instance-level checks plugged into the same behavior layer.'
        ] },

        { t: 'h', text: 'The request path' },
        { t: 'p', text: 'When a user presses Save in a Fiori app, this happens:' },
        { t: 'steps', items: [
          { title: 'Fiori app → OData request', body: 'The UI sends a `POST`/`PATCH`/`DELETE` (or a `$batch`) to the service binding URL.' },
          { title: 'Service binding → service definition', body: 'The binding routes the request to an exposed entity of the service definition.' },
          { title: 'Behavior definition', body: 'The runtime resolves which operations are allowed and invokes your determinations, validations, actions and authorization checks.' },
          { title: 'Behavior pool (ABAP class)', body: 'Your code runs here — but only for the logic you actually implemented.' },
          { title: 'CDS → database', body: 'Managed save writes changes; the response returns the new state, ETag and messages.' }
        ] },

        { t: 'code', lang: 'abap', title: 'A minimal interface view — the top of the stack', code: `@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Travel - interface'
define view entity ZI_Travel
  as select from ztravel
{
  key travel_id          as TravelID,
      agency_id          as AgencyID,
      customer_id        as CustomerID,
      begin_date         as BeginDate,
      end_date           as EndDate,
      @Semantics.amount.currencyCode: 'CurrencyCode'
      total_price        as TotalPrice,
      currency_code      as CurrencyCode,
      last_changed_at    as LastChangedAt
}` },

        { t: 'h', text: 'RAP compared to what came before' },
        { t: 'compare', left: { title: 'Classic ABAP stacks', items: [
          'Separate data, logic and UI layers with glue code',
          'SOAP/RFC services, Web Dynpro, BOPF, custom OData',
          'Save logic written by hand per object',
          'UI rebuilt for every channel'
        ] }, right: { title: 'RAP', items: [
          'One BO definition drives every layer',
          'OData V4/V2 out of the box',
          'Managed save and draft are framework features',
          'Fiori elements UI generated from annotations'
        ] } },

        { t: 'callout', tone: 'tip', title: 'The learning order that works', text: 'Do not start with behavior syntax. First be able to read a CDS view entity and explain its associations. Then add `managed implementation`, then a service binding. You can have a working read-only app before you write a single line of ABAP.' }
      ],
      keyPoints: [
        { front: 'Name the four RAP layers, bottom to top.', back: 'Data model (CDS view entities) → Behavior (behavior definition + behavior pool class) → Business service (service definition + binding) → Consumption (Fiori elements app / API client).' },
        { front: 'What does "managed" mean in a RAP BO?', back: 'The framework implements standard CRUD, the save sequence, draft persistence, ETag locking and the transactional buffer. You only add determinations, validations, actions and custom logic. In an unmanaged BO you implement those yourself.' },
        { front: 'Which artifact actually creates the OData endpoint?', back: 'The service binding. The service definition only lists which entities are exposed and under which alias; the binding decides protocol (OData V4/V2, Web API) and publishes the service.' },
        { front: 'What is the job of a projection view (ZC_)?', back: 'It is the consumption-specific layer on top of the interface view: it adds UI, search and value-help annotations, and exposes only what the service needs — while the interface view stays stable and reusable.' },
        { front: 'Where does a request get validated, and where does it get saved?', back: 'Validations and determinations run in the behavior layer during the request. The managed save sequence persists the buffered changes afterwards; a failed validation stops the save and returns messages to the UI.' },
        { front: 'Why does RAP use ETags?', back: 'For optimistic locking. The client sends the ETag it last read; if the record changed meanwhile, the request fails with 412 instead of overwriting another user\'s data.' }
      ],
      quiz: [
        { q: 'Which building block publishes a RAP business object as an OData service?', options: ['Service binding', 'Service definition', 'Behavior definition', 'Projection view'], answer: 0, why: 'The service definition is the list of exposed entities; the binding selects the protocol and publishes the endpoint.' },
        { q: 'In a managed RAP BO, which part do you normally NOT implement yourself?', options: ['The save sequence and draft persistence', 'Validations', 'Determinations', 'Actions'], answer: 0, why: 'Managed means the framework provides standard CRUD, save, draft and locking. Validations, determinations and actions are exactly the extension points you do implement.' },
        { q: 'What is the correct build order?', options: ['Data model → behavior → service definition/binding', 'Service binding → behavior → data model', 'Behavior → data model → service definition', 'Data model → service binding → behavior'], answer: 0, why: 'Each layer references the one below. A behavior definition needs an entity from the CDS model, and a service exposes entities from the model.' }
      ],
      resources: [
        { label: 'SAP Help — ABAP RESTful Application Programming Model', url: 'https://help.sap.com/docs/abap-cloud/abap-rap/abap-restful-application-programming-model' },
        { label: 'SAP-samples — RAP openSAP course repository', url: 'https://github.com/SAP-samples/abap-platform-rap-opensap' }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'bo-anatomy',
      title: 'Anatomy of a RAP business object',
      level: 'beginner',
      minutes: 10,
      summary: 'The artifact map: what each object is called, what references what, and which parts are optional.',
      tags: ['architecture', 'artifacts', 'naming'],
      sections: [
        { t: 'p', cls: 'lead', text: 'A RAP business object is a family of repository objects. Knowing the family — and which member owns which decision — is what makes the syntax feel obvious instead of arbitrary.' },

        { t: 'h', text: 'The artifact map' },
        { t: 'table', head: ['Artifact', 'Typical name', 'References', 'Required?'], rows: [
          ['Database table', '`ZTRAVEL`', '—', 'Yes, unless your BO is read-only or built on existing tables'],
          ['Interface view entity', '`ZI_Travel`', 'Table or other CDS views', 'Yes — the semantic root'],
          ['Projection view entity', '`ZC_Travel`', '`ZI_Travel`', 'Recommended — the consumption view'],
          ['Behavior definition', '`ZI_Travel` (same name as interface view)', 'Interface view', 'Yes for transactional BOs'],
          ['Behavior pool class', '`ZBP_I_Travel`', 'Behavior definition (`for behavior of`)', 'Only if you have custom logic (quick-fix generates it)'],
          ['Metadata extension', '`ZC_Travel` (same name as projection)', 'Projection view', 'No — but usual for Fiori apps'],
          ['Access control (DCL)', '`ZI_Travel` role', 'CDS entity', 'Depends on `@AccessControl.authorizationCheck`'],
          ['Service definition', '`ZUI_Travel`', '`ZC_Travel`', 'Yes to expose a service'],
          ['Service binding', '`ZUI_TRAVEL_O4`', 'Service definition', 'Yes to publish OData'],
          ['Behavior implementation include', '`ZBP_I_Travel##CCIMP`', 'Generated by ADT', 'Auto-generated with the class']
        ] },

        { t: 'callout', tone: 'info', title: 'Naming is a convention, not a rule', text: '`ZI_`, `ZC_`, `ZBP_I_`, `ZUI_` are widespread community/SAP conventions. The compiler never checks them. But consistent names make navigation, search and code review dramatically easier — and many SAP samples and trainings assume them.' },

        { t: 'h', text: 'Who owns which decision' },
        { t: 'list', items: [
          '**Interface view** owns the business meaning: field names, types, associations, compositions, text relationships.',
          '**Projection view** owns the consumer view: which fields are visible, labels, UI layout, search, value help.',
          '**Behavior definition** owns the contract: operations, actions, validations, determinations, draft, locking, authorization.',
          '**Behavior pool** owns the implementation: ABAP handlers for the methods the behavior definition declared.',
          '**Service definition** owns scope: which entities are reachable from outside.',
          '**Service binding** owns protocol and publication: OData V4 vs V2, UI vs Web API, the URL.'
        ] },

        { t: 'h', text: 'A tiny but complete example' },
        { t: 'code', lang: 'abap', title: 'ZI_Travel — interface view with a composition', code: `@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Travel - interface'
define view entity ZI_Travel
  as select from ztravel
  association [0..*] to ZI_Booking as _Booking
    on $projection.TravelID = _Booking.TravelID
{
  key travel_id       as TravelID,
      agency_id       as AgencyID,
      customer_id     as CustomerID,
      begin_date      as BeginDate,
      end_date        as EndDate,
      total_price     as TotalPrice,
      currency_code   as CurrencyCode,
      last_changed_at as LastChangedAt,
      _Booking
}` },

        { t: 'code', lang: 'abap', title: 'ZI_Travel — behavior definition (managed, no draft yet)', code: `managed implementation in class zbp_i_travel unique;
strict ( 2 );

define behavior for ZI_Travel alias Travel
persistent table ztravel
lock master
authorization master ( instance )
{
  create;
  update;
  delete;

  field ( readonly ) TravelID, LastChangedAt;
  field ( mandatory ) AgencyID, CustomerID, BeginDate, EndDate;

  association _Booking { create; }
}` },

        { t: 'code', lang: 'abap', title: 'ZUI_Travel — service definition', code: `@EndUserText.label: 'Travel service'
define service ZUI_Travel {
  expose ZC_Travel as Travel;
  expose ZC_Booking as Booking;
}` },

        { t: 'p', text: 'That is already a working read/write BO. The missing pieces are annotations (UI), a metadata extension, and a service binding — none of which change the core design.' },

        { t: 'callout', tone: 'warn', title: 'The most common beginner confusion', text: 'The behavior definition and the interface view share the name `ZI_Travel`, but they are different repository objects. The behavior definition is the one that starts with `managed`/`unmanaged` and contains `define behavior for`.' }
      ],
      keyPoints: [
        { front: 'Which two objects share the same name in a RAP BO, and how do you tell them apart?', back: 'The interface view entity and its behavior definition both use `ZI_<Entity>`. The view starts with `define view entity`; the behavior definition starts with `managed`/`unmanaged implementation` and contains `define behavior for`.' },
        { front: 'What does the behavior pool class reference in its definition?', back: '`CLASS zbp_i_travel DEFINITION PUBLIC ABSTRACT FINAL FOR BEHAVIOR OF zi_travel.` The `FOR BEHAVIOR OF` clause binds the class to the behavior definition; handlers are implemented in the local handler class inside the CCIMP include.' },
        { front: 'Where do UI annotations belong?', back: 'In a metadata extension on the projection view (`annotate entity ZC_Travel with { ... }`), or as annotations directly in the projection view. Keeping them in a metadata extension separates layout from the data model.' },
        { front: 'What does the service definition decide, and what does the binding decide?', back: 'The service definition lists exposed entities and aliases (scope). The binding chooses OData V4/V2 or Web API and publishes the service with a URL (protocol/publication).' },
        { front: 'When is a metadata extension not needed?', back: 'For pure API use with no Fiori UI, and when no UI-specific annotations are required. The service works without it; Fiori elements just has nothing to render a nice list/object page from.' },
        { front: 'Why can the same BO serve a Fiori app and an integration API?', back: 'Both consume the service layer of the same BO, so they share data model, behavior, validations and authorization. Only the exposed scope and annotations differ.' }
      ],
      quiz: [
        { q: 'Where is the rule "field AgencyID is mandatory" declared?', options: ['Behavior definition', 'Projection view', 'Service definition', 'Metadata extension'], answer: 0, why: 'Mandatory fields are part of the behavior contract: `field ( mandatory ) AgencyID;` in the behavior definition.' },
        { q: 'Which object does NOT reference the interface view directly?', options: ['Service binding', 'Projection view', 'Behavior definition', 'Metadata extension on the projection'], answer: 0, why: 'The binding references the service definition, not the CDS entity directly. The other three all target the CDS layer (projection or interface).' },
        { q: 'You need instance-level authorization. Where is it enabled?', options: ['`authorization master ( instance )` in the behavior definition', '`@AccessControl.authorizationCheck: #CHECK` alone', 'In the service binding settings', 'In the metadata extension'], answer: 0, why: 'The annotation/DCL enables the check, but instance-level authorization must be declared in the behavior definition with `authorization master ( instance )` and implemented via `get_instance_authorizations`.' },
        { q: 'What is the CCIMP include used for in a behavior pool?', options: ['It holds the local handler class with the method implementations', 'It stores the OData metadata', 'It defines the database table', 'It declares the service definition'], answer: 0, why: 'ADT generates `ZBP_I_X##CCIMP` containing `lcl_handler`; that is where determinations, validations and actions are implemented.' }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'managed-unmanaged-draft',
      title: 'Managed, unmanaged, and draft: choose deliberately',
      level: 'beginner',
      minutes: 11,
      summary: 'A decision guide with the trade-offs, the exact BDEF header syntax, and when draft is worth the extra table.',
      tags: ['behavior', 'managed', 'draft', 'decisions'],
      sections: [
        { t: 'p', cls: 'lead', text: 'Three early decisions determine most of the work: managed or unmanaged implementation, with or without draft, and how the BO is composed. Get these right and the rest is detail.' },

        { t: 'h', text: 'Managed vs unmanaged' },
        { t: 'compare', left: { title: 'Managed', items: [
          'Framework does CUD and the save sequence',
          'Automatic draft support',
          'Automatic ETag and lock handling',
          'You add determinations, validations, actions',
          'Default choice for new transactional BOs'
        ] }, right: { title: 'Unmanaged', items: [
          'You implement create, update, delete and save',
          'You control the save sequence and legacy APIs',
          'Draft is not automatic',
          'Needed when wrapping BAPIs, function modules or legacy tables',
          'More code, more control'
        ] } },
        { t: 'code', lang: 'abap', title: 'The only difference in the header', code: `" managed
managed implementation in class zbp_i_travel_m unique;
strict ( 2 );
with draft;
define behavior for ZI_Travel alias Travel
persistent table ztravel
draft table ztravel_d
etag master LastChangedAt
lock master total etag LastChangedAt
authorization master ( instance )
{
  create; update; delete;
}

" unmanaged
unmanaged implementation in class zbp_i_travel_u unique;
strict ( 2 );
define behavior for ZI_Travel alias Travel
persistent table ztravel
lock master
authorization master ( instance )
{
  create; update; delete;
}` },

        { t: 'callout', tone: 'why', title: 'What unmanaged really means', text: 'The framework still manages the transactional buffer, the OData layer, messages, and the draft if you add it. What you implement is `create`, `update`, `delete`, `lock`, and the save (`save_modified`) — usually delegating to existing APIs. Unmanaged is a bridge, not a punishment.' },

        { t: 'h', text: 'Draft: what you get and what it costs' },
        { t: 'p', text: 'Draft lets a user start editing, navigate away, and continue later. It stores an intermediate state separate from the active data.' },
        { t: 'table', head: ['With draft', 'Without draft'], rows: [
          ['Extra draft table `ztravel_d` (generated)', 'No extra table'],
          ['Edit → Activate flow in the UI', 'Changes are saved immediately on Save'],
          ['Total ETag across the BO', 'Per-entity ETag only'],
          ['Better UX for long forms and multi-entity edits', 'Simpler, fewer moving parts'],
          ['Draft actions: Edit, Activate, Discard, Resume, Prepare', 'No draft actions'],
          ['Locks held by draft ownership', 'Short-lived locks during save']
        ] },
        { t: 'code', lang: 'abap', title: 'Draft-related BDEF statements', code: `with draft;

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
}` },
        { t: 'callout', tone: 'warn', title: 'Draft table must match', text: 'The draft table includes all persisted fields plus draft administration fields (for example `draftentityinstance`, `draftaccessibility`, `draftcreatedby`). ADT can generate it from the behavior definition — use the generator instead of hand-writing it.' },

        { t: 'h', text: 'A decision checklist' },
        { t: 'steps', items: [
          { title: 'Does the BO write data?', body: 'No → a read-only BO: no behavior definition at all, just CDS + service. You still get a query API.' },
          { title: 'Can the standard CRUD be expressed directly on tables?', body: 'Yes → managed. No (BAPI, RFC, non-standard persistence) → unmanaged.' },
          { title: 'Do users edit over multiple screens or need to resume later?', body: 'Yes → add draft. Simple, short, single-entity edits → skip draft and keep it lean.' },
          { title: 'Is the BO composed of multiple entities?', body: 'Root + child → use compositions and `association _Child { create; }` in the parent, plus `lock dependent by _Parent` in the child.' }
        ] },
        { t: 'callout', tone: 'tip', title: 'Start managed, no draft', text: 'Get a working managed BO without draft first. Add draft later as a small, isolated change (`with draft;` + draft table + draft actions). This makes debugging far easier than starting with everything enabled.' }
      ],
      keyPoints: [
        { front: 'Which methods do you implement in an unmanaged BO that managed gives you free?', back: '`create`, `update`, `delete`, `lock`, and the save logic in `save_modified` (plus read if needed). Managed implements these in the runtime.' },
        { front: 'What extra database object does draft require?', back: 'A draft table (e.g. `ZTRAVEL_D`) holding the in-progress version, including draft administration fields. It is declared with `draft table ztravel_d` and can be generated by ADT.' },
        { front: 'What is the difference between `etag master` and `lock master`?', back: '`etag master` names the field used for optimistic locking of the entity. `lock master` declares the entity as lock owner; with draft you also set `total etag` for the whole BO instance.' },
        { front: 'When should you choose unmanaged?', back: 'When persistence must go through existing APIs (BAPIs, function modules) or legacy logic you cannot replace — or when the save sequence needs behaviour the managed runtime cannot express.' },
        { front: 'How is a child entity attached to a root?', back: 'Through a composition in the CDS model and `association _Child { create; }` in the root behavior definition; the child declares `lock dependent by _Parent` and `authorization dependent by _Parent`.' },
        { front: 'Do read-only BOs need a behavior definition?', back: 'No. Without a behavior definition the BO is read-only; the CDS entity can still be exposed through a service definition and binding.' }
      ],
      quiz: [
        { q: 'You must reuse an existing BAPI for saving. Which scenario fits?', options: ['Unmanaged implementation', 'Managed implementation', 'Read-only BO', 'Managed with draft'], answer: 0, why: 'Unmanaged lets you implement create/update/delete and the save sequence yourself, which is exactly what wrapping a BAPI requires.' },
        { q: 'What does `with draft;` add to a BO?', options: ['Draft persistence, draft actions and a total ETag', 'Only a new service binding', 'Instance authorization', 'Automatic numbering'], answer: 0, why: 'Draft mode brings the draft table, the Edit/Activate/Discard/Resume flow, and a BO-wide total ETag for conflict detection.' },
        { q: 'Which declaration makes a child entity lock together with its root?', options: ['`lock dependent by _Travel` in the child', '`lock master` in the child', '`etag master` in the child', '`with draft` in the child'], answer: 0, why: 'Children use `lock dependent by _Parent` (and `authorization dependent by _Parent`); only the root is `lock master`.' },
        { q: 'A BO only reads data. What is the leanest valid design?', options: ['CDS views + service definition + binding, no behavior definition', 'Managed BO with create/update/delete disabled', 'Unmanaged BO with empty methods', 'Managed BO with draft'], answer: 0, why: 'Without a behavior definition the entity is read-only. You still get a query OData service from the binding.' }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'first-bo-walkthrough',
      title: 'Build your first BO: the exact clicks',
      level: 'beginner',
      minutes: 14,
      summary: 'A concrete ADT walkthrough from package to Fiori preview, with the code for each artifact and a definition of done.',
      tags: ['hands-on', 'adt', 'walkthrough'],
      sections: [
        { t: 'p', cls: 'lead', text: 'This is the fastest path to a *working* travel BO: table → interface view → projection view → behavior → service → binding → preview. Follow it once end-to-end before optimising anything.' },

        { t: 'callout', tone: 'info', title: 'Prerequisites', text: 'Eclipse with ABAP Development Tools (ADT), an ABAP Cloud or S/4HANA system with RAP enabled (7.55+ for view entities; older systems use `define view`), and a package you can write to. Everything below is transportable.' },

        { t: 'h', text: 'Step by step' },
        { t: 'steps', items: [
          { title: 'Create the table', body: 'New → Database Table, name `ZTRAVEL`, delivery class A. Keys: `travel_id` (NUMC 10? use `abap.numc(10)` or an INT4/CHAR). Client field first. Include `last_changed_at` for the ETag.' },
          { title: 'Create the interface view', body: 'New → Data Definition, name `ZI_Travel`, template "define view entity". Select from `ztravel`, alias every field with a semantic name.' },
          { title: 'Create the projection view', body: 'New → Data Definition `ZC_Travel` → `as select from ZI_Travel`. Keep it thin for now.' },
          { title: 'Create the behavior definition', body: 'Right-click `ZI_Travel` → New Behavior Definition. Choose "managed", tick "draft" only if needed. Set the implementation class to `ZBP_I_Travel`.' },
          { title: 'Generate the behavior pool', body: 'ADT offers a quick fix to create the class `ZBP_I_Travel` with the CCIMP include. Accept the generated skeleton.' },
          { title: 'Add the service definition', body: 'New → Service Definition `ZUI_Travel`, expose `ZC_Travel as Travel`.' },
          { title: 'Create the service binding', body: 'New → Service Binding `ZUI_TRAVEL_O4`, binding type "OData V4 - UI", service definition `ZUI_Travel`. Click Activate, then Publish.' },
          { title: 'Preview', body: 'In the binding, double-click the entity set. Without UI annotations you get a raw data preview; add a metadata extension for a real list report.' }
        ] },

        { t: 'code', lang: 'abap', title: 'Table (simplified)', code: `@EndUserText.label : 'Travel'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
define table ztravel {
  key client         : abap.clnt not null;
  key travel_id      : abap.numc(10) not null;
      agency_id      : abap.numc(6);
      customer_id    : abap.numc(6);
      begin_date     : abap.dats;
      end_date       : abap.dats;
      total_price    : abap.curr(15,2);
      currency_code  : abap.cuky;
      description    : abap.char(1024);
      last_changed_at : timestampl;
}` },

        { t: 'code', lang: 'abap', title: 'Projection view + UI annotations in one place (works, but metadata ext is cleaner)', code: `@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Travel - consumption'
@Search.searchable: true
define view entity ZC_Travel
  as select from ZI_Travel
{
  key TravelID,
      @Search.defaultSearchElement: true
      AgencyID,
      CustomerID,
      BeginDate,
      EndDate,
      @Semantics.amount.currencyCode: 'CurrencyCode'
      TotalPrice,
      CurrencyCode,
      LastChangedAt
}` },

        { t: 'code', lang: 'abap', title: 'Behavior definition to start with', code: `managed implementation in class zbp_i_travel unique;
strict ( 2 );

define behavior for ZI_Travel alias Travel
persistent table ztravel
lock master
authorization master ( instance )
{
  create;
  update;
  delete;

  field ( readonly ) TravelID, LastChangedAt;
  field ( mandatory ) AgencyID, CustomerID, BeginDate, EndDate;
}` },

        { t: 'callout', tone: 'warn', title: 'If activation fails', text: 'Read the errors bottom-up: one root cause usually produces cascades. Typical order of fixes: table types → CDS field names/types → behavior definition references → service definition → binding. Do not try to fix layer 4 before layer 2 is clean.' },

        { t: 'h', text: 'Definition of done' },
        { t: 'list', checked: true, items: [
          'The service binding publishes without errors and gives you a URL.',
          'A GET on the entity set returns an empty `value` array (not an error).',
          'A POST with a valid payload creates a row in `ZTRAVEL`.',
          'A PATCH changes a field and the ETag changes with it.',
          'A DELETE removes the row.',
          'The Fiori preview shows a list report with the fields you annotated.'
        ] },
        { t: 'callout', tone: 'tip', title: 'Save the URL', text: 'The preview URL is the fastest debugging tool you have. Keep it in your browser bar; append `$metadata` to inspect what the service actually exposes.' }
      ],
      keyPoints: [
        { front: 'What are the first five artifacts of a minimal transactional RAP BO?', back: 'Table, interface view (ZI_), projection view (ZC_), behavior definition + behavior class, service definition + service binding.' },
        { front: 'Which ADT object produces the OData URL you can test with?', back: 'The service binding. Activate it, publish it, then use its preview or the service URL for GET/POST tests.' },
        { front: 'What is the definition of done for a first BO?', back: 'Binding published, GET returns a list, POST creates a row, PATCH updates with a new ETag, DELETE removes it, and the Fiori preview renders the annotated fields.' },
        { front: 'Why keep the projection view thin at first?', back: 'The projection is the consumer layer. Starting thin isolates problems: if the service fails while the projection is trivial, the fault is almost certainly in the interface view or behavior.' },
        { front: 'What is the fastest way to inspect service metadata?', back: 'Append `$metadata` to the service URL. It shows entity sets, properties, keys, navigation properties and supported operations.' }
      ],
      quiz: [
        { q: 'You want a quick read-only check that the service works. What do you call?', options: ['GET on the entity set URL', 'POST on the entity set', 'Activate the behavior pool', 'Create a DCL role'], answer: 0, why: 'A GET returns the entity collection (possibly empty). It validates binding, service definition, CDS and authorization in one shot.' },
        { q: 'Activation fails with several errors. What is the best strategy?', options: ['Fix the lowest-layer error first, reactivate, repeat', 'Fix all errors at once', 'Delete and recreate every object', 'Restart Eclipse'], answer: 0, why: 'Errors cascade upward. One corrected CDS field often clears several behavior/service errors.' },
        { q: 'Which choice in the service binding wizard matters first?', options: ['Binding type (OData V4 - UI, OData V2 - UI, Web API)', 'Package', 'Transport request', 'Description'], answer: 0, why: 'The binding type determines protocol and consumption style, which in turn affects annotations and client support.' }
      ]
    }
  ]
});
