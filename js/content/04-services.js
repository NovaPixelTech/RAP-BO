/* ==========================================================================
   Module 4 — Services and UI
   ========================================================================== */
(window.RAP_COACH_CONTENT = window.RAP_COACH_CONTENT || []).push({
  id: 'm4',
  title: 'Services & UI',
  tagline: 'Publish the BO, shape the Fiori app, and test the API like a consumer.',
  description: 'A BO that nobody can reach is a hobby. Learn the service layer, annotation-driven UI, and how to verify behaviour over HTTP.',
  lessons: [

    /* ------------------------------------------------------------------ */
    {
      id: 'service-def-binding',
      title: 'Service definition and binding',
      level: 'beginner',
      minutes: 10,
      summary: 'Scope vs protocol, the three binding types, aliases, and the fastest way to a working endpoint.',
      tags: ['service', 'odata', 'binding'],
      sections: [
        { t: 'p', cls: 'lead', text: 'Two objects, two jobs. The **service definition** says *what* is exposed. The **service binding** says *how* and *where* it is published.' },
        { t: 'code', lang: 'abap', title: 'Service definition', code: `@EndUserText.label: 'Travel - OData service'
define service ZUI_TRAVEL {
  expose ZC_Travel  as Travel;
  expose ZC_Booking as Booking;
  expose ZC_Agency  as Agency;
}` },
        { t: 'list', items: [
          '`expose` takes a CDS entity from the projection layer (or interface layer for APIs).',
          '`as Travel` sets the **entity set name** in the service — this is what clients see in the URL and `$metadata`.',
          'Entities not listed are not reachable, even if they exist in the model.',
          'Expose children explicitly (Booking) if clients should address them directly; otherwise they are reachable via `$expand` only.'
        ] },

        { t: 'h', text: 'Binding types' },
        { t: 'table', head: ['Binding type', 'Use for', 'Notes'], rows: [
          ['OData V4 – UI', 'Fiori elements apps with draft', 'Best default for new UI apps; supports draft, side effects, modern annotations'],
          ['OData V2 – UI', 'Fiori elements when V4 is not supported by the target stack', 'Older but widely deployed; some annotation differences'],
          ['OData V4 – Web API', 'Integration/API-only consumption', 'No UI semantics; ideal for external systems'],
          ['OData V2 – Web API', 'Legacy integrations', 'Use only when the consumer requires V2']
        ] },
        { t: 'callout', tone: 'why', title: 'Why two objects at all?', text: 'Scope changes more often than protocol. You can expose a different subset to a Web API than to the UI, while reusing the same BO. The binding also carries publication metadata (URL, service version) without touching the model.' },

        { t: 'h', text: 'Publishing and first checks' },
        { t: 'steps', items: [
          { title: 'Create the service definition and activate it', body: 'If activation fails, an exposed entity is inactive or misspelled.' },
          { title: 'Create the binding', body: 'Choose the type, pick the service definition, activate.' },
          { title: 'Publish', body: 'Publishing registers the service in the gateway. For V2 you may also need `/IWFND/MAINT_SERVICE`.' },
          { title: 'Open `$metadata`', body: '`/sap/opu/odata4/sap/zui_travel_o4/srvd/sap/zui_travel/0001/$metadata` — confirms entity sets, keys and navigation.' },
          { title: 'Run a GET', body: 'The entity set should return `{"value":[]}` or data — not an HTML error page.' }
        ] },
        { t: 'code', lang: 'text', title: 'Typical V4 URL shape', code: `/sap/opu/odata4/sap/<binding_name>/srvd/sap/<service_name>/0001/
  Travel?$select=TravelID,AgencyID,TotalPrice&$top=10` },
        { t: 'callout', tone: 'warn', title: 'Do not confuse service name and binding name', text: 'The URL is built from the binding and the service definition. Renaming either breaks clients. Treat published URLs as contracts, especially for integrations.' },

        { t: 'h', text: 'Designing the exposed scope' },
        { t: 'list', items: [
          'UI app: expose the root plus the children the app navigates to; keep lookups available for value helps.',
          'API: expose only what the integration contract needs — fewer entities, smaller blast radius.',
          'Never expose internal helper entities or unrestricted technical views.',
          'Use separate bindings for UI and API when the scope or protocol differs. Same BO, different doors.',
          'Document the alias names: they are the public names of your entities.'
        ] },
        { t: 'callout', tone: 'tip', title: 'Version your API binding', text: 'For integrations, create a dedicated Web API binding and treat its URL and entity names as stable. UI bindings can evolve with the app; partner integrations cannot.' }
      ],
      keyPoints: [
        { front: 'What does the service definition control?', back: 'Scope: which CDS entities are exposed and under which alias. It creates no endpoint by itself.' },
        { front: 'What does the service binding control?', back: 'Protocol and publication: OData V4/V2, UI vs Web API, the service URL, and activation/publishing of the endpoint.' },
        { front: 'Which binding type should a new Fiori elements app with draft use?', back: 'OData V4 – UI. It supports draft, side effects and modern annotations; Web API bindings are for integration without UI semantics.' },
        { front: 'Why expose an entity with an alias (`as Travel`)?', back: 'The alias is the public entity-set name. It decouples clients from the CDS name and makes the service model readable.' },
        { front: 'A GET returns 404 although the CDS view is active. What do you check?', back: 'Whether the entity is actually exposed in the service definition, whether the binding is active/published, and whether the URL uses the correct binding and service names.' }
      ],
      quiz: [
        { q: 'Which object creates the OData endpoint URL?', options: ['Service binding', 'Service definition', 'Projection view', 'Behavior definition'], answer: 0, why: 'The binding publishes the service and defines its protocol and URL; the definition only lists exposed entities.' },
        { q: 'What does `expose ZC_Travel as Travel` change?', options: ['The public entity-set name becomes Travel', 'The CDS entity is renamed', 'The database table is renamed', 'The behavior alias changes'], answer: 0, why: 'The alias after `as` is the entity-set name clients use; the CDS entity itself is unchanged.' },
        { q: 'You need an integration-only service with no Fiori semantics. Which binding?', options: ['OData V4 – Web API', 'OData V4 – UI', 'OData V2 – UI', 'Any — they are identical'], answer: 0, why: 'Web API bindings are intended for programmatic consumption without UI-specific behaviour.' }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'fiori-annotations',
      title: 'Metadata extensions and the generated Fiori app',
      level: 'intermediate',
      minutes: 12,
      summary: 'How annotations become a list report and object page — and the five annotations that fix most blank screens.',
      tags: ['fiori', 'annotations', 'ui', 'metadata'],
      sections: [
        { t: 'p', cls: 'lead', text: 'Fiori elements does not read your mind. It reads annotations. A blank list report almost always means a missing `@UI.lineItem`, not a broken service.' },
        { t: 'h', text: 'The minimum viable UI' },
        { t: 'code', lang: 'abap', title: 'Just enough to get a usable list report', code: `@Metadata.layer: #CORE
annotate entity ZC_Travel with
{
  @UI.headerInfo: {
    typeName: 'Travel',
    typeNamePlural: 'Travels',
    title: { type: #STANDARD, value: 'TravelID' }
  }

  @UI.lineItem: [ { position: 10 } ]
  @UI.selectionField: [ { position: 10 } ]
  TravelID;

  @UI.lineItem: [ { position: 20 } ]
  @UI.selectionField: [ { position: 20 } ]
  AgencyID;

  @UI.lineItem: [ { position: 30 } ]
  BeginDate;

  @UI.lineItem: [ { position: 40 } ]
  EndDate;

  @UI.lineItem: [ { position: 50 } ]
  TotalPrice;
}` },
        { t: 'table', head: ['Need', 'Annotation'], rows: [
          ['List report columns', '`@UI.lineItem`'],
          ['Filter bar fields', '`@UI.selectionField`'],
          ['Object page title/subtitle', '`@UI.headerInfo`'],
          ['Object page field sections', '`@UI.facet` + `@UI.identification` / `@UI.fieldGroup`'],
          ['Child table on object page', '`@UI.facet` with `type: #LINEITEM_REFERENCE` and `targetElement: \'_Booking\'`'],
          ['Hide a technical field', '`@UI.hidden: true`'],
          ['Show text instead of ID', '`@UI.textArrangement: #TEXT_ONLY`']
        ] },

        { t: 'h', text: 'The object page and its facets' },
        { t: 'code', lang: 'abap', title: 'Header, sections, child table', code: `@UI.headerInfo: {
  typeName: 'Travel',
  typeNamePlural: 'Travels',
  title: { type: #STANDARD, value: 'TravelID' },
  description: { type: #STANDARD, value: 'Description' }
}
@UI.facet: [ {
  id: 'General',
  purpose: #STANDARD,
  type: #IDENTIFICATION_REFERENCE,
  label: 'General Information',
  position: 10
}, {
  id: 'Bookings',
  purpose: #STANDARD,
  type: #LINEITEM_REFERENCE,
  label: 'Bookings',
  position: 20,
  targetElement: '_Booking'
} ]

@UI.identification: [ { position: 10 } ]
TravelID;

@UI.identification: [ { position: 20 } ]
AgencyID;` },
        { t: 'callout', tone: 'why', title: 'Why `targetElement` matters', text: 'The facet points at the composition association, not at the child entity. If `_Booking` is missing from the projection or the composition is not modelled, the section cannot render — even if the child service is exposed.' },

        { t: 'h', text: 'Draft in the UI' },
        { t: 'list', items: [
          'With `with draft;` the object page gets Edit and Save/Cancel automatically. No UI code.',
          'Save triggers Activate; Cancel triggers Discard. The draft is per user and persists across sessions.',
          '`@UI.hidden` on the draft admin fields keeps them out of the form.',
          'Validations surface as messages on the fields marked with `%element`.',
          'Actions declared in the BDEF appear as buttons when they are exposed to the UI.'
        ] },
        { t: 'callout', tone: 'warn', title: 'Annotations do not fix a broken model', text: 'If the object page cannot navigate to bookings, check the composition in CDS and the `lock/authorization dependent by` in the child BDEF before adding more annotations. UI annotations only visualise a sound model.' },

        { t: 'h', text: 'Five-minute UI debugging' },
        { t: 'steps', items: [
          { title: 'Blank table?', body: 'Add `@UI.lineItem` to two or three fields and refresh. If columns appear, the service was fine all along.' },
          { title: 'No title on the object page?', body: 'Add `@UI.headerInfo` with a `title.value` pointing at a real field.' },
          { title: 'No filter fields?', body: 'Add `@UI.selectionField`. Also check `@Search.searchable` if the search bar is missing.' },
          { title: 'Child section empty?', body: 'Confirm `_Booking` is exposed in the projection, the composition exists, and the facet target is spelled exactly.' },
          { title: 'Fields missing entirely?', body: 'Check `@UI.hidden`, whether the field is in the projection, and whether the service metadata contains it.' }
        ] },
        { t: 'callout', tone: 'tip', title: 'Keep annotations out of the interface view', text: 'Put UI metadata in a metadata extension on the projection. It is easier to review, can be layered, and keeps the BO reusable by APIs that should not carry UI semantics.' }
      ],
      keyPoints: [
        { front: 'Which annotation creates list report columns?', back: '`@UI.lineItem` on the projection fields (or in a metadata extension). Without it the list is empty even if data exists.' },
        { front: 'What does `@UI.headerInfo` define?', back: 'The object page identity: type name, plural, title field and optional description field. It is the difference between a titled object page and a blank header.' },
        { front: 'What is `targetElement` used for in a facet?', back: 'It points a `#LINEITEM_REFERENCE` facet at the child composition association (e.g. `_Booking`) so the child table renders on the object page.' },
        { front: 'How does draft appear in the UI without custom code?', back: 'The Fiori elements runtime detects draft-enabled entities and renders Edit/Save/Cancel; those actions map to the draft lifecycle (Edit, Activate, Discard).' },
        { front: 'Why use a metadata extension instead of inline annotations?', back: 'Separation of concerns, easier review, and layering (`#CORE`, `#CUSTOMER`) so different consumers can extend UI metadata without touching the projection.' }
      ],
      quiz: [
        { q: 'The list report shows no columns but the service returns data. What is missing?', options: ['`@UI.lineItem` annotations', '`@Search.searchable`', 'A draft table', '`@AccessControl`'], answer: 0, why: 'Fiori elements builds columns from `@UI.lineItem`; without them the table has nothing to show.' },
        { q: 'A child table on the object page is missing. What is the most likely annotation issue?', options: ['The facet lacks `targetElement: \'_Booking\'`', 'The child has no `@UI.lineItem`', 'The service is V4', 'The parent has no `@UI.headerInfo`'], answer: 0, why: 'A child table facet must reference the association, not the entity name.' },
        { q: 'Where should UI annotations live for a reusable BO?', options: ['In a metadata extension on the projection', 'In the interface view', 'In the behavior definition', 'In the service binding'], answer: 0, why: 'Keeping UI concerns on the consumption layer preserves the reusability of the interface view for APIs and other apps.' }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'consume-api',
      title: 'Consuming and testing the OData API',
      level: 'intermediate',
      minutes: 12,
      summary: 'Query, create, update, delete and call actions — with ETags, deep inserts and the status codes that tell you what broke.',
      tags: ['odata', 'api', 'testing', 'debugging'],
      sections: [
        { t: 'p', cls: 'lead', text: 'Testing the API directly is the fastest way to separate UI problems from BO problems. If the OData call works, the service is fine and you can look at annotations.' },
        { t: 'h', text: 'Reading' },
        { t: 'code', lang: 'text', title: 'Useful V4 queries', code: `GET .../Travel?$select=TravelID,AgencyID,TotalPrice&$top=20
GET .../Travel?$filter=AgencyID eq '070001'&$orderby=BeginDate desc
GET .../Travel?$expand=_Booking($select=BookingID,BookingDate)
GET .../Travel?$count=true&$top=1
GET .../Travel('00000042')` },
        { t: 'list', items: [
          '`$select` keeps payloads small and makes the response readable.',
          '`$expand` follows associations/compositions; nested `$select`/`$filter` work on V4.',
          '`$count=true` returns the total in `@odata.count`.',
          'Keys: string keys appear quoted in V4 (`\'00000042\'`); composite keys use comma-separated values.'
        ] },

        { t: 'h', text: 'Writing' },
        { t: 'code', lang: 'json', title: 'POST — create a travel (V4)', code: `POST .../Travel
Content-Type: application/json

{
  "AgencyID": "070001",
  "CustomerID": "000042",
  "BeginDate": "2026-01-10",
  "EndDate": "2026-01-14",
  "CurrencyCode": "EUR"
}` },
        { t: 'code', lang: 'text', title: 'PATCH and DELETE with ETag', code: `GET .../Travel('00000042')        -> response contains ETag
PATCH .../Travel('00000042')
If-Match: W/"2026-01-10T10:00:00Z"
{ "EndDate": "2026-01-20" }

DELETE .../Travel('00000042')
If-Match: W/"2026-01-10T10:00:00Z"` },
        { t: 'callout', tone: 'warn', title: 'ETag is not optional in practice', text: 'If you skip `If-Match`, the service may reject the request or accept it unconditionally depending on configuration. Always send the ETag you last read — that is the whole point of optimistic locking.' },

        { t: 'h', text: 'Deep insert' },
        { t: 'code', lang: 'json', title: 'Create travel with bookings in one request', code: `POST .../Travel
{
  "AgencyID": "070001",
  "CustomerID": "000042",
  "BeginDate": "2026-01-10",
  "EndDate": "2026-01-14",
  "CurrencyCode": "EUR",
  "_Booking": [
    { "BookingDate": "2026-01-10", "CustomerID": "000042", "FlightDate": "2026-01-11" },
    { "BookingDate": "2026-01-11", "CustomerID": "000043", "FlightDate": "2026-01-12" }
  ]
}` },
        { t: 'p', text: 'Deep insert requires a composition and `association _Booking { create; }` in the parent behavior definition. The response echoes the created tree with keys.' },

        { t: 'h', text: 'Actions' },
        { t: 'code', lang: 'text', title: 'Bound action', code: `POST .../Travel('00000042')/acceptTravel
Content-Type: application/json

{ }` },
        { t: 'p', text: 'The action returns the result declared in the BDEF. Feature control may disable it in the UI, but the endpoint still exists — the implementation must reject invalid states.' },

        { t: 'h', text: 'Status codes as a debugging map' },
        { t: 'table', head: ['Code', 'Meaning in RAP', 'Look at'], rows: [
          ['200 / 201 / 204', 'Success (read / created / deleted)', '—'],
          ['400', 'Validation failed or malformed payload', 'Messages in the response body; `failed` entries'],
          ['401 / 403', 'Not authenticated / not authorized', 'DCL, instance authorization, PFCG roles'],
          ['404', 'Entity or action not exposed', 'Service definition, binding, URL'],
          ['412', 'ETag mismatch — someone changed the record', 'Re-read and retry; check `total etag`'],
          ['500', 'Runtime error/dump', '`/IWFND/ERROR_LOG`, ST22, behavior implementation']
        ] },
        { t: 'code', lang: 'json', title: 'V4 error payload (simplified)', code: `{
  "error": {
    "code": "ZCX_RAP/001",
    "message": "End date must be on or after the begin date",
    "target": "EndDate"
  }
}` },

        { t: 'h', text: 'Test like a consumer' },
        { t: 'list', items: [
          'Use the Fiori preview for the UI path and a REST client for the API path. They fail differently.',
          'Append `$metadata` and check the entity set, keys, navigation properties and actions actually exist.',
          'Add the client parameter (`sap-client=100`) when your system requires it — a missing client looks like an auth error.',
          'Check `/IWFND/ERROR_LOG` and `/IWBEP/ERROR_LOG` for server-side detail that never reaches the response.',
          'Test with a restricted user for authorization issues; developer users hide the problem.'
        ] },
        { t: 'callout', tone: 'tip', title: 'Save a smoke-test collection', text: 'Keep one GET, one POST, one PATCH, one action and one DELETE request in a REST client collection per BO. After every transport, run the collection — it catches regressions in minutes.' }
      ],
      keyPoints: [
        { front: 'How do you expand composition children in OData V4?', back: 'With `$expand=_Booking`, optionally nested: `$expand=_Booking($select=BookingID,BookingDate)`.' },
        { front: 'What must be sent with a PATCH to make optimistic locking work?', back: 'The `If-Match` header containing the ETag from the last read. A mismatch returns 412.' },
        { front: 'What does deep insert require in the model?', back: 'A composition from parent to child and `association _Child { create; }` in the parent behavior definition, plus the child fields in the payload.' },
        { front: 'Which status code indicates a validation error?', back: 'Typically 400, with messages in the error response body and `failed` entries in the BO result.' },
        { front: 'Where do you look when the response is a 500 with no useful message?', back: '`/IWFND/ERROR_LOG`, `/IWBEP/ERROR_LOG` and ST22; the behavior implementation or a mapping/runtime error is the usual cause.' }
      ],
      quiz: [
        { q: 'Which header carries the ETag for an update?', options: ['`If-Match`', '`ETag`', '`If-None-Match`', '`Content-MD5`'], answer: 0, why: '`If-Match` tells the server which version you are updating; it returns 412 if the current ETag differs.' },
        { q: 'What is required for a deep insert of bookings with a travel?', options: ['A composition and `association _Booking { create; }`', 'A separate service binding', 'Draft enabled', 'A DCL role'], answer: 0, why: 'Ownership plus create permission on the association lets the runtime insert the child tree in one request.' },
        { q: 'A request returns 404 although the entity exists in CDS. What is the first check?', options: ['The entity is exposed in the service definition and the binding is published', 'The table has data', 'The behavior class is active', 'The ETag field is filled'], answer: 0, why: '404 means the route/entity is not reachable at that URL — scope or publication, not data.' }
      ]
    }
  ]
});
