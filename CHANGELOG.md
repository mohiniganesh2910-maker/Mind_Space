# Expanded edition — file-level changes

| File | Change |
| --- | --- |
| dashboard.html / dashboard.js | New real-data summary, latest activity, 7/30-day categorical mood distribution, period activity counts and dated three-action plans with edit/remove/complete/undo/reschedule. |
| focus.html / focus.js | New study/break timer, presets/custom durations, monotonic timing, pause-on-hidden, explicit transitions, optional sound, completion-only history and break suggestions. |
| grounding.html / grounding.js | New guided sensory steps, optional temporary responses, next/back/skip/restart/exit, simpler alternative, saved completion history and explicitly saved response history. |
| preferences.html / preferences.js | New persistent appearance/motion/sound/draft choices and file-size/schema validated backup preview with confirmed merge/replace. |
| storage.js | v2 schema, v1/legacy migration, preserved recovery bytes, record validation, atomic writes, local-date helper, backup parsing/merge and shared plan rules. |
| journal-editor.js | New shared journal editor extracted from script.js; prompts, keyword/tag/date/mood filters, favourites and opt-in debounced draft recovery added to existing CRUD. |
| script.js | Shared grouped/mobile navigation, Escape handling, preference application, export/clear and cross-tab notice. Journal implementation moved into its own file. |
| journal.html / gratitude.html | Added prompt controls, optional tags, search/favourites/date filters and restore/discard draft panel. Existing labels, forms and entry history retained. |
| journal.js / gratitude.js | Existing thin shared-editor initializers retained. |
| index.html | Added clear links to the new dashboard, study timer and grounding guide. |
| script2.js | Existing five mood mappings, explicit check-in saving and summaries retained using the upgraded storage API. |
| breathing.js | Existing exercise retained; circle now also respects the saved motion preference. |
| breathing.html / activities.html / games.html | Shared navigation/footer updated; existing page functionality retained. |
| activities.js / games.js | Existing 17 activities and two games retained without replacement. |
| style2.css | Grouped navigation, dashboard/planning controls, timer/preferences/grounding layouts, full dark theme and explicit/system motion choices. Existing responsive layouts retained. |
| index2.html | Existing compatibility redirect retained. |
| README.md | Updated launch instructions, feature guide, exact data/merge/migration rules and limitations. |
| TESTING.md | Updated verification evidence and browser QA checklist. |

All content pages share manageable grouped navigation and data controls. User text is rendered through textContent. New features use the same storage helper as existing features. No external assets, accounts, services, or dependencies were introduced.

## Supabase navbar integration
- Removed the standalone `supabase.html` page and its legacy page-specific script.
- Added shared Log in / Sign up controls and account dialog across the existing main pages.
- Added account logout, manual cloud backup/restore, and opt-in automatic backup of successful local saves.
- Updated Supabase setup instructions and privacy text.

## Cloud backup removal
- Removed account controls, Supabase page integrations, cloud backup code, setup files, and related styling.
- Updated page privacy text to describe browser-local storage only.

## Dedicated authentication pages
- Added dedicated Sign up and Log in pages linked from navbar buttons; account authentication uses Supabase Auth only.
- Removed the Preferences page and its import screen, along with links to that page.
- Wellbeing records remain local and are not uploaded or synced by authentication.

## Account profile
- Successful sign-up (when immediately authenticated) and login now open a profile page showing the Supabase username and email.
- Added profile logout with a redirect to Home.
