/* ==========================================================================
   Module 2 — Data model with CDS
   ========================================================================== */
(window.RAP_COACH_CONTENT = window.RAP_COACH_CONTENT || []).push({
  id: 'm2',
  title: 'The data model (CDS)',
  tagline: 'View entities, associations, compositions, annotations and access control.',
  description: 'The CDS layer is the backbone of every RAP BO. Learn to write view entities that are semantic, composable and ready for a service.',
  lessons: [

    /* ------------------------------------------------------------------ */
    {
      id: 'cds-view-entities',
      title: 'CDS view entities: the syntax that matters',
      level: 'beginner',
      minutes: 12,
      summary: 'From table to semantic view: keys, aliases, casts, case, joins and the rules that keep a view entity activation-clean.',
      tags: ['cds', 'view-entity', 'syntax'],
      sections: [
        { t: 'p', cls: 'lead', text: 'A view entity is a semantic, reusable data model on top of tables or other views. In RAP it is the *interface view* — the stable contract your behavior, service and consumers build on.' },
        { t: 'code', lang: 'abap', title: 'The canonical shape', code: `@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Travel - interface'
define view entity ZI_Travel
  as select from ztravel
{
  key travel_id          as TravelID,
      agency_id          as AgencyID,
      customer_id        as CustomerID,
      begin_date         as BeginDate,
      end_date           as EndDate,
      total_price        as TotalPrice,
      currency_code      as CurrencyCode,
      description        as Description,
      last_changed_at    as LastChangedAt
}` },
        { t: 'h', text: 'Line by line' },
        { t: 'table', head: ['Piece', 'Meaning'], rows: [
          ['`@AccessControl.authorizationCheck`', 'Declares whether the entity needs a DCL role. `#NOT_REQUIRED` for prototypes; `#CHECK` in production.'],
          ['`@EndUserText.label`', 'The human-readable name shown in tools and Fiori.'],
          ['`define view entity`', 'Modern CDS entity type. No `@AbapCatalog.sqlViewName` needed.'],
          ['`as select from ztravel`', 'The data source. Can be a table, another view entity, or a join/subquery.'],
          ['`key`', 'Marks the element that identifies a row. A view entity must have a key.'],
          ['`travel_id as TravelID`', 'Renames a technical field to a semantic name. Consumers see `TravelID`.']
        ] },
        { t: 'callout', tone: 'warn', title: 'Keys are not decoration', text: 'The key you declare here becomes the key of the OData entity and the anchor for associations and draft. Wrong or non-unique keys cause duplicate rows, broken navigation and ETag conflicts — fix them at the CDS level, not in the UI.' },

        { t: 'h', text: 'Casting and expressions' },
        { t: 'p', text: 'Use casts to align types between sources or to protect consumers from technical types. Use expressions sparingly in the interface view — heavy logic belongs in the projection or a dedicated view.' },
        { t: 'code', lang: 'abap', title: 'Casts, case, concat', code: `define view entity ZI_Travel
  as select from ztravel
{
  key cast( travel_id as abap.numc(10) ) as TravelID,
      agency_id                          as AgencyID,

      case when description is initial
           then 'No description'
           else description
      end                                as Description,

      concat( agency_id, customer_id )   as AgencyCustomer,
      substring( description, 1, 40 )    as ShortText,

      cast( total_price as abap.curr(15,2) ) as TotalPrice,
      currency_code                      as CurrencyCode
}` },

        { t: 'h', text: 'Joins: when and how' },
        { t: 'p', text: 'Prefer associations for navigation and composition. Use an explicit join only when you need to flatten data into one row set and no association model fits.' },
        { t: 'code', lang: 'abap', title: 'Inner join to enrich a row', code: `define view entity ZI_Travel
  as select from ztravel as t
    inner join zagency as a on a.agency_id = t.agency_id
{
  key t.travel_id     as TravelID,
      t.agency_id     as AgencyID,
      a.name          as AgencyName,
      t.begin_date    as BeginDate,
      t.end_date      as EndDate
}` },
        { t: 'callout', tone: 'tip', title: 'View entity vs classic view', text: 'Classic `define view` needs `@AbapCatalog.sqlViewName` and a separate SQL view. View entities don\'t, support `association to parent`, and give better composition support — use them for all new RAP work on 7.55+ / S/4HANA 2021+.' },

        { t: 'h', text: 'Naming rules that save hours' },
        { t: 'list', items: [
          'Semantic field names in **CamelCase**: `TravelID`, `BeginDate`, `TotalPrice`.',
          'Keep the technical key name short but obvious: avoid `FIELD1`, `ZSTATUS`.',
          'Prefix source aliases (`t.`, `a.`) when joining — never rely on implicit resolution.',
          'One entity, one purpose. A 60-field interface view with UI annotations is a warning sign; split it or move annotations to the projection.',
          'Model dates as `abap.dats`, amounts as `abap.curr`, currencies as `abap.cuky`, timestamps as `timestampl` so semantics annotations work.'
        ] },
        { t: 'callout', tone: 'why', title: 'Why the interface view should not know about UI', text: 'The interface view is reused by other BOs, APIs and behavior. UI-only fields and labels in it leak consumption decisions into the model. Put those in the projection view and the metadata extension.' }
      ],
      keyPoints: [
        { front: 'What must every CDS view entity have that a classic `define view` also has?', back: 'A key. In a view entity you mark it with `key` on the element; without a key the entity cannot be used as a root BO entity or OData entity set.' },
        { front: 'Why does `define view entity` not need `@AbapCatalog.sqlViewName`?', back: 'A view entity is not backed by a separately named SQL view. The runtime generates the database representation, so the old sqlViewName annotation is unnecessary.' },
        { front: 'When should you use a join instead of an association?', back: 'When you need a flattened row set and the relationship is not part of the BO navigation model. For navigation, compositions and to-parent relationships, use associations.' },
        { front: 'What is the risk of a wrong key in the interface view?', back: 'Duplicate rows, broken navigation/OData entity identity, failed draft and ETag handling, and incorrect update behaviour. Keys must uniquely identify the business entity.' },
        { front: 'Which data types do the currency/amount annotations expect?', back: 'Amounts should be `abap.curr(len,dec)` with a related `abap.cuky` currency field; quantities use `abap.quan` with a unit. That lets `@Semantics.amount.currencyCode` and quantity annotations work correctly.' }
      ],
      quiz: [
        { q: 'What is required to expose a CDS entity as an OData entity?', options: ['A key', 'A SQL view name', 'UI annotations', 'A DCL role'], answer: 0, why: 'An OData entity needs identity. The CDS key provides it; without one, the entity cannot be an entity set.' },
        { q: 'Which annotation switches off the authorization check for a prototype?', options: ['`@AccessControl.authorizationCheck: #NOT_REQUIRED`', '`@AccessControl.authorizationCheck: #CHECK`', '`@Authorization.notRequired`', '`@AccessControl.authorizationCheck: #NONE`'], answer: 0, why: 'The documented value is `#NOT_REQUIRED`. Production entities typically use `#CHECK`.' },
        { q: 'Where should UI labels and layout annotations live?', options: ['In the projection view or a metadata extension', 'In the database table', 'In the behavior definition', 'In the service binding'], answer: 0, why: 'Consumption concerns belong to the projection layer; metadata extensions keep them separate and switchable.' }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'associations-compositions',
      title: 'Associations and compositions',
      level: 'intermediate',
      minutes: 13,
      summary: 'Cardinality, ON conditions, to-parent, compositions, and how navigation turns into $expand and deep inserts.',
      tags: ['cds', 'associations', 'composition'],
      sections: [
        { t: 'p', cls: 'lead', text: 'Associations are the difference between a flat view and a business object. Compositions are the difference between a node and a self-contained BO. This lesson is the one to re-read until it is automatic.' },

        { t: 'h', text: 'Association or composition?' },
        { t: 'compare', left: { title: 'Association', items: [
          'Navigation to another entity',
          'Independent lifecycle',
          'Example: Travel → Agency (lookup)',
          '`association [0..1] to …`',
          'Can exist without a composition'
        ] }, right: { title: 'Composition', items: [
          'Owned child with lifecycle tied to the root',
          'Deleted and locked with the root',
          'Example: Travel → Booking',
          '`composition [0..*] of …`',
          'Required for a full BO tree'
        ] } },

        { t: 'code', lang: 'abap', title: 'Root entity with a lookup and a composition', code: `@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Travel - interface'
define view entity ZI_Travel
  as select from ztravel
  association [0..1] to ZI_Agency  as _Agency
    on $projection.AgencyID = _Agency.AgencyID
  composition [0..*] of ZI_Booking as _Booking
{
  key travel_id       as TravelID,
      agency_id       as AgencyID,
      customer_id     as CustomerID,
      begin_date      as BeginDate,
      end_date        as EndDate,
      total_price     as TotalPrice,
      currency_code   as CurrencyCode,
      last_changed_at as LastChangedAt,

      _Agency,
      _Booking
}` },

        { t: 'code', lang: 'abap', title: 'Child entity: association to parent', code: `@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Booking - interface'
define view entity ZI_Booking
  as select from zbooking
  association to parent ZI_Travel as _Travel
    on $projection.TravelID = _Travel.TravelID
{
  key booking_id     as BookingID,
      travel_id      as TravelID,
      booking_date   as BookingDate,
      customer_id    as CustomerID,
      flight_date    as FlightDate,
      _Travel
}` },

        { t: 'callout', tone: 'why', title: 'Why `association to parent` instead of a normal association?', text: 'It is the inverse of a composition. It tells the framework "this entity is a node in the composition tree of that parent", which is what enables draft, dependent locking, authorization inheritance and hierarchical OData navigation.' },

        { t: 'h', text: 'Cardinality in practice' },
        { t: 'table', head: ['Syntax', 'Meaning', 'Typical use'], rows: [
          ['`[0..1]`', 'At most one target', 'Lookup: agency, customer, currency'],
          ['`[1..1]`', 'Exactly one target', 'Mandatory header reference'],
          ['`[0..*]`', 'Any number of targets', 'Composition children (bookings)'],
          ['`[1..*]`', 'At least one target', 'Rare; usually better enforced by validation']
        ] },
        { t: 'p', text: 'Cardinality affects how the association is exposed in OData and how path expressions behave. Declaring `[1..1]` on a field that can actually be empty produces runtime dumps rather than clean empty results.' },

        { t: 'h', text: 'Using the association' },
        { t: 'code', lang: 'abap', title: 'Path expressions and aggregation over children', code: `" Flatten a lookup field into the row
define view entity ZC_Travel
  as select from ZI_Travel
{
  key TravelID,
      AgencyID,
      _Agency.Name as AgencyName,
      BeginDate,
      EndDate,
      TotalPrice,
      _Booking
}

" Aggregate children: total of all booking prices per travel
define view entity ZI_TravelTotals
  as select from ZI_Travel
{
  key TravelID,
      sum( _Booking.Price ) as BookingTotal
}` },
        { t: 'callout', tone: 'warn', title: 'Path expression limits', text: 'Aggregations over associations require the right cardinality (`[0..*]`) and are evaluated at the SQL level. If you find yourself chaining three path expressions, consider a dedicated view instead — it is easier to test and to reuse.' },

        { t: 'h', text: 'How the model shows up in the API' },
        { t: 'list', items: [
          'A composition exposes a **navigation property** in OData; consumers use `$expand=_Booking`.',
          'A lookup association exposes the target as a navigation property too, but does not imply ownership.',
          'Deep insert: `POST` a travel with an inline `_Booking` array — valid only when the child is a composition and the behavior allows `create` for the association.',
          '`$expand` depth and filtering on children are controlled by annotations and the service, not by SQL joins in the app.'
        ] },
        { t: 'callout', tone: 'tip', title: 'Draw the tree before coding', text: 'Sketch the root and its children on paper: keys, cardinality, lifecycle. If a child can exist without the root, it is an association, not a composition. This five-minute step prevents most redesigns.' }
      ],
      keyPoints: [
        { front: 'What is the key difference between `association` and `composition`?', back: 'A composition declares an owned child whose lifecycle is bound to the root (created, locked, deleted with it). An association is navigation to an independent entity.' },
        { front: 'How does a child declare that it belongs to a composition root?', back: 'With `association to parent ZI_Travel as _Travel on $projection.TravelID = _Travel.TravelID`. It is the inverse side of the root\'s `composition ... of ZI_Booking`.' },
        { front: 'Which cardinality do you use for a composition child list?', back: '`[0..*]` — zero or more children. `[1..*]` is rare and usually belongs in a validation instead.' },
        { front: 'How do composition children appear in OData?', back: 'As navigation properties that can be `$expand`ed; deep inserts are possible when the behavior definition allows `create` on the association.' },
        { front: 'When is an association preferred over a composition?', back: 'When the target has its own lifecycle and can exist without the current entity — for example Agency or Customer lookups.' },
        { front: 'What does `association to parent` enable in the behavior layer?', back: 'Dependent locking and authorization (`lock dependent by _Travel`), draft integration, and correct hierarchical save behaviour for the child.' }
      ],
      quiz: [
        { q: 'Travel → Booking with lifecycle owned by Travel. Which declaration is correct in ZI_Travel?', options: ['`composition [0..*] of ZI_Booking as _Booking`', '`association [0..*] to ZI_Booking as _Booking`', '`composition to parent ZI_Booking as _Booking`', '`association [1..1] to ZI_Booking as _Booking`'], answer: 0, why: 'The root owns the child; `composition [0..*] of` expresses exactly that lifecycle.' },
        { q: 'What must the child entity declare to be the inverse of a composition?', options: ['`association to parent ZI_Travel as _Travel`', '`association [1..1] to ZI_Travel as _Travel`', '`composition [0..*] of ZI_Travel as _Travel`', 'Nothing — the root side is enough'], answer: 0, why: 'The `to parent` association marks the child as part of the parent composition tree and drives draft/lock/authorization inheritance.' },
        { q: 'A lookup field that may be empty should use which cardinality?', options: ['`[0..1]`', '`[1..1]`', '`[1..*]`', '`[0..*]`'], answer: 0, why: 'Optional lookups are `[0..1]`. `[1..1]` would declare a mandatory target and can cause runtime issues when the value is initial.' }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'interface-vs-projection',
      title: 'Interface vs projection views',
      level: 'intermediate',
      minutes: 10,
      summary: 'Two layers, two jobs: stable business semantics versus consumer-friendly shape. Includes text entities and value help.',
      tags: ['cds', 'projection', 'texts'],
      sections: [
        { t: 'p', cls: 'lead', text: 'A common beginner mistake is to put everything into one CDS view. The interface/projection split exists so the BO can evolve: internals change, consumers stay stable.' },
        { t: 'table', head: ['Aspect', 'Interface view `ZI_`', 'Projection view `ZC_`'], rows: [
          ['Purpose', 'Business semantics, reuse', 'Consumption shape, UI and API'],
          ['Field names', 'Canonical, stable', 'Can rename/hide, add virtual fields'],
          ['Associations', 'Full model, compositions', 'Exposes what the consumer needs'],
          ['Annotations', 'Semantics, access control, value helps', 'UI, search, metadata extension target'],
          ['Consumers', 'Other CDS views, behavior, other BOs', 'Service definition'],
          ['Stability', 'High — changing it breaks BOs', 'Lower — tailored per app']
        ] },

        { t: 'code', lang: 'abap', title: 'Projection: same data, different shape', code: `@AccessControl.authorizationCheck: #NOT_REQUIRED
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
      LastChangedAt,

      _Agency,
      _Booking
}` },

        { t: 'h', text: 'Text entities: the clean way to show names' },
        { t: 'p', text: 'Never denormalise names into transactional tables. Model a text entity and link it with `@ObjectModel.text.element` so Fiori and OData can resolve the description automatically.' },
        { t: 'code', lang: 'abap', title: 'Text view + usage', code: `@ObjectModel.dataCategory: #TEXT
@ObjectModel.representativeKey: 'AgencyID'
@AccessControl.authorizationCheck: #NOT_REQUIRED
define view entity ZI_AgencyText
  as select from zagencytext
{
  key agency_id as AgencyID,
      @Semantics.language: true
      key language as Language,
      name          as AgencyName
}

" In ZI_Agency:
@ObjectModel.text.element: [ 'AgencyName' ]
@ObjectModel.text.association: '_Text'
define view entity ZI_Agency as select from zagency
  association [0..*] to ZI_AgencyText as _Text
    on $projection.AgencyID = _Text.AgencyID
{
  key agency_id as AgencyID,
      name      as AgencyName,
      _Text
}` },
        { t: 'callout', tone: 'warn', title: 'Language-dependent reads', text: 'Text entities need a language key and `@Semantics.language: true`. Without it, the runtime cannot pick the user\'s language and you will see blank or duplicated names.' },

        { t: 'h', text: 'Value help the standard way' },
        { t: 'code', lang: 'abap', title: 'Declare a value help on the consumption field', code: `@Consumption.valueHelpDefinition: [ {
  entity: {
    name: 'ZI_Agency',
    element: 'AgencyID'
  }
} ]
AgencyID,` },
        { t: 'p', text: 'The Fiori value help then uses the target entity and its text association. You can add `@Consumption.valueHelpDefault` for a default, and `@UI.textArrangement` to control ID vs description display.' },

        { t: 'h', text: 'What not to do in the projection' },
        { t: 'list', items: [
          'Do not re-implement business logic with complex joins — keep it a projection.',
          'Do not hide fields that the behavior needs (for example the ETag or key).',
          'Do not put `@AccessControl` differences between interface and projection without understanding the DCL propagation.',
          'Do not create a projection per screen. Create one per consumption scenario (one UI app, one API).'
        ] },
        { t: 'callout', tone: 'tip', title: 'A quick test for placement', text: 'Ask: "Would another app or another BO need this?" Yes → interface view. "Is this only about how my app shows it?" → projection or metadata extension.' }
      ],
      keyPoints: [
        { front: 'What is the single most important difference between ZI_ and ZC_?', back: 'The interface view holds stable business semantics and is reused by other BOs/views; the projection view is the consumption-specific shape exposed to one service, with UI/search annotations and possibly fewer fields.' },
        { front: 'Why not put names into the transactional table?', back: 'Names are language-dependent and maintained in master data. Model a text entity and link it with `@ObjectModel.text.element` / `@ObjectModel.text.association` so the runtime resolves the right language.' },
        { front: 'Which annotation marks a CDS entity as a text entity?', back: '`@ObjectModel.dataCategory: #TEXT`, together with `@ObjectModel.representativeKey` on the text view and `@Semantics.language: true` on the language field.' },
        { front: 'What does `@Consumption.valueHelpDefinition` do?', back: 'It points a field at a value-help entity and element, so Fiori and OData generate a value help from that entity — including its texts and filters.' },
        { front: 'Should the projection view contain complex business joins?', back: 'No. It should select and annotate. Complex enrichment belongs in the interface or a dedicated CDS view so it is testable and reusable.' }
      ],
      quiz: [
        { q: 'Where should `@UI.lineItem` annotations go?', options: ['Projection view or metadata extension', 'Interface view', 'Behavior definition', 'Database table'], answer: 0, why: 'UI annotations are consumption concerns and belong on the projection (or its metadata extension).' },
        { q: 'What is the correct pairing for a text entity?', options: ['`@ObjectModel.dataCategory: #TEXT` + `@ObjectModel.representativeKey`', '`@UI.text` + `@Search.text`', '`@Semantics.text: true` + `@UI.label`', '`@AccessControl.text` + `@ObjectModel.language`'], answer: 0, why: 'A text entity is declared with dataCategory #TEXT and a representative key; the main entity points to it via `@ObjectModel.text.association`.' },
        { q: 'Why keep the projection thin?', options: ['It isolates consumption from the reusable model and is easier to evolve', 'It makes activation faster', 'It is required by the compiler', 'It avoids ETags'], answer: 0, why: 'The projection is the consumer layer; keeping it declarative makes it cheap to change without touching other BOs.' }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'annotations',
      title: 'Annotations that actually change behaviour',
      level: 'intermediate',
      minutes: 12,
      summary: 'A working set of semantics, UI, search and object-model annotations — with a complete metadata extension.',
      tags: ['cds', 'annotations', 'fiori'],
      sections: [
        { t: 'p', cls: 'lead', text: 'There are hundreds of CDS annotations. You need about twenty. Learn what each one *does at runtime*, not just how it looks, and Fiori apps stop feeling like guesswork.' },

        { t: 'h', text: 'Semantics: types with meaning' },
        { t: 'table', head: ['Annotation', 'Put it on', 'What it enables'], rows: [
          ['`@Semantics.amount.currencyCode: \'CurrencyCode\'`', 'Amount field', 'Currency-aware formatting; correct aggregation'],
          ['`@Semantics.currencyCode: true`', 'Currency field', 'Marks the field as a currency key'],
          ['`@Semantics.quantity.unitOfMeasure: \'Unit\'`', 'Quantity field', 'Quantity formatting and conversion'],
          ['`@Semantics.user.createdBy: true`', 'Created-by field', 'Standard audit semantics'],
          ['`@Semantics.systemDateTime.lastChangedAt: true`', 'Timestamp', 'Change tracking, ETag hints'],
          ['`@Semantics.language: true`', 'Language field', 'Language-dependent text resolution']
        ] },
        { t: 'code', lang: 'abap', title: 'Amount + currency done right', code: `@Semantics.amount.currencyCode: 'CurrencyCode'
TotalPrice,

@Semantics.currencyCode: true
CurrencyCode,` },

        { t: 'h', text: 'Search' },
        { t: 'code', lang: 'abap', title: 'Make a field searchable', code: `@Search.searchable: true          " on the entity
...
@Search.defaultSearchElement: true " on fields that should match the search bar
AgencyID,
Description,` },
        { t: 'p', text: '`@Search.searchable: true` is required before `@Search.defaultSearchElement` takes effect. Without it you get a search bar that never matches anything.' },

        { t: 'h', text: 'UI: the Fiori elements contract' },
        { t: 'table', head: ['Annotation', 'Effect'], rows: [
          ['`@UI.headerInfo`', 'Defines the object page title and subtitle (typeName, title value).'],
          ['`@UI.lineItem: [{ position, label }]`', 'Adds the field to the list report columns.'],
          ['`@UI.identification: [{ position }]`', 'Adds the field to the object page header/content.'],
          ['`@UI.selectionField: [{ position }]`', 'Adds a filter field to the list report.'],
          ['`@UI.facet: [{ type: #IDENTIFICATION_REFERENCE, ... }]`', 'Creates sections/facets on the object page.'],
          ['`@UI.hidden: true`', 'Hides a field from the UI while keeping it in the service.'],
          ['`@UI.textArrangement: #TEXT_ONLY`', 'Shows text instead of the ID for coded fields.']
        ] },
        { t: 'code', lang: 'abap', title: 'A complete metadata extension', code: `@Metadata.layer: #CORE
annotate entity ZC_Travel with
{
  @UI.headerInfo: {
    typeName: 'Travel',
    typeNamePlural: 'Travels',
    title: { type: #STANDARD, value: 'TravelID' }
  }
  @UI.facet: [ {
    id: 'TravelData',
    purpose: #STANDARD,
    type: #IDENTIFICATION_REFERENCE,
    label: 'Travel',
    position: 10
  }, {
    id: 'Bookings',
    purpose: #STANDARD,
    type: #LINEITEM_REFERENCE,
    label: 'Bookings',
    position: 20,
    targetElement: '_Booking'
  } ]

  @UI.lineItem: [ { position: 10 } ]
  @UI.selectionField: [ { position: 10 } ]
  @UI.identification: [ { position: 10 } ]
  TravelID;

  @UI.lineItem: [ { position: 20, label: 'Agency' } ]
  @UI.selectionField: [ { position: 20 } ]
  @Consumption.valueHelpDefinition: [ {
    entity: { name: 'ZI_Agency', element: 'AgencyID' }
  } ]
  AgencyID;

  @UI.lineItem: [ { position: 30 } ]
  BeginDate;

  @UI.lineItem: [ { position: 40 } ]
  EndDate;

  @UI.lineItem: [ { position: 50, label: 'Total Price' } ]
  TotalPrice;

  @UI.hidden: true
  LastChangedAt;
}` },
        { t: 'callout', tone: 'why', title: 'Metadata extension or inline?', text: 'Both work. A metadata extension (`annotate entity …`) keeps the projection readable and can be layered (`#CORE`, `#CUSTOMER`, `#PARTNER`). Start inline for a prototype, move to an extension as soon as a second consumer appears.' },

        { t: 'h', text: 'ObjectModel: tell the runtime what a field is' },
        { t: 'list', items: [
          '`@ObjectModel.readOnly: true` — the field cannot be changed through the BO (UI/API).',
          '`@ObjectModel.mandatory: true` — required; Fiori shows it as mandatory.',
          '`@ObjectModel.text.element: [ \'AgencyName\' ]` — the descriptive field for an ID.',
          '`@ObjectModel.foreignKey.association: \'_Agency\'` — marks a field as the foreign key of an association.',
          '`@ObjectModel.semanticKey: [ \'TravelID\' ]` — human-readable alternate key.'
        ] },
        { t: 'callout', tone: 'warn', title: 'Read-only is not authorization', text: '`@ObjectModel.readOnly` / `field ( readonly )` controls what the API and UI may change. It is not a security boundary. Real protection needs a DCL and instance authorization in the behavior layer.' }
      ],
      keyPoints: [
        { front: 'Which two annotations make a field searchable in Fiori?', back: '`@Search.searchable: true` on the entity, and `@Search.defaultSearchElement: true` on the field(s). Without the entity annotation, the field annotation has no effect.' },
        { front: 'What does `@Semantics.amount.currencyCode` do?', back: 'It links an amount field to its currency field so the runtime formats and aggregates it correctly and clients understand the pair.' },
        { front: 'Which annotation defines the object page title?', back: '`@UI.headerInfo` with `typeName`, `typeNamePlural` and `title: { type: #STANDARD, value: \'TravelID\' }`.' },
        { front: 'Difference between `@UI.lineItem` and `@UI.identification`?', back: '`lineItem` adds a column to the list report table; `identification` adds the field to the object page content/header.' },
        { front: 'Why is `@ObjectModel.readOnly` not security?', back: 'It only tells UI/API consumers not to change the field. A determined caller with other channels or a missing DCL can still access data; authorization is enforced via DCL + instance authorization.' },
        { front: 'What does a metadata extension add over inline annotations?', back: 'Separation of layout from the model, and layering (`#CORE`/`#CUSTOMER`/`#PARTNER`) so different consumers can extend annotations without editing the projection.' }
      ],
      quiz: [
        { q: 'Where does `@Metadata.layer: #CORE` belong?', options: ['In the metadata extension header', 'In the interface view', 'In the behavior definition', 'In the service binding'], answer: 0, why: 'The layer annotation controls which metadata extension wins when several annotate the same entity; it belongs in the extension.' },
        { q: 'Which annotation creates the Bookings section on the object page?', options: ['`@UI.facet` with `targetElement: \'_Booking\'`', '`@UI.lineItem` on BookingID', '`@Search.defaultSearchElement`', '`@ObjectModel.composition`'], answer: 0, why: 'Facets define object-page sections; a `#LINEITEM_REFERENCE` facet points at the child association via targetElement.' },
        { q: 'You set `@Search.defaultSearchElement: true` but search finds nothing. Most likely cause?', options: ['`@Search.searchable: true` is missing on the entity', 'The field is not a key', 'Draft is enabled', 'The service uses OData V4'], answer: 0, why: 'Field-level search annotations only apply to a searchable entity; add `@Search.searchable: true` to the CDS entity.' }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'access-control',
      title: 'Access control with DCL',
      level: 'intermediate',
      minutes: 11,
      summary: 'Row-level security in CDS, PFCG aspects, and how instance authorization connects to the behavior layer.',
      tags: ['cds', 'authorization', 'dcl', 'security'],
      sections: [
        { t: 'p', cls: 'lead', text: 'There are two different authorization questions in RAP: *may this user see this row?* (DCL / CDS) and *may this user change this instance in this way?* (behavior instance authorization). They are separate mechanisms and you usually need both.' },

        { t: 'h', text: 'Step 1 — require a check' },
        { t: 'code', lang: 'abap', title: 'On the interface view', code: `@AccessControl.authorizationCheck: #CHECK
@EndUserText.label: 'Travel - interface'
define view entity ZI_Travel
  as select from ztravel
{ ... }` },
        { t: 'table', head: ['Value', 'Meaning'], rows: [
          ['`#NOT_REQUIRED`', 'No DCL needed. Prototypes and public data only.'],
          ['`#CHECK`', 'If a DCL exists, it is applied; otherwise access is allowed. Do not rely on this for security.'],
          ['`#MANDATORY`', 'A DCL must exist and is enforced. Fails activation if missing.'],
          ['`#PRIVILEGED_ONLY`', 'Only privileged access; used for internal entities.']
        ] },

        { t: 'h', text: 'Step 2 — grant rows with a DCL role' },
        { t: 'code', lang: 'abap', title: 'Access control definition', code: `@MappingRole: true
define role ZI_TRAVEL_ROLE {
  grant select on ZI_Travel
    where ( AgencyID ) = aspect pfcg_auth(
      'Z_TRAVEL_AG',
      'AGENCY',
      ACTVT = '03'
    );
}` },
        { t: 'p', text: '`@MappingRole: true` turns the DCL into a classic authorization role mapping. The `aspect pfcg_auth(...)` compares a CDS field with the values in an authorization object maintained in PFCG.' },
        { t: 'callout', tone: 'why', title: 'What happens at runtime', text: 'The framework injects the DCL condition into the generated SQL. A user with no matching PFCG values sees an empty result — not an error. That distinction matters when debugging: "empty list" usually means authorization, not a broken query.' },

        { t: 'h', text: 'Testing and debugging authorizations' },
        { t: 'steps', items: [
          { title: 'Reproduce with a test user', body: 'Do not test as a developer with broad authorizations. Use `SU01` to check roles and a user with realistic restrictions.' },
          { title: 'Trace the check', body: 'Use `STAUTHTRACE` (or the authorization trace in ADT) and watch which authorization object and values are checked.' },
          { title: 'Check the DCL mapping', body: 'Confirm the field used in the DCL has values that match the PFCG object. A wrong field or empty values produces silent empty results.' },
          { title: 'Then test the instance check', body: 'Instance authorization runs in the behavior layer and returns messages; it is not the same as the DCL filter.' }
        ] },

        { t: 'h', text: 'Instance authorization in the behavior layer' },
        { t: 'p', text: 'Declare it in the behavior definition and implement `get_instance_authorizations`. The DCL may allow reading a row while the behavior forbids updating it.' },
        { t: 'code', lang: 'abap', title: 'BDEF + handler skeleton', code: `define behavior for ZI_Travel alias Travel
authorization master ( instance )
{
  create; update; delete;

  " the runtime calls get_instance_authorizations
}

" In the behavior pool (lcl_handler):
METHOD get_instance_authorizations.
  READ ENTITIES OF zi_travel IN LOCAL MODE
    ENTITY Travel
    FIELDS ( AgencyID )
    WITH CORRESPONDING #( keys )
    RESULT DATA(travels).

  LOOP AT travels INTO DATA(travel).
    DATA(update_allowed) = is_agency_allowed( travel-AgencyID ).
    APPEND VALUE #( %tky = travel-%tky
                    %update = COND #( WHEN update_allowed = abap_true
                                      THEN if_abap_behv=>auth-allowed
                                      ELSE if_abap_behv=>auth-unauthorized ) )
      TO result.
  ENDLOOP.
ENDMETHOD.` },
        { t: 'callout', tone: 'warn', title: 'Do not duplicate the DCL', text: 'DCL controls row visibility for reads. Instance authorization controls operations on instances. Implementing both with the same rule is fine, but they are evaluated at different times and return different symptoms.' },

        { t: 'h', text: 'Checklist before calling a BO "secured"' },
        { t: 'list', checked: true, items: [
          '`@AccessControl.authorizationCheck` is `#CHECK` or `#MANDATORY` on every exposed entity.',
          'A DCL exists for each entity and maps to a real PFCG authorization object.',
          'Instance authorization is declared for write operations and implemented.',
          'Tests exist with a restricted user, not only with a developer user.',
          'The service binding does not expose internal entities you did not intend to secure.'
        ] }
      ],
      keyPoints: [
        { front: 'Which annotation value requires a DCL to exist?', back: '`#MANDATORY`. `#CHECK` applies a DCL if present but does not require one; `#NOT_REQUIRED` disables the check.' },
        { front: 'What does `@MappingRole: true` add to a DCL?', back: 'It maps the access control definition to classic PFCG authorization roles, enabling `aspect pfcg_auth(...)` comparisons at runtime.' },
        { front: 'A restricted user sees an empty list. First suspicion?', back: 'Row-level authorization via the DCL. The filter is applied silently, so the query succeeds with zero rows. Trace with STAUTHTRACE before touching the query.' },
        { front: 'How is instance authorization declared and implemented?', back: 'Declared in the behavior definition with `authorization master ( instance )` (or `dependent by`), implemented in the behavior pool method `get_instance_authorizations`, returning `%update`/`%delete` etc. with `if_abap_behv=>auth-allowed` or `auth-unauthorized`.' },
        { front: 'Is `@ObjectModel.readOnly` a security control?', back: 'No. It is a modeling hint for UI/API. Security needs DCL row filtering plus instance authorization for write operations.' }
      ],
      quiz: [
        { q: 'Which setting makes a DCL mandatory at activation?', options: ['`#MANDATORY`', '`#CHECK`', '`#NOT_REQUIRED`', '`#PRIVILEGED_ONLY`'], answer: 0, why: '`#MANDATORY` forces the existence of an access control definition; activation fails without it.' },
        { q: 'What does `aspect pfcg_auth(...)` compare?', options: ['A CDS field against values in a PFCG authorization object', 'A user name against a table', 'A service binding against a role', 'An ETag against a timestamp'], answer: 0, why: 'It maps a field in the CDS entity to an authorization object field and its maintained values.' },
        { q: 'Where is instance-level write authorization implemented?', options: ['`get_instance_authorizations` in the behavior pool', 'A DCL role', 'A service definition', 'An `@UI.hidden` annotation'], answer: 0, why: 'Instance authorization is behavior-layer logic; the DCL filters rows for reads but does not decide operation-level permissions per instance.' }
      ]
    }
  ]
});
