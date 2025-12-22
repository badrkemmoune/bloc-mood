"use strict";

const yearElement = document.getElementById("year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

const nav = document.getElementById("navLinks");
const menuButton = document.querySelector(".menu-toggle");
let menuOpen = false;

function setMenuState(open) {
  if (!nav || !menuButton) return;
  menuOpen = open;
  nav.classList.toggle("open", open);
  menuButton.setAttribute("aria-expanded", open ? "true" : "false");
  menuButton.setAttribute("aria-controls", "navLinks");
  document.body.classList.toggle("no-scroll", open);
}

window.toggleMenu = function toggleMenu() {
  setMenuState(!menuOpen);
};

if (nav && menuButton) {
  setMenuState(false);

  nav.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.tagName === "A") {
      setMenuState(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuOpen) {
      setMenuState(false);
    }
  });

  const handleMenuBlur = (event) => {
    if (!menuOpen) return;
    const next = event.relatedTarget;
    if (!next || (!nav.contains(next) && next !== menuButton)) {
      setMenuState(false);
    }
  };

  nav.addEventListener("focusout", handleMenuBlur);
  menuButton.addEventListener("focusout", handleMenuBlur);
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
