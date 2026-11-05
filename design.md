# Design: Teacher’s Hub ITQSHHB

Shared system for the main portal, account screens and administration.

## System

- Genre: modern-minimal, application screens.
- Theme: existing ITQSHHB brand, editorial workspace composition.
- Main job: open teacher services and consult the current weekly calendar.
- Keep every existing route, form field, data connection and access check.
- Use the existing institutional photograph and circular logo.

## Tokens

`tokens.css` is the source of truth.

- Main portal: primary `#2b6077`, deep `#1e4b5e`, surface `#f6f8f8`.
- Account screens: primary `#123f34`, deep `#0b3029`, surface `#f4f6f4`.
- Administration: primary `#245f69`, deep `#174850`, surface `#f2f5f4`.
- Main/account body: Avenir Next, Avenir, Segoe UI, Arial, sans-serif.
- Admin body: Inter, Segoe UI, Arial, sans-serif, retained from the original.
- Display: Georgia, Times New Roman, serif.
- Maximum canvas: 1100px. Grid gap: 16px. Mobile gutters: 20px.
- Panels: 12px radius, one containment layer. Controls: 8px radius.
- Color and font literals belong only in the token declarations.

## Controls and states

- Existing blue/green filled primary actions; outlined or text secondary actions.
- Visible keyboard focus; touch targets of at least 44px on coarse pointers.
- Loading, full, empty and failed states use the real application state.
- A failed calendar refresh keeps the last known current-week data and explains the failure.
- FAQ uses its native dialog, search, category filters, Escape and focus return.
- Account tabs support arrow keys, Home and End.

## Motion

Small Georgia letter T, 20px, uses a 1.25-second opacity/translation loop only during loading.
No artificial loading delays or decorative entrances. Reduced motion shows a static T.

## Portal refinements

- The opening uses the original photograph beside a deep-teal field, Georgia title and direct service/calendar actions.
- Phone navigation groups teacher tasks, institutional information and help in a native modal menu.
- The calendar remains restricted to the current Brunei Monday–Sunday week. Seven day buttons select one daily agenda, defaulting to today and resetting on a new Brunei day.
- Date-stamped nearest-activity guidance excludes finished and cancelled activities; details open in a native dialog using text-only source fields.
- Keep selected days and cached activities on failed refresh. Unchanged refreshes preserve the existing agenda DOM and focus.
- Short button labels remain readable at 320px; full activity names stay in headings. Three-line day choices and complete FAQ questions intentionally use larger controls.
- Service hover changes only the border; native dialogs use short opacity/transform transitions and respect reduced motion. The small T remains tied to real loading.
- Quick access shows six lightweight dimensional SVG icons and short titles. Full service names, descriptions, live availability and notes appear in a native dialog before the external action. Privacy/help stay available in the dialog. Firestore link/status overrides and outbound click recording are preserved.

## Exports

`tokens.css`, `base.css` and `hub-ui.js` serve all three pages.
