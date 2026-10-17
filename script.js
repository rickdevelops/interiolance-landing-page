'use strict';

// Keep the landing page visually static like the published Canva design while
// providing a small, accessible tap interaction for touchscreen visitors.
document.querySelectorAll('.pill').forEach((link) => {
  link.addEventListener('pointerdown', () => link.classList.add('is-pressed'));
  const clearPressed = () => link.classList.remove('is-pressed');
  link.addEventListener('pointerup', clearPressed);
  link.addEventListener('pointercancel', clearPressed);
  link.addEventListener('pointerleave', clearPressed);
});
