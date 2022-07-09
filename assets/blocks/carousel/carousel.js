import {
  createEl,
  createOptimizedPicture,
  decorateIcons,
  debounce,
} from '../../scripts/scripts.js';

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
    const slides = carouselSlides;

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
        updateCarousel(carouselSlides, carouselIndex);
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

function generateRandomIcon(content) {
  // sanitize content
  // eslint-disable-next-line no-param-reassign
  content = content.toLowerCase()
    .replace(/(\r\n|\n|\r)/g, '').replace(/[^0-9a-z]/g, ' ').replace(/ +(?= )/g, '')
    .trim()
    .split(' ');
  // eslint-disable-next-line no-param-reassign
  content = [...content, ...window.location.pathname.replace(/\//g, '-').split('-').filter((a) => a)];
  const icons = {
    cone: 0, pint: 0, pints: 0, store: 0, truck: 0, van: 0,
  };
  content.forEach((word) => {
    if (word === 'cone' || word === 'cones') icons.cone += 1;
    if (word === 'pint') icons.pint += 1;
    if (word === 'pints') icons.pints += 1;
    if (word === 'store') icons.store += 1;
    if (word === 'truck') icons.truck += 1;
    if (word === 'van') icons.van += 1;
  });
  const allKeys = Object.keys(icons);
  let highKey;
  let highVal = 0;
  allKeys.forEach((key) => {
    if ((icons[key] > 0) && (icons[key] >= highVal)) {
      highKey = key;
      highVal = icons[key];
    }
  });
  const icon = createEl('span', { class: 'icon' });
  if (highKey) { // build "relevant" icon
    icon.classList.add(`icon-${highKey}`);
  } else { // generate random
    icon.classList.add(`icon-${allKeys[Math.floor(Math.random() * allKeys.length)]}`);
  }
  return icon;
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
      slide.classList.add('slide-image');
    } else { // slide contains card (picture, text, button)
      slide.classList.add('slide-card');
      const picture = c.querySelector(' p picture');
      if (picture) {
        picture.parentNode.classList.add('slide-card-img');
      } else { // if no picture, add an icon
        const icon = createEl('p', {
          html: generateRandomIcon(c.textContent).outerHTML,
          class: 'slide-card-img slide-card-icon',
        });
        c.prepend(icon);
      }
      const title = c.querySelector('h3');
      if (title) title.classList.add('slide-card-title');
      const subtitle = c.querySelector('h3 + p strong');
      if (subtitle) subtitle.parentNode.classList.add('slide-card-subtitle');
      // TODO: add card class to button
      // const button = c.querySelector('p a');
    }
    slide.appendChild(c);
    c.tabIndex = 0;
    slide.ariaLabel = `Slide ${i + 1}`;
    slidesWrapper.appendChild(slide);
  });

  setupNavigation(block);
}

function resize() {
  const carousels = document.querySelectorAll('.block.carousel-cards > .carousel-wrapper');
  carousels.forEach((carousel) => {
    const slides = carousel.querySelectorAll('.carousel-slide > div');
    let max = 0;
    slides.forEach((slide) => {
      if (slide.offsetHeight > max) max = slide.offsetHeight;
    });
    if (max > 0) carousel.style.height = `${max + (32 * 2)}px`;
  });
}

export default async function decorate(block) {
  const linkOnly = block.querySelector('a')?.textContent === block.textContent;
  const slides = [];
  const carouselHeader = createEl('div', { class: 'carousel-header' });
  // if link is only content in carousel, carousel consists of external images
  if (linkOnly) {
    block.classList.add('carousel-images');
    const src = block.querySelector('a');
    try {
      if (src.href.endsWith('.json')) { // json file with image list
        const resp = await fetch(src.href);
        const json = await resp.json();
        json.data.sort((a, b) => ((a.order > b.order) ? 1 : -1)).forEach((j, i) => {
          const picture = createOptimizedPicture(j.source, j.caption || '', i < 2);
          slides.push(picture);
        });
      } else { // html file with inline images
        // TODO: create carousel from html file of inline images
        // const resp = await fetch(`${src.href}.plain.html`);
        // const html = await resp.text();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Could not load images', error);
    }
  } else { // carousel consists of cards
    block.classList.add('carousel-cards');
    // setup carousel header
    const first = block.firstElementChild;
    const isHeader = first.querySelector('h2');
    if (isHeader) {
      carouselHeader.innerHTML = first.innerHTML;
      first.remove();
    }
    // add wrapping divs to slides
    [...block.children].forEach((slideWrapper) => {
      slides.push(slideWrapper.firstElementChild);
    });
  }
  block.innerHTML = '';
  if (slides.length) buildCarousel(slides, block);
  if (carouselHeader.hasChildNodes()) {
    block.prepend(carouselHeader);
  }
  decorateIcons();

  // setting the height of card carousels
  window.addEventListener('resize', debounce(resize, 250));
  setTimeout(resize, 250);
}
