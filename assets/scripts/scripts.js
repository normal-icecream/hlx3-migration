/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * Builds an HTML DOM element.
 * @param {string} tag The type of element
 * @param {object} params Additional parameters for element
 * @returns {Element} The block element
 */
export function createEl(tag, params) {
  const el = document.createElement(tag);
  if (params) {
    Object.keys(params).forEach((param) => {
      if (param === 'html') {
        el.innerHTML = params[param];
      } else if (param === 'text') {
        el.textContent = params[param];
      } else {
        el.setAttribute(param, params[param]);
      }
    });
  }
  return el;
}

/**
 * Creates an SVG tag using the specified ID.
 * @param {string} name The ID
 * @returns {element} The SVG tag
 */
export function createSVG(name) {
  // eslint-disable-next-line no-param-reassign
  name = name.replace(/\s+/g, '-').toLowerCase();
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `/assets/icons/icons.svg#${name}`);
  svg.classList.add('icon', `icon-${name}`);
  svg.appendChild(use);
  return svg;
}

/**
 * Loads a CSS file.
 * @param {string} href The path to the CSS file
 */
export function loadCSS(href) {
  if (!document.querySelector(`head > link[href="${href}"]`)) {
    const link = createEl('link', {
      rel: 'stylesheet',
      href,
    });
    link.onload = () => {
    };
    link.onerror = () => {
    };
    document.head.appendChild(link);
  }
}

/**
 * loads a script by adding a script tag to the head.
 * @param {string} url URL of the js file
 * @param {Function} callback callback on load
 * @param {string} type type attribute of script tag
 * @returns {Element} script element
 */
export function loadScript(url, callback, type) {
  const head = document.querySelector('head');
  const props = { src: url };
  if (type) { props.type = type; }
  const script = createEl('script', props);
  head.append(script);
  script.onload = callback;
  return script;
}

/**
 * Retrieves the content of a metadata tag.
 * @param {string} name The metadata name (or property)
 * @returns {string} The metadata value
 */
export function getMetadata(name) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = document.head.querySelector(`meta[${attr}="${name}"]`);
  return meta && meta.content;
}

function getLastStore() {
  const last = localStorage.getItem('normal-lastVisited');
  return last || 'store'; // default
}

export function getCurrentStore() {
  const paths = window.location.pathname.split('/').filter((i) => i);
  if (paths.length) {
    const path = paths[paths.length - 1].replace(/-/g, ' ');
    const CONFIGURED_STORES = ['store', 'lab', 'shipping', 'pint club', 'merch', 'abnormal'];
    if (CONFIGURED_STORES.includes(path)) {
      return path;
    }
  }
  return getLastStore(); // default
}

function setLastStore() {
  const store = getCurrentStore();
  localStorage.setItem('normal-lastVisited', store);
}

/**
 * Adds one or more URLs to the dependencies for publishing.
 * @param {string|[string]} url The URL(s) to add as dependencies
 */
export function addPublishDependencies(url) {
  const urls = Array.isArray(url) ? url : [url];
  window.hlx = window.hlx || {};
  if (window.hlx.dependencies && Array.isArray(window.hlx.dependencies)) {
    window.hlx.dependencies.concat(urls);
  } else {
    window.hlx.dependencies = urls;
  }
}

/**
 * Sanitizes a name for use as class name.
 * @param {*} name The unsanitized name
 * @returns {string} The class name
 */
export function toClassName(name) {
  return name && typeof name === 'string'
    ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-')
    : '';
}

/**
 * Wraps each section in an additional {@code div}.
 * @param {[Element]} sections The sections
 */
function wrapSections(sections) {
  sections.forEach((div) => {
    if (div.childNodes.length === 0) {
      // remove empty sections
      div.remove();
    } else if (!div.id) {
      const wrapper = createEl('div', {
        class: 'section-wrapper',
      });
      div.parentNode.appendChild(wrapper);
      wrapper.appendChild(div);
    }
  });
}

/**
 * Decorates a block.
 * @param {Element} block The block element
 */
export function decorateBlock(block) {
  const classes = Array.from(block.classList.values());
  let blockName = classes[0];
  if (!blockName) return;
  const section = block.closest('.section-wrapper');
  if (section) {
    section.classList.add(`${blockName}-container`.replace(/--/g, '-'));
  }
  const variants = ['carousel'];
  variants.forEach((b) => {
    if (blockName.startsWith(`${b}-`)) {
      const options = blockName.substring(b.length + 1).split('-').filter((opt) => !!opt);
      blockName = b;
      block.classList.add(b);
      block.classList.add(...options);
    }
  });

  block.classList.add('block');
  block.setAttribute('data-block-name', blockName);
}

/**
 * Decorates all blocks in a container element.
 * @param {Element} main The container element
 */
function decorateBlocks(main) {
  main
    .querySelectorAll('div.section-wrapper > div > div')
    .forEach((block) => decorateBlock(block));
}

/**
 * Builds a block DOM Element from a two dimensional array
 * @param {string} blockName name of the block
 * @param {any} content two dimensional array or string or object of content
 */
export function buildBlock(blockName, content) {
  const table = Array.isArray(content) ? content : [[content]];
  // build image block nested div structure
  const blockEl = createEl('div', {
    class: blockName,
  });
  table.forEach((row) => {
    const rowEl = createEl('div');
    row.forEach((col) => {
      const colEl = createEl('div');
      const vals = col.elems ? col.elems : [col];
      vals.forEach((val) => {
        if (val) {
          if (typeof val === 'string') {
            colEl.innerHTML += val;
          } else {
            colEl.appendChild(val);
          }
        }
      });
      rowEl.appendChild(colEl);
    });
    blockEl.appendChild(rowEl);
  });
  return (blockEl);
}

/**
 * Loads JS and CSS for a block.
 * @param {Element} block The block element
 */
export async function loadBlock(block) {
  if (!block.getAttribute('data-loaded')) {
    const blockName = block.getAttribute('data-block-name');

    try {
      const mod = await import(`/assets/blocks/${blockName}/${blockName}.js`);
      if (mod.default) {
        await mod.default(block, blockName, document);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(`failed to load module for ${blockName}`, err);
    }

    loadCSS(`/assets/blocks/${blockName}/${blockName}.css`);
    block.setAttribute('data-loaded', true);
  }
}

/**
 * Loads JS and CSS for all blocks in a container element.
 * @param {Element} main The container element
 */
async function loadBlocks(main) {
  main
    .querySelectorAll('div.section-wrapper > div > .block')
    .forEach(async (block) => loadBlock(block));
}

/**
 * Build header
 */
function loadHeader() {
  const header = document.querySelector('header');
  header.setAttribute('data-block-name', 'header');
  header.setAttribute('data-source', '/header');
  loadBlock(header);
}

/**
 * Build footer
 */
function loadFooter() {
  const footer = document.querySelector('footer');
  footer.setAttribute('data-block-name', 'footer');
  footer.setAttribute('data-source', '/footer');
  loadBlock(footer);
}

/**
 * Extracts the config from a block.
 * @param {Element} block The block element
 * @returns {object} The block config
 */
export function readBlockConfig(block) {
  const config = {};
  block.querySelectorAll(':scope>div').forEach((row) => {
    if (row.children) {
      const cols = [...row.children];
      if (cols[1]) {
        const valueEl = cols[1];
        const name = toClassName(cols[0].textContent);
        let value = '';
        if (valueEl.querySelector('a')) {
          const as = [...valueEl.querySelectorAll('a')];
          if (as.length === 1) {
            value = as[0].href;
          } else {
            value = as.map((a) => a.href);
          }
        } else if (valueEl.querySelector('p')) {
          const ps = [...valueEl.querySelectorAll('p')];
          if (ps.length === 1) {
            value = ps[0].textContent;
          } else {
            value = ps.map((p) => p.textContent);
          }
        } else value = row.children[1].textContent;
        config[name] = value;
      }
    }
  });
  return config;
}

/**
 * Returns a picture element with webp and fallbacks
 * @param {string} src The image URL
 * @param {boolean} eager load image eager
 * @param {Array} breakpoints breakpoints and corresponding params (eg. width)
 */
export function createOptimizedPicture(src, alt = '', eager = false, breakpoints = [{ media: '(min-width: 400px)', width: '2000' }, { width: '750' }]) {
  const url = new URL(src, window.location.href);
  const picture = createEl('picture');
  const { pathname } = url;
  const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

  // webp
  breakpoints.forEach((br) => {
    const source = createEl('source', {
      type: 'image/webp',
      srcset: `${pathname}?width=${br.width}&format=webply&optimize=medium`,
    });
    if (br.media) source.setAttribute('media', br.media);
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      const source = createEl('source', {
        srcset: `${pathname}?width=${br.width}&format=${ext}&optimize=medium`,
      });
      if (br.media) source.setAttribute('media', br.media);
      picture.appendChild(source);
    } else {
      const img = createEl('img', {
        src: `${pathname}?width=${br.width}&format=${ext}&optimize=medium`,
        loading: `${eager ? 'eager' : 'lazy'}`,
        alt,
      });
      picture.appendChild(img);
    }
  });

  return picture;
}

/**
 * Removes formatting from images.
 * @param {Element} main The container element
 */
function removeStylingFromImages(main) {
  // remove styling from images, if any
  const imgs = [...main.querySelectorAll('strong picture'), ...main.querySelectorAll('em picture')];
  imgs.forEach((img) => {
    const parentEl = img.closest('p');
    parentEl.prepend(img);
    parentEl.lastChild.remove();
  });
}

/**
 * Normalizes all headings within a container element.
 * @param {Element} el The container element
 * @param {[string]]} allowedHeadings The list of allowed headings (h1 ... h6)
 */
export function normalizeHeadings(el, allowedHeadings) {
  const allowed = allowedHeadings.map((h) => h.toLowerCase());
  el.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((tag) => {
    const h = tag.tagName.toLowerCase();
    if (allowed.indexOf(h) === -1) {
      // current heading is not in the allowed list -> try first to "promote" the heading
      let level = parseInt(h.charAt(1), 10) - 1;
      while (allowed.indexOf(`h${level}`) === -1 && level > 0) {
        level -= 1;
      }
      if (level === 0) {
        // did not find a match -> try to "downgrade" the heading
        while (allowed.indexOf(`h${level}`) === -1 && level < 7) {
          level += 1;
        }
      }
      if (level !== 7) {
        tag.outerHTML = `<h${level}>${tag.textContent}</h${level}>`;
      }
    }
  });
}

/**
 * Decorates the picture elements.
 * @param {Element} main The container element
 */
function decoratePictures(main) {
  main.querySelectorAll('img[src*="/media_"').forEach((img, i) => {
    const newPicture = createOptimizedPicture(img.src, img.alt, !i);
    const picture = img.closest('picture');
    if (picture) picture.parentElement.replaceChild(newPicture, picture);
  });
}

export function noScroll() {
  window.scrollTo(0, 0);
}

/**
 * Builds auth block.
 * @param {Element} main The container element
 */
function buildAuthBlock(main) {
  const authBlock = buildBlock('auth', {
    elems: [
      '<form class="auth-form">',
    ],
  });
  authBlock.classList.add('block');
  authBlock.setAttribute('data-block-name', 'auth');
  const wrapper = createEl('div', {
    class: 'section-wrapper auth-container',
  });
  wrapper.setAttribute('aria-expanded', true);
  wrapper.append(authBlock);
  main.insertBefore(wrapper, main.children[1]);
  loadBlock(authBlock);
}

/**
 * Builds checkout block.
 * @param {Element} main The container element
 */
function buildCheckoutBlock(main) {
  const checkoutBlock = buildBlock('checkout', {
    elems: [
      '<aside class="btn btn-back">',
      '<div class="checkout-head"><h2>',
      '<table class="checkout-table"><tbody class="checkout-table-body"><tfoot class="checkout-table-foot">',
      '<form class="checkout-form">',
      '<div class="checkout-foot"><a class="btn btn-rect">',
    ],
  });
  checkoutBlock.setAttribute('data-block-name', 'checkout');
  const wrapper = createEl('div', {
    class: 'section-wrapper checkout-container',
  });
  wrapper.append(checkoutBlock);
  main.append(wrapper);
  loadBlock(checkoutBlock);
}

/**
 * Builds customize block.
 * @param {Element} main The container element
 */
function buildCustomizeBlock(main) {
  const customizeBlock = buildBlock('customize', {
    elems: [
      '<aside class="btn btn-close">',
      '<div class="customize-head"><h2>',
      '<form class="customize-body">',
      '<div class="customize-foot"><a class="btn btn-rect">',
    ],
  });
  customizeBlock.setAttribute('data-block-name', 'customize');
  const wrapper = createEl('div', {
    class: 'section-wrapper customize-container',
  });
  wrapper.append(customizeBlock);
  main.append(wrapper);
  loadBlock(customizeBlock);
}

function classify(main) {
  const paths = window.location.pathname.split('/').filter((i) => i);
  if (paths.length) {
    paths.forEach((path) => {
      main.parentElement.parentElement.classList.add(path);
    });
  }
}

/**
 * Fetchs catalog JSON.
 * @returns {object}
 */
export async function fetchCatalog() {
  if (!window.catalog) {
    const resp = await fetch('https://www.normal.club/catalog.json', { cache: 'reload' });
    if (resp.ok) {
      const json = await resp.json();
      const catalog = {
        byId: {},
        items: [],
        categories: [],
        discounts: {},
      };
      json.forEach((e) => {
        if (!catalog.byId[e.id]) {
          catalog.byId[e.id] = e;
        }
        if (e.type === 'ITEM') {
          catalog.items.push(e);
          if (e.item_data.variations) {
            e.item_data.variations.forEach((v) => {
              catalog.byId[v.id] = v;
            });
          }
        }
        if (e.type === 'MODIFIER_LIST') {
          if (e.modifier_list_data.modifiers) {
            e.modifier_list_data.modifiers.forEach((m) => {
              m.modifier_data.modifier_list_id = e.id;
              catalog.byId[m.id] = m;
            });
          }
        }
        if (e.type === 'DISCOUNT') {
          if (e.discount_data.name) {
            catalog.discounts[e.discount_data.name.toLowerCase()] = { id: e.id };
          }
        }
        if (e.type === 'CATEGORY') {
          catalog.categories.push(e);
        }
      });
      window.catalog = catalog;
    }
  }
  return window.catalog;
}

export async function fetchMenu() {
  if (!window.menu) {
    const resp = await fetch('/_admin/menu.json');
    if (resp.ok) {
      let json = await resp.json();
      if (json.data) {
        json = json.data; // helix quirk, difference between live and local
      }
      window.menu = json;
    }
  }
  return window.menu;
}

export function buildGQs(params) {
  let qs = '';
  Object.keys(params).forEach((key) => {
    if (key in params) {
      if (key === 'line_items') {
        qs += `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`;
      } else {
        qs += `${key}=${encodeURIComponent(params[key])}`;
      }
      qs += '&';
    }
  });
  return qs;
}

export function buildGScriptLink(id) {
  return `https://script.google.com/macros/s/${id}/exec`;
}

/**
 * Decorates single Square link.
 * @param {Element} a Anchor element to be decorated
 */
function decorateSquareLink(a) {
  a.classList.add('btn', 'btn-rect', 'btn-cart');
  const squarePrefix = 'https://squareup.com/dashboard/items/library/';
  const giftcardPrefix = 'https://squareup.com/gift/';
  const href = a.getAttribute('href');
  if (href.startsWith(squarePrefix)) {
    const id = href.substr(squarePrefix.length);
    a.setAttribute('data-id', id);
    a.removeAttribute('href');
  } else if (href.includes(giftcardPrefix)) {
    a.target = '_blank';
  }
}

async function squarify(main) {
  const metaHide = getMetadata('hide');
  if (!metaHide || !metaHide.includes('cart')) {
    const squareLink = main.querySelector('a[href^="https://squareup"');
    if (squareLink) {
      main.querySelectorAll('a').forEach((a) => {
        decorateSquareLink(a);
      });
    }
    const square = 'square'; // lost a fight with eslint
    try {
      const mod = await import(`/assets/utils/${square}/${square}.js`);
      if (mod.default) {
        await mod.default(main, square, document);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(`failed to load module for ${square}`, err);
    }
    await loadScript('https://js.squareup.com/v2/paymentform');
  }
}

async function pagify(main) {
  const configured = ['about', 'legal', 'order', 'pint-club', 'recipes'];
  const paths = window.location.pathname.split('/').filter((i) => i);
  paths.forEach(async (path) => {
    if (configured.includes(path)) {
      try {
        const mod = await import(`/assets/pages/${path}/${path}.js`);
        if (mod.default) {
          await mod.default(main, path, document);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(`failed to load module for ${path}`, err);
      }

      loadCSS(`/assets/pages/${path}/${path}.css`);
    }
  });
}

function replaceSVGs(main) {
  main.querySelectorAll('h1, h2, h3, a, p, strong, em, u, span').forEach((el) => {
    const svgs = el.textContent.trim().match(/<[a-zA-z-]{1,}>/);
    if (svgs) {
      svgs.forEach((svg) => {
        const name = svg
          .split('<')[1]
          .replace('>', '');
        const svgEl = createSVG(name);
        if (name === 'v') {
          const title = createEl('title', {
            text: 'vegan',
          });
          svgEl.prepend(title);
        } else if (name === 'gf') {
          const title = createEl('title', {
            text: 'gluten free',
          });
          svgEl.prepend(title);
        }
        if (el.textContent.trim() === svg) {
          el.replaceWith(svgEl);
        }
      });
    }
  });
}

/**
 * Fixes images in a container element.
 * @param {Element} main The container element
 */
function updateImages(main) {
  try {
    removeStylingFromImages(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('updating images failed', error);
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    const metaHide = getMetadata('hide');
    const metaAuth = getMetadata('auth');
    if (!metaHide || !metaHide.includes('cart')) {
      buildCustomizeBlock(main);
      buildCheckoutBlock(main);
      loadScript('https://web.squarecdn.com/v1/square.js');
    }
    if (metaAuth && metaAuth === 'required') {
      buildAuthBlock(main);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('autoblocking failed', error);
  }
}

/**
 * Removes the empty sections from the container element.
 * @param {Element} main The container element
 */
function removeEmptySections(main) {
  main.querySelectorAll(':scope > div:empty').forEach((div) => {
    div.remove();
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
export function decorateMain(main) {
  classify(main);
  loadHeader();
  squarify(main);
  replaceSVGs(main);
  // forward compatible pictures redecoration
  decoratePictures(main);
  updateImages(main);
  removeEmptySections(main);
  wrapSections(main.querySelectorAll(':scope > div'));
  decorateBlocks(main);
}

const LCP_BLOCKS = ['auth', 'index', 'carousel', 'popup']; // add your LCP blocks to the list

/**
 * loads everything needed to get to LCP.
 */
async function loadEager(doc) {
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    await pagify(main);
    doc.querySelector('body').classList.add('appear');

    const block = doc.querySelector('.block');
    const hasLCPBlock = (block && LCP_BLOCKS.includes(block.getAttribute('data-block-name')));
    if (hasLCPBlock) await loadBlock(block, true);
    const lcpCandidate = doc.querySelector('main img');
    const loaded = {
      then: (resolve) => {
        if (lcpCandidate && !lcpCandidate.complete) {
          lcpCandidate.addEventListener('load', () => resolve());
          lcpCandidate.addEventListener('error', () => resolve());
        } else {
          resolve();
        }
      },
    };
    await loaded;
  }
}

export async function fetchLabels() {
  if (!window.labels) {
    const resp = await fetch('/_admin/labels.json');
    if (resp.ok) {
      let json = await resp.json();
      if (json.data) {
        json = json.data; // helix quirk, difference between live and local
      }
      const labels = {};
      json.forEach((label) => {
        labels[label.key] = label.value;
      });
      window.labels = labels;
    }
  }
  return window.labels;
}

function convertHour(timestamp) {
  if (timestamp.includes('.')) {
    // eslint-disable-next-line prefer-const
    let [hour, minute] = timestamp.split('.');
    switch (minute) {
      case '25':
      case 25:
        minute = 15;
        break;
      case '5':
      case 5:
        minute = 30;
        break;
      case '75':
      case 75:
        minute = 45;
        break;
      default:
        break;
    }
    return {
      hour: parseInt(hour, 10),
      minute,
      string: `${hour}${minute}`,
    };
  }
  return {
    hour: parseInt(timestamp, 10),
    minute: 0,
    string: `${parseInt(timestamp, 10) * 100}`,
  };
}

export async function getHoursOfOperation() {
  const labels = await fetchLabels();
  const store = getCurrentStore();
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const timesObj = {};
  if (!labels[`${store}_onlinehoursopen`] && !labels[`${store}_onlinehoursclose`]) {
    // always open
    days.forEach((day) => {
      timesObj[day] = {
        open: convertHour('0'),
        close: convertHour('24'),
      };
    });
  } else {
    const openHours = labels[`${store}_onlinehoursopen`].split(',').map((o) => o.trim());
    const closeHours = labels[`${store}_onlinehoursclose`].split(',').map((o) => o.trim());
    days.forEach((day, i) => {
      timesObj[day] = {
        open: convertHour(openHours[i]),
        close: convertHour(closeHours[i]),
      };
    });
  }
  return timesObj;
}

export async function getOpenStatus(day) {
  const timeObj = await getHoursOfOperation();
  const now = new Date();
  const currentTime = Number(`${now.getHours()}${now.getMinutes()}`);
  const openObj = {};
  if (currentTime < Number(timeObj[day].open.string)) {
    openObj.open = false;
    openObj.text = 'before open';
  } else if (currentTime < Number(timeObj[day].close.string)) {
    openObj.open = true;
    openObj.text = 'after open, before close';
  } else {
    openObj.open = false;
    openObj.text = 'after close';
  }
  return openObj;
}

/**
 * loads everything that doesn't need to be delayed.
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  fetchLabels();
  loadCSS('/assets/styles/lazy-styles.css');
  loadBlocks(main);
  buildAutoBlocks(main);
}

export async function fetchFormFields() {
  if (!window.formFields) {
    const resp = await fetch('/_admin/forms.json');
    if (resp.ok) {
      let json = await resp.json();
      if (json.data) {
        json = json.data; // helix quirk, difference between live and local
      }
      const fields = {};
      json.forEach((j) => {
        if (fields[j.category]) {
          fields[j.category].push(j);
        } else {
          fields[j.category] = [j];
        }
      });
      Object.keys(fields).forEach((key) => {
        fields[key].sort((a, b) => ((a.order > b.order) ? 1 : -1));
      });
      window.formFields = fields;
    }
  }
  return window.formFields;
}

/**
 * loads everything that happens a lot later, without impacting
 * the user experience.
 */
function loadDelayed() {
  // load anything that can be postponed to the latest here
  loadFooter();
  fetchFormFields();
  loadCSS('/assets/utils/forms/forms.css');
  fetchCatalog();
  setLastStore();
}

/**
 * Decorates the page.
 */
async function decoratePage(doc) {
  await loadEager(doc);
  loadLazy(doc);
  loadDelayed(doc);
}

decoratePage(document);
