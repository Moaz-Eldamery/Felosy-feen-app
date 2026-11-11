---
name: Spending
description: A personal monthly spending tracker that looks and behaves like one of Apple's own iOS apps.
colors:
  system-grouped-bg: "#F2F2F7"
  group-surface: "#FFFFFF"
  sheet-bg: "#F2F2F7"
  sheet-group: "#FFFFFF"
  label: "#000000"
  label-secondary: "#6C6C70"
  label-tertiary: "#8E8E93"
  separator: "rgba(60, 60, 67, 0.22)"
  fill: "rgba(118, 118, 128, 0.12)"
  fill-strong: "rgba(118, 118, 128, 0.2)"
  segment-on: "#FFFFFF"
  bar-material: "rgba(249, 249, 249, 0.86)"
  tint: "#007AFF"
  tint-press: "#0062CC"
  on-tint: "#FFFFFF"
  amber: "#FF9500"
  amber-text: "#A84B00"
  amber-bg: "rgba(255, 149, 0, 0.14)"
  red: "#FF3B30"
  red-text: "#D70015"
  red-bg: "rgba(255, 59, 48, 0.12)"
  cat-green: "#34C759"
  cat-cyan: "#32ADE6"
  cat-indigo: "#5856D6"
  cat-purple: "#AF52DE"
  cat-brown: "#A2845E"
  cat-blue: "#007AFF"
  cat-pink: "#FF2D55"
  cat-gray: "#8E8E93"
typography:
  hero-amount:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "3.2rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  display-total:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "2.6rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  large-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.01em"
  title-2:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "1.294rem"
    fontWeight: 700
  title-3:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "1.176rem"
    fontWeight: 700
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.29
  subheadline:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "0.882rem"
    fontWeight: 400
  footnote:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "0.765rem"
    fontWeight: 400
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "0.647rem"
    fontWeight: 400
    fontFeature: "tnum"
  keypad-digit:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "1.647rem"
    fontWeight: 400
    fontFeature: "tnum"
  mono:
    fontFamily: "ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "0.765rem"
    fontWeight: 400
rounded:
  meter: "2px"
  tag: "4px"
  tile: "7px"
  segment: "9px"
  control: "10px"
  group: "12px"
  action-sheet: "14px"
  app-mark: "16px"
  chip: "17px"
  toast: "26px"
  full: "50%"
spacing:
  hairline: "0.5px"
  xs: "4px"
  sm: "8px"
  row-y: "10px"
  md: "12px"
  gutter: "16px"
  lg: "20px"
  xl: "24px"
  section: "28px"
  section-big: "32px"
components:
  button-primary:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.on-tint}"
    typography: "{typography.headline}"
    rounded: "{rounded.group}"
    padding: "0 20px"
    height: "50px"
  button-primary-active:
    backgroundColor: "{colors.tint-press}"
  button-primary-disabled:
    backgroundColor: "{colors.fill-strong}"
    textColor: "{colors.label-tertiary}"
  button-plain:
    textColor: "{colors.tint}"
    typography: "{typography.body}"
    height: "44px"
  button-destructive:
    textColor: "{colors.red-text}"
    typography: "{typography.body}"
    height: "44px"
  bar-button:
    textColor: "{colors.tint}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 8px"
    height: "44px"
  list-group:
    backgroundColor: "{colors.group-surface}"
    rounded: "{rounded.group}"
  list-row:
    backgroundColor: "{colors.group-surface}"
    textColor: "{colors.label}"
    typography: "{typography.body}"
    padding: "10px 16px"
    height: "44px"
  icon-tile:
    textColor: "{colors.on-tint}"
    rounded: "{rounded.tile}"
    size: "29px"
  meter:
    backgroundColor: "{colors.fill}"
    rounded: "{rounded.meter}"
    height: "4px"
  category-disc:
    textColor: "{colors.on-tint}"
    rounded: "{rounded.full}"
    size: "46px"
  category-disc-large:
    rounded: "{rounded.full}"
    size: "68px"
  segmented-control:
    backgroundColor: "{colors.fill}"
    rounded: "{rounded.segment}"
    padding: "2px"
  segmented-control-selected:
    backgroundColor: "{colors.segment-on}"
    typography: "{typography.footnote}"
    rounded: "{rounded.tile}"
    height: "30px"
  filter-chip:
    backgroundColor: "{colors.group-surface}"
    typography: "{typography.subheadline}"
    rounded: "{rounded.chip}"
    padding: "0 14px"
    height: "34px"
  filter-chip-selected:
    backgroundColor: "{colors.label}"
    textColor: "{colors.system-grouped-bg}"
  keypad-key:
    typography: "{typography.keypad-digit}"
    rounded: "{rounded.group}"
    height: "50px"
  keypad-key-active:
    backgroundColor: "{colors.fill-strong}"
  sheet:
    backgroundColor: "{colors.sheet-bg}"
    rounded: "{rounded.group}"
  toast:
    backgroundColor: "rgba(30, 30, 32, 0.94)"
    textColor: "#FFFFFF"
    rounded: "{rounded.toast}"
    padding: "10px 10px 10px 18px"
  tag:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.label-secondary}"
    typography: "{typography.caption}"
    rounded: "{rounded.tag}"
    padding: "1px 5px"
---

# Design System: Spending

## Overview

**Creative North Star: "A First-Party iOS App"**

Spending is meant to look like an app Apple ships, with no visual identity of its own. The owner chose standard iOS over a custom world, so the platform's conventions are the brand. It uses the system grouped background, inset rounded groups, the system font through Dynamic Type, system blue as the one tint, and system-palette colours for the eight categories. Things that would usually make an app distinctive, like an expressive typeface, an own palette, or decorative depth, are left out on purpose. The only additions are a bold Revolut-style total, a Health-style pace chart, and a hatched overshoot on budget meters.

The screens are dense but calm. Each screen leads with an iOS large title. Content sits in inset grouped lists with hairline separators. One prominent tint button is anchored in a translucent bottom toolbar, within thumb reach. Colour carries information. Category colour says which category a row is. Amber and red say how a budget is doing. Tint marks what you can tap. Light and dark modes follow the system and both are fully specified. Motion uses the iOS sheet curve.

**Key Characteristics:**
- System grouped background with white (light) or #1C1C1E (dark) inset groups at a 12px radius.
- System font via `-apple-system-body`. Every size is in rem, so the whole scale follows Dynamic Type.
- Tabular numerals on every amount, axis label, count and keypad digit.
- Category identity is a white glyph on a coloured 29px rounded tile in lists, and on a coloured disc in pickers.
- Amber and red are the budget-state colours. Red also serves the iOS destructive role.
- Translucent bar material only on the navbar once scrolled, the bottom toolbar, and the action sheet.

## Colors

These are Apple's system colours, used for their system meanings. One tint, a fixed status pair, and eight category hues. Dark mode swaps each token for its iOS dark counterpart. Those values are in the sidecar.

### Primary
- **System Blue** (tint): the only interactive colour. It's used for bar buttons, plain buttons, the primary button fill, the caret, the focus ring, selection and the pace-chart line and area. It darkens to Pressed Blue (tint-press) on press.

### Secondary
- **Budget Amber** (amber / amber-text / amber-bg): a category at 80% or more of its budget. Shown as the meter fill, the warning tile and the value text. Amber-text is a darker shade so it passes contrast as text on white.
- **Over-Budget Red** (red / red-text / red-bg): a category past its budget. Shown as the meter fill and hatch, the warning tile, and the value text. Red-text is also the iOS destructive colour for Delete, "Forget key", input errors, and a pace status that has gone over the total budget.

### Tertiary
- **Category Palette** (cat-green, cat-cyan, cat-indigo, cat-purple, cat-brown, cat-blue, cat-vodafone, cat-gray): one per fixed category. In order: Food & Drinks, Water, Computer Accessories, Clothes, Bills, Transportation, Vodafone Bills, Others. Each is used as the fill for a tile, disc, chip swatch or meter, always with white glyphs on top. iOS red, orange and yellow are left out because they belong to budget status.

### Neutral
- **Grouped Background** (system-grouped-bg): the screen ground, and the sheet ground in light mode.
- **Group Surface** (group-surface / sheet-group): inset group cards. Sheets use the app ground (#F2F2F7 / #000) with the same group colours as the main screen.
- **Label / Secondary Label / Tertiary Label**: primary text; then supporting text, section headers, axis labels and the currency prefix; then placeholders, chevrons, the pace line and disabled text. Secondary label is darkened from the iOS default (#6C6C70) so it reaches 4.5:1 on both grounds.
- **Separator** (separator): 0.5px hairlines between rows and under the bar material.
- **Fill / Fill Strong**: meter tracks, pressed rows, segmented and date-field wells, tags, the grabber, pressed keys and the disabled primary button.
- **Bar Material** (bar-material): the translucent background behind `saturate(180%) blur(20px)` on the scrolled navbar, the toolbar and the action sheet.

### Named Rules
**The Reserved Status Rule.** Amber and red communicate budget state: near (≥80%) and over. Red also keeps its iOS meaning of destructive or error. Neither is ever used as a category colour, decoration or emphasis. A pace that is ahead but still within budget is shown in bold label colour, not amber.

**The One Tint Rule.** System blue is the only colour that means "tappable". Category colours never mark controls.

## Typography

**Display Font:** System (-apple-system / SF Pro, with system-ui, Segoe UI, Roboto fallbacks)
**Body Font:** The same system stack, set through `font: -apple-system-body` when supported (17px fallback)
**Label/Mono Font:** ui-monospace / SF Mono, only for the Shortcut endpoint and key display

**Character:** All type is the system face, as in a first-party app. Hierarchy comes from size and weight steps that map to iOS text styles, never from a second family.

### Hierarchy
- **Hero Amount** (600, 3.2rem, 1.1, -0.02em, tabular): the amount being typed in the Add payment sheet. The currency prefix is 0.45em in secondary label.
- **Display Total** (700, 2.6rem, 1.1, -0.02em, tabular): the month total on the main screen. The "EGP" prefix is 0.5em, weight 600, in secondary label.
- **Large Title** (700, 2rem, 1.2, 0.01em): the month name and other top-level screen titles. When scrolled, it collapses into the 1rem/600 navbar title.
- **Title 2 / Title 3** (700, 1.294rem / 1.176rem): the month switcher in History, the large "Categories" section header, the merchant in sort mode, and empty-state headings.
- **Headline** (600, 1rem): navbar and sheet titles, chart title, primary button.
- **Body** (400, 1rem, 1.29): row titles, inputs and plain buttons.
- **Subheadline** (0.882rem): row subtitles, the "of budget" value, chips and hints.
- **Footnote** (0.765rem): section headers and footers, segmented labels, the sync note and the legend.
- **Caption** (0.647–0.706rem): chart axis labels, the "Edited" tag, and category-picker labels.

### Named Rules
**The Dynamic Type Rule.** Every size is in rem off the `-apple-system-body` root. Never hard-code px for text, so the whole scale follows the user's text size setting.

**The Tabular Money Rule.** Every number that can change or line up with another (amounts, totals, counts, axis labels, keypad digits) uses `font-variant-numeric: tabular-nums`.

## Layout

The layout is a single phone column. Screens are full-height flex columns: navbar, scrolling body with a 16px gutter, and an optional fixed bottom toolbar. Safe-area insets pad the navbar top, the toolbar, the sheet and the action sheet. Groups are inset by the gutter. Rows are at least 44px tall with 10px/16px padding. Separators start at 16px, or at 57px when the row has a tile, so they line up under the text. Section headers sit 28px above a group and 7px above its first row. Large section headers sit 32px above and 10px below. At 640px and wider (iPad or desktop preview), the content, toolbar and navbar centre in a 600px column. The sheet is capped at 600px and the action sheet at 560px. No layout is designed for desktop.

## Elevation & Depth

Depth comes from tonal layering, as on iOS: the grey ground, white groups on it, and sheets above both. There are no card shadows. The few shadows mark real stacking: a sheet over the stage, the selected segment lifting off its well, and a floating toast. Bar material uses translucent blur, not shadow, and is separated from content by a 0.5px separator drawn as a box-shadow.

### Shadow Vocabulary
- **Segment thumb** (`box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12), 0 3px 1px rgba(0, 0, 0, 0.04)`): the selected segment in a segmented control.
- **Toast float** (`box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18)`): the toast.
- **Bar hairline** (`box-shadow: 0 0.5px 0 var(--sep)`, or `0 -0.5px 0` on the toolbar): the scrolled navbar and the toolbar edge.

### Named Rules
**The Flat Groups Rule.** Inset groups never get a shadow or border. They separate from the ground by tone alone.

## Shapes

Corners are continuous and gentle, following the iOS sizes. Groups, sheets, primary buttons and keypad keys use 12px. Icon tiles use 7px. Segmented wells use 9px, with 7px thumbs. The action sheet uses 14px. Chips and the toast are pills. Category discs, chart dots and status dots are circles. Meters are 4px bars with 2px ends. Borders are only ever 0.5px separators. Selection rings on category discs are two box-shadow rings: a 2.5px ring in the ground colour, then a 5px ring in the category colour.

## Components

### Buttons
- **Shape:** gently rounded (12px). Full width, 50px tall.
- **Primary:** system-blue fill, white 1rem/600 label, optional leading icon at 1.2rem. Lives in the bottom toolbar or a sheet's confirm row.
- **Pressed / Disabled:** pressed turns Pressed Blue and scales to 0.98. Disabled uses the strong fill with tertiary label text. Focus is a 2px tint outline offset by 2px.
- **Plain / Destructive:** text-only at 44px tall, 1rem/400, in tint or red-text. Pressed drops to 0.4 opacity.
- **Bar buttons:** tint text and icons in the navbar, at least 44×44px. The back chevron is 1.6rem. A "strong" variant at weight 600 is used for confirm actions.

### Chips (if used)
- **Style:** History filter chips are 34px pills on group surface, 0.882rem/500, with an 8px category swatch and a tabular count.
- **State:** selected chips invert to label-colour fill with ground-colour text, and their count drops to 0.7 opacity.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** group surface, or sheet-group inside sheets.
- **Shadow Strategy:** none (The Flat Groups Rule).
- **Internal Padding:** rows are 10px/16px. The chart card is 14px/16px/12px.

### Inputs / Fields
- **Style:** text inputs have no border or background and are right-aligned inside a row, after a left label, with tertiary-label placeholders. Date fields are a 34px fill well with a 7px radius.
- **Focus:** tint caret, plus the global 2px tint focus-visible ring.
- **Error:** the hint line below the amount turns red-text.

### Navigation
- **Navbar:** a three-column grid. Bar buttons sit left and right, and a centred title fades in on scroll. At rest the bar is the ground colour. Once scrolled it becomes bar material with a hairline.
- **Screens:** push and pop horizontally, with the outgoing screen offset by -28%, over 0.42s on the iOS curve. Pushed screens support edge-swipe back.

### Grouped Row with Tile
The main building block for lists. A 29px coloured tile with a 7px radius and a 17px white glyph, then a title, an optional subtitle and a right-aligned tabular value. The row ends in a tertiary-label chevron when it navigates. Category rows add a meter under the title line. Warning rows use the red or amber tile with an alert glyph. The unsorted-payments row uses a tint tile.

### Budget Meter
A 4px track in fill colour. The fill is the category colour under 80%, amber from 80%, and red when over. When over, the bar splits: a solid red part up to the budget, a 2px gap, then a diagonal hatch for the excess (`repeating-linear-gradient(-45deg, red 0 3px, red at 30% 3px 6px)`, at least 8px wide). Width animates over 0.6s.

### Pace Chart
Sits in a group card. It shows the cumulative spend as a 2.5px tint line over a 14% tint area fill, against a 1.5px dashed tertiary-label "on track" line. Hairline gridlines and a today rule run through it, and an 11px tint dot marks today, ringed in the group colour. Caption-size tabular labels sit on the right y-axis and the x-axis. Below is a legend with line swatches.

### Sheet
Rises from the bottom over 0.5s on `cubic-bezier(0.32, 0.72, 0, 1)`. It covers the full screen, status-bar area included (padding-top is the safe-area inset), in the app's own ground colour, so the screen is one colour edge to edge; it keeps a 36×5px grabber. The stage behind it does not scale or dim. It can be dragged down to dismiss. The header is a three-column grid with a centred 1rem/600 title.

### Custom Keypad
A 3-column grid of 50px keys with a 12px radius. Digits are 1.647rem/400, tabular. Keys have no background at rest and show the strong fill when pressed. Backspace is an icon key. Because the keypad replaces the system keyboard for the amount, the amount shows a blinking 3px tint caret.

### Segmented Control
A 9px fill well with 2px padding and equal columns. Segments are 30px, 0.765rem/500. The selected segment uses segment-on (white in light mode, #636366 in dark), weight 600, with the segment-thumb shadow.

### Category Disc Picker
A 4-column grid of 46px circular discs with 22px white glyphs and caption labels. In sort mode the discs grow to 68px, with 30px glyphs and 0.882rem labels. Pressing a disc scales it to 0.92. Once one is chosen, the rest fade to 0.45 and the chosen disc gets a double ring.

### Toast
A dark translucent pill (26px radius) with blur, white 0.882rem/500 text and a cyan (#64D2FF) undo action. It sits above the toolbar. When a sheet is open it drops in from the top instead, so it never covers the keypad or the confirm button.

### Action Sheet
Two stacked groups, inset 8px from the screen edges, with a 14px radius. The top group is bar material with a 30px blur and holds a footnote title and 57px tint actions separated by hairlines. The bottom group is a separate Cancel at weight 600 on group surface. It rises over 0.4s on the iOS curve above a 30% scrim.

### Motion
The iOS sheet curve (`cubic-bezier(0.32, 0.72, 0, 1)`) drives every spatial move. Sheets and the stage take 0.5s, screens 0.42s, the action sheet 0.4s, meter fills 0.6s, and presses 0.12–0.2s. With `prefers-reduced-motion`, transitions collapse to 0.01s, the caret stops blinking.

## Do's and Don'ts

### Do:
- **Do** use the system tokens for every colour, and give each light value its iOS dark counterpart through `prefers-color-scheme`.
- **Do** set every text size in rem off `-apple-system-body`, and use tabular numerals for all figures.
- **Do** build lists as inset groups (12px radius) of rows at least 44px tall, with 0.5px separators inset to the text (16px, or 57px with a 29px tile).
- **Do** keep the one prominent action as a 50px full-width tint button in the bottom toolbar or a sheet.
- **Do** show overspend as a solid red bar plus a hatched excess segment, and near-budget as an amber fill.
- **Do** move things with the iOS sheet curve, and drop to instant transitions under reduced motion.

### Don't:
- **Don't** use amber or red for anything except budget state, plus red for iOS destructive actions and errors. Never use them as a category colour or for emphasis.
- **Don't** use any colour other than system blue for tappable controls.
- **Don't** put shadows or borders on inset groups. Shadows are only for sheets, the selected segment and the toast.
- **Don't** add a custom display face or a second font family. The system face is the identity.
- **Don't** use system iOS red, orange or yellow as category colours.


## Appearance

Settings › Appearance offers System / Light / Dark (stored in `localStorage` as `spending.theme`). An inline script in `index.html` resolves it before first paint and sets `data-theme="light|dark"` on `<html>`; every dark token lives under `:root[data-theme="dark"]`. The `theme-color` meta is kept equal to the ground (#F2F2F7 / #000) so the iOS status bar matches the app. System follows `prefers-color-scheme` live.
