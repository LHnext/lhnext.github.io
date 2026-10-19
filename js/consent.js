/*
 * Cookie-Einwilligung und Google Analytics 4.
 *
 * Google Analytics wird erst nach ausdrücklicher Einwilligung geladen
 * (§ 25 Abs. 1 TTDSG, Art. 6 Abs. 1 lit. a DSGVO). Ohne Einwilligung
 * wird keine Verbindung zu Google aufgebaut und kein Cookie gesetzt.
 * Die Entscheidung wird im localStorage gespeichert und nach 12 Monaten
 * erneut abgefragt. Über „Cookie-Einstellungen“ im Footer lässt sie sich
 * jederzeit ändern bzw. widerrufen.
 */
(function () {
  /* Mess-ID der GA4-Property (Google Analytics → Verwaltung → Datenstreams) */
  const GA_MEASUREMENT_ID = "G-7SW473HGED";

  const CONSENT_KEY = "lhnext_consent";
  const CONSENT_VERSION = 1;
  const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

  const isConfigured = /^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID) && GA_MEASUREMENT_ID !== "G-XXXXXXXXXX";
  if (!isConfigured) return;

  function readConsent() {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.v !== CONSENT_VERSION || Date.now() - data.ts > CONSENT_MAX_AGE_MS) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function writeConsent(analytics) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ v: CONSENT_VERSION, ts: Date.now(), analytics }));
    } catch (e) {
      /* localStorage nicht verfügbar — Entscheidung gilt nur für diesen Seitenaufruf */
    }
  }

  let gaLoaded = false;

  function loadAnalytics() {
    window["ga-disable-" + GA_MEASUREMENT_ID] = false;
    if (gaLoaded) return;
    gaLoaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "granted",
    });
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(script);
  }

  /* GA-Cookies (_ga, _ga_<ID>) für alle möglichen Domain-Varianten löschen */
  function removeAnalyticsCookies() {
    const host = location.hostname;
    const parts = host.split(".");
    const domains = ["", host];
    for (let i = 1; i < parts.length - 1; i++) {
      domains.push("." + parts.slice(i).join("."));
    }
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      if (!/^_ga(_|$)/.test(name)) return;
      domains.forEach((domain) => {
        document.cookie =
          name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + (domain ? "; domain=" + domain : "");
      });
    });
  }

  function disableAnalytics() {
    window["ga-disable-" + GA_MEASUREMENT_ID] = true;
    if (window.gtag) {
      window.gtag("consent", "update", { analytics_storage: "denied" });
    }
    removeAnalyticsCookies();
  }

  function applyChoice(analytics) {
    writeConsent(analytics);
    if (analytics) {
      loadAnalytics();
    } else {
      disableAnalytics();
    }
    hideBanner();
  }

  let banner = null;

  function buildBanner() {
    banner = document.createElement("div");
    banner.className = "consent-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", "Cookie-Einstellungen");
    banner.hidden = true;
    banner.innerHTML =
      '<div class="consent-inner">' +
      '<p class="consent-text"><strong>Cookies &amp; Reichweitenmessung</strong><br>' +
      "Mit deiner Einwilligung nutzen wir Google Analytics, um in pseudonymisierter Form zu verstehen, wie diese Website genutzt wird. " +
      "Dabei werden Cookies gesetzt und Daten an Google (auch in die USA) übertragen. " +
      "Ohne Einwilligung findet kein Tracking statt. Du kannst deine Entscheidung jederzeit über " +
      "„Cookie-Einstellungen“ im Seitenfuß ändern. Mehr in der " +
      '<a href="datenschutz.html#analytics">Datenschutzerklärung</a>.</p>' +
      '<div class="consent-actions">' +
      '<button type="button" class="btn btn-ghost" data-consent="deny">Ablehnen</button>' +
      '<button type="button" class="btn btn-primary" data-consent="accept">Akzeptieren</button>' +
      "</div></div>";
    banner.querySelector('[data-consent="accept"]').addEventListener("click", () => applyChoice(true));
    banner.querySelector('[data-consent="deny"]').addEventListener("click", () => applyChoice(false));
    document.body.appendChild(banner);
  }

  function showBanner() {
    if (!banner) buildBanner();
    banner.hidden = false;
  }

  function hideBanner() {
    if (banner) banner.hidden = true;
  }

  function addSettingsLinks() {
    document.querySelectorAll(".footer-nav").forEach((nav) => {
      const link = document.createElement("a");
      link.href = "#";
      link.textContent = "Cookie-Einstellungen";
      link.setAttribute("data-consent-open", "");
      nav.appendChild(link);
    });
    document.querySelectorAll("[data-consent-open]").forEach((el) => {
      el.addEventListener("click", (event) => {
        event.preventDefault();
        showBanner();
      });
    });
  }

  function init() {
    addSettingsLinks();
    const consent = readConsent();
    if (consent === null) {
      showBanner();
    } else if (consent.analytics) {
      loadAnalytics();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
