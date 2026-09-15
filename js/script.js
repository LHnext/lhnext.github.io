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

    const subject = `Anfrage: ${leistung || "Leistung"}`;
    const body =
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
