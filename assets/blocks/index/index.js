import {
  createEl,
  createSVG,
} from '../../scripts/scripts.js';

import {
  buildCarouselNav,
} from '../carousel/carousel.js';

export function buildTitle(nav) {
  console.log('\nbuilding title', nav);
  const titleBlock = nav.querySelector('h1');
  titleBlock.classList.add('title-wrapper');
  const title = titleBlock.textContent.split('<')[0];
  console.log('title:', title);
  const span = createEl('span', {
    class: 'title',
    text: title,
  });
  let svg = titleBlock.querySelector('svg');
  if (!svg) {
    svg = createSVG('reg');
  }
  console.log('svg:', svg);
  span.append(svg);
  console.log('span:', span);
  titleBlock.innerHTML = '';
  titleBlock.append(span);
  console.log('title block:', titleBlock);
}

function buildNav(nav) {
  console.log('\nbuild nav', nav);
  const navBlock = createEl('nav', {
    class: 'index-nav',
  });
  const linksWrapper = nav.querySelector('ul');
  navBlock.append(linksWrapper.cloneNode(true));
  console.log('nav block:', navBlock);
  linksWrapper.replaceWith(navBlock);
  console.log('links wrapper:', linksWrapper);
  navBlock.querySelectorAll('a').forEach((a) => {
    const arrow = createSVG('arrow-right');
    a.append(arrow);
    console.log('a:', a);
  });
}

export async function fetchCarousel() {
  console.log('\nfetching carousel');
  const options = {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  };
  console.log('options:', options);
  const resp = await fetch('/_admin/carousel-builder-tool.json', options);
  if (resp.ok) {
    delete window.carousel;
    const json = await resp.json();
    console.log('json:', json);
    const data = json.data.sort((a, b) => ((a.order > b.order) ? 1 : -1));
    console.log('data:', data);
    window.carousel = data;
  }
  console.log('window carousel:', window.carousel);
  return window.carousel;
}

export function buildMedia(media, type = 'index') {
  console.log('\nbuilding media', media);
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
  console.log('media el:', mediaEl);
  return mediaEl;
}

async function buildCarousel(el) {
  console.log('\nbuilding carousel', el);
  const data = await fetchCarousel();
  if (data) {
    console.log('data:', data);
    const wrapper = createEl('div', {
      class: 'index-carousel-slides',
    });
    console.log('wrapper:', wrapper);
    data.forEach((d) => {
      console.log('d:', d);
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
    console.log('el:', el);
    wrapper.parentNode.classList.add('index-carousel-wrapper', 'carousel');
    console.log(wrapper.parentNode);
  } else {
    el.remove();
  }
}

async function buildCarouselBlock(block) {
  console.log('\nbuilding carousel block', block);
  const [media, attr] = block.querySelectorAll('a');
  console.log('media:', media);
  attr.parentNode.remove();
  console.log('attr:', attr);
  await buildCarousel(media.parentNode, media.href);
}

export default async function decorateIndex(block) {
  console.log('\ndecorating index', block);
  const wrapper = block.firstChild;
  wrapper.classList.add('index-wrapper');
  console.log('wrapper:', wrapper);
  const nav = block.firstChild.firstChild;
  nav.classList.add('index-column');
  console.log('nav:', nav);
  buildTitle(nav);
  buildNav(nav);
  const carousel = block.firstChild.lastChild;
  await buildCarouselBlock(carousel);
}
