const header = document.getElementById("siteHeader");
const navToggle = document.getElementById("navToggle");
const siteNav = document.getElementById("siteNav");
const navLinks = document.querySelectorAll("[data-scroll]");
const revealItems = document.querySelectorAll(".reveal");
const demoMedia = document.getElementById("demoMedia");
const demoVideo = document.querySelector("[data-demo-video]");
const demoIframe = document.querySelector("[data-demo-iframe]");
const demoPlayButton = document.getElementById("demoPlayButton");
const headerLoginLink = document.getElementById("landingHeaderLogin");
const heroAuthForm = document.getElementById("heroAuthForm");
const ctaAuthForm = document.getElementById("ctaAuthForm");
const heroGoogleLogin = document.getElementById("heroGoogleLogin");
const ctaGoogleLogin = document.getElementById("ctaGoogleLogin");
const LOCAL_API_BASE = "http://127.0.0.1:8000/api";
const runtimeApiBase = window.__APP_CONFIG__?.apiBase?.trim();
const isLocalStaticPreview = ["127.0.0.1:5500", "localhost:5500"].includes(window.location.host);
const API_BASE = runtimeApiBase || (isLocalStaticPreview ? LOCAL_API_BASE : `${window.location.origin}/api`);
let isAuthRedirectPending = false;

function syncHeaderState() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

function setNavOpen(isOpen) {
  if (!navToggle || !siteNav) return;

  navToggle.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  siteNav.classList.toggle("is-open", isOpen);
}

function handleSmoothScroll(event) {
  const trigger = event.currentTarget;
  const href = trigger.getAttribute("href");

  if (!href || !href.startsWith("#")) {
    return;
  }

  const target = document.querySelector(href);
  if (!target) {
    return;
  }

  event.preventDefault();

  const headerOffset = header ? header.offsetHeight + 12 : 0;
  const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;

  window.scrollTo({
    top: Math.max(targetTop, 0),
    behavior: "smooth",
  });

  setNavOpen(false);
}

function setupRevealObserver() {
  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.18,
    rootMargin: "0px 0px -60px 0px",
  });

  revealItems.forEach((item) => observer.observe(item));
}

function markDemoFallback() {
  if (!demoMedia) return;

  demoMedia.classList.add("is-fallback");
  demoMedia.classList.remove("has-video");
}

function markDemoReady() {
  if (!demoMedia) return;

  demoMedia.classList.remove("is-fallback");
  demoMedia.classList.add("has-video");
}

function flashDemoPlaceholder() {
  if (!demoMedia) return;

  demoMedia.classList.remove("is-flashing");
  void demoMedia.offsetWidth;
  demoMedia.classList.add("is-flashing");
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  let payload = null;

  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    const detail = payload?.detail || "Авторизацияны бастау мүмкін болмады.";
    throw new Error(detail);
  }

  return payload;
}

function getFormEmailHint(form) {
  const emailInput = form?.querySelector('input[name="email"]');
  return emailInput?.value.trim() || "";
}

function openLandingAuthPage() {
  const authUrl = new URL("index.html", window.location.href);
  authUrl.searchParams.set("auth", "open");
  window.location.href = authUrl.toString();
}

function openLandingAppPage() {
  const appUrl = new URL("index.html", window.location.href);
  window.location.href = appUrl.toString();
}

function getLandingReturnUrl() {
  const returnUrl = new URL(window.location.href);
  returnUrl.search = "";
  returnUrl.hash = "";
  return returnUrl.toString();
}

function handleLandingDriveReturn() {
  const params = new URLSearchParams(window.location.search);
  const driveStatus = params.get("drive");
  const message = params.get("message");

  if (!driveStatus && !message) {
    return;
  }

  const cleanUrl = `${window.location.pathname}${window.location.hash || ""}`;
  window.history.replaceState({}, "", cleanUrl);

  if (driveStatus === "connected") {
    openLandingAppPage();
    return;
  }

  if (driveStatus === "error") {
    window.alert(message || "Google авторизациясын аяқтау мүмкін болмады.");
  }
}

async function connectGoogleDriveFromLanding(loginHint = "") {
  if (isAuthRedirectPending) {
    return;
  }

  isAuthRedirectPending = true;

  try {
    const requestUrl = new URL(`${API_BASE}/users/drive/connect/`);
    requestUrl.searchParams.set("return_to", getLandingReturnUrl());
    if (loginHint) {
      requestUrl.searchParams.set("login_hint", loginHint);
      requestUrl.searchParams.set("expected_email", loginHint);
    }

    const payload = await fetchJSON(requestUrl.toString(), {
      credentials: "include",
    });

    if (!payload?.authorization_url) {
      throw new Error("Google авторизация сілтемесі табылмады.");
    }

    window.location.href = payload.authorization_url;
  } catch (error) {
    isAuthRedirectPending = false;
    window.alert(error.message || "Google авторизациясын ашу мүмкін болмады.");
  }
}

function handleAuthLinkClick(event) {
  event.preventDefault();
  openLandingAuthPage();
}

function handleAuthFormSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  if (typeof form.reportValidity === "function" && !form.reportValidity()) {
    return;
  }

  const loginHint = getFormEmailHint(form);
  if (!loginHint) {
    openLandingAuthPage();
    return;
  }

  if (isAuthRedirectPending) {
    return;
  }

  isAuthRedirectPending = true;

  fetchJSON(`${API_BASE}/users/drive/status/`, {
    credentials: "include",
  }).then((status) => {
    const activeEmail = String(status?.google_email || "").trim().toLowerCase();
    const enteredEmail = loginHint.toLowerCase();

    if (status?.connected && activeEmail && activeEmail !== enteredEmail) {
      throw new Error("Кіре алмайсыз: жүйеде басқа Google аккаунт байланып тұр.");
    }

    isAuthRedirectPending = false;
    return connectGoogleDriveFromLanding(loginHint);
  }).catch((error) => {
    isAuthRedirectPending = false;
    window.alert(error.message || "Бұл email арқылы бірден кіру мүмкін болмады.");
  });
}

function setupDemoVideo() {
  if (demoIframe) {
    if (demoPlayButton) {
      demoPlayButton.addEventListener("click", () => {
        if (demoMedia?.classList.contains("has-video")) {
          return;
        }

        const src = demoIframe.dataset.src;
        if (src && demoIframe.getAttribute("src") !== src) {
          demoIframe.setAttribute("src", src);
        }

        markDemoReady();
      });
    }

    return;
  }

  if (!demoVideo) return;

  const handleReady = () => markDemoReady();
  const handleError = () => markDemoFallback();

  demoVideo.addEventListener("canplay", handleReady);
  demoVideo.addEventListener("loadeddata", handleReady);
  demoVideo.addEventListener("error", handleError);

  const source = demoVideo.querySelector("source");
  if (source) {
    source.addEventListener("error", handleError);
  }

  demoVideo.load();

  if (demoPlayButton) {
    demoPlayButton.addEventListener("click", async () => {
      if (demoMedia?.classList.contains("has-video")) {
        try {
          await demoVideo.play();
        } catch (_error) {
          demoVideo.controls = true;
        }
        return;
      }

      flashDemoPlaceholder();
    });
  }
}

function setupInteractions() {
  syncHeaderState();
  window.addEventListener("scroll", syncHeaderState, { passive: true });

  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const nextState = navToggle.getAttribute("aria-expanded") !== "true";
      setNavOpen(nextState);
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", handleSmoothScroll);
  });

  document.addEventListener("click", (event) => {
    if (!siteNav || !navToggle) return;
    if (siteNav.contains(event.target) || navToggle.contains(event.target)) return;
    setNavOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setNavOpen(false);
    }
  });

  [headerLoginLink, heroGoogleLogin, ctaGoogleLogin].forEach((link) => {
    link?.addEventListener("click", handleAuthLinkClick);
  });

  [heroAuthForm, ctaAuthForm].forEach((form) => {
    form?.addEventListener("submit", handleAuthFormSubmit);
  });
}

setupInteractions();
setupRevealObserver();
setupDemoVideo();
handleLandingDriveReturn();
