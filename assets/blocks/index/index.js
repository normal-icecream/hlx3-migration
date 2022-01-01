import {
  createEl,
  createSVG,
} from '../../scripts/scripts.js';

export function buildTitle(nav) {
  const titleBlock = nav.querySelector('h1');
  titleBlock.classList.add('title-wrapper');
  const title = titleBlock.textContent.split('<')[0];
  const span = createEl('span', {
    class: 'title',
    text: title,
  });
  let svg = titleBlock.querySelector('svg');
  if (!svg) {
    svg = createSVG('reg');
  }
  span.append(svg);
  titleBlock.innerHTML = '';
  titleBlock.append(span);
}

function buildNav(nav) {
  const navBlock = createEl('nav', {
    class: 'index-nav',
  });
  const linksWrapper = nav.querySelector('ul');
  navBlock.append(linksWrapper.cloneNode(true));
  linksWrapper.replaceWith(navBlock);
  navBlock.querySelectorAll('a').forEach((a) => {
    const arrow = createSVG('arrow-right');
    a.append(arrow);
  });
}

async function buildCarousel(carousel) {
  carousel.classList.add('index-carousel');
  const as = carousel.querySelectorAll('a');
  const { pathname } = new URL(as[0].href);
  const attr = as[1];
  const resp = await fetch(pathname);
  if (resp.ok) {
    const json = await resp.json();
    const data = json.data.sort((a, b) => ((a.order > b.order) ? 1 : -1));
    const wrapper = createEl('div', {
      class: 'index-carousel-media',
    });
    carousel.innerHTML = '';
    data.forEach((row) => {
      const a = createEl('a', {
        href: row.link,
        target: '_blank',
      });
      let media;
      if (row.type === 'VIDEO') {
        media = createEl('video', {
          type: 'video/mp4',
        });
        media.playsinline = true;
        media.autoplay = true;
        media.loop = true;
        media.muted = true;
        const postSrc = createEl('source', {
          src: row.url,
        });
        media.append(postSrc);
      } else {
        media = createEl('picture');
        const postSrc = createEl('img', {
          src: row.url,
        });
        media.append(postSrc);
      }
      a.append(media);
      wrapper.append(a);
    });
    attr.classList.add('index-carousel-attr');
    const arrow = createSVG('arrow-right');
    attr.append(arrow);
    carousel.append(wrapper, attr);
  } else {
    carousel.innerHTML = '';
    // eslint-disable-next-line no-console
    console.warn('could not load carousel media');
  }
}

function buildNavBtn(direction) {
  const btn = createEl('button', {
    class: `cnav cnav-${direction}`,
    title: `scroll ${direction}`,
  });
  const arrow = createSVG(`arrow-${direction}`);
  btn.append(arrow);
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const carousel = document.querySelector('.index-carousel-media');
    if (direction === 'right') {
      carousel.scrollLeft += (carousel.offsetWidth / 1.2);
    } else {
      carousel.scrollLeft -= (carousel.offsetWidth / 1.2);
    }
  });
  return btn;
}

function buildCarouselNav(carousel) {
  const leftBtn = buildNavBtn('left');
  const rightBtn = buildNavBtn('right');
  carousel.prepend(leftBtn, rightBtn);
}

export default async function decorateIndex(block) {
  const wrapper = block.firstChild;
  wrapper.classList.add('index-wrapper');
  const nav = block.firstChild.firstChild;
  nav.classList.add('index-column');
  buildTitle(nav);
  buildNav(nav);
  const carousel = block.firstChild.lastChild;
  await buildCarousel(carousel);
  buildCarouselNav(carousel);
}
