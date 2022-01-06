import {
  createEl,
  createSVG,
  toClassName,
} from '../../scripts/scripts.js';

function reorgSlides(carousel, direction) {
  const slides = carousel.querySelectorAll('.carousel-slide');
  if (direction === 'left') {
    // add last slide to front
    const lastSlide = slides[slides.length - 1];
    carousel.prepend(lastSlide);
  } else if (direction === 'right') {
    // add first slide to end
    const firstSlide = slides[0];
    carousel.append(firstSlide);
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
    const carousel = e.target.closest('.carousel > :last-child');
    const currentPosition = carousel.scrollLeft;
    const slideWidth = carousel.querySelector('.carousel-slide').offsetWidth;
    let carouselWidth = slideWidth * (carousel.childNodes.length - 2); // exclude btns
    const nextPosition = currentPosition + (direction === 'right' ? slideWidth : -slideWidth);
    // calculate width based on visible slides
    if (carousel.offsetWidth >= 898) { // hacky
      carouselWidth -= ((slideWidth * 2) + 2);
    } else if (carousel.offsetWidth >= 689) { // hacky
      carouselWidth -= (slideWidth + 2); // border?
    }
    if (nextPosition < 0 || nextPosition >= carouselWidth) {
      // no content in that direction
      reorgSlides(carousel, direction);
    }
    if (direction === 'right') {
      carousel.scrollLeft += slideWidth;
    } else {
      carousel.scrollLeft -= slideWidth;
    }
  });
  return btn;
}

export function buildCarouselNav(carousel) {
  const leftBtn = buildNavBtn('left');
  const rightBtn = buildNavBtn('right');
  carousel.prepend(leftBtn, rightBtn);
}

async function fetchCarouselImages(url) {
  const resp = await fetch(`${url}.plain.html`);
  if (resp.ok) {
    const html = await resp.text();
    const placeholder = createEl('div', { html });
    const imgs = placeholder.querySelectorAll('picture');
    return imgs;
  }
  return false;
}

export default async function decorateCarousel(block) {
  const children = [...block.querySelectorAll(':scope > div')];
  if ([...block.classList].includes('carousel-images')) {
    // fetch carousel images
    const { pathname } = new URL(block.querySelector('a').href);
    const imgs = await fetchCarouselImages(pathname);
    if (imgs) {
      const wrapper = block.firstChild;
      wrapper.innerHTML = '';
      wrapper.classList.add('carousel-images-slides');
      imgs.forEach((img) => {
        img.classList.add('carousel-slide');
        wrapper.append(img);
      });
      // build navigation
      if (imgs.length > 1) {
        buildCarouselNav(wrapper);
      }
    }
  } else {
    block.querySelectorAll('img').forEach((img) => {
      img.setAttribute('height', 160);
    });
    // setup carousel head
    const head = children[0].firstChild;
    head.classList.add('carousel-head');
    const title = toClassName(head.textContent);
    block.classList.add(`${title}-carousel`);
    // setup carousel slides
    children.shift();
    const slides = children.map((child) => child.firstChild);
    // build new carousel
    block.innerHTML = '';
    const wrapper = createEl('div', {
      class: 'carousel-slides',
    });
    slides.forEach((slide) => {
      // remove deleted content
      let deleted = false;
      slide.querySelectorAll('del').forEach((del) => {
        if (del.textContent.trim() === del.parentNode.textContent.trim()) {
          del.parentNode.remove();
          deleted = true;
        } else {
          del.remove();
          deleted = true;
        }
      });
      // content was deleted and only slide remaining is an image
      if (deleted && slide.childNodes.length === 1 && slide.querySelector('img')) {
        slide.remove();
      } else {
        slide.classList.add('carousel-slide');
        wrapper.append(slide);
      }
    });
    wrapper.classList.add(`carousel-slides-${wrapper.childNodes.length <= 3 ? wrapper.childNodes.length : 'multi'}`);
    block.append(head, wrapper);
    block.classList.add('carousel-border');
    // build navigation
    if (wrapper.childNodes.length > 1) {
      buildCarouselNav(wrapper);
    }
  }
}
