import { createEl, createOptimizedPicture } from '../../scripts/scripts.js';

/**
 * The carousel's navigation
 * @param {element} block The container of the carousel
 */
function setupNavigation(block) {
  const wrapper = block.querySelector('.carousel-wrapper');
  const carouselSlides = wrapper.querySelectorAll('.carousel-slide');
  const carouselPrev = wrapper.querySelector('.carousel-previous');
  const carouselNext = wrapper.querySelector('.carousel-next');

  const updateCarousel = (slides, i) => {
    const current = slides[i];
    const prev = slides[i - 1] ?? slides[[...slides].length - 1];
    const next = slides[i + 1] ?? slides[0];
  
    slides.forEach((slide) => {
      slide.classList.remove('slide-active');
      slide.classList.remove('slide-prev');
      slide.classList.remove('slide-next');
    });
  
    current.classList.add('slide-active');
    prev.classList.add('slide-prev');
    next.classList.add('slide-next');
  };

  let carouselIndex = 0;
  updateCarousel(carouselSlides, carouselIndex);

  const incrementCurrentCarousel = (next = true) => {
    let slides = carouselSlides;
  
    if (next) {
      carouselIndex += 1;
      if (carouselIndex > [...slides].length - 1) carouselIndex = 0;
    } else {
      carouselIndex -= 1;
      if (carouselIndex < 0) carouselIndex = [...slides].length - 1;
    }

    updateCarousel(slides, carouselIndex);
  };

  carouselNext.addEventListener('click', () => {
    incrementCurrentCarousel(true);
  });

  carouselPrev.addEventListener('click', () => {
    incrementCurrentCarousel(false);
  });

  carouselSlides.forEach((slide, i) => {
    slide.addEventListener('focusin', () => {
      if (i !== carouselIndex) {
        carouselIndex = i;
        updateCarousel(carouselSlides,  carouselIndex);
      }
    });
  });

  block.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      incrementCurrentCarousel(false);
    } else if (e.key === 'ArrowRight') {
      incrementCurrentCarousel(true);
    }
  });
}

/**
 * Builds the carousel html
 * @param {array} content Array of elements
 * @param {element} block The container of the carousel
 */
function buildCarousel(content, block) {
  block.innerHTML = '';
  // setup structure
  const wrapper = createEl('div', { class: 'carousel-wrapper' });
  const controls = createEl('div', { class: 'carousel-controls' });
  const slides = createEl('div', { class: 'carousel-slides' });
  const slidesWrapper = createEl('div');
  wrapper.append(controls, slides);
  slides.appendChild(slidesWrapper);
  block.appendChild(wrapper);
  // build controls
  const prev = createEl('button', {
    class: 'carousel-arrow carousel-previous',
    'aria-label': 'Previous slide',
  });
  const next = createEl('button', {
    class: 'carousel-arrow carousel-next',
    'aria-label': 'Next slide',
  });
  prev.appendChild(createEl('span', { class: 'icon icon-arrow icon-arrow-left' }));
  next.appendChild(createEl('span', { class: 'icon icon-arrow icon-arrow-right' }));
  controls.append(prev, next);
  // populate slides
  content.forEach((c, i) => {
    const slide = createEl('div', { class: 'carousel-slide' });
    if (c.nodeName === 'PICTURE') { // slide only contains a picture
      slide.classList.add('carousel-image-slide')
    } else { // slide contains card (picture and text)
      slide.classList.add('carousel-card-slide')
    }
    slide.appendChild(c);
    c.tabIndex = 0;
    slide.ariaLabel = `Slide ${i + 1}`;
    slidesWrapper.appendChild(slide);
  });

  setupNavigation(block);
}

export default async function decorate(block) {
  const linkOnly = block.querySelector('a')?.textContent === block.textContent;
  let slides = [];
  // if link is only content in carousel
  if (linkOnly) {
    const src = block.querySelector('a');
    try {
      if (src.href.endsWith('.json')) { // json file with image list
        const resp = await fetch(src.href);
        const json = await resp.json();
        json.data.sort((a, b) => (a.order > b.order) ? 1 : -1).forEach((j, i) => {
          const picture = createOptimizedPicture(j.source, j.caption || '', i < 3);
          slides.push(picture);
        });
      } else { // html file with inline images
        const resp = await fetch(`${src.href}.plain.html`);
        const html = await resp.text();
        // TODO: create carousel from html file of inline images
      }
    } catch(error) {
      console.warn('Could not load images', error);
    }
  } else {
    // TODO: create carousel from block content
  }
  block.innerHTML = '';
  buildCarousel(slides, block);
}