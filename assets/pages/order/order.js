import {
  createEl,
  createSVG,
} from '../../scripts/scripts.js';

function buildBackBtn(menu) {
  menu.classList.add('relative');
  const btn = createEl('aside', {
    class: 'btn btn-back btn-order',
    text: 'back to options',
  });
  const arrow = createSVG('arrow-left');
  btn.append(arrow);
  btn.addEventListener('click', () => {
    menu.classList.add('order-hide');
    const html = document.querySelector('html');
    html.classList.remove('order-selected-pickup', 'order-selected-delivery');
    const mainMenu = document.querySelector('.order-menu');
    mainMenu.classList.remove('order-hide');
    btn.remove();
  });
  menu.prepend(btn);
}

function menuClick(e) {
  const target = e.target.closest('.order-menu-btn').getAttribute('data-target');
  const menu = document.querySelector('.order-menu');
  menu.classList.add('order-hide');
  const targetMenu = document.querySelector(`.order-${target}`);
  buildBackBtn(targetMenu);
  const html = document.querySelector('html');
  html.classList.add(`order-selected-${target}`);
  targetMenu.classList.remove('order-hide');
}

function buildMenu(block) {
  const pickup = block.firstChild.firstChild;
  pickup.classList.add('order-menu-btn');
  pickup.setAttribute('data-target', 'pickup');
  pickup.addEventListener('click', menuClick);
  const delivery = block.firstChild.lastChild;
  delivery.classList.add('order-menu-btn');
  delivery.setAttribute('data-target', 'delivery');
  delivery.addEventListener('click', menuClick);
}

export default async function decorateOrder(main) {
  const blocks = main.querySelectorAll('.columns');
  const menu = blocks[0];
  menu.classList.add('order-menu');
  buildMenu(menu);
  const pickup = blocks[1];
  pickup.classList.add('order-pickup', 'order-hide');
  const delivery = blocks[2];
  delivery.classList.add('order-delivery', 'order-hide');
}
