import { createEl, decorateIcons } from '../../scripts/lib.js';

function createTileBtns(wrapper) {
  const headings = wrapper.querySelectorAll('h2');
  headings.forEach((heading) => {
    const tile = heading.closest('div');
    tile.classList.add('order-tile');
    const icon = tile.querySelector('.icon').closest('p');
    const link = tile.querySelector('a');
    const a = createEl('a', {
      'aria-label': heading.textContent,
      href: link.href,
      html: `${icon.outerHTML}
        ${heading.outerHTML}`,
    });
    tile.innerHTML = '';
    tile.append(a);
    decorateIcons(a);
  });
}

/**
 * loads and decorates the body with the order template
 * @param {Element} body The document body element
 */
export default async function decorate(body) {
  const main = body.querySelector('main');
  const [toggle, pickup, delivery] = main.querySelectorAll('.columns');

  // create back button
  const aside = createEl('aside', {
    class: 'order-back-wrapper',
    'aria-hidden': true,
  });
  const backBtn = createEl('button', {
    type: 'button',
    class: 'order-back',
    html: `<p>back to options 
      <span class="icon icon-arrow icon-arrow-left"></span></p>`,
  });
  backBtn.addEventListener('click', () => {
    aside.setAttribute('aria-hidden', true);
    pickup.setAttribute('aria-hidden', true);
    delivery.setAttribute('aria-hidden', true);
    body.classList.remove('order-pickup', 'order-delivery');
    toggle.setAttribute('aria-hidden', false);
  });
  aside.append(backBtn);
  toggle.parentElement.insertBefore(aside, toggle);
  // setup toggle
  toggle.classList.add('order-toggle');
  const options = toggle.querySelectorAll('h2');
  options.forEach((option) => {
    const type = option.id;
    const tile = option.closest('div');
    const button = createEl('button', {
      type: 'button',
      id: `order-${type}`,
      'aria-label': option.textContent,
      html: tile.innerHTML,
    });
    button.addEventListener('click', () => {
      aside.setAttribute('aria-hidden', false);
      toggle.setAttribute('aria-hidden', true);
      body.classList.remove('order-pickup', 'order-delivery');
      body.classList.add(`order-${type}`);
      if (type === 'pickup') {
        delivery.setAttribute('aria-hidden', true);
        pickup.setAttribute('aria-hidden', false);
      } else if (type === 'delivery') {
        pickup.setAttribute('aria-hidden', true);
        delivery.setAttribute('aria-hidden', false);
      }
    });
    tile.innerHTML = '';
    tile.append(button);
    decorateIcons(tile);
  });

  // setup pickup
  pickup.classList.add('order-pickup');
  pickup.setAttribute('aria-hidden', true);
  createTileBtns(pickup);

  // setup delivery
  delivery.classList.add('order-delivery');
  delivery.setAttribute('aria-hidden', true);
  createTileBtns(delivery);
}
