import { createEl } from '../../scripts/lib.js';

/**
 * loads and decorates the body with the index template
 * @param {Element} body The document body element
 */
export default async function decorate(body) {
  const main = body.querySelector('main');
  // setup nav
  const ul = main.querySelector('ul');
  ul.querySelectorAll('li a').forEach((a) => {
    const arrow = createEl('span', {
      class: 'icon icon-arrow icon-arrow-right',
    });
    a.append(arrow);
  });
  const nav = createEl('nav', {
    html: ul.outerHTML,
  });
  ul.replaceWith(nav);
}
