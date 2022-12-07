export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);
  [...block.children].forEach((row) => {
    const pictures = row.querySelectorAll('picture');
    pictures.forEach((picture) => {
      const pictureCol = picture.closest('div');
      if (pictureCol && pictureCol.textContent.trim() === '') pictureCol.className = 'columns-img-col';
      else pictureCol.className = 'columns-inline-col';
    });
  });
}
