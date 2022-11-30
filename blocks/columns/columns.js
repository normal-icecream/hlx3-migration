export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);
  [...block.children].forEach((row) => {
    const picture = row.querySelector('picture');
    if (picture) {
      const pictureCol = picture.closest('div');
      if (pictureCol && pictureCol.textContent.trim() === '') pictureCol.className = 'columns-img-col';
    }
  });
}
