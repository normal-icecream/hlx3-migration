export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const colEls = col.children.length;
      const picture = col.querySelector('picture');
      // TODO: handle column imgs that should be linked
      // const pictureLink = col.querySelector('picture + p a');
      // const isPictureLinked = pictureLink && (pictureLink?.href === pictureLink?.textContent);
      if (colEls === 1 && picture) { // only column content is picture
        col.classList.add('columns-img-col');
      }
    });
  });
}
