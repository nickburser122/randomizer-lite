# Randomizer

Static randomizer app. Entry: `index.html` (tool selectable by hash: `#number`, `#list`, `#dice`, `#coin`, `#password`, `#color`, `#qr`).

## Tools
- Number: range, count up to 1000, no repeats, sorted, sum
- List: pick (optionally removing picked items), shuffle, split into groups
- Dice: d4 to d100, up to 100 dice, total
- Coin: up to 500 flips with tally
- Password: length 4 to 64, character sets, look-alike filter, entropy estimate
- Color: any, vivid, pastel or deep, up to 8 swatches
- QR: plain text to QR, four error correction levels, PNG export, "As QR" from any result

Space or Enter generates. Clicking any value copies it.

## Technical
- Randomness: `crypto.getRandomValues` with rejection sampling
- Storage: `localStorage` keys `rz:settings`, `rz:history` (last 30, passwords and QR text never logged), `rz:tool`
- Dependencies: `qrcode-generator@1.4.4` via jsDelivr, Google Fonts (Fraunces, DM Mono)
- Files: `index.html`, `css/style.css`, `js/app.js`

## Status
Not yet browser-tested. Not deployed. Built without access to the original GitHub repo. Image to QR is not included.
