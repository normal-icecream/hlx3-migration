export default async function decorateOrder(main) {
  main.querySelectorAll('.section-wrapper').forEach((wrapper) => {
    const firstEl = wrapper.firstChild.querySelector(':scope > *:first-child');
    const lastEl = wrapper.firstChild.querySelector(':scope > *:last-child');
    if (firstEl && lastEl) {
      if (firstEl.nodeName === 'H3' && (lastEl.nodeName === 'P' || lastEl.nodeName === 'OL')) {
        wrapper.classList.add('section-wrapper-filled');
      }
    }
  });
}
