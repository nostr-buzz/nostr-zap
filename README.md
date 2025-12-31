# nostr-zap

Embeddable buttons for Nostr:

1) **Zap viewer**: open a dialog and **view zap history** for an `npub`, `nprofile`, `note`, `nevent`, or `naddr`.
2) **Zap button (legacy API)**: zap a profile or note from anywhere.

The package ships a single-file browser bundle **and** an ES module build.

## Quick start (plain HTML)

Add the script tag near the end of your page:

```html
<script src="./dist/nostr-zap.js"></script>
```

Then add a “View zaps” button:

```html
<button
  data-nzv-id="npub1tapj48eekk8lzvhupfxg4ugdgthaj97cqahk3wml97g76l20dfqspmpjyp"
  data-relay-urls="wss://relay.nostr.band,wss://relay.damus.io,wss://nos.lol"
  data-title=""
  data-zap-color-mode="true">
  View zaps
</button>
```

You can also target an event via `nevent`:

```html
<button
  data-nzv-id="nevent1qvzqqqqqqypzqh6r920nndv07ye0czjv3tcs6sh0mytaspm0dzah7tu3a47576jpqqsdh64tahww6w58nj26qcur9wxjnzrgrf5mklfytw33m2mdyf05tessgaznd"
  data-relay-urls="wss://relay.nostr.band,wss://relay.damus.io,wss://nos.lol"
  data-title=""
  data-zap-color-mode="true">
  View zaps (event)
</button>
```

On page load, the library auto-wires any `button[data-nzv-id]` and opens a dialog on click.

## Zap viewer button attributes

These are read from the clicked button:

- `data-nzv-id` (**required**): Nostr identifier (`npub`, `nprofile`, `note`, `nevent`, `naddr`).
- `data-relay-urls` (**required**): Comma-separated relay URLs to fetch data from.
- `data-title` (optional): Custom dialog title. If empty/missing, the identifier is used.
- `data-zap-color-mode` (optional): `"true"` or `"false"`. If missing, defaults to the library’s configured default.

## Using with bundlers (Vite/Webpack/Rollup)

Install:

```sh
npm i nostr-zap
```

Then call `initialize()` once after your buttons exist in the DOM:

```js
import { initialize } from "nostr-zap";

initialize();
```

### SPA / dynamic DOM

If your buttons appear later (route changes, dialogs, etc.), call `initialize()` again after rendering.

## Svelte example

Buttons are visible on initial render:

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { initialize } from "nostr-zap";

  onMount(() => {
    initialize();
  });
</script>
```

Buttons appear conditionally (after a tick):

```svelte
<script lang="ts">
  import { tick } from "svelte";
  import { initialize } from "nostr-zap";

  export let show = false;

  $: if (show) {
    (async () => {
      await tick();
      initialize();
    })();
  }
</script>
```

## Legacy zap button API (still included)

This bundle also includes the older “zap” flow and auto-initializes it.

### Auto-wire legacy buttons

If you already have legacy buttons on your page, they will continue to work.
Common attributes used by older embeds include:

- `data-npub` (required)
- `data-note-id` (optional)
- `data-relays` (optional, comma-separated)

### Programmatic legacy API

When using the module build:

```js
import { nostrZap, zapInit, zapInitTargets } from "nostr-zap";

// Low-level API object
// nostrZap.init({ npub, noteId?, naddr?, relays?, buttonColor?, anon? })

// Convenience exports
await zapInit({ npub: "npub1tapj48eekk8lzvhupfxg4ugdgthaj97cqahk3wml97g76l20dfqspmpjyp", relays: "wss://relay.damus.io,wss://nos.lol" });
zapInitTargets();
```

## Browser globals (script tag build)

When loaded via `<script ...>`, the UMD build exposes a global namespace:

- `window.nostrZap.initialize()`
- `window.nostrZap.nostrZapView()` (alias)
- `window.nostrZap.nostrZap` (legacy API object)

