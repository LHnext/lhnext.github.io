/* Theme (Dark/Light) */
const THEME_KEY = "lhtech_theme";
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  if (themeToggle) {
    themeToggle.textContent = theme === "light" ? "Dark Mode" : "Light Mode";
  }
}

(function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem(THEME_KEY);
  } catch (e) {
    /* localStorage nicht verfügbar */
  }
  applyTheme(saved === "light" ? "light" : "dark");
})();

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    const next = isLight ? "dark" : "light";
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (e) {
      /* localStorage nicht verfügbar — Auswahl gilt nur für diesen Seitenaufruf */
    }
  });
}

const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

/*
 * Kontakt-Werte (E-Mail/Telefon) liegen nur Base64-kodiert im Markup und werden
 * erst nach einem echten Klick entschlüsselt und in href/Text geschrieben.
 * Das verhindert, dass einfache Scraper die Adressen aus dem statischen HTML lesen.
 */
document.querySelectorAll("[data-reveal-enc]").forEach((el) => {
  el.addEventListener("click", (event) => {
    if (el.dataset.revealed === "true") return;
    event.preventDefault();

    let value;
    try {
      value = atob(el.getAttribute("data-reveal-enc"));
    } catch (e) {
      return;
    }

    const type = el.getAttribute("data-reveal-type");
    const href = type === "tel" ? `tel:${value.replace(/\s+/g, "")}` : `mailto:${value}`;
    el.setAttribute("href", href);

    if (el.hasAttribute("data-reveal-text")) {
      el.textContent = type === "tel" ? value : value.split(",")[0];
    }

    el.dataset.revealed = "true";

    if (el.hasAttribute("data-reveal-navigate")) {
      window.location.href = href;
    }
  });
});

const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const requestForm = document.getElementById("requestForm");
if (requestForm) {
  requestForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(requestForm);
    const name = data.get("name") || "";
    const email = data.get("email") || "";
    const phone = data.get("phone") || "";
    const leistung = data.get("leistung") || "";
    const fahrzeug = data.get("fahrzeug") || "";
    const termin = data.get("termin") || "";
    const message = data.get("message") || "";
    const cartItems = data.get("cartItems") || "";

    const subject = cartItems
      ? "Anfrage: mehrere Leistungen (Warenkorb)"
      : `Anfrage: ${leistung || "Leistung"}`;

    const cartBlock = cartItems
      ? `Ausgewählte Leistungen (Warenkorb):\n${cartItems
          .split("|")
          .map((item) => `- ${item}`)
          .join("\n")}\n\n`
      : "";

    const body =
      cartBlock +
      `Name: ${name}\n` +
      `E-Mail: ${email}\n` +
      `Telefon: ${phone}\n` +
      `Leistung: ${leistung}\n` +
      `Fahrzeug/Modell: ${fahrzeug}\n` +
      `Wunschtermin: ${termin}\n\n` +
      `Nachricht:\n${message}\n\n` +
      `Hinweis: Dies ist eine unverbindliche Anfrage, kein verbindlicher Auftrag.`;

    let recipients;
    try {
      recipients = atob(requestForm.getAttribute("data-reveal-enc"));
    } catch (e) {
      return;
    }

    window.location.href =
      `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

/* Warenkorb (rein clientseitig, keine Server-/Zahlungsanbindung) */
const CART_KEY = "lhtech_cart";

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCart(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch (e) {
    /* localStorage nicht verfügbar (z. B. privater Modus) — Warenkorb bleibt nur im Speicher der Seite */
  }
}

const cartToggle = document.getElementById("cartToggle");
const cartPanel = document.getElementById("cartPanel");
const cartCount = document.getElementById("cartCount");
const cartList = document.getElementById("cartList");
const cartEmpty = document.getElementById("cartEmpty");
const cartToRequest = document.getElementById("cartToRequest");
const cartSummaryRow = document.getElementById("cartSummaryRow");
const cartSummaryList = document.getElementById("cartSummaryList");
const cartItemsField = document.getElementById("cartItemsField");

if (cartToggle && cartPanel) {
  function renderCart() {
    const items = getCart();

    if (cartCount) cartCount.textContent = String(items.length);

    if (cartList) {
      cartList.innerHTML = "";
      items.forEach((item) => {
        const li = document.createElement("li");
        const span = document.createElement("span");
        span.textContent = item;
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "cart-remove";
        removeBtn.setAttribute("aria-label", `${item} entfernen`);
        removeBtn.textContent = "×";
        removeBtn.addEventListener("click", () => {
          saveCart(getCart().filter((i) => i !== item));
          renderCart();
        });
        li.append(span, removeBtn);
        cartList.appendChild(li);
      });
    }

    if (cartEmpty) cartEmpty.hidden = items.length > 0;
    if (cartToRequest) cartToRequest.hidden = items.length === 0;

    if (cartSummaryRow && cartSummaryList) {
      if (items.length > 0) {
        cartSummaryRow.hidden = false;
        cartSummaryList.innerHTML = "";
        items.forEach((item) => {
          const li = document.createElement("li");
          li.textContent = item;
          cartSummaryList.appendChild(li);
        });
      } else {
        cartSummaryRow.hidden = true;
      }
    }

    if (cartItemsField) cartItemsField.value = items.join("|");

    document.querySelectorAll("[data-cart-add]").forEach((btn) => {
      const name = btn.getAttribute("data-cart-add");
      btn.dataset.added = items.includes(name) ? "true" : "false";
      btn.textContent = items.includes(name) ? "Im Warenkorb ✓" : "In den Warenkorb";
    });
  }

  cartToggle.addEventListener("click", () => {
    const isOpen = cartPanel.hidden;
    cartPanel.hidden = !isOpen;
    cartToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.querySelectorAll("[data-cart-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.getAttribute("data-cart-add");
      const items = getCart();
      if (!items.includes(name)) {
        items.push(name);
        saveCart(items);
      }
      renderCart();
      cartPanel.hidden = false;
      cartToggle.setAttribute("aria-expanded", "true");
    });
  });

  renderCart();
}
