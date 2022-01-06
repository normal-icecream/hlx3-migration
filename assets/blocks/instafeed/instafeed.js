/* eslint-disable import/no-cycle */
/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */
import {
  createEl,
  buildGScriptLink,
  buildGQs,
} from '../../scripts/scripts.js';

import {
  buildMedia,
  fetchCarousel,
} from '../index/index.js';

import {
  getAuthToken,
  removeAuthToken,
} from '../../utils/admin/admin.js';

import {
  buildScreensaver,
  makeScreensaverError,
  removeScreensaver,
} from '../../utils/screensaver/screensaver.js';

const INSTAFEED_ID = 'AKfycbz7IGXP3CWKxfZ6hZbhv3Z-ttJHpKj5IXwW1ZuIpeSXlNgQXzKgYpDuzG5j3UNH9ahAWg';

async function addToCarousel(btn) {
  buildScreensaver('adding image to carousel...');
  const token = getAuthToken();
  const url = buildGScriptLink(INSTAFEED_ID);
  const qs = buildGQs({
    token,
    type: 'add',
    id: btn.getAttribute('data-id'),
    media_type: btn.getAttribute('data-type'),
    caption: btn.getAttribute('data-caption'),
    link_id: btn.getAttribute('data-link_id'),
    source: btn.getAttribute('data-source'),
  });
  const resp = await fetch(`${url}?${qs}`, { method: 'POST' });
  if (resp.ok) {
    const json = await resp.json();
    if (json['error-text']) {
      // eslint-disable-next-line no-console
      console.error(json);
      makeScreensaverError(`${json['error-text']}. login to continue!`);
      removeAuthToken();
    } else if (json.result === 'success') {
      btn.removeEventListener('click', addToCarouselClick);
      btn.classList.add('instafeed-added');
      btn.classList.remove('instafeed-add');
      removeScreensaver();
      return true;
    }
  }
  return false;
}

async function addToCarouselClick(e) {
  e.preventDefault();
  const btn = e.target.closest('button');
  const res = await addToCarousel(btn);
  if (res) {
    await refreshCarousel();
  } else {
    makeScreensaverError('something went wrong. try again?');
  }
}

async function fetchFeed(cursor) {
  const token = getAuthToken();
  if (!cursor && window.instafeed && token) { // no cursor, something in feed, has token
    return window.instafeed;
  }
  const url = buildGScriptLink(INSTAFEED_ID);
  const params = { token };
  if (cursor) { params.cursor = cursor; }
  const qs = buildGQs(params);
  const resp = await fetch(`${url}?${qs}`);
  if (resp.ok) {
    const json = await resp.json();
    if (json['error-text']) {
      // eslint-disable-next-line no-console
      console.error(json);
      removeAuthToken();
      makeScreensaverError(`${json['error-text']}. login to continue!`);
      return false;
    }
    // something in feed already, received good json data, has cursor
    if (window.instafeed && window.instafeed.data && window.instafeed.paging
      && json.data && json.paging && cursor) {
      // add new data to existing data
      json.data.forEach((d) => {
        window.instafeed.data.push(d);
      });
      // replace paging
      window.instafeed.paging = json.paging;
      return json; // has cursor, only return new
    }
    // nothing in feed, no cursor
    window.instafeed = json;
    return window.instafeed; // return everything
  }
  makeScreensaverError('something went wrong. try again?');
  return false;
}

async function refreshCarousel() {
  const carousel = document.querySelector('.instafeed .instafeed-carousel');
  if (carousel) {
    carousel.innerHTML = '';
    await populateCarousel(carousel);
  }
}

async function reorderCarousel(btn) {
  const form = btn.parentNode;
  const input = form.querySelector('input');
  const orig = input.getAttribute('data-orig');
  const val = input.value;
  if (val !== orig) { // order has changed
    buildScreensaver('reordering carousel slides...');
    const id = btn.getAttribute('data-id');
    const token = getAuthToken();
    const url = buildGScriptLink(INSTAFEED_ID);
    const qs = buildGQs({
      token,
      type: 'order',
      id,
      order: val,
    });
    const resp = await fetch(`${url}?${qs}`, { method: 'POST' });
    if (resp.ok) {
      const json = await resp.json();
      if (json['error-text']) {
        // eslint-disable-next-line no-console
        console.error(json);
        makeScreensaverError(`${json['error-text']}. login to continue!`);
        removeAuthToken();
      } else if (json.result === 'success') {
        return true;
      }
    }
  }
  return false;
}

async function removeFromCarousel(btn) {
  buildScreensaver('removing slide from carousel...');
  const id = btn.getAttribute('data-id');
  const token = getAuthToken();
  const url = buildGScriptLink(INSTAFEED_ID);
  const qs = buildGQs({
    token,
    type: 'remove',
    id,
  });
  const resp = await fetch(`${url}?${qs}`, { method: 'POST' });
  if (resp.ok) {
    const json = await resp.json();
    if (json['error-text']) {
      // eslint-disable-next-line no-console
      console.error(json);
      makeScreensaverError(`${json['error-text']}. login to continue!`);
      removeAuthToken();
    } else if (json.result === 'success') {
      return true;
    }
  }
  return false;
}

function buildCarouselForm(data) {
  const form = createEl('form', {
    class: 'instafeed-form',
  });
  const input = createEl('input', {
    type: 'number',
    value: data.order,
    'data-orig': data.order,
    min: 1,
  });
  const reorderBtn = createEl('button', {
    class: 'instafeed-form-reorder',
    'data-id': data.id,
    title: 'reorder carousel slide',
    html: '<span>⟳</span>',
  });
  reorderBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const res = await reorderCarousel(e.target.closest('button'));
    if (res) {
      await refreshCarousel();
    } else {
      makeScreensaverError('something went wrong. try again?');
    }
  });
  const removeBtn = createEl('button', {
    class: 'instafeed-form-remove',
    'data-id': data.id,
    title: 'remove carousel slide',
    html: '<span>✕</span>',
  });
  removeBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const res = await removeFromCarousel(e.target.closest('button'));
    if (res) {
      await refreshCarousel();
    } else {
      makeScreensaverError('something went wrong. try again?');
    }
  });
  form.append(input, reorderBtn, removeBtn);
  return form;
}

function buildFigure(fig, caption) {
  const figure = createEl('figure', {
    class: 'instafeed-figure',
  });
  const figcaption = createEl('figcaption');
  figcaption.append(caption);
  figure.append(fig, figcaption);
  return figure;
}

async function addToFeed(btn) {
  btn.remove();
  await populateFeed(window.instafeed.paging.cursors.after);
}

function buildLoadBtn() {
  // window.instafeed.paging.cursors.after
  const loadBtn = createEl('button', {
    class: 'btn btn-rect btn-fixed instafeed-load',
    text: 'load more posts',
  });
  loadBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await addToFeed(e.target);
  });
  return loadBtn;
}

async function populateFeed(cursor) {
  const wrapper = document.querySelector('.instafeed .instafeed-feed');
  if (!wrapper.hasChildNodes() || cursor) { // wrapper is empty OR cursor
    buildScreensaver('populating feed...');
    let feed;
    if (cursor) {
      feed = await fetchFeed(cursor);
    } else {
      feed = await fetchFeed(cursor);
    }
    if (feed) {
      const idsInCarousel = window.carousel.map((c) => c.id);
      feed.data.forEach((f) => {
        const cap = f.caption.split('\n')[0].trim();
        // for figure
        const media = buildMedia({ type: f.media_type, source: f.media_url, caption: cap }, 'instafeed');
        const mediaWrapper = createEl('a', {
          href: f.permalink,
          target: '_blank',
        });
        mediaWrapper.append(media);
        // for caption
        const caption = createEl('p', {
          class: 'instafeed-caption',
          text: cap,
        });
        const btn = createEl('button', {
          class: 'btn btn-rect btn-fixed instafeed-add',
          'data-id': f.id,
          'data-type': f.media_type,
          'data-caption': cap,
          'data-link_id': new URL(f.permalink).pathname,
          'data-source': f.media_url,
        });
        if (idsInCarousel.includes(f.id)) {
          btn.classList.add('instafeed-added');
          btn.classList.remove('instafeed-add');
        } else {
          btn.addEventListener('click', addToCarouselClick);
        }
        const captionWrapper = createEl('div');
        captionWrapper.append(caption, btn);
        const figure = buildFigure(mediaWrapper, captionWrapper);
        wrapper.append(figure);
      });
      const loadBtn = buildLoadBtn();
      wrapper.append(loadBtn);
      removeScreensaver();
    }
  }
}

async function populateCarousel(wrapper) {
  const carousel = await fetchCarousel();
  carousel.forEach((c) => {
    const media = buildMedia(c, 'instafeed');
    const form = buildCarouselForm(c);
    const figure = buildFigure(media, form);
    wrapper.append(figure);
  });
  removeScreensaver();
}

function toggleActiveMenu(target) {
  const active = document.querySelector('a.instafeed-active');
  const activeWrapper = document
    .querySelector(`div[data-type="${active.getAttribute('data-type')}"]`);
  const targetWrapper = document
    .querySelector(`div[data-type="${target.getAttribute('data-type')}"]`);
  active.classList.remove('instafeed-active');
  activeWrapper.classList.remove('instafeed-active');
  target.classList.add('instafeed-active');
  targetWrapper.classList.add('instafeed-active');
}

function setupMenu(block) {
  const btnWrapper = createEl('div', {
    class: 'btn-wrapper instafeed-btn-wrapper',
  });
  const addBtn = createEl('a', {
    class: 'btn instafeed-btn instafeed-add-btn',
    'data-type': 'feed',
    text: 'add to carousel',
  });
  addBtn.addEventListener('click', async (e) => {
    await populateFeed();
    toggleActiveMenu(e.target);
  });
  const editBtn = createEl('a', {
    class: 'btn instafeed-btn instafeed-edit-btn instafeed-active',
    'data-type': 'carousel',
    text: 'edit carousel',
  });
  editBtn.addEventListener('click', (e) => {
    toggleActiveMenu(e.target);
  });
  btnWrapper.append(addBtn, editBtn);
  block.prepend(btnWrapper);
}

export default async function decorateInstafeed(block) {
  setupMenu(block);
  const carouselWrapper = createEl('div', {
    class: 'instafeed-carousel instafeed-active',
    'data-type': 'carousel',
  });
  await populateCarousel(carouselWrapper);
  const feedWrapper = createEl('div', {
    class: 'instafeed-feed',
    'data-type': 'feed',
  });
  block.append(carouselWrapper, feedWrapper);
}
