import {
  createEl,
  createSVG,
} from '../../scripts/scripts.js';

function toggle(e) {
  let id;
  let target = e.target.closest('[id^="collapse--"]');
  if (target) {
    id = target.id;
  } else {
    target = e.target.closest('[aria-labelledby^="collapse--"]');
    id = target.getAttribute('aria-labelledby');
  }
  const expanded = document.getElementById(id).getAttribute('aria-expanded');
  if (expanded === 'true') {
    document.getElementById(id).setAttribute('aria-expanded', false);
  } else {
    document.getElementById(id).setAttribute('aria-expanded', true);
  }
}

export default function decorateCollapse(block) {
  const title = block.querySelector('h2').id;
  const parent = block.parentNode;
  // build starburst wrapper
  const wrapper = createEl('aside', {
    class: 'collapse-wrapper collapse-btn',
    id: `collapse--${title}`,
    'aria-haspopup': true,
    'aria-expanded': false,
    role: 'button',
  });
  // build starburst
  const config = block.querySelector('div');
  const text = createEl('p', {
    class: 'starburst-text',
    text: config.textContent,
  });
  config.remove();
  const starburst = createSVG('starburst');
  starburst.classList.add('starburst');
  // build close button for menu
  const btn = createEl('aside', {
    class: 'btn btn-close',
    title: `close ${title.split('-').join(' ')}`,
  });
  const close = createSVG('close');
  btn.append(close);
  btn.addEventListener('click', toggle);
  // build
  wrapper.append(text, starburst);
  wrapper.addEventListener('click', toggle);
  parent.parentElement.insertBefore(wrapper, parent);
  block.setAttribute('aria-labelledby', `collapse--${title}`);
  block.setAttribute('role', 'menu');
  block.classList.add('collapse-menu');
  block.prepend(btn);
}
