'use strict';

// Navigation and the mobile menu.
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Мәзірді ашу');
  navigation.classList.remove('open');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Мәзірді жабу' : 'Мәзірді ашу');
  navigation.classList.toggle('open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('open')) {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.header')) closeMenu();
});
if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navigation.querySelectorAll('a').forEach(link => {
        const active = link.hash === '#' + (entry.target.id === 'author-videos' ? 'videos' : entry.target.id);
        link.classList.toggle('current', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, {rootMargin: '-20% 0px -65% 0px', threshold: 0});
  ['home', 'about', 'research', 'gallery', 'videos', 'author-videos', 'survey', 'project'].forEach(id => navObserver.observe(document.getElementById(id)));
}

// Accessible botanical tabs: arrow keys move the selection and focus together.
const botanyTabs = [...document.querySelectorAll('[data-botany]')];
function selectBotanyTab(tab) {
  botanyTabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  });
}
botanyTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectBotanyTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % botanyTabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + botanyTabs.length) % botanyTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = botanyTabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    selectBotanyTab(botanyTabs[next]);
    botanyTabs[next].focus();
  });
});

// All source photos remain in the HTML. JavaScript adds filtering and enlargement.
const photoItems = [...document.querySelectorAll('.gallery-item')];
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const galleryMore = document.getElementById('gallery-more');
const galleryCount = document.getElementById('gallery-count');
let activeFilter = 'all';
let expanded = false;
function matchingPhotos() {
  return photoItems.filter(item => activeFilter === 'all' || item.dataset.category === activeFilter);
}
function renderGallery() {
  const matches = matchingPhotos();
  const shown = expanded || activeFilter !== 'all' ? matches : matches.slice(0, 6);
  photoItems.forEach(item => { item.hidden = !shown.includes(item); });
  galleryMore.hidden = expanded || activeFilter !== 'all' || matches.length <= 6;
  galleryCount.textContent = shown.length === matches.length
    ? `${matches.length} фотоматериал көрсетілді`
    : `${matches.length} фотоматериалдың ${shown.length}-ы көрсетілді`;
  filterButtons.forEach(button => {
    const active = button.dataset.filter === activeFilter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}
filterButtons.forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  renderGallery();
}));
galleryMore.addEventListener('click', () => {
  expanded = true;
  renderGallery();
  photoItems[6]?.querySelector('button').focus({preventScroll:true});
});
renderGallery();

const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-image');
let lightboxItems = [];
let photoIndex = 0;
let lightboxOpener = null;
function displayPhoto(index) {
  photoIndex = (index + lightboxItems.length) % lightboxItems.length;
  const item = lightboxItems[photoIndex];
  lightboxImage.src = item.dataset.full;
  lightboxImage.alt = item.dataset.title;
  document.getElementById('lightbox-title').textContent = item.dataset.title;
  document.getElementById('lightbox-source').textContent = item.dataset.source;
  document.getElementById('lightbox-counter').textContent = `${photoIndex + 1} / ${lightboxItems.length}`;
  document.getElementById('photo-download').href = item.dataset.full;
}
photoItems.forEach(item => item.querySelector('button').addEventListener('click', event => {
  lightboxOpener = event.currentTarget;
  lightboxItems = matchingPhotos();
  displayPhoto(lightboxItems.indexOf(item));
  lightbox.showModal();
  document.body.classList.add('modal-open');
}));
document.getElementById('photo-prev').addEventListener('click', () => displayPhoto(photoIndex - 1));
document.getElementById('photo-next').addEventListener('click', () => displayPhoto(photoIndex + 1));
document.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
lightbox.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    displayPhoto(photoIndex + (event.key === 'ArrowLeft' ? -1 : 1));
  }
});
lightbox.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  lightboxOpener?.focus({preventScroll:true});
});

// Capture media events so original and newly added videos never play together.
document.addEventListener('play', event => {
  const video = event.target;
  if (video.tagName !== 'VIDEO') return;
  document.querySelectorAll('video').forEach(other => { if (other !== video) other.pause(); });
  video.closest('.video-stage')?.classList.add('playing');
}, true);
['pause', 'ended'].forEach(eventName => document.addEventListener(eventName, event => {
  if (event.target.tagName === 'VIDEO') event.target.closest('.video-stage')?.classList.remove('playing');
}, true));

// Open the source list before scrolling to an individual reference.
function revealSource(hash) {
  if (!hash.startsWith('#source-')) return;
  const target = document.querySelector(hash);
  if (!target) return;
  target.closest('details').open = true;
  requestAnimationFrame(() => target.scrollIntoView({block:'start'}));
}
document.querySelectorAll('a[href^="#source-"]').forEach(link => link.addEventListener('click', () => revealSource(link.hash)));
window.addEventListener('hashchange', () => revealSource(location.hash));
revealSource(location.hash);
