# déjà pan

A mobile-first PWA for pausing impulse beauty buys, using what you already own, and tracking small no-buy wins.
Can use via this: https://deja-pan.netlify.app/

## v17 changes

- Added a handwritten accent font for the logo, home headline, proof cards, product notes, and shelf value moments.
- Uses **Kalam** for handwritten accents, **Fraunces** for soft editorial headings, and **Nunito Sans** for warm, readable UI text.
- Avoids `next/font` so installs/builds stay simple and do not depend on font downloads at build time.
- Keeps v14 features: shelf value, levels popup, reset confirmation, brand field, grouped shelf sections, edit/delete products, and past uses without XP backfill.

## run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## storage

This MVP stores data in the browser using `localStorage`. It persists on the same browser/device, but does not sync across devices yet.


## v18 notes

- all UI text now uses a handwritten font by default
- style popup includes handwriting choices: kalam, patrick hand, gaegu, caveat, and nanum pen
- color themes are still available in the same style popup


## v20 font update

The style popup now includes 5 handwritten fonts and 5 normal fonts. Font selection applies globally across headings, buttons, forms, tabs, cards, and body copy.


## v20 font fix

The font picker now applies the selected font across the whole app, including headers, buttons, tabs, cards, inputs, modals, and bottom navigation. The only exception is the font style picker itself, where each option still previews its own font.


## Netlify deploy

This version is configured as a static export for Netlify. Use:

- Build command: `npm run build`
- Publish directory: `out`
- Node version: `20`

The app stores user data locally in the browser with LocalStorage.


## v22 indie aesthetic pass

Adds soft sketchbook doodles, scrapbook-style cards, illustrated empty states, and tab-specific background drawings while keeping the app static-export friendly for Netlify.


## v23 organized shelf

- Added shelf search by brand, product, category, or shade/note.
- Added category filter chips for lippies, base, cheeks, eyes, skin + scent, tools, and other.
- Long shelves now collapse into sections so the Shelf tab does not become one endless list.
- Large shelves switch to compact product rows with quick actions: use, past, empty, edit, delete.
- Section headers show product count and known value when prices are entered.
