---
version: 1
slug: "web-index-html"
primary_target: "web/index.html"
related_targets: []
---

# Surface: Spending app (main, add-payment sheet, history, settings)

Mode: Operate. Audience: the owner, alone, one-handed on an iPhone, usually right after paying (often in bright sunlight outdoors in Cairo, sometimes at night). Task: log a payment in seconds, then read the month at a glance.

## Direction contract

THESIS: The month as Apple's own apps would show it. A bold Revolut-style total, a Health-style pace chart, and a Wallet-style grouped category list. It refuses the category default of a floating + button on a dashboard of colored cards: here, Add payment is the sheet the app opens on.

OWN-WORLD: iOS system grouped background (#F2F2F7 light / #000 dark) with white or #1C1C1E inset groups and 10pt corner radius. SF Pro via the system font stack, with tabular numerals. Each of the 8 categories has its own system-palette color, shown as a glyph in a 29pt rounded square. System blue is the tint. Amber means near budget and red means over, and those two colors are used for nothing else. Overspend shows as a diagonal hatch past the end of the bar.

STORY: Open the app, and the Add payment sheet is already up with unsorted Apple Pay payments first. File the payment with a category tap and the keypad, then confirm. The sheet drops to reveal the month. Warnings sit at the top, the total and pace show whether you're on track, and each category row shows spent vs. budget. History holds past months, a filter, editing and deleting, and CSV export.

FIRST VIEWPORT: Main screen at 390pt wide:
- navigation bar with History (left) and Settings (right)
- a large title with the month name, then the total in a 44pt bold numeral with "of 8,300 · 21 days left"
- warning rows directly under the large title (iOS HIG: top-level screens lead with the large title)
- an inset card holding the pace chart (cumulative line, dotted on-track line, today dot)
- inset grouped list of 8 categories with thin meters
- a fixed bottom toolbar with a full-width, prominent "Add Payment" button within thumb reach

FORM: canon (the category standard: native iOS spending app), chosen by the user over the roll; seed:8673847153b4b906

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Signature interaction

The app opens with the Add payment sheet up. It has a custom keypad, so no system keyboard is needed for the amount. In unsorted mode, a single category tap files the payment, then shows an undo toast and moves to the next one. Motion uses the iOS sheet curve: the sheet slides up from the bottom and covers the full screen in the app's ground colour, so the screen is one colour edge to edge (owner request, 2026-11-09).
