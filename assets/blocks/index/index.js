import {
  createEl,
  createSVG,
} from '../../scripts/scripts.js';

import {
  buildCarouselNav,
} from '../carousel/carousel.js';

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

export async function fetchCarousel() {
  const options = {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  };
  const resp = await fetch('/_admin/carousel-builder-tool.json', options);
  if (resp.ok) {
    delete window.carousel;
    const json = await resp.json();
    const data = json.data.sort((a, b) => ((a.order > b.order) ? 1 : -1));
    window.carousel = data;
  }
  return window.carousel;
}

export function buildMedia(media, type = 'index') {
  let mediaEl;
  if (media.type === 'VIDEO') {
    mediaEl = createEl('video', {
      class: `${type}-media`,
      type: 'video/mp4',
    });
    mediaEl.playsinline = true;
    mediaEl.autoplay = true;
    mediaEl.loop = true;
    mediaEl.muted = true;
    const mediaSrc = createEl('source', {
      src: media.source,
    });
    mediaEl.append(mediaSrc);
  } else {
    mediaEl = createEl('picture', {
      class: `${type}-media`,
    });
    const mediaSrc = createEl('img', {
      src: media.source,
      alt: media.caption ? `${media.caption} | media from instagram` : 'media from instagram',
    });
    mediaEl.append(mediaSrc);
  }
  return mediaEl;
}

async function buildCarousel(el) {
  const data = await fetchCarousel();
  if (data) {
    const wrapper = createEl('div', {
      class: 'index-carousel-slides',
    });
    data.forEach((d) => {
      const media = buildMedia(d, 'index');
      const a = createEl('a', {
        class: 'index-carousel-slide carousel-slide',
        href: d.link,
        target: '_blank',
      });
      a.append(media);
      wrapper.append(a);
    });
    if (data.length > 1) {
      buildCarouselNav(wrapper);
    }
    el.parentNode.replaceChild(wrapper, el);
    wrapper.parentNode.classList.add('index-carousel-wrapper', 'carousel');
  } else {
    el.remove();
  }
}

async function buildCarouselBlock(block) {
  const [media, attr] = block.querySelectorAll('a');
  attr.parentNode.remove();
  await buildCarousel(media.parentNode, media.href);
}

export default async function decorateIndex(block) {
  const wrapper = block.firstChild;
  wrapper.classList.add('index-wrapper');
  const nav = block.firstChild.firstChild;
  nav.classList.add('index-column');
  buildTitle(nav);
  buildNav(nav);
  const carousel = block.firstChild.lastChild;
  await buildCarouselBlock(carousel);
}
