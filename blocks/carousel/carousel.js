import { createEl, decorateIcons } from '../../scripts/lib.js';

function generateRandomIcon(text) {
  const words = text.replace(/[^a-z ]/gi, '').split(' ').filter((w) => w.trim());
  const counts = {
    pint: 0, pints: 0, store: 0, truck: 0, van: 0,
  };
  words.forEach((word) => {
    if (word.toLowerCase() in counts) counts[word.toLowerCase()] += 1;
  });
  const options = Object.keys(counts);
  const max = options.reduce((a, b) => (counts[a] > counts[b] ? a : b));
  if (counts[max] > 0) return max;
  return options[Math.floor(Math.random() * (options.length))];
}

/**
 * loads and decorates the carousel
 * @param {Element} block The carousel block element
 */
export default async function decorate(block) {
  let carousel = block;
  let carouselWrapper = block.parentElement;
  const hasTitle = block.firstElementChild.querySelector('h2');
  if (hasTitle) {
    // setup carousel title
    block.firstElementChild.className = 'carousel-title';
    block.setAttribute('aria-labelledby', hasTitle.id);
    // wrap remaining children in slide wrapper
    const wrapper = createEl('ul', {
      class: 'carousel-slide-wrapper',
    });
    carousel = wrapper;
    carouselWrapper = block;
    [...block.children].slice(1).forEach((child) => {
      const slide = createEl('li', {
        class: 'carousel-slide',
        html: child.firstElementChild.innerHTML,
      });
      const hasImg = slide.querySelector(':first-child picture');
      if (hasImg) {
        hasImg.parentElement.className = 'carousel-slide-img';
      } else {
        // create fallback img if none
        const img = createEl('div', {
          class: 'carousel-slide-img',
          html: `<span class="icon icon-${generateRandomIcon(slide.textContent)}"></span>`,
        });
        decorateIcons(img);
        slide.prepend(img);
      }
      child.remove();
      wrapper.append(slide);
    });
    block.append(wrapper);
  } else if (block.className.includes('images')) {
    // images carousel
    block.parentElement.classList.add('carousel-images-wrapper');
    block.parentElement.parentElement.classList.add('carousel-images-container');
    [...block.children].forEach((child) => {
      child.className = 'carousel-slide';
    });
  }
  // build carousel controls
  const controls = createEl('ul', {
    class: 'carousel-controls',
  });
  const btns = ['left', 'right'];
  btns.forEach((direction) => {
    const control = createEl('li', {
      class: `carousel-control carousel-control-${direction}`,
      html: `<button type="button"
        aria-label="${direction === 'left' ? 'previous slide' : 'next slide'}">
          <span class="icon icon-arrow icon-arrow-${direction}"></span>
        </button>`,
    });
    control.addEventListener('click', () => {
      const windowWidth = window.innerWidth;
      // eslint-disable-next-line no-nested-ternary
      const offsetSlides = windowWidth >= 900 ? 3 : windowWidth >= 700 ? 2 : 1;
      const slideWidth = carousel.lastElementChild.offsetWidth;
      const slides = carousel.querySelectorAll('.carousel-slide');
      const slidesWidth = (slides.length - offsetSlides) * slideWidth;
      // trying to scroll right at end of carousel
      if ((carousel.scrollLeft >= (slidesWidth * 0.95)) && direction === 'right') {
        carousel.scrollLeft = 0;
      // trying to scroll left at beginning of carousel
      } else if ((carousel.scrollLeft < (slideWidth * 0.95)) && direction === 'left') {
        carousel.scrollLeft += slidesWidth;
      } else if (direction === 'right') {
        carousel.scrollLeft += slideWidth;
      } else if (direction === 'left') {
        carousel.scrollLeft -= slideWidth;
      }
    });
    control.addEventListener('dblclick', () => {
      if (direction === 'right') carousel.scrollLeft = 0;
      if (direction === 'left') carousel.scrollLeft += carousel.offsetWidth;
    });
    controls.append(control);
  });
  carouselWrapper.append(controls);
}
