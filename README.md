# nostr-zap

Embeddable buttons for Nostr:

1) **Zap viewer**: open a dialog and **view zap history** for an `npub`, `nprofile`, `note`, `nevent`, or `naddr`.
2) **Zap button (legacy API)**: zap a profile or note from anywhere.

This project is intended to be embedded via a single-file browser bundle.

## Quick start (plain HTML)

Add the script tag near the end of your page:

```html
<script src="https://zap.nostr.buzz/dist/nostr-zap.js"></script>
```

Live HTML docs (recommended for your domain):

- https://zap.nostr.buzz/docs.html

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

## Zapwall (zap-to-unlock content)

You can optionally gate any HTML block behind a zap. Each content block can have its own price.

Add the `data-zapwall` attributes to a container (and optionally wrap your gated content with `data-zapwall-content`).

Example:

```html
<section
  data-zapwall
  data-zapwall-id="post-123"
  data-title="Premium post"
  data-amount="21"
  data-npub="npub1..."
  data-relays="wss://relay.damus.io,wss://relay.primal.net,wss://nos.lol"
  data-note-id="nevent1...">

  <div data-zapwall-content>
    <h2>Premium content</h2>
    <p>This section is revealed after a successful zap.</p>
  </div>
</section>
```

Notes:
- This is **client-side unlocking** (stored in your browser via `localStorage`). If you need true secrecy, you’ll want a server or an encrypted-content/key-delivery flow.
- `data-note-id` / `data-naddr` are optional. If omitted, it will be a profile zap to `data-npub`.

### Secure mode: encrypted payload (no plaintext in HTML)

If you want the content to be **actually hidden** from “View Source”, do **not** put the plaintext in your HTML. Instead embed an encrypted payload and decrypt it after a successful zap.

Reality check (important):
- With *only* a static HTML file and **no** external key delivery, you cannot automatically give a secret key only to payers.
- So this mode is secure **only if** you provide a decryption key via a secure channel (server, Nostr DM/keybot, manual delivery, etc.).

1) Encrypt your content offline:

The repo includes an offline helper:

`scripts/zapwall-encrypt.mjs`

It outputs a JSON payload plus a 32-byte key (hex). You must deliver the key to users who paid.

2) Embed the payload:

```html
<section
  data-zapwall
  data-zapwall-id="post-locked-1"
  data-title="Premium post"
  data-amount="21"
  data-npub="npub1..."
  data-relays="wss://relay.damus.io,wss://relay.primal.net,wss://nos.lol"
  data-zapwall-key-label="Enter your key">

  <div data-zapwall-content></div>

  <script type="application/json" data-zapwall-payload>
    {"v":1,"alg":"AES-256-GCM","iv":"...","ct":"...","format":"html"}
  </script>
</section>
```

3) Provide a key provider (recommended):

```js
// Option A: set a global function
window.nostrZapZapwallKeyProvider = async ({ wall, zap }) => {
  // Fetch key from your own secure channel.
  // Return 32-byte key as 64-hex string or base64.
  return null;
};
```

If you don’t provide a provider, the default fallback is a prompt asking the user to paste a key.
On page load, the library auto-wires any `button[data-nzv-id]` and opens a dialog on click.

## Zap viewer button attributes

These are read from the clicked button:

- `data-nzv-id` (**required**): Nostr identifier (`npub`, `nprofile`, `note`, `nevent`, `naddr`).
- `data-relay-urls` (**required**): Comma-separated relay URLs to fetch data from.
- `data-title` (optional): Custom dialog title. If empty/missing, the identifier is used.
- `data-zap-color-mode` (optional): `"true"` or `"false"`. If missing, defaults to the library’s configured default.

## Legacy zap button API (still included)

This bundle also includes the older “zap” flow and auto-initializes it.

### Auto-wire legacy buttons

If you already have legacy buttons on your page, they will continue to work.
Common attributes used by older embeds include:

- `data-npub` (required)
- `data-note-id` (optional)
- `data-relays` (optional, comma-separated)

### Programmatic legacy API

When loaded via a script tag, use the browser global:

```js
// Low-level API object:
// window.nostrZap.nostrZap.init({ npub, noteId?, naddr?, relays?, buttonColor?, anon? })

// Convenience helpers:
await window.nostrZap.zapInit({
  npub: "npub1tapj48eekk8lzvhupfxg4ugdgthaj97cqahk3wml97g76l20dfqspmpjyp",
  relays: "wss://relay.damus.io,wss://nos.lol",
});

window.nostrZap.zapInitTargets();
```

## Browser globals (script tag build)

When loaded via `<script ...>`, the UMD build exposes a global namespace:

- `window.nostrZap.initialize()`
- `window.nostrZap.nostrZapView()` (alias)
- `window.nostrZap.nostrZap` (legacy API object)

