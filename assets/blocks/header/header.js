import {
  createEl,
  createSVG,
  getMetadata,
} from '../../scripts/scripts.js';

async function fetchHeaderContent(url) {
  const resp = await fetch(`${url}.plain.html`);
  if (resp.ok) {
    const html = await resp.text();
    const content = createEl('div', { html });
    return content;
  }
  const year = new Date().getFullYear();
  const fallback = createEl('div', {
    html: `
    <div>
      <p>
        © normal® ice cream, inc. ${year} |
        all rights reserved | 
        slc, ut
      </p>
    </div>`,
  });
  return fallback;
}

function findSVGName(text) {
  const svgName = text
    .match(/<[a-zA-z-]{1,}>/)[0]
    .split('<')[1]
    .replace('>', '');
  return svgName;
}

function buildHeader(block, content) {
  const metaHide = getMetadata('hide') || 'null';

  const headWrapper = createEl('div', {
    class: 'header-wrapper',
  });
  const logoBlock = content.querySelector('.logo');
  if (logoBlock) {
    const a = createEl('a', {
      class: 'header-link',
      href: window.location.origin,
    });
    const logo = findSVGName(logoBlock.textContent);
    const svg = createSVG(logo);
    svg.classList.add('header-logo');
    a.append(svg);
    headWrapper.append(a);
  }

  const cartBlock = content.querySelector('.cart');
  if (cartBlock && !metaHide.includes('cart')) {
    const cart = createEl('div', {
      class: 'header-cart',
    });
    const cartIcon = findSVGName(cartBlock.textContent);
    const svg = createSVG(cartIcon);
    svg.classList.add('header-cart-icon');
    const amount = createEl('p', {
      class: 'header-cart-amount',
      text: 0,
    });
    cart.append(svg, amount);
    headWrapper.append(cart);
  }
  block.append(headWrapper);

  const titleBlock = content.querySelector('.title');
  if (titleBlock && !metaHide.includes('title')) {
    const fullTitle = titleBlock.querySelector('h1').textContent;
    const title = fullTitle.split('<')[0];
    const reg = findSVGName(fullTitle);
    const svg = createSVG(reg);
    const span = createEl('span', {
      class: 'title',
      text: title,
    });
    span.append(svg);
    const wrapper = createEl('div', {
      class: 'title-wrapper',
    });
    wrapper.append(span);
    block.append(wrapper);
  }
}

export default async function decorateHeader(block) {
  const url = block.getAttribute('data-source');
  const content = await fetchHeaderContent(url);
  buildHeader(block, content);
}
