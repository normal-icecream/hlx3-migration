import { readBlockConfig, decorateIcons, createEl } from '../../scripts/lib.js';

function decorateCart(section) {
  const a = section.querySelector('a');
  if (a) {
    const btn = createEl('button', {
      class: 'header-cart-btn',
      html: a.innerHTML,
    });
    const total = createEl('div', {
      html: '<p class="header-cart-total">0</p>',
      'aria-live': 'polite',
      'aria-label': 'Items in cart: 0',
    });
    btn.prepend(total);
    a.parentElement.replaceWith(btn);
  }
}

function decorateBrand(section) {
  const a = section.querySelector('a');
  if (a) a.setAttribute('aria-label', 'Homepage');
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  block.textContent = '';

  // fetch header content
  const headerPath = config.header || '/header';
  const resp = await fetch(`${headerPath}.plain.html`);
  if (resp.ok) {
    const html = await resp.text();

    // decorate header DOM
    const header = document.createElement('div');
    header.innerHTML = html;

    const classes = ['brand', 'cart'];
    classes.forEach((e, j) => {
      const section = header.children[j];
      if (section) section.classList.add(`header-${e}`);
    });

    const brand = header.querySelector('.header-brand');
    if (brand) decorateBrand(brand);

    const cart = header.querySelector('.header-cart');
    if (cart) decorateCart(cart);

    decorateIcons(header);
    block.append(header);
  }
}
