export default async function decorateColumns(block) {
  const numOfColumns = block.firstChild.childNodes.length;
  block.classList.add(`columns-${numOfColumns}`);

  block.firstChild.childNodes.forEach((col) => {
    const as = col.querySelectorAll('a');
    if (as) {
      as.forEach((a) => {
        if (a.href === a.textContent) {
          // whole col should be linked
          a.textContent = '';
          a.append(col.cloneNode(true));
          col.replaceWith(a);
        } else {
          // create btn
          a.classList.add('btn', 'btn-rect');
        }
      });
    }
  });
}
