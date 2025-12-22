"use strict";

const yearElement = document.getElementById("year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

window.toggleMenu = function toggleMenu() {
  const nav = document.getElementById("navLinks");
  if (!nav) return;
  nav.classList.toggle("open");
};

const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("active");
    }
  });
}, observerOptions);

document.querySelectorAll(".reveal").forEach((el) => {
  observer.observe(el);
});

(function enableMobileParallax() {
  const MOBILE_MAX_WIDTH = 900;
  let enabled = false;
  let sections = [];

  function handleScroll() {
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const offset = rect.top * -0.2;
      section.style.backgroundPosition = `center ${offset}px`;
    });
  }

  function updateParallax() {
    const shouldEnable = window.innerWidth <= MOBILE_MAX_WIDTH;
    if (shouldEnable && !enabled) {
      sections = Array.from(document.querySelectorAll(".image-break"));
      if (!sections.length) return;
      enabled = true;
      window.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
    } else if (!shouldEnable && enabled) {
      enabled = false;
      window.removeEventListener("scroll", handleScroll);
      sections.forEach((section) => {
        section.style.backgroundPosition = "center";
      });
      sections = [];
    }
  }

  window.addEventListener("load", updateParallax);
  window.addEventListener("resize", updateParallax);
})();

(function handleNewsletterForm() {
  const form = document.getElementById("newsletter-form");
  const emailInput = document.getElementById("newsletter-email");
  const honeypot = document.getElementById("newsletter-website");
  const alertEl = document.getElementById("newsletter-alert");
  const helperText = document.getElementById("newsletter-helper");
  const submitButton = form?.querySelector('button[type="submit"]');

  if (!form || !emailInput || !alertEl || !honeypot || !helperText) return;

  const locale = form.dataset.locale || "en";
  const defaultButtonLabel = submitButton ? submitButton.textContent : "";
  const messages = {
    en: {
      sending: "Sending...",
      success: "Welcome to the bloc, you're in ✌️",
      invalidEmail: "Enter a valid email address.",
      blockedDomain: "Temporary email domains are not allowed.",
      rateLimited: "Too many attempts. Please try again later.",
      csrf: "Security check failed. Please reload and try again.",
      genericError: "Something went wrong. Please try again.",
      networkError: "Connection error. Please try again in a moment.",
      bot: "Form validation failed. Please contact support.",
      helper: "Subscribers get the drop link before everyone else.",
    },
    fr: {
      sending: "Envoi en cours...",
      success: "Bienvenue dans le bloc, c’est validé ✌️",
      invalidEmail: "Saisis une adresse e-mail valide.",
      blockedDomain: "Les domaines temporaires ne sont pas autorisés.",
      rateLimited: "Trop de tentatives. Réessaie plus tard.",
      csrf: "Vérification de sécurité échouée. Recharge et réessaie.",
      genericError: "Une erreur est survenue. Réessaie.",
      networkError: "Problème de connexion. Réessaie dans un instant.",
      bot: "Validation refusée. Contacte-nous si besoin.",
      helper:
        "Les abonnés reçoivent le lien du drop avant tout le monde.",
    },
  };

  function getMessage(key) {
    const lang = messages[locale] ? locale : "en";
    return messages[lang][key];
  }

  function setAlert(type, text) {
    alertEl.hidden = false;
    alertEl.textContent = text;
    alertEl.className = "alert";
    alertEl.classList.add(type === "success" ? "alert-success" : "alert-error");
    if (helperText) helperText.textContent = "";
  }

  function resetAlert() {
    if (!alertEl) return;
    alertEl.hidden = true;
    alertEl.textContent = "";
    alertEl.className = "alert";
    if (helperText) helperText.textContent = getMessage("helper");
  }

  function isValidEmail(email) {
    const emailPattern =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    return emailPattern.test(email);
  }

  function isBlockedDomain(email) {
    const blocked = [
      "mailinator.com",
      "tempmail.com",
      "10minutemail.com",
      "yopmail.com",
      "guerrillamail.com",
    ];
    const domain = email.split("@")[1] || "";
    return blocked.some((d) => domain.toLowerCase().endsWith(d));
  }

  async function submitNewsletter(email) {
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({ email }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      return { success: true, message: data.message };
    }

    if (response.status === 429) {
      throw new Error("rateLimited");
    }

    if (response.status === 400) {
      throw new Error("invalidEmail");
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error("csrf");
    }

    throw new Error(data.message || "genericError");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    resetAlert();
    const email = emailInput.value.trim();
    const trapValue = honeypot.value.trim();

    if (trapValue) {
      setAlert("error", getMessage("bot"));
      return;
    }

    if (!email) {
      setAlert("error", getMessage("invalidEmail"));
      return;
    }

    if (!isValidEmail(email)) {
      setAlert("error", getMessage("invalidEmail"));
      return;
    }

    if (isBlockedDomain(email)) {
      setAlert("error", getMessage("blockedDomain"));
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = getMessage("sending");
    }

    try {
      const result = await submitNewsletter(email);
      if (result.success) {
        setAlert("success", result.message || getMessage("success"));
        emailInput.value = "";
      } else {
        setAlert("error", getMessage("genericError"));
      }
    } catch (error) {
      const messageKey = error?.message;
      if (messageKey === "rateLimited") {
        setAlert("error", getMessage("rateLimited"));
      } else if (messageKey === "invalidEmail") {
        setAlert("error", getMessage("invalidEmail"));
      } else if (messageKey === "csrf") {
        setAlert("error", getMessage("csrf"));
      } else if (error instanceof TypeError) {
        setAlert("error", getMessage("networkError"));
      } else {
        const mapped =
          (messageKey && messages[locale]?.[messageKey]) ||
          getMessage("genericError");
        setAlert("error", mapped);
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = defaultButtonLabel || "Join";
      }
    }
  });

  resetAlert();
})();
