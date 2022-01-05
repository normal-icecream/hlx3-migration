// import {
//   createEl,
//   createSVG,
// } from '../../scripts/scripts.js';

export default async function decorateOrder(main) {
  main.querySelectorAll('.section-wrapper').forEach((wrapper) => {
    console.log(wrapper);
    const firstEl = wrapper.firstChild.querySelector(':scope > *:first-child');
    console.log('firstEl:', firstEl);
    const lastEl = wrapper.firstChild.querySelector(':scope > *:last-child');
    console.log('lastEl:', lastEl);
    if (firstEl && lastEl) {
      if (firstEl.nodeName === 'H3' && (lastEl.nodeName === 'P' || lastEl.nodeName === 'OL')) {
        wrapper.classList.add('section-wrapper-filled');
      }
    }
  });
}
