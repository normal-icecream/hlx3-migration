export default async function decorateAbout(main) {
  const columns = main.querySelectorAll('.columns');
  const store = columns[0];
  store.classList.add('about-store');
  store.firstChild.firstChild.classList.add('columns-img');
  const lab = columns[1];
  lab.classList.add('about-lab');
  lab.firstChild.firstChild.classList.add('columns-img');
}
