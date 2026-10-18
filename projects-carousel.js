(function () {
  'use strict';

  const config = window.INTERIOLANCE_SUPABASE || {};
  const isConfigured = Boolean(config.url && config.anonKey);
  const bucket = config.bucket || 'project-images';
  const table = config.table || 'projects';

  // These are clearly marked inspiration placeholders, never represented as completed client work.
  const sampleProjects = [
    { id: 'sample-1', title: 'A warm, considered living room', category: 'Living spaces', description: 'A sample inspiration image. Replace it with a verified completed project.', image_url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1100&q=85', image_alt: 'Warm contemporary living room with layered textures', is_sample: true },
    { id: 'sample-2', title: 'A softer place to unwind', category: 'Bedrooms', description: 'A sample inspiration image. Replace it with a verified completed project.', image_url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1100&q=85', image_alt: 'Serene bedroom with soft neutral tones', is_sample: true },
    { id: 'sample-3', title: 'A table set for togetherness', category: 'Dining spaces', description: 'A sample inspiration image. Replace it with a verified completed project.', image_url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1100&q=85', image_alt: 'Dining and lounge interior with warm finishes', is_sample: true },
    { id: 'sample-4', title: 'The finishing layer', category: 'Styling & details', description: 'A sample inspiration image. Replace it with a verified completed project.', image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1100&q=85', image_alt: 'Styled neutral interior with plants and accessories', is_sample: true },
    { id: 'sample-5', title: 'Easy, open-plan living', category: 'Full-home interiors', description: 'A sample inspiration image. Replace it with a verified completed project.', image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1100&q=85', image_alt: 'Open-plan living room with natural materials', is_sample: true },
    { id: 'sample-6', title: 'A calmer everyday rhythm', category: 'Room design', description: 'A sample inspiration image. Replace it with a verified completed project.', image_url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1100&q=85', image_alt: 'Contemporary home interior with natural light', is_sample: true },
    { id: 'sample-7', title: 'Natural textures, quiet contrast', category: 'Material palette', description: 'A sample inspiration image. Replace it with a verified completed project.', image_url: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1100&q=85', image_alt: 'Modern interior with natural finishes and a neutral palette', is_sample: true },
    { id: 'sample-8', title: 'Small details, a personal feel', category: 'Styling & details', description: 'A sample inspiration image. Replace it with a verified completed project.', image_url: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1100&q=85', image_alt: 'Calm, carefully styled interior detail', is_sample: true }
  ];

  function apiHeaders() {
    return { apikey: config.anonKey, Authorization: 'Bearer ' + config.anonKey };
  }

  async function loadProjects() {
    if (!isConfigured) return { projects: sampleProjects, isSample: true, error: false };
    try {
      const endpoint = config.url.replace(/\/$/, '') + '/rest/v1/' + encodeURIComponent(table) + '?select=id,title,category,description,image_url,image_alt,created_at,is_published&is_published=eq.true&order=created_at.desc&limit=10';
      const response = await fetch(endpoint, { headers: apiHeaders() });
      if (!response.ok) throw new Error('Portfolio request failed (' + response.status + ').');
      const rows = await response.json();
      if (!Array.isArray(rows) || rows.length === 0) return { projects: sampleProjects, isSample: true, error: false };
      return { projects: rows.slice(0, 10), isSample: false, error: false };
    } catch (error) {
      console.warn('[INTERIOLANCE portfolio]', error);
      return { projects: sampleProjects, isSample: true, error: true };
    }
  }

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function renderCarousel(root, projects, status) {
    root.replaceChildren();
    root.setAttribute('role', 'region');
    root.setAttribute('aria-roledescription', 'carousel');
    const shell = make('div', 'portfolio-carousel');
    const viewport = make('div', 'portfolio-viewport');
    viewport.id = root.id || ('portfolio-' + Math.random().toString(36).slice(2, 8));
    viewport.setAttribute('tabindex', '0');
    viewport.setAttribute('aria-label', 'Project photographs. Scroll or use the previous and next buttons to explore.');
    const track = make('div', 'portfolio-track');
    track.setAttribute('role', 'list');

    projects.slice(0, 10).forEach((project, index) => {
      const card = make('article', 'portfolio-card');
      card.setAttribute('role', 'listitem');
      card.dataset.projectId = String(project.id || index);
      const media = make('div', 'portfolio-media');
      const image = make('img', 'portfolio-image');
      image.src = project.image_url || '';
      image.alt = project.image_alt || project.title || 'Interior design project';
      image.loading = index < 3 ? 'eager' : 'lazy';
      image.decoding = 'async';
      image.onerror = function () { media.classList.add('image-unavailable'); this.alt = 'Image unavailable'; };
      media.appendChild(image);
      if (status.isSample || project.is_sample) media.appendChild(make('span', 'portfolio-tag', 'Inspiration sample'));
      else media.appendChild(make('span', 'portfolio-tag', 'Latest work'));
      const content = make('div', 'portfolio-card-content');
      content.append(make('span', 'portfolio-category', project.category || 'Interior design'));
      content.append(make('h3', '', project.title || 'Untitled project'));
      content.append(make('p', '', project.description || 'A considered space, designed around everyday life.'));
      card.append(media, content);
      track.appendChild(card);
    });
    viewport.appendChild(track);

    const controls = make('div', 'portfolio-controls');
    const count = make('span', 'portfolio-count', 'Showing 1 of ' + String(projects.length));
    count.setAttribute('aria-live', 'polite');
    const pagination = make('div', 'portfolio-dots');
    pagination.setAttribute('aria-label', 'Choose a carousel position');
    const prev = make('button', 'portfolio-arrow portfolio-prev', '←');
    prev.type = 'button'; prev.setAttribute('aria-label', 'Previous projects');
    const next = make('button', 'portfolio-arrow portfolio-next', '→');
    next.type = 'button'; next.setAttribute('aria-label', 'Next projects');
    const arrows = make('div', 'portfolio-arrows');
    arrows.append(prev, next);
    controls.append(count, pagination, arrows);
    shell.append(viewport, controls);
    root.appendChild(shell);

    const cards = Array.from(track.children);
    let dots = [];
    let activeIndex = 0;
    let scrollFrame = 0;

    function cardLeft(index) {
      return Math.max(0, cards[index].offsetLeft - track.offsetLeft);
    }
    function maxScrollLeft() {
      return Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    }
    function maxStartIndex() {
      const maxLeft = maxScrollLeft();
      let nearest = 0;
      let nearestDistance = Infinity;
      cards.forEach((card, index) => {
        const distance = Math.abs(cardLeft(index) - maxLeft);
        if (distance < nearestDistance) { nearestDistance = distance; nearest = index; }
      });
      return nearest;
    }
    function lastVisibleIndex(startIndex) {
      const rightEdge = cardLeft(startIndex) + viewport.clientWidth - 8;
      let endIndex = startIndex;
      for (let i = startIndex + 1; i < cards.length; i += 1) {
        if (cardLeft(i) < rightEdge) endIndex = i;
      }
      return endIndex;
    }
    function scrollToCard(index) {
      const bounded = Math.max(0, Math.min(maxStartIndex(), index));
      viewport.scrollTo({ left: Math.min(maxScrollLeft(), cardLeft(bounded)), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      setActive(bounded);
    }
    function setActive(index) {
      activeIndex = Math.max(0, Math.min(maxStartIndex(), index));
      const endIndex = lastVisibleIndex(activeIndex);
      count.textContent = 'Showing ' + (activeIndex + 1) + '–' + (endIndex + 1) + ' of ' + cards.length;
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === activeIndex);
        if (i === activeIndex) dot.setAttribute('aria-current', 'true'); else dot.removeAttribute('aria-current');
      });
      prev.disabled = activeIndex <= 0;
      next.disabled = activeIndex >= maxStartIndex();
    }
    function refreshPagination() {
      const oldActive = activeIndex;
      pagination.replaceChildren();
      const limit = maxStartIndex();
      for (let index = 0; index <= limit; index += 1) {
        const dot = make('button', 'portfolio-dot');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Show carousel position ' + (index + 1));
        dot.addEventListener('click', () => scrollToCard(index));
        pagination.appendChild(dot);
      }
      dots = Array.from(pagination.children);
      setActive(Math.min(oldActive, limit));
    }
    function updateOnScroll() {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => {
        const currentLeft = viewport.scrollLeft;
        let nearest = 0;
        let distance = Infinity;
        cards.forEach((card, index) => {
          const nextDistance = Math.abs(cardLeft(index) - currentLeft);
          if (nextDistance < distance) { distance = nextDistance; nearest = index; }
        });
        setActive(nearest);
      });
    }
    prev.addEventListener('click', () => scrollToCard(activeIndex - 1));
    next.addEventListener('click', () => scrollToCard(activeIndex + 1));
    viewport.addEventListener('scroll', updateOnScroll, { passive: true });
    viewport.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); scrollToCard(activeIndex + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); scrollToCard(activeIndex - 1); }
    });
    window.addEventListener('resize', () => {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(refreshPagination);
    }, { passive: true });
    refreshPagination();
  }

  async function init() {
    const roots = Array.from(document.querySelectorAll('[data-project-carousel]'));
    if (!roots.length) return;
    roots.forEach(root => { root.setAttribute('aria-busy', 'true'); root.appendChild(make('p', 'portfolio-loading', 'Loading the latest spaces…')); });
    const status = await loadProjects();
    roots.forEach(root => {
      renderCarousel(root, status.projects, status);
      root.setAttribute('aria-busy', 'false');
      const note = document.querySelector('[data-portfolio-note][data-for="' + root.id + '"]');
      if (note) {
        note.hidden = !status.isSample;
        if (status.error) note.textContent = 'The live portfolio could not be reached. Sample inspiration images are shown for now; check the portfolio connection before publishing.';
      }
    });
  }

  window.INTERIOLANCE_PORTFOLIO = {
    loadProjects,
    renderCarousel,
    isConfigured,
    bucket,
    table,
    config
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
