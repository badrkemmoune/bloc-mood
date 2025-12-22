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
  const honeypotInput = document.getElementById("newsletter-website");
  const messageEl = document.getElementById("newsletter-message");
  const alertEl = document.getElementById("newsletter-alert");

  const locales = {
    en: {
      sending: "Sending...",
      success: "Welcome to the bloc, you're in ✌️",
      invalidEmail: "Please enter a valid email address.",
      tempDomain: "Temporary email domains are not allowed.",
      botDetected: "Action blocked. Please try again.",
      defaultError: "Something went wrong. Please try again.",
      networkError: "Connection error. Please try again in a moment.",
      clientError: "Unable to process request. Please try again later.",
      serverError: "Server error. Please retry in a moment.",
      rateLimited: "Too many attempts. Please slow down and try again.",
    },
    fr: {
      sending: "Envoi en cours...",
      success: "Bienvenue dans le bloc, tu es inscrit ✌️",
      invalidEmail: "Merci d'entrer une adresse email valide.",
      tempDomain: "Les emails temporaires ne sont pas autorisés.",
      botDetected: "Action bloquée. Réessaie dans un instant.",
      defaultError: "Une erreur est survenue. Réessaie plus tard.",
      networkError: "Erreur de connexion. Réessaie dans un instant.",
      clientError: "Requête invalide. Réessaie plus tard.",
      serverError: "Erreur serveur. Réessaie dans un instant.",
      rateLimited: "Trop de tentatives. Réessaie dans un moment.",
    },
  };

  const getLocaleStrings = () => {
    const lang = document.documentElement.lang || "en";
    return locales[lang] || locales.en;
  };

  const tempEmailDomains = [
    "mailinator.com",
    "tempmail.com",
    "10minutemail.com",
    "guerrillamail.com",
    "yopmail.com",
  ];

  function showAlert(message, type = "neutral") {
    if (!alertEl) return;
    alertEl.textContent = message;
    alertEl.dataset.type = type;
    alertEl.hidden = false;
  }

  function clearAlert() {
    if (alertEl) {
      alertEl.textContent = "";
      alertEl.hidden = true;
      alertEl.dataset.type = "";
    }
  }

  if (!form || !emailInput || !messageEl) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();

    const {
      sending,
      success,
      invalidEmail,
      tempDomain,
      botDetected,
      defaultError,
      networkError,
      clientError,
      serverError,
      rateLimited,
    } = getLocaleStrings();

    clearAlert();
    if (!email) return;

    const emailPattern =
      /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/i;
    if (!emailPattern.test(email)) {
      showAlert(invalidEmail, "error");
      return;
    }

    const domain = email.split("@")[1]?.toLowerCase();
    if (domain && tempEmailDomains.includes(domain)) {
      showAlert(tempDomain, "error");
      return;
    }

    if (honeypotInput && honeypotInput.value) {
      showAlert(botDetected, "error");
      return;
    }

    messageEl.textContent = sending;

    fetch("/api/subscribe", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email }),
    })
      .then((res) =>
        res
          .json()
          .catch(() => ({}))
          .then((data) => ({ res, data }))
      )
      .then(({ res, data }) => {
        if (res.ok && data.success) {
          messageEl.textContent = success;
          showAlert(success, "success");
          emailInput.value = "";
          if (honeypotInput) {
            honeypotInput.value = "";
          }
          return;
        }

        if (res.status === 429) {
          showAlert(rateLimited, "error");
        } else if (res.status >= 400 && res.status < 500) {
          showAlert(data.message || clientError, "error");
        } else if (res.status >= 500) {
          showAlert(serverError, "error");
        } else {
          showAlert(data.message || defaultError, "error");
        }

        messageEl.textContent = data.message || defaultError;
      })
      .catch(() => {
        showAlert(networkError, "error");
        messageEl.textContent = networkError;
      });
  });
})();
