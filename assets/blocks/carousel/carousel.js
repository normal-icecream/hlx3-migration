import {
  createEl,
  createSVG,
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
    const carousel = document.querySelector('.carousel-slides');
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

function buildCarouselNav(carousel) {
  const leftBtn = buildNavBtn('left');
  const rightBtn = buildNavBtn('right');
  carousel.prepend(leftBtn, rightBtn);
}

export default function decorateCarousel(block) {
  const children = [...block.querySelectorAll(':scope > div')];
  // setup carousel head
  const head = children[0].firstChild;
  head.classList.add('carousel-head');
  // setup carousel slides
  children.shift();
  const slides = children.map((child) => child.firstChild);
  // build new carousel
  block.innerHTML = '';
  const wrapper = createEl('div', {
    class: `carousel-slides carousel-slides-${slides.length <= 3 ? slides.length : 'multi'}`,
  });
  slides.forEach((slide) => {
    slide.classList.add('carousel-slide');
    wrapper.append(slide);
  });
  block.append(head, wrapper);
  block.setAttribute('data-loaded', true);
  // build navigation
  if (slides.length > 1) {
    buildCarouselNav(wrapper);
  }
}
