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

// export default function decorateStarburstCollapse(block) {
//   const title = block
//     .querySelector('h2')
//     .textContent;
//   const titleDashed = title.replace(/ /g, '-');

//   const parent = block.parentElement;

//   // build starburst container
//   const container = createEl('aside', {
//     class: 'starburst-container starburst-collapse-btn',
//     id: `starburst-collapse--${titleDashed}`,
//     'aria-haspopup': true,
//     'aria-expanded': false,
//     role: 'button'
//   });

//   // build starburst
//   const configColor = block.querySelector('strong').textContent;
//   const starburst = createEl('img', {
//     src: buildPath(`svg/starburst-${configColor}.svg`),
//     class: `starburst`
//   });

//   const configText = block.querySelector('em').textContent;
//   const text = createEl('p', {
//     class: 'starburst-text'
//   });
//   text.textContent = configText;

//   block.firstElementChild.remove(); // remove config div

//   // build close button for menu
//   const closeBtn = createEl('button', {
//     class: 'icon close',
//     title: `close ${title}`
//   });

//   const closeBtnContainer = createEl('div', {
//     class: 'icon-container'
//   });

//   const expand = (e) => {
//     const btn = e.target.closest('.starburst-container');
//     const expanded = btn.getAttribute('aria-expanded');
//     if (expanded === 'false') {
//       btn.setAttribute('aria-expanded', true);
//     } else {
//       btn.setAttribute('aria-expanded', false);
//     }
//   }

//   const collapse = (e) => {
//     const btn = e.target.closest('.icon-container');
//     const parent = btn.parentElement;
//     const label = parent.getAttribute('aria-labelledby');
//     const target = document.getElementById(label);
//     const expanded = target.getAttribute('aria-expanded');
//     if (expanded === 'true') {
//       target.setAttribute('aria-expanded', false);
//     } else {
//       target.setAttribute('aria-expanded', true);
//     }
//   }

//   container.append(text, starburst);
//   container.classList.add(`starburst-${configColor}`);
//   container.addEventListener('click', expand);

//   closeBtnContainer.append(closeBtn);
//   closeBtn.addEventListener('click', collapse);

//   parent.parentElement.insertBefore(container, parent);

//   parent.setAttribute('aria-labelledby', `starburst-collapse--${titleDashed}`);
//   parent.setAttribute('role', 'menu');
//   parent.classList.add('starburst-collapse-menu', `starburst-menu-${configColor}`);
//   parent.prepend(closeBtnContainer);
// }
