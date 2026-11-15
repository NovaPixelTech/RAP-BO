/* ==========================================================================
   RAP Coach — reference data
   Annotations, BDEF keywords, EML, snippets, glossary, troubleshooting.
   ========================================================================== */
(function () {
  'use strict';
  var RC = (window.RC = window.RC || {});

  RC.reference = {
    /* ---------------- annotations ---------------- */
    annotations: [
      { name: '@AccessControl.authorizationCheck', target: 'CDS entity', effect: 'Enables/requires the DCL check.', example: '@AccessControl.authorizationCheck: #CHECK' },
      { name: '@EndUserText.label', target: 'Entity, element', effect: 'Human-readable label used in tools and UI.', example: "@EndUserText.label: 'Travel'" },
      { name: '@Semantics.amount.currencyCode', target: 'Amount element', effect: 'Links an amount to its currency field.', example: "@Semantics.amount.currencyCode: 'CurrencyCode'" },
      { name: '@Semantics.currencyCode', target: 'Currency element', effect: 'Marks the field as a currency key.', example: '@Semantics.currencyCode: true' },
      { name: '@Semantics.quantity.unitOfMeasure', target: 'Quantity element', effect: 'Links a quantity to its unit.', example: "@Semantics.quantity.unitOfMeasure: 'Unit'" },
      { name: '@Semantics.language', target: 'Language element', effect: 'Marks a language key for text resolution.', example: '@Semantics.language: true' },
      { name: '@Semantics.user.createdBy', target: 'User element', effect: 'Audit semantics for created-by.', example: '@Semantics.user.createdBy: true' },
      { name: '@Semantics.systemDateTime.lastChangedAt', target: 'Timestamp element', effect: 'Audit/change semantics for last-changed.', example: '@Semantics.systemDateTime.lastChangedAt: true' },
      { name: '@Search.searchable', target: 'CDS entity', effect: 'Enables the search feature.', example: '@Search.searchable: true' },
      { name: '@Search.defaultSearchElement', target: 'Element', effect: 'Field participates in the default search.', example: '@Search.defaultSearchElement: true' },
      { name: '@ObjectModel.readOnly', target: 'Element', effect: 'Field is not changeable by consumers (model hint).', example: '@ObjectModel.readOnly: true' },
      { name: '@ObjectModel.mandatory', target: 'Element', effect: 'Field is required in the UI/API model.', example: '@ObjectModel.mandatory: true' },
      { name: '@ObjectModel.text.element', target: 'Element', effect: 'Names the descriptive field(s) for an ID.', example: "@ObjectModel.text.element: [ 'AgencyName' ]" },
      { name: '@ObjectModel.text.association', target: 'Association', effect: 'Points to the text entity.', example: "@ObjectModel.text.association: '_Text'" },
      { name: '@ObjectModel.dataCategory', target: 'CDS entity', effect: 'Declares a special entity type, e.g. #TEXT.', example: '@ObjectModel.dataCategory: #TEXT' },
      { name: '@ObjectModel.representativeKey', target: 'Text entity', effect: 'Key of the text entity that maps to the main ID.', example: "@ObjectModel.representativeKey: 'AgencyID'" },
      { name: '@ObjectModel.foreignKey.association', target: 'Element', effect: 'Marks a field as the FK of an association.', example: "@ObjectModel.foreignKey.association: '_Agency'" },
      { name: '@ObjectModel.semanticKey', target: 'CDS entity', effect: 'Defines an alternate human-readable key.', example: "@ObjectModel.semanticKey: [ 'TravelID' ]" },
      { name: '@Consumption.valueHelpDefinition', target: 'Element', effect: 'Generates a value help from another entity.', example: "@Consumption.valueHelpDefinition: [ { entity: { name: 'ZI_Agency', element: 'AgencyID' } } ]" },
      { name: '@UI.headerInfo', target: 'CDS entity', effect: 'Object page title/subtitle definition.', example: "@UI.headerInfo: { typeName: 'Travel', typeNamePlural: 'Travels', title: { type: #STANDARD, value: 'TravelID' } }" },
      { name: '@UI.lineItem', target: 'Element', effect: 'Adds the field as a list report column.', example: '@UI.lineItem: [ { position: 10 } ]' },
      { name: '@UI.selectionField', target: 'Element', effect: 'Adds the field to the filter bar.', example: '@UI.selectionField: [ { position: 10 } ]' },
      { name: '@UI.identification', target: 'Element', effect: 'Adds the field to the object page content.', example: '@UI.identification: [ { position: 10 } ]' },
      { name: '@UI.facet', target: 'CDS entity', effect: 'Defines object page sections, including child tables.', example: "@UI.facet: [ { id: 'Bookings', purpose: #STANDARD, type: #LINEITEM_REFERENCE, label: 'Bookings', position: 20, targetElement: '_Booking' } ]" },
      { name: '@UI.hidden', target: 'Element', effect: 'Hides the field in the UI but keeps it in the service.', example: '@UI.hidden: true' },
      { name: '@UI.textArrangement', target: 'Element', effect: 'Controls ID vs text display.', example: '@UI.textArrangement: #TEXT_ONLY' },
      { name: '@Metadata.layer', target: 'Metadata extension', effect: 'Layer priority for annotation merging.', example: '@Metadata.layer: #CORE' },
      { name: '@MappingRole', target: 'DCL role', effect: 'Maps the DCL to classic PFCG authorization roles.', example: '@MappingRole: true' }
    ],

    /* ---------------- BDEF keywords ---------------- */
    bdef: [
      { kw: 'managed implementation in class …', meaning: 'Framework implements CRUD and save; you add logic.', example: 'managed implementation in class zbp_i_travel unique;' },
      { kw: 'unmanaged implementation in class …', meaning: 'You implement create/update/delete/lock and save_modified.', example: 'unmanaged implementation in class zbp_i_travel_u unique;' },
      { kw: 'strict ( 2 )', meaning: 'Strict syntax: explicit mapping/types, fewer implicit conversions.', example: 'strict ( 2 );' },
      { kw: 'with draft;', meaning: 'Enables draft persistence and the draft lifecycle.', example: 'with draft;' },
      { kw: 'define behavior for <entity> alias <Alias>', meaning: 'Binds behavior to a CDS entity and names the alias used in code.', example: 'define behavior for ZI_Travel alias Travel' },
      { kw: 'persistent table <table>', meaning: 'Active database table for the entity.', example: 'persistent table ztravel' },
      { kw: 'draft table <table>', meaning: 'Table storing draft versions.', example: 'draft table ztravel_d' },
      { kw: 'etag master <field>', meaning: 'Entity-level ETag field for optimistic locking.', example: 'etag master LastChangedAt' },
      { kw: 'etag dependent by <association>', meaning: 'Child inherits the parent ETag.', example: 'etag dependent by _Travel' },
      { kw: 'lock master [total etag <field>]', meaning: 'Entity owns the lock; total etag covers the BO instance.', example: 'lock master total etag LastChangedAt' },
      { kw: 'lock dependent by <association>', meaning: 'Child is locked through the parent.', example: 'lock dependent by _Travel' },
      { kw: 'authorization master ( instance )', meaning: 'Instance-level authorization checks are performed.', example: 'authorization master ( instance )' },
      { kw: 'authorization dependent by <association>', meaning: 'Child inherits authorization from the parent.', example: 'authorization dependent by _Travel' },
      { kw: 'create / update / delete', meaning: 'Enable standard operations. Omit to forbid.', example: 'create; update; delete;' },
      { kw: 'field ( readonly )', meaning: 'Consumers cannot change the field.', example: 'field ( readonly ) TravelID, LastChangedAt;' },
      { kw: 'field ( mandatory )', meaning: 'Field must be supplied/valid on save.', example: 'field ( mandatory ) AgencyID, CustomerID;' },
      { kw: 'field ( features : instance )', meaning: 'Field editability can vary per instance via feature control.', example: 'field ( features : instance ) TravelStatus;' },
      { kw: 'determination … on save / on modify', meaning: 'Derived-value logic with a trigger.', example: 'determination setTravelID on save { create; }' },
      { kw: 'validation … on save', meaning: 'Business rule that can veto the save.', example: 'validation validateDates on save { field BeginDate, EndDate; create; update; }' },
      { kw: 'action [ ( features : instance ) ] … result [n] $self', meaning: 'Business operation with optional per-instance features and a result.', example: 'action ( features : instance ) acceptTravel result [1] $self;' },
      { kw: 'function … result [n] $self', meaning: 'Read-only operation that returns data.', example: 'function getBookingCount result [0..1] $self;' },
      { kw: 'association _Child { create; }', meaning: 'Allows creating children through the parent.', example: 'association _Booking { create; }' },
      { kw: 'draft action Edit / Activate / Discard / Resume', meaning: 'Standard draft lifecycle operations. Activate is usually optimized.', example: 'draft action Activate optimized;' },
      { kw: 'draft determine action Prepare', meaning: 'Draft preparation hook before display/activation.', example: 'draft determine action Prepare;' },
      { kw: 'mapping for <table> { … }', meaning: 'Maps CDS element names to table columns.', example: 'mapping for ztravel { TravelID = travel_id; }' },
      { kw: 'extensible', meaning: 'Marks the BO as extendable without modification.', example: 'extensible' }
    ],

    /* ---------------- EML ---------------- */
    eml: [
      { stmt: 'READ ENTITIES OF <bo>', purpose: 'Read through the BO model.', example: 'READ ENTITIES OF zi_travel ENTITY Travel FIELDS ( TravelID ) WITH VALUE #( ( TravelID = \'42\' ) ) RESULT DATA(t).' },
      { stmt: 'MODIFY ENTITIES OF <bo> … CREATE', purpose: 'Create instances (with `%cid` for identity).', example: 'MODIFY ENTITIES OF zi_travel ENTITY Travel CREATE FIELDS ( AgencyID ) WITH VALUE #( ( %cid = \'c1\' AgencyID = \'070001\' ) ) FAILED DATA(f) REPORTED DATA(r).' },
      { stmt: '… UPDATE FIELDS ( … )', purpose: 'Update selected fields.', example: 'MODIFY ENTITIES OF zi_travel ENTITY Travel UPDATE FIELDS ( EndDate ) WITH VALUE #( ( TravelID = \'42\' EndDate = \'20260120\' ) ).' },
      { stmt: '… DELETE FROM', purpose: 'Delete instances.', example: 'MODIFY ENTITIES OF zi_travel ENTITY Travel DELETE FROM VALUE #( ( TravelID = \'42\' ) ).' },
      { stmt: '… EXECUTE <action>', purpose: 'Call a business action.', example: 'MODIFY ENTITIES OF zi_travel ENTITY Travel EXECUTE acceptTravel FROM VALUE #( ( TravelID = \'42\' ) ) RESULT DATA(res).' },
      { stmt: 'COMMIT ENTITIES', purpose: 'Persist the RAP transactional buffer.', example: 'COMMIT ENTITIES RESPONSE OF zi_travel FAILED DATA(f) REPORTED DATA(r).' },
      { stmt: 'ROLLBACK ENTITIES', purpose: 'Discard buffered changes.', example: 'ROLLBACK ENTITIES.' },
      { stmt: 'IN LOCAL MODE', purpose: 'Skip authorization checks — only inside behavior implementations.', example: 'MODIFY ENTITIES OF zi_travel IN LOCAL MODE ENTITY Travel UPDATE …' },
      { stmt: 'MAPPED / FAILED / REPORTED', purpose: 'Result structures for generated keys, failures and messages.', example: 'MODIFY ENTITIES OF … MAPPED DATA(m) FAILED DATA(f) REPORTED DATA(r).' }
    ],

    /* ---------------- naming ---------------- */
    naming: [
      { artifact: 'Interface view', convention: 'ZI_<Entity>', example: 'ZI_Travel' },
      { artifact: 'Projection view', convention: 'ZC_<Entity>', example: 'ZC_Travel' },
      { artifact: 'Behavior definition', convention: 'Same name as interface view', example: 'ZI_Travel' },
      { artifact: 'Behavior pool class', convention: 'ZBP_I_<Entity>', example: 'ZBP_I_Travel' },
      { artifact: 'Service definition', convention: 'ZUI_<Area>', example: 'ZUI_Travel' },
      { artifact: 'Service binding', convention: 'ZUI_<Area>_<Protocol>', example: 'ZUI_TRAVEL_O4' },
      { artifact: 'Metadata extension', convention: 'Same name as projection', example: 'ZC_Travel' },
      { artifact: 'DCL role', convention: 'ZI_<Entity>_ROLE', example: 'ZI_TRAVEL_ROLE' },
      { artifact: 'Database table', convention: 'Z<Entity>', example: 'ZTRAVEL' },
      { artifact: 'Draft table', convention: 'Z<Entity>_D', example: 'ZTRAVEL_D' },
      { artifact: 'Abstract parameter entity', convention: 'ZD_<Purpose>', example: 'ZD_Discount' },
      { artifact: 'Message class', convention: 'Z<Area>_MSG', example: 'ZTRAVEL_MSG' }
    ],

    /* ---------------- snippets ---------------- */
    snippets: [
      {
        title: 'Managed BO with draft — complete BDEF',
        lang: 'abap',
        note: 'Root entity only. Add a child block with dependent lock/authorization/etag for compositions.',
        code: `managed implementation in class zbp_i_travel unique;
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

  association _Booking { create; }

  draft action Activate optimized;
  draft action Discard;
  draft action Edit;
  draft action Resume;
  draft determine action Prepare;

  mapping for ztravel {
    TravelID      = travel_id;
    AgencyID      = agency_id;
    CustomerID    = customer_id;
    BeginDate     = begin_date;
    EndDate       = end_date;
    TotalPrice    = total_price;
    CurrencyCode  = currency_code;
    LastChangedAt = last_changed_at;
  }
}`
      },
      {
        title: 'Validation handler',
        lang: 'abap',
        note: 'Always pair the failed entry with a reported message.',
        code: `METHOD validateDates.
  READ ENTITIES OF zi_travel IN LOCAL MODE
    ENTITY Travel
      FIELDS ( BeginDate EndDate )
      WITH CORRESPONDING #( keys )
    RESULT DATA(travels).

  LOOP AT travels INTO DATA(travel).
    IF travel-EndDate < travel-BeginDate.
      APPEND VALUE #( %tky = travel-%tky ) TO failed-travel.
      APPEND VALUE #(
        %tky = travel-%tky
        %element-BeginDate = if_abap_behv=>mk-on
        %element-EndDate   = if_abap_behv=>mk-on
        %msg = new_message_with_text(
          severity = if_abap_behv_message=>severity-error
          text     = 'End date must be on or after the begin date' )
      ) TO reported-travel.
    ENDIF.
  ENDLOOP.
ENDMETHOD.`
      },
      {
        title: 'Determination handler with next ID',
        lang: 'abap',
        note: 'Replace MAX+1 with a number range or UUID for high concurrency.',
        code: `METHOD setTravelID.
  READ ENTITIES OF zi_travel IN LOCAL MODE
    ENTITY Travel
      FIELDS ( TravelID )
      WITH CORRESPONDING #( keys )
    RESULT DATA(travels).

  SELECT MAX( travel_id ) FROM ztravel INTO @DATA(max_id).

  DATA update TYPE TABLE FOR UPDATE zi_travel\\\\Travel.
  LOOP AT travels INTO DATA(travel) WHERE TravelID IS INITIAL.
    max_id += 1.
    APPEND VALUE #( %tky     = travel-%tky
                    TravelID = max_id ) TO update.
  ENDLOOP.

  MODIFY ENTITIES OF zi_travel IN LOCAL MODE
    ENTITY Travel UPDATE FIELDS ( TravelID )
    WITH update.
ENDMETHOD.`
      },
      {
        title: 'Action handler with result',
        lang: 'abap',
        note: 'Enforce preconditions even if feature control disables the button.',
        code: `METHOD acceptTravel.
  MODIFY ENTITIES OF zi_travel IN LOCAL MODE
    ENTITY Travel
      UPDATE FIELDS ( TravelStatus )
      WITH VALUE #( FOR key IN keys
                    ( %tky         = key-%tky
                      TravelStatus = 'A' ) ).

  READ ENTITIES OF zi_travel IN LOCAL MODE
    ENTITY Travel
      ALL FIELDS WITH CORRESPONDING #( keys )
    RESULT DATA(updated).

  result = VALUE #( FOR travel IN updated
                    ( %tky    = travel-%tky
                      %param  = travel ) ).
ENDMETHOD.`
      },
      {
        title: 'EML create + commit',
        lang: 'abap',
        note: 'Use %cid to identify the request row and mapped to retrieve generated keys.',
        code: `MODIFY ENTITIES OF zi_travel
  ENTITY Travel
    CREATE FIELDS ( AgencyID CustomerID BeginDate EndDate CurrencyCode )
    WITH VALUE #( ( %cid        = 'c1'
                    AgencyID    = '070001'
                    CustomerID  = '000042'
                    BeginDate   = '20260110'
                    EndDate     = '20260114'
                    CurrencyCode = 'EUR' ) )
  MAPPED   DATA(mapped)
  FAILED   DATA(failed)
  REPORTED DATA(reported).

IF failed IS INITIAL.
  COMMIT ENTITIES
    RESPONSE OF zi_travel
      FAILED   DATA(commit_failed)
      REPORTED DATA(commit_reported).
ENDIF.`
      },
      {
        title: 'Metadata extension — list report + object page',
        lang: 'abap',
        note: 'Target is the projection view. UI annotations only affect the UI, not the API.',
        code: `@Metadata.layer: #CORE
annotate entity ZC_Travel with
{
  @UI.headerInfo: {
    typeName: 'Travel',
    typeNamePlural: 'Travels',
    title: { type: #STANDARD, value: 'TravelID' }
  }
  @UI.facet: [ {
    id: 'Bookings',
    purpose: #STANDARD,
    type: #LINEITEM_REFERENCE,
    label: 'Bookings',
    position: 20,
    targetElement: '_Booking'
  } ]

  @UI.lineItem: [ { position: 10 } ]
  @UI.selectionField: [ { position: 10 } ]
  TravelID;

  @UI.lineItem: [ { position: 20 } ]
  AgencyID;
}`
      },
      {
        title: 'DCL role with PFCG aspect',
        lang: 'abap',
        note: 'Grant select on the entity; compare a field to authorization values.',
        code: `@MappingRole: true
define role ZI_TRAVEL_ROLE {
  grant select on ZI_Travel
    where ( AgencyID ) = aspect pfcg_auth(
      'Z_TRAVEL_AG',
      'AGENCY',
      ACTVT = '03'
    );
}`
      },
      {
        title: 'Composition root and child',
        lang: 'abap',
        note: 'The root owns the children; the child points back with association to parent.',
        code: `" Root
define view entity ZI_Travel
  as select from ztravel
  composition [0..*] of ZI_Booking as _Booking
{
  key travel_id as TravelID,
      ...
      _Booking
}

" Child
define view entity ZI_Booking
  as select from zbooking
  association to parent ZI_Travel as _Travel
    on $projection.TravelID = _Travel.TravelID
{
  key booking_id as BookingID,
      travel_id  as TravelID,
      ...
      _Travel
}`
      },
      {
        title: 'ABAP Unit test with EML',
        lang: 'abap',
        note: 'Assert failed/reported and roll back so the test leaves no data behind.',
        code: `CLASS ltcl_travel DEFINITION FOR TESTING
  DURATION SHORT RISK LEVEL HARMLESS.
  PRIVATE SECTION.
    METHODS create_without_dates_fails FOR TESTING.
ENDCLASS.

CLASS ltcl_travel IMPLEMENTATION.
  METHOD create_without_dates_fails.
    MODIFY ENTITIES OF zi_travel
      ENTITY Travel
        CREATE FIELDS ( AgencyID CustomerID )
        WITH VALUE #( ( %cid = 't1'
                        AgencyID = '070001'
                        CustomerID = '000042' ) )
      FAILED DATA(failed)
      REPORTED DATA(reported).

    cl_abap_unit_assert=>assert_not_initial(
      act = failed-travel
      msg = 'Validation must block the create' ).

    ROLLBACK ENTITIES.
  ENDMETHOD.
ENDCLASS.`
      }
    ],

    /* ---------------- glossary ---------------- */
    glossary: [
      { term: 'RAP', def: 'ABAP RESTful Application Programming Model — SAP\'s standard model for transactional business services and Fiori apps.' },
      { term: 'Business object (BO)', def: 'A semantic unit of business data plus its behaviour, exposed through services. In RAP it spans CDS, behavior and service layers.' },
      { term: 'CDS', def: 'Core Data Services — the semantic data modelling layer of ABAP. View entities define the BO data model.' },
      { term: 'View entity', def: 'Modern CDS entity type (`define view entity`) with a key, unions/joins, associations and no separate SQL view name.' },
      { term: 'Interface view', def: 'The stable, reusable `ZI_` layer holding business semantics and associations.' },
      { term: 'Projection view', def: 'The consumption `ZC_` layer: selects and annotates the interface view for a specific app or API.' },
      { term: 'Behavior definition', def: 'The BDEF: a declarative contract for operations, actions, validations, determinations, draft and locking.' },
      { term: 'Behavior pool', def: 'The ABAP class implementing handler methods declared in the BDEF; handlers live in `lcl_handler` in the CCIMP include.' },
      { term: 'Determination', def: 'Framework hook that derives data (keys, totals, timestamps) on save or modify.' },
      { term: 'Validation', def: 'Framework hook that checks business rules on save and can veto the transaction.' },
      { term: 'Action', def: 'A business operation beyond CRUD, callable from UI/API/EML, optionally with parameters and a result.' },
      { term: 'Function', def: 'A read-only operation on a BO that returns data without changing state.' },
      { term: 'Draft', def: 'Persisted in-progress edit state with Edit/Activate/Discard lifecycle, private to a user.' },
      { term: 'ETag', def: 'Version token used for optimistic locking. Sent by the client as If-Match; mismatch → HTTP 412.' },
      { term: 'Total ETag', def: 'BO-instance-wide ETag for draft, changing when any entity in the composition changes.' },
      { term: 'DCL', def: 'Access Control Definition — CDS role enforcing row-level authorization, optionally mapped to PFCG.' },
      { term: 'Instance authorization', def: 'Behavior-layer check deciding whether a user may perform an operation on a specific instance.' },
      { term: 'Managed', def: 'RAP scenario where the framework implements standard CRUD, save, draft and locking.' },
      { term: 'Unmanaged', def: 'RAP scenario where you implement create/update/delete/lock and save, typically to reuse existing APIs.' },
      { term: 'EML', def: 'Entity Manipulation Language — ABAP statements (READ/MODIFY/COMMIT ENTITIES) for using a BO.' },
      { term: 'Service definition', def: 'Lists which CDS entities are exposed and under which aliases.' },
      { term: 'Service binding', def: 'Publishes a service definition with a protocol (OData V4/V2 UI or Web API) and URL.' },
      { term: 'Fiori elements', def: 'Annotation-driven UI generation: list report, object page, value helps, draft handling.' },
      { term: 'Composition', def: 'Owned child relationship: the child\'s lifecycle, lock and authorization follow the root.' },
      { term: 'Association', def: 'Navigation to an independent entity; no lifecycle ownership.' },
      { term: 'Strict mode', def: '`strict ( 2 )`: no implicit conversions/mapping; mistakes fail at activation.' },
      { term: 'Clean core', def: 'Keeping custom code upgrade-stable by using released APIs/CDS and extension points instead of modifications.' },
      { term: 'Extensibility', def: 'Adding fields, logic and UI to a BO without modifying it, enabled by `extensible` and extension artifacts.' },
      { term: 'Business event', def: 'A declared business fact raised by a BO and consumed asynchronously by other systems.' },
      { term: 'ADT', def: 'ABAP Development Tools in Eclipse — the IDE for CDS, behavior definitions, services and ABAP.' }
    ],

    /* ---------------- troubleshooting ---------------- */
    troubleshooting: [
      {
        title: 'Behavior implementation class not found / invalid',
        symptom: 'Activation of the behavior definition fails: the implementation class is missing or not valid for the BDEF.',
        cause: 'The class name in the header does not match an existing class, or the class was not generated for this behavior definition.',
        fix: 'Create the class via the quick fix on the BDEF (this generates `FOR BEHAVIOR OF` and the CCIMP include). Use the convention ZBP_I_<Entity>, then activate all objects together.',
        code: 'managed implementation in class zbp_i_travel unique;\n" class definition must contain:\nCLASS zbp_i_travel DEFINITION PUBLIC ABSTRACT FINAL FOR BEHAVIOR OF zi_travel.'
      },
      {
        title: 'Field not found in CDS entity / mapping error',
        symptom: 'Activation errors about unknown fields or missing mapping in strict mode.',
        cause: 'BDEF field names or `mapping for` entries do not match the CDS element names exactly (case-insensitive but spelling-sensitive).',
        fix: 'Open the CDS entity, copy the element names, and align the BDEF/field list and mapping. Activate the CDS entity first, then the BDEF.',
        code: 'mapping for ztravel {\n  TravelID = travel_id;\n  AgencyID = agency_id;\n}'
      },
      {
        title: 'Determination never runs',
        symptom: 'The derived field stays empty after create/update, or a log statement never fires.',
        cause: 'Wrong trigger (`on modify` for a save-time value), the operation is not listed in the braces, or the determination is not in the active BDEF.',
        fix: 'Check `determination <name> on save { create; }` vs `on modify`, confirm the BDEF is active, and test with an EML create + COMMIT ENTITIES.',
        code: 'determination setTravelID on save { create; }'
      },
      {
        title: 'Validation message shows but the save succeeds',
        symptom: 'Error text appears in the response/UI, yet data is persisted.',
        cause: 'Only `reported` was filled; no corresponding entry in `failed`.',
        fix: 'Append to both structures for errors that must veto: `failed-travel` and `reported-travel`.',
        code: 'APPEND VALUE #( %tky = travel-%tky ) TO failed-travel.\nAPPEND VALUE #( %tky = travel-%tky %msg = ... ) TO reported-travel.'
      },
      {
        title: 'Draft: Edit does nothing / no draft actions',
        symptom: 'The UI shows no Edit button or it fails; draft rows are never created.',
        cause: '`with draft;` is missing, draft actions are not declared, or the binding is not a UI binding that supports draft.',
        fix: 'Declare Edit/Activate/Discard/Resume (and Prepare if needed), add the draft table and total etag, activate the BDEF, and use an OData V4 UI binding.',
        code: 'with draft;\ndraft action Edit;\ndraft action Activate optimized;\ndraft action Discard;\ndraft action Resume;'
      },
      {
        title: 'Draft table out of sync',
        symptom: 'Activate fails with a draft-table error or draft fields are lost.',
        cause: 'Fields were added to the active table/CDS but not to the draft table (or vice versa).',
        fix: 'Regenerate the draft table from ADT or align its fields and types with the active table, then reactivate all layers.',
        code: '" draft table must mirror persisted fields + draft administration fields'
      },
      {
        title: 'HTTP 412 Precondition Failed',
        symptom: 'PATCH/DELETE or draft activation returns 412 with an ETag conflict.',
        cause: 'The client sent an old/unmatched If-Match value, or `LastChangedAt` is not updated by a determination.',
        fix: 'Re-read the entity, send the current ETag, ensure the ETag field is maintained on every change, and use a total ETag for draft compositions.',
        code: 'If-Match: W/"2026-01-10T10:00:00Z"'
      },
      {
        title: 'Empty result for a restricted user',
        symptom: 'GET succeeds (200) but returns no rows for a user who should see data.',
        cause: 'The DCL row filter excludes everything (wrong field, empty PFCG values, or mapping issue).',
        fix: 'Trace with STAUTHTRACE, verify the authorization object values, and check the DCL field mapping. Test with the same user, not a developer.',
        code: '@MappingRole: true\ndefine role ZI_TRAVEL_ROLE {\n  grant select on ZI_Travel where ( AgencyID ) = aspect pfcg_auth( ... );\n}'
      },
      {
        title: '403 Forbidden on create/update',
        symptom: 'Read works but writes are rejected with 403.',
        cause: 'Instance authorization returns unauthorized, or the user lacks the PFCG authorization for the activity.',
        fix: 'Implement `get_instance_authorizations` correctly and populate `%create/%update/%delete`; check the activity (ACTVT) values in the role.',
        code: '%update = if_abap_behv=>auth-unauthorized'
      },
      {
        title: 'OData 404 — entity or service not found',
        symptom: 'The metadata loads but the entity set or action returns 404.',
        cause: 'The entity is not exposed in the service definition, the alias is misspelled, or the binding is not published/active.',
        fix: 'Check `expose` lines and aliases, activate/publish the binding, and compare the URL with the binding preview URL.',
        code: 'define service ZUI_Travel {\n  expose ZC_Travel as Travel;\n}'
      },
      {
        title: 'Field missing from $metadata / payload',
        symptom: 'A CDS field never appears in the API or UI.',
        cause: 'The field is not in the projection view, or the service exposes a different projection.',
        fix: 'Add the field to the projection (`ZC_`) and reactivate the service layer. `@UI.hidden` hides it in the UI only, not from the API.',
        code: 'define view entity ZC_Travel as select from ZI_Travel { ..., TotalPrice }'
      },
      {
        title: 'Blank list report / no columns',
        symptom: 'The Fiori preview shows a table with no columns or no filter bar.',
        cause: 'Missing `@UI.lineItem` / `@UI.selectionField` annotations, or annotations on the wrong entity (interface instead of projection).',
        fix: 'Add UI annotations to the projection or its metadata extension, check `@Metadata.layer`, and refresh the preview.',
        code: '@UI.lineItem: [ { position: 10 } ]\nTravelID;'
      },
      {
        title: 'Child table missing on object page',
        symptom: 'The bookings section does not appear even though the service exposes Booking.',
        cause: 'No `@UI.facet` with `#LINEITEM_REFERENCE` and `targetElement: \'_Booking\'`, or `_Booking` is not in the projection.',
        fix: 'Add the facet with the exact association name and expose `_Booking` in the projection view. Confirm the composition exists in CDS.',
        code: '@UI.facet: [ { id: \'Bookings\', type: #LINEITEM_REFERENCE, targetElement: \'_Booking\', ... } ]'
      },
      {
        title: 'Cannot create a child entity',
        symptom: 'Creating a booking through the travel fails / the create operation is not allowed.',
        cause: 'The root behavior does not allow `create` for the association, or the child wrongly declares `create`.',
        fix: 'Add `association _Booking { create; }` to the root BDEF; the child should expose `update; delete;` and its dependent lock/authorization.',
        code: 'association _Booking { create; }'
      },
      {
        title: 'Mandatory field is not enforced',
        symptom: 'A create succeeds although a business-required field is empty.',
        cause: 'Only UI annotations (`@ObjectModel.mandatory`) exist; there is no `field ( mandatory )` in the BDEF and no validation.',
        fix: 'Declare `field ( mandatory )` in the BDEF for framework enforcement, and add a validation for business-specific rules and messages.',
        code: 'field ( mandatory ) AgencyID, CustomerID, BeginDate, EndDate;'
      },
      {
        title: 'Key is empty after create',
        symptom: 'A new instance has an initial key or the create response has no key.',
        cause: 'No determination fills the key, or the key is set after the buffer is already saved.',
        fix: 'Add an `on save` determination for the key, mark it readonly, and verify with an EML create that `mapped` contains the generated key.',
        code: 'determination setTravelID on save { create; }\nfield ( readonly ) TravelID;'
      },
      {
        title: 'Action not visible in the UI',
        symptom: 'The button for an action does not appear or is always disabled.',
        cause: 'Feature control returns disabled, the action is not annotated for UI, or the entity/binding does not expose it.',
        fix: 'Check `get_instance_features`, the action declaration (`features : instance`), the UI annotation, and that the service is published.',
        code: '%action-acceptTravel = if_abap_behv=>fc-o-enabled'
      },
      {
        title: '500 Internal Server Error with no message',
        symptom: 'The API returns a generic 500 and the UI shows nothing useful.',
        cause: 'A runtime error in the handler (short dump, type conversion, missing mapping), often hidden from the response.',
        fix: 'Check `/IWFND/ERROR_LOG`, `/IWBEP/ERROR_LOG` and ST22. Debug the handler; check types in EML and mapping entries.',
        code: '/IWFND/ERROR_LOG\n/IWBEP/ERROR_LOG\nST22'
      },
      {
        title: 'Behavior class methods do not match the BDEF',
        symptom: 'Activation/debugging shows missing or mismatched handler methods after changing the BDEF.',
        cause: 'Handlers were written by hand and the BDEF declaration changed (new parameter, renamed action, different result type).',
        fix: 'Use the ADT quick fix to regenerate the missing methods, then move your logic into the regenerated signature. Do not edit generated global class parts.',
        code: '" Right-click BDEF -> Quick Fix -> generate handler methods'
      },
      {
        title: 'Authorization works for developer but not business user',
        symptom: 'Everything passes in DEV with your user; the same request fails for the key user.',
        cause: 'Developer users typically have broad SAP_ALL-like authorizations and bypass DCL/instance checks.',
        fix: 'Test with a user that has only the intended PFCG roles. Use STAUTHTRACE to see the exact missing authorization object and values.',
        code: 'STAUTHTRACE'
      }
    ],

    /* ---------------- resources ---------------- */
    resources: [
      { label: 'SAP Help — ABAP RESTful Application Programming Model', url: 'https://help.sap.com/docs/abap-cloud/abap-rap/abap-restful-application-programming-model', note: 'The authoritative documentation: CDS, behavior, services, draft, authorization.' },
      { label: 'SAP-samples — RAP openSAP repository', url: 'https://github.com/SAP-samples/abap-platform-rap-opensap', note: 'Working sample BOs with code you can read and compare against.' },
      { label: 'SAP Learning — ABAP learning journeys', url: 'https://learning.sap.com/', note: 'Structured courses; search for ABAP Cloud and RAP.' },
      { label: 'SAP Community — ABAP RAP tag', url: 'https://community.sap.com/t5/application-development-and-automation-blog-posts/bg-p/application-development', note: 'Deep-dive blog posts and answers to edge cases.' }
    ]
  };
})();
