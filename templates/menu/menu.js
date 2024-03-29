import { createEl, fetchPlaceholders } from '../../scripts/lib.js';

function styleCartBtn(a) {
  const square = 'https://squareup.com/dashboard/items/library/';
  const block = a.closest('.block');
  if (block && [...block.classList].includes('carousel')) {
    const slide = a.closest('div');
    if (slide) slide.setAttribute('data-has-cart-btn', true);
    const p = a.closest('p');
    if (p) p.classList.add('anchored-container');
  }
  if (a.href.startsWith(square)) {
    const btn = createEl('button', {
      class: a.className || 'button primary',
      text: a.textContent,
      'data-id': a.href.split('/').pop(),
    });
    a.replaceWith(btn);
  } else {
    a.classList.add('button', 'primary');
  }
}

/* ABNORMAL */
async function setupAbnormal(main) {
  const hero = main.querySelector('.hero');
  if (hero) hero.classList.add('hero-abnormal');
}

/* WHOLESALE */
function wholesaleOrderOpen() {
  const date = new Date();
  const day = date.toString().slice(0, 3).toLowerCase();
  const days = {
    sun: 'open',
    mon: 'open',
    tue: 'time',
    wed: 'closed',
    thu: 'closed',
    fri: 'closed',
    sat: 'time',
  };
  if (days[day] === 'open') return true;
  if (days[day] === 'closed') return false;
  const hour = date.getHours();
  // check if before open (opens saturday @ 3 [15])
  if (day === 'sat') return hour >= 15;
  // check if after close (closes tuesday @ 3 [15])
  if (day === 'tue') return hour < 15;
  return false;
}

async function setupWholesale(main) {
  const ph = await fetchPlaceholders();
  const order = main.querySelector('[data-id="place-order"]');
  if (order) {
    const open = wholesaleOrderOpen();
    if (open) { // append order button
      const orderBtn = createEl('button', {
        type: 'button',
        class: 'button',
        text: 'start a wholesale order',
      });
      order.firstElementChild.append(orderBtn);
    } else if (ph.wholesaleClosed) { // display closed message
      const p = createEl('p', {
        text: ph.wholesaleClosed,
      });
      order.firstElementChild.append(p);
    }
  }
}

/**
 * decorates the body with the menu template
 * @param {Element} body The document body element
 */
export default async function decorate(body) {
  const main = body.querySelector('main');
  // style sold out text
  const soldOuts = main.querySelectorAll('del + em');
  soldOuts.forEach((so) => so.classList.add('button', 'disabled'));
  // style cart buttons
  const as = main.querySelectorAll('a[href]');
  as.forEach((a) => styleCartBtn(a));
  // setup page-specifics
  const page = window.location.pathname.split('/').pop();
  if (page === 'abnormal') await setupAbnormal(main);
  if (page === 'wholesale') await setupWholesale(main);
  // setup square functionality
}
