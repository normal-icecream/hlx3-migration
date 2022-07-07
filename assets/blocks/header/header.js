import {
  createEl,
  decorateIcons,
  readBlockConfig,
} from '../../scripts/scripts.js';

function openCart(e) {
  console.log('hi from', e.target.closest('a'));
}

function setupCart(cart) {
  const btn = cart.querySelector('a');
  if (btn) {
    // setup button
    btn.removeAttribute('href');
    btn.id = 'cart';
    btn.classList.add('cart');
    // add total
    const total = createEl('p', { class: 'cart-total', text: 0 });
    btn.append(total);
    // setup click behavior
    btn.addEventListener('click', openCart);
  }
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  block.textContent = '';

  // fetch nav content
  const headerPath = config.nav || '/header';
  const resp = await fetch(`${headerPath}.plain.html`);
  if (resp.ok) {
    const html = await resp.text();

    // decorate nav DOM
    const header = createEl('div', { html });

    const classes = ['brand', 'cart', 'title'];
    classes.forEach((c, i) => {
      const section = header.children[i];
      if (section) section.classList.add(`header-${c}`);
    });

    setupCart(header.querySelector('.header-cart'));

    decorateIcons(header);
    block.append(header);
  }
}
