import { createEl, toClassName } from '../../scripts/lib.js';

/**
 * loads and decorates the body with the club template
 * @param {Element} body The document body element
 */
export default async function decorate(body) {
  const main = body.querySelector('main');
  // setup nav
  const club = main.querySelector('.columns.club');
  const options = club.querySelectorAll('h2');
  options.forEach((option) => {
    const col = option.closest('div');
    const type = toClassName(option.textContent);
    const btn = createEl('button', {
      class: 'button',
      text: `join the ${type} club`,
    });
    col.append(btn);
  });
}
