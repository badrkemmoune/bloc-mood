"use strict";

const yearElement = document.getElementById("year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

const navLinks = document.getElementById("navLinks");
const menuToggleButton = document.querySelector(".menu-toggle");
const navContainer = document.querySelector(".nav");
const MOBILE_NAV_BREAKPOINT = 900;

function setMenuState(isOpen) {
  if (!navLinks || !menuToggleButton) return;
  navLinks.classList.toggle("open", isOpen);
  menuToggleButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
  document.body.classList.toggle("no-scroll", isOpen);
}

window.toggleMenu = function toggleMenu(forceState) {
  if (!navLinks) return;
  const shouldOpen =
    typeof forceState === "boolean"
      ? forceState
      : !navLinks.classList.contains("open");
  setMenuState(shouldOpen);
};

function handleMenuBlur() {
  if (!navContainer || !navLinks || !navLinks.classList.contains("open")) {
    return;
  }
  setTimeout(() => {
    const active = document.activeElement;
    if (!navContainer.contains(active)) {
      setMenuState(false);
    }
  }, 0);
}

if (menuToggleButton && navLinks) {
  menuToggleButton.setAttribute("aria-controls", "navLinks");
  menuToggleButton.addEventListener("click", () => toggleMenu());
  menuToggleButton.addEventListener("blur", handleMenuBlur);

  navLinks.addEventListener("focusout", handleMenuBlur);
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuState(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navLinks.classList.contains("open")) {
      setMenuState(false);
      menuToggleButton.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (
      window.innerWidth > MOBILE_NAV_BREAKPOINT &&
      (navLinks.classList.contains("open") ||
        document.body.classList.contains("no-scroll"))
    ) {
      setMenuState(false);
    }
  });
}

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
  const messageEl = document.getElementById("newsletter-message");

  if (!form || !emailInput || !messageEl) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    if (!email) return;

    messageEl.textContent = "Sending...";

    fetch("subscribe.php", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ email }),
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data.success) {
          messageEl.textContent = "Welcome to the bloc, you're in ✌️";
          emailInput.value = "";
        } else {
          messageEl.textContent =
            data.message || "Something went wrong. Please try again.";
        }
      })
      .catch(() => {
        messageEl.textContent = "Connection error. Please try again in a moment.";
      });
  });
})();
