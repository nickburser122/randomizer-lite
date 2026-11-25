# Randomizer lite

Static randomizer app, version 2. Entry: `index.html` (tool selectable by hash: `#number`, `#list`, `#dice`, `#coin`, `#password`, `#color`, `#qr`). Imported from `nickburser122/randomizer-lite`.

## Tools
- Number: range, count up to 1000, no repeats, sorted, sum
- List: pick (optionally removing picked items), shuffle, split into groups
- Dice: d4 to d100, up to 100 dice, total
- Coin: up to 500 flips with tally
- Password: length 4 to 64, character sets, look-alike filter, entropy estimate, regenerates live while options change
- Color: any, vivid, pastel or deep, up to 8 swatches
- QR: plain text to QR, four error correction levels, PNG export, "As QR" from any result

## Keys
- Space or Enter generates, Ctrl/Cmd+Enter generates from a text area
- 1 to 7 switch tools
- Clicking any value or history row copies it

## New in version 2
- No network requests: fonts and the QR library are served from the project
- Motion: animated tool marker, panel and result entrances, springy press states, theme cross-fade, single fade for results over 40 items
- Touch: no sticky hover, no tap delay, stable stage height, active tool scrolls into view
- Settings writes are throttled, live QR and password updates are batched per frame
- Focus is released after pointer clicks so Space always generates
- No new tools were added

## Technical
- Randomness: `crypto.getRandomValues` with rejection sampling
- Storage: `localStorage` keys `rz:settings`, `rz:history` (last 30, passwords and QR text never logged), `rz:tool`, `rz:theme` (unchanged from version 1)
- Fonts: Fraunces variable (opsz, wght) and DM Mono 400/500, latin and latin-ext, in `fonts/` with their OFL licence texts
- QR: `qrcode-generator@1.4.4`, unmodified, in `js/vendor/qrcode.js` (MIT, its header comments are kept)
- Files: `index.html`, `css/style.css`, `js/app.js`, `js/vendor/qrcode.js`, `fonts/`
