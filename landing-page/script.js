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


// Expand/collapse studio information without taking visitors away from the quick links.
const discoverToggle = document.querySelector('.discover-toggle');
const discoverPanel = document.querySelector('#discover-panel');
if (discoverToggle && discoverPanel) {
  discoverToggle.addEventListener('click', () => {
    const expanded = discoverToggle.getAttribute('aria-expanded') === 'true';
    discoverToggle.setAttribute('aria-expanded', String(!expanded));
    discoverPanel.hidden = expanded;
    const symbol = discoverToggle.querySelector('.toggle-symbol');
    if (symbol) symbol.textContent = expanded ? '＋' : '−';
    discoverToggle.firstChild.textContent = expanded ? 'Get to know us ' : 'Hide studio details ';
  });
}
