// ZapWall (zap-to-unlock content)
//
// This feature is intentionally optional and does not affect existing zap buttons.
//
// Usage (example):
// <section data-zapwall data-zapwall-id="post-1" data-npub="npub1..." data-relays="wss://..." data-note-id="nevent1..." data-amount="21">
//   <div data-zapwall-content>...your premium content...</div>
// </section>
//
// Notes:
// - This is client-side gating. For true secrecy you need to deliver content from a server
//   or encrypt + deliver the decryption key after verifying payment.

const STORAGE_PREFIX = "nostrZap.zapwall.";

const isLocalStorageAvailable = () => {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
};

const getStorage = (key) => {
  if (!isLocalStorageAvailable()) return null;
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${key}`);
  } catch {
    return null;
  }
};

const setStorage = (key, value) => {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, value);
  } catch {
    // ignore
  }
};

const normalizeRelayUrl = (u) => (u || "").trim().replace(/\/+$/, "");

const ensureZapWallStyles = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById("nz-zapwall-styles")) return;

  const style = document.createElement("style");
  style.id = "nz-zapwall-styles";
  style.textContent = `
    [data-zapwall] { position: relative; }

    .nz-zapwall-locked {
      filter: blur(10px);
      user-select: none;
      pointer-events: none;
    }

    .nz-zapwall-overlay {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 16px;
      background: radial-gradient(circle at 30% 20%, rgba(247,147,26,0.22) 0%, rgba(0,0,0,0) 52%),
                  rgba(255,255,255,0.70);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      border: 1px solid rgba(15, 23, 42, 0.08);
      border-radius: 16px;
    }

    @media (prefers-color-scheme: dark) {
      .nz-zapwall-overlay {
        background: radial-gradient(circle at 30% 20%, rgba(247,147,26,0.18) 0%, rgba(0,0,0,0) 52%),
                    rgba(2, 6, 23, 0.68);
        border: 1px solid rgba(255, 255, 255, 0.10);
      }
    }

    .nz-zapwall-card {
      width: min(520px, 100%);
      border-radius: 14px;
      padding: 14px 14px 12px;
      background: rgba(255,255,255,0.90);
      border: 1px solid rgba(15, 23, 42, 0.10);
      box-shadow: 0 18px 40px rgba(2, 6, 23, 0.10);
      text-align: center;
      color: #0f172a;
    }

    @media (prefers-color-scheme: dark) {
      .nz-zapwall-card {
        background: rgba(15, 23, 42, 0.82);
        border: 1px solid rgba(255, 255, 255, 0.10);
        box-shadow: 0 18px 40px rgba(0,0,0,0.45);
        color: #f1f5f9;
      }
    }

    .nz-zapwall-title { font-weight: 700; font-size: 14px; letter-spacing: -0.01em; }
    .nz-zapwall-sub { margin-top: 4px; font-size: 13px; opacity: 0.85; }

    .nz-zapwall-btn {
      margin-top: 10px;
      width: 100%;
      border: 0;
      border-radius: 12px;
      padding: 10px 12px;
      font-weight: 700;
      cursor: pointer;
      background: #f7931a;
      color: #0b0f14;
      box-shadow: 0 10px 22px rgba(247,147,26,0.25);
    }

    .nz-zapwall-btn:hover { filter: brightness(0.98); }
    .nz-zapwall-btn:active { transform: translateY(1px); }

    .nz-zapwall-note {
      margin-top: 8px;
      font-size: 12px;
      opacity: 0.75;
    }
  `;

  document.head.appendChild(style);
};

const parseZapWall = (el, index) => {
  const key =
    el.getAttribute("data-zapwall-id") ||
    el.getAttribute("id") ||
    `zapwall-${index}`;

  const npub = (el.getAttribute("data-npub") || "").trim();
  const relays = (el.getAttribute("data-relays") || "").trim();
  const noteId = (el.getAttribute("data-note-id") || "").trim();
  const naddr = (el.getAttribute("data-naddr") || "").trim();

  const amountSats = Number(el.getAttribute("data-amount"));
  const title = (el.getAttribute("data-title") || "Unlocked content").trim();

  const relayUrls = relays
    ? relays
        .split(",")
        .map(normalizeRelayUrl)
        .filter(Boolean)
    : [];

  const contentEl =
    el.querySelector("[data-zapwall-content]") ||
    el;

  return {
    el,
    key,
    npub,
    relayUrls,
    noteId,
    naddr,
    amountSats,
    title,
    contentEl,
  };
};

const isUnlockMatch = (wall, detail) => {
  if (!detail || typeof detail !== "object") return false;

  const paidSats = Number(detail.amountSats);
  if (!Number.isFinite(paidSats) || !Number.isFinite(wall.amountSats)) return false;
  if (paidSats < wall.amountSats) return false;

  // Prefer exact target matching when provided.
  if (wall.noteId) {
    return (
      detail.noteId === wall.noteId ||
      detail.nip19Target === wall.noteId
    );
  }

  if (wall.naddr) {
    return (
      detail.naddr === wall.naddr ||
      detail.nip19Target === wall.naddr
    );
  }

  // Fallback: profile zap match.
  return !!wall.npub && detail.npub === wall.npub;
};

const unlockWall = (wall, detail) => {
  wall.el.setAttribute("data-zapwall-unlocked", "true");

  // Remove overlay
  const overlay = wall.el.querySelector(":scope > .nz-zapwall-overlay");
  overlay?.remove();

  // Unblur content
  wall.contentEl.classList.remove("nz-zapwall-locked");

  // Persist unlock locally
  setStorage(
    wall.key,
    JSON.stringify({
      unlockedAt: Date.now(),
      amountSats: wall.amountSats,
      invoice: detail?.invoice || null,
      successSource: detail?.successSource || null,
      nip19Target: detail?.nip19Target || null,
    })
  );
};

const lockWall = (wall) => {
  wall.el.removeAttribute("data-zapwall-unlocked");

  // Blur content (but keep layout)
  wall.contentEl.classList.add("nz-zapwall-locked");

  // Avoid duplicating overlay
  const existing = wall.el.querySelector(":scope > .nz-zapwall-overlay");
  if (existing) return;

  const overlay = document.createElement("div");
  overlay.className = "nz-zapwall-overlay";

  const card = document.createElement("div");
  card.className = "nz-zapwall-card";

  const title = document.createElement("div");
  title.className = "nz-zapwall-title";
  title.textContent = wall.title;

  const sub = document.createElement("div");
  sub.className = "nz-zapwall-sub";
  sub.textContent = `Send a zap to unlock (${wall.amountSats} sats).`;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "nz-zapwall-btn";
  btn.textContent = `⚡ Unlock for ${wall.amountSats} sats`;

  // Turn this button into a regular nostr-zap button.
  // LegacyZap will pick it up (because it has data-npub).
  if (wall.npub) btn.setAttribute("data-npub", wall.npub);
  if (wall.relayUrls.length) btn.setAttribute("data-relays", wall.relayUrls.join(","));
  if (wall.noteId) btn.setAttribute("data-note-id", wall.noteId);
  if (wall.naddr) btn.setAttribute("data-naddr", wall.naddr);

  // Fixed price
  btn.setAttribute("data-amount", String(wall.amountSats));
  btn.setAttribute("data-amount-fixed", "true");

  const note = document.createElement("div");
  note.className = "nz-zapwall-note";
  note.textContent = "Unlock is stored locally in your browser.";

  card.appendChild(title);
  card.appendChild(sub);
  card.appendChild(btn);
  card.appendChild(note);
  overlay.appendChild(card);

  wall.el.appendChild(overlay);
};

export const autoInitializeZapWalls = () => {
  if (typeof document === "undefined") return;

  const run = () => {
    ensureZapWallStyles();

    const walls = Array.from(document.querySelectorAll("[data-zapwall]"))
      .map((el, i) => parseZapWall(el, i))
      .filter((w) => w && w.el);

    walls.forEach((wall) => {
      // Basic validation
      if (!Number.isFinite(wall.amountSats) || wall.amountSats <= 0) {
        return;
      }

      const prior = getStorage(wall.key);
      if (prior) {
        wall.el.setAttribute("data-zapwall-unlocked", "true");
        wall.contentEl.classList.remove("nz-zapwall-locked");
        wall.el.querySelector(":scope > .nz-zapwall-overlay")?.remove();
        return;
      }

      lockWall(wall);
    });

    // Listen for zap success events and unlock matching walls.
    window.addEventListener("nostr-zap:success", (e) => {
      const detail = e?.detail;
      if (!detail) return;

      walls.forEach((wall) => {
        if (wall.el.getAttribute("data-zapwall-unlocked") === "true") return;
        if (!isUnlockMatch(wall, detail)) return;
        unlockWall(wall, detail);
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
};
