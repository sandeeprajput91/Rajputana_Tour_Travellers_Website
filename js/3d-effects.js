/**
 * Rajputana Tour & Travellers - 3D Interactive Engine & Cinematic Animation Controller
 * Implements smooth 60fps 3D mouse parallax tilt, specular holographic glare,
 * scroll-triggered 3D reveals, floating depth layers, and tactile 3D interactions.
 */

(function () {
  "use strict";

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function init3DEffects() {
    if (prefersReducedMotion) return;

    setupCard3DTilt();
    setupHero3DParallax();
    setupScroll3DReveal();
    setup3DButtons();
    setupFloatingBadges();
  }

  /**
   * 1. 3D Card Hover & Tilt Engine
   * Dynamically tracks cursor coordinates and applies real 3D perspective transforms & glare.
   */
  function setupCard3DTilt() {
    const cardSelectors = [
      ".vehicle-card",
      ".tour-card",
      ".chauffeur-3d-card",
      ".feature-pill",
      ".portal-card"
    ];

    const cards = document.querySelectorAll(cardSelectors.join(", "));

    cards.forEach(card => {
      // Add 3D perspective class
      card.classList.add("card-3d-wrap");

      // Inject dynamic specular glare element if not present
      let glare = card.querySelector(".card-3d-glare");
      if (!glare) {
        glare = document.createElement("div");
        glare.className = "card-3d-glare";
        card.appendChild(glare);
      }

      let isHovering = false;
      let rafId = null;

      function onMouseMove(e) {
        if (!isHovering) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate rotation angles (max tilt ~10 degrees)
        const rotateX = ((centerY - y) / centerY) * 9;
        const rotateY = ((x - centerX) / centerX) * 9;

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(12px) scale3d(1.015, 1.015, 1.015)`;
          
          // Position the light reflection glare
          const glareX = (x / rect.width) * 100;
          const glareY = (y / rect.height) * 100;
          glare.style.opacity = "1";
          glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 65%)`;
        });
      }

      function onMouseEnter() {
        isHovering = true;
        card.style.transition = "transform 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.25s ease";
      }

      function onMouseLeave() {
        isHovering = false;
        if (rafId) cancelAnimationFrame(rafId);
        card.style.transition = "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s ease";
        card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)";
        glare.style.opacity = "0";
      }

      card.addEventListener("mouseenter", onMouseEnter);
      card.addEventListener("mousemove", onMouseMove);
      card.addEventListener("mouseleave", onMouseLeave);
    });
  }

  /**
   * 2. Hero Section 3D Mouse Parallax
   * Multi-layered depth shifts on cursor movement
   */
  function setupHero3DParallax() {
    const heroSection = document.querySelector(".hero-section");
    const heroCalc = document.querySelector(".hero-calc-col");
    const heroContent = document.querySelector(".hero-content-col");

    if (!heroSection || !heroCalc) return;

    let rafHero = null;

    heroSection.addEventListener("mousemove", (e) => {
      const rect = heroSection.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;

      if (rafHero) cancelAnimationFrame(rafHero);
      rafHero = requestAnimationFrame(() => {
        if (heroCalc) {
          heroCalc.style.transform = `translate3d(${(-relX * 6).toFixed(2)}px, ${(-relY * 4).toFixed(2)}px, 0)`;
        }
        if (heroContent) {
          heroContent.style.transform = `perspective(1200px) translate3d(${(-relX * 12).toFixed(2)}px, ${(-relY * 8).toFixed(2)}px, 0)`;
        }
      });
    });

    heroSection.addEventListener("mouseleave", () => {
      if (rafHero) cancelAnimationFrame(rafHero);
      if (heroCalc) {
        heroCalc.style.transition = "transform 0.4s ease";
        heroCalc.style.transform = "translate3d(0, 0, 0)";
        setTimeout(() => heroCalc.style.transition = "", 400);
      }
      if (heroContent) {
        heroContent.style.transition = "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)";
        heroContent.style.transform = "perspective(1200px) translate3d(0, 0, 0)";
        setTimeout(() => heroContent.style.transition = "", 600);
      }
    });
  }

  /**
   * 3. Scroll-triggered 3D Entrance Reveal
   */
  function setupScroll3DReveal() {
    const elementsToReveal = document.querySelectorAll(
      ".section-head, .vehicle-card, .tour-card, .feature-pill, .chauffeur-3d-card, .features-grid"
    );

    elementsToReveal.forEach(el => {
      el.classList.add("reveal-3d-item");
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view-3d");
            // Unobserve after entrance
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.15,
        rootMargin: "0px 0px -40px 0px"
      });

      elementsToReveal.forEach(el => observer.observe(el));
    } else {
      // Fallback
      elementsToReveal.forEach(el => el.classList.add("in-view-3d"));
    }
  }

  /**
   * 4. 3D Tactile Buttons
   */
  function setup3DButtons() {
    const buttons = document.querySelectorAll(".btn");
    buttons.forEach(btn => {
      btn.addEventListener("mousedown", () => {
        btn.style.transform = "translateY(2px) scale(0.98)";
      });
      btn.addEventListener("mouseup", () => {
        btn.style.transform = "";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "";
      });
    });
  }

  /**
   * 5. Smooth Floating 3D Floating Badges
   */
  function setupFloatingBadges() {
    const floatingBadges = document.querySelectorAll(".tour-duration-tag, .vehicle-badge-pill, .vehicle-rate-pill");
    floatingBadges.forEach((badge, idx) => {
      badge.style.animation = `floatingBadge 3.5s ease-in-out ${idx * 0.4}s infinite alternate`;
    });
  }

  // Auto-init on DOM Ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init3DEffects);
  } else {
    init3DEffects();
  }

  // Re-run card tilt when dynamic content renders (tours or fleet)
  window.refresh3DTilt = () => {
    setTimeout(setupCard3DTilt, 150);
  };

})();
