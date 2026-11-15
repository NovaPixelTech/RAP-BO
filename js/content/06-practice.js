/* ==========================================================================
   Module 6 — Practice
   ========================================================================== */
(window.RAP_COACH_CONTENT = window.RAP_COACH_CONTENT || []).push({
  id: 'm6',
  title: 'Practice',
  tagline: 'Build it end to end, then make the learning stick.',
  description: 'A capstone booking BO with composition, draft and validation — plus the study loop that turns reading into recall.',
  lessons: [

    /* ------------------------------------------------------------------ */
    {
      id: 'capstone-bookings',
      title: 'Capstone: add Bookings to your Travel BO',
      level: 'advanced',
      minutes: 20,
      summary: 'A complete child BO: composition, dependent locking, draft, validation, determination and UI facet — with acceptance criteria.',
      tags: ['hands-on', 'capstone', 'composition', 'draft'],
      sections: [
        { t: 'p', cls: 'lead', text: 'This is the exercise that makes RAP click. You will add a Booking child to the travel BO, wire composition and draft, add real logic, and verify the whole thing through the API and the UI.' },
        { t: 'callout', tone: 'info', title: 'Starting point', text: 'You have the travel BO from Module 1: table `ztravel`, `ZI_Travel`, `ZC_Travel`, managed BDEF without draft, a service definition and a V4 UI binding. If you built it with draft already, even better.' },

        { t: 'h', text: '1. Table and interface view' },
        { t: 'code', lang: 'abap', title: 'ZBOOKING', code: `@EndUserText.label: 'Booking'
define table zbooking {
  key client        : abap.clnt not null;
  key booking_id    : abap.numc(10) not null;
      travel_id     : abap.numc(10);
      booking_date  : abap.dats;
      customer_id   : abap.numc(6);
      flight_date   : abap.dats;
      price         : abap.curr(15,2);
      currency_code : abap.cuky;
      booking_status: abap.char(1);
      last_changed_at : timestampl;
}` },
        { t: 'code', lang: 'abap', title: 'ZI_Booking — composition child', code: `@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Booking - interface'
define view entity ZI_Booking
  as select from zbooking
  association to parent ZI_Travel as _Travel
    on $projection.TravelID = _Travel.TravelID
{
  key booking_id      as BookingID,
      travel_id       as TravelID,
      booking_date    as BookingDate,
      customer_id     as CustomerID,
      flight_date     as FlightDate,
      price           as Price,
      currency_code   as CurrencyCode,
      booking_status  as BookingStatus,
      last_changed_at as LastChangedAt,
      _Travel
}` },
        { t: 'p', text: 'In `ZI_Travel`, add the composition and expose it:' },
        { t: 'code', lang: 'abap', title: 'ZI_Travel changes', code: `composition [0..*] of ZI_Booking as _Booking
...
{
  ...
  _Booking
}` },

        { t: 'h', text: '2. Behavior definition' },
        { t: 'code', lang: 'abap', title: 'Booking behavior (draft, dependent)', code: `managed implementation in class zbp_i_booking unique;
strict ( 2 );
with draft;

define behavior for ZI_Booking alias Booking
persistent table zbooking
draft table zbooking_d
etag dependent by _Travel
lock dependent by _Travel
authorization dependent by _Travel
{
  update;
  delete;

  field ( readonly ) BookingID, TravelID, LastChangedAt;
  field ( mandatory ) BookingDate, CustomerID, FlightDate;

  determination setBookingID on save { create; }
  determination setBookingDefaults on modify { create; }
  validation validateBooking on save
    { field BookingDate, FlightDate, CustomerID; create; update; }

  association _Travel;
}` },
        { t: 'p', text: 'In the travel BDEF, allow creating bookings through the composition:' },
        { t: 'code', lang: 'abap', title: 'ZI_Travel (root) changes', code: `association _Booking { create; }` },
        { t: 'callout', tone: 'warn', title: 'Create goes through the parent', text: 'The child normally declares `update; delete;` but not `create;`. Creation happens through the parent association so the root key is known and the draft tree stays consistent.' },

        { t: 'h', text: '3. Logic' },
        { t: 'code', lang: 'abap', title: 'Booking validation', code: `METHOD validateBooking.
  READ ENTITIES OF zi_booking IN LOCAL MODE
    ENTITY Booking
      FIELDS ( BookingDate FlightDate CustomerID )
      WITH CORRESPONDING #( keys )
    RESULT DATA(bookings).

  LOOP AT bookings INTO DATA(booking).
    DATA(error) = abap_false.

    IF booking-CustomerID IS INITIAL.
      error = abap_true.
      APPEND VALUE #( %tky = booking-%tky
                      %element-CustomerID = if_abap_behv=>mk-on
                      %msg = new_message_with_text(
                        severity = if_abap_behv_message=>severity-error
                        text = 'A customer is required for a booking' )
                    ) TO reported-booking.
    ENDIF.

    IF booking-FlightDate IS NOT INITIAL
       AND booking-FlightDate < booking-BookingDate.
      error = abap_true.
      APPEND VALUE #( %tky = booking-%tky
                      %element-FlightDate = if_abap_behv=>mk-on
                      %msg = new_message_with_text(
                        severity = if_abap_behv_message=>severity-error
                        text = 'Flight date cannot be before the booking date' )
                    ) TO reported-booking.
    ENDIF.

    IF error = abap_true.
      APPEND VALUE #( %tky = booking-%tky ) TO failed-booking.
    ENDIF.
  ENDLOOP.
ENDMETHOD.` },
        { t: 'code', lang: 'abap', title: 'Booking ID determination', code: `METHOD setBookingID.
  READ ENTITIES OF zi_booking IN LOCAL MODE
    ENTITY Booking
      FIELDS ( BookingID )
      WITH CORRESPONDING #( keys )
    RESULT DATA(bookings).

  SELECT MAX( booking_id ) FROM zbooking INTO @DATA(max_id).

  DATA update TYPE TABLE FOR UPDATE zi_booking\\\\Booking.
  LOOP AT bookings INTO DATA(booking) WHERE BookingID IS INITIAL.
    max_id += 1.
    APPEND VALUE #( %tky      = booking-%tky
                    BookingID = max_id ) TO update.
  ENDLOOP.

  IF update IS NOT INITIAL.
    MODIFY ENTITIES OF zi_booking IN LOCAL MODE
      ENTITY Booking
        UPDATE FIELDS ( BookingID )
        WITH update.
  ENDIF.
ENDMETHOD.` },

        { t: 'h', text: '4. Service and UI' },
        { t: 'code', lang: 'abap', title: 'Projection, service, facet', code: `" ZC_Booking: thin projection on ZI_Booking
define view entity ZC_Booking as select from ZI_Booking {
  key BookingID,
      TravelID,
      BookingDate,
      CustomerID,
      FlightDate,
      Price,
      CurrencyCode,
      BookingStatus,
      _Travel
}

" Service definition
define service ZUI_Travel {
  expose ZC_Travel  as Travel;
  expose ZC_Booking as Booking;
}

" Metadata extension on ZC_Travel: add the bookings facet
@UI.facet: [ {
  id: 'Bookings',
  purpose: #STANDARD,
  type: #LINEITEM_REFERENCE,
  label: 'Bookings',
  position: 20,
  targetElement: '_Booking'
} ]` },
        { t: 'p', text: 'Add `@UI.lineItem` annotations for the booking fields in a metadata extension on `ZC_Booking`, and `@UI.lineItem` on `TravelID` only if you expose bookings as a separate list.' },

        { t: 'h', text: '5. Accept it' },
        { t: 'list', checked: true, items: [
          'The binding publishes and `$metadata` shows `Booking` with a navigation back to `Travel`.',
          '`GET /Travel(\'…\')?$expand=_Booking` returns the children.',
          'Editing a travel shows the Bookings table; creating a booking inside draft works and Cancel discards it.',
          'Activating with an invalid flight date fails, and the message sits on the FlightDate field.',
          'A valid booking gets a generated BookingID and appears in `zbooking` after activation.',
          'Two users editing the same travel: the second activate fails with a conflict (total ETag).',
          'Deleting the travel deletes its bookings (composition lifecycle).'
        ] },

        { t: 'h', text: '6. Stretch goals' },
        { t: 'list', items: [
          'Add a `deductDiscount` action on the travel that updates all booking prices and returns the new total.',
          'Add feature control: bookings are readonly after the travel is accepted.',
          'Add a `getBookingCount` function and surface it on the object page.',
          'Add a DCL role restricting travels by agency, and test with a restricted user.',
          'Add an ABAP Unit test that creates a travel with two bookings via EML and asserts the total.',
          'Write down three things that surprised you — then add them as flashcards in Practice.'
        ] },
        { t: 'callout', tone: 'tip', title: 'Ship it as a reference', text: 'When the capstone works, save the key snippets as examples in this app with a short note on why each part exists. Your own annotated BO is far more valuable than another tutorial.' }
      ],
      keyPoints: [
        { front: 'Which side of a composition declares `create` for children?', back: 'The root: `association _Child { create; }`. The child declares `update; delete;` and its own dependent lock/authorization/etag.' },
        { front: 'Which draft declarations does a child need?', back: 'Its own `draft table`, `etag dependent by _Parent`, `lock dependent by _Parent`, `authorization dependent by _Parent`, and a `draft action` set inherited from the root lifecycle.' },
        { front: 'What does a valid capstone prove?', back: 'That you can model a composition, configure draft, implement validation/determination, expose the service, render a facet, and verify create/update/activate/conflict behaviour.' },
        { front: 'How do you verify the total ETag works?', back: 'Edit the same BO instance in two sessions and activate the stale one; it must fail with a conflict instead of overwriting.' },
        { front: 'Why add metadata annotations on ZC_Booking?', back: 'So the child table on the travel object page has meaningful columns and labels; the service alone does not define the UI.' }
      ],
      quiz: [
        { q: 'Where is a booking created in a composition?', options: ['Through the travel association `_Booking`', 'Directly on the Booking entity only', 'In the service binding', 'In the DCL'], answer: 0, why: 'Creation goes through the root association so the parent key and draft tree are consistent.' },
        { q: 'Which declaration lets a child participate in the root draft total ETag?', options: ['`etag dependent by _Travel`', '`etag master BookingID`', '`lock master`', '`with draft;` alone'], answer: 0, why: 'A dependent ETag ties the child to the root instance ETag.' },
        { q: 'Activating a stale draft must fail. What makes that possible?', options: ['The root total ETag', 'The child key', 'The service definition', 'The metadata extension'], answer: 0, why: 'The total ETag represents the whole instance and detects that something changed since the draft was created.' }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'study-loop',
      title: 'The learning loop: make it stick',
      level: 'beginner',
      minutes: 8,
      summary: 'A repeatable weekly routine using this app: read, recall, build, explain your own examples, review.',
      tags: ['learning', 'method', 'practice'],
      sections: [
        { t: 'p', cls: 'lead', text: 'Reading RAP feels productive and is mostly forgotten in 48 hours. The fix is not more reading — it is retrieval, building, and explaining. This lesson is the routine that uses everything in this app.' },
        { t: 'h', text: 'The 30-minute session' },
        { t: 'steps', items: [
          { title: '5 min — review due cards', body: 'Open Practice and clear the due queue. Grade honestly: "Again" is information, not failure. This is the highest-value five minutes of the session.' },
          { title: '10 min — one lesson', body: 'Read a single lesson. Do not highlight. After each section, look away and say the idea out loud in one sentence.' },
          { title: '10 min — apply it', body: 'Open the Lab or your ADT system. Generate or write the smallest possible artifact that uses the idea. Reading about determinations without writing one is entertainment, not learning.' },
          { title: '5 min — explain your example', body: 'Save the artifact in My Examples with a note: what it does, why each block exists, what breaks if you remove it. This note becomes your flashcard answer.' }
        ] },
        { t: 'callout', tone: 'why', title: 'Why your own examples beat tutorials', text: 'Recall is strongest when it is tied to something you built and can picture. Your example carries your mistakes, your naming and your context — which is exactly what you will need to retrieve at work.' },

        { t: 'h', text: 'The weekly loop' },
        { t: 'table', head: ['Day', 'Focus', 'Output'], rows: [
          ['Mon', 'New module, 2 lessons', '2 flashcards reviewed + 1 note'],
          ['Tue', 'Practice due cards', 'Queue cleared if possible'],
          ['Wed', 'Build: extend the capstone', 'One working artifact'],
          ['Thu', 'Quiz the module', 'Score ≥ 80%, log weak spots'],
          ['Fri', 'Explain an example from your job', '1 annotated example + 1 card'],
          ['Weekend', 'Rest or light review', 'Streak maintained, no cramming']
        ] },

        { t: 'h', text: 'How to write a note that becomes a card' },
        { t: 'compare', left: { title: 'Weak note', items: [
          '"Determination sets the ID."',
          'Copy-pasted code with no context',
          '"See SAP docs"',
          'A list of keywords'
        ] }, right: { title: 'Strong note', items: [
          '"Runs once on save; reads keys, computes MAX+1, updates via local-mode EML. Direct SQL would bypass the buffer."',
          'The code plus why each block exists',
          'What error appears if the determination is missing',
          'One sentence you can say from memory'
        ] } },
        { t: 'code', lang: 'text', title: 'Example note template', code: `WHAT: Booking ID determination for a draft-enabled child BO.
WHY: Keys must exist before persistence; MAX+1 needs a single source of truth.
HOW: read keys -> select max -> build update table with %tky -> MODIFY ENTITIES IN LOCAL MODE.
BREAKS IF: field not readonly (users overwrite), no guard (recursion), direct SQL (buffer bypass).
REMEMBER: on save = once; on modify = many times.` },
        { t: 'h', text: 'Signs you actually understand it' },
        { t: 'list', checked: true, items: [
          'You can predict what breaks if you remove a line from a BDEF.',
          'You can explain why the managed runtime does not fill timestamps automatically.',
          'You can read an OData 403 and know which of DCL or instance auth to check.',
          'You can build a small BO without copying a tutorial.',
          'You can describe the difference between interface and projection without looking it up.',
          'You can teach the draft lifecycle in 60 seconds.'
        ] },
        { t: 'callout', tone: 'tip', title: 'Use the troubleshooting page as a learning log', text: 'When a real error costs you time, write three lines: symptom, cause, fix. Searching your own log is faster than any search engine, and writing it forces the lesson to stick.' }
      ],
      keyPoints: [
        { front: 'What is the highest-value activity in a short study session?', back: 'Reviewing due flashcards (active recall). It beats re-reading because retrieval strengthens memory and exposes gaps.' },
        { front: 'Why annotate your own examples?', back: 'The note forces you to explain intent, mechanism and failure modes — which is retrieval and elaboration, much stronger than recognition.' },
        { front: 'What should a strong example note contain?', back: 'What it does, why it exists, how the key blocks work, what breaks without them, and a one-sentence takeaway you can recall.' },
        { front: 'How often should you build versus read?', back: 'At least as much time building/applying as reading. Reading without building creates familiarity without skill.' },
        { front: 'What does a quiz score below 80% tell you?', back: 'Not that you failed, but which lesson needs another pass. Re-read selectively, then review the related cards.' }
      ],
      quiz: [
        { q: 'Which activity produces the strongest retention per minute?', options: ['Active recall of due cards', 'Re-reading a lesson', 'Watching a video at 2×', 'Highlighting code'], answer: 0, why: 'Retrieval practice strengthens memory and reveals gaps; passive review feels easy but fades quickly.' },
        { q: 'What belongs in an example note?', options: ['What it does, why, how, and what breaks without it', 'Only the code', 'A link to the source', 'A list of annotations'], answer: 0, why: 'The explanation is the retrieval cue; it turns the snippet into understanding.' },
        { q: 'You scored 60% on a module quiz. Best next step?', options: ['Revisit the missed lessons, then review their cards', 'Start the next module', 'Reset all progress', 'Read all lessons again'], answer: 0, why: 'Targeted review of the missed topics is efficient; a full re-read is mostly wasted time.' }
      ]
    }
  ]
});
