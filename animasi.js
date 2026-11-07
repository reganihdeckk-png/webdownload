(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealTargets = document.querySelectorAll(".workspace, .bottom-grid, .footer");

  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.08 },
    );

    revealTargets.forEach((element, index) => {
      element.classList.add("reveal-ready");
      element.style.transitionDelay = `${Math.min(index * 70, 140)}ms`;
      observer.observe(element);
    });
  }

  const orbs = document.querySelectorAll(".ambient");
  let pointerX = 0;
  let pointerY = 0;
  let frameRequested = false;

  function moveOrbs() {
    orbs.forEach((orb, index) => {
      const depth = (index + 1) * 0.012;
      orb.style.transform = `translate3d(${pointerX * depth}px, ${pointerY * depth}px, 0)`;
    });
    frameRequested = false;
  }

  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    document.addEventListener(
      "pointermove",
      (event) => {
        pointerX = event.clientX - window.innerWidth / 2;
        pointerY = event.clientY - window.innerHeight / 2;
        if (frameRequested) return;
        frameRequested = true;
        window.requestAnimationFrame(moveOrbs);
      },
      { passive: true },
    );
  }
})();