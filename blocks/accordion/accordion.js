import { createEl } from '../../scripts/lib.js';

/**
 * decorates the accordion
 * @param {Element} block The accordion block element
 */
export default async function decorate(block) {
  [...block.children].forEach((row, i) => {
    const h3s = row.querySelectorAll('h3');
    const arrow = createEl('span', {
      class: 'icon icon-arrow icon-arrow-down',
    });
    const q = createEl('button', {
      type: 'button',
      class: 'accordion-q',
      id: `q${i + 1}`,
      'aria-expanded': false,
      'aria-controls': `a${i + 1}`,
    });
    q.addEventListener('click', () => {
      // eslint-disable-next-line eqeqeq
      const expanded = q.getAttribute('aria-expanded') == 'true';
      q.setAttribute('aria-expanded', !expanded);
    });
    h3s.forEach((h3) => q.append(h3));
    q.append(arrow);
    row.prepend(q);
    const a = row.querySelector('div');
    a.id = `a${i + 1}`;
    a.setAttribute('role', 'region');
    a.setAttribute('aria-labelledby', `q${i + 1}`);
    a.className = 'accordion-a';
  });
}
