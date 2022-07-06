import {
  createSVG,
  toClassName,
} from '../../scripts/scripts.js';

function toggle(e) {
  const expanded = e.target.getAttribute('aria-expanded');
  if (expanded === 'true') {
    e.target.setAttribute('aria-expanded', false);
  } else {
    e.target.setAttribute('aria-expanded', true);
  }
}

export default function decorateAccordion(block) {
  [...block.children].forEach((child) => {
    child.classList.add('accordion-item');
    const q = child.querySelector('h3');
    q.classList.add('accordion-head');
    q.setAttribute('role', 'button');
    q.setAttribute('aria-expanded', false);
    q.setAttribute('aria-controls', (q.toString().includes(' ') ? toClassName(q) : q));
    q.addEventListener('click', toggle);
    const arrow = createSVG('arrow-up');
    q.append(arrow);
    child.prepend(q);
    const a = child.querySelector('div');
    a.classList.add('accordion-body');
    a.id = (q.toString().includes(' ') ? toClassName(q) : q);
  });
}
