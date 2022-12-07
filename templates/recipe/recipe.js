import { buildBlock } from '../../scripts/lib.js';

/**
 * loads and decorates the body with the recipe template
 * @param {Element} body The document body element
 */
export default async function decorate(body) {
  const main = body.querySelector('main');
  // add anchor
  const carousel = main.querySelector('.carousel');
  if (carousel) {
    carousel.id = 'recipe-hero';
    const anchor = buildBlock('anchor', [
      ['<div>anchor</div>', '<div>#recipe-hero</div>'],
      ['<div>position</div>', '<div>right</div>'],
      ['<div>color</div>', '<div>blue</div>'],
      ['<div>logo</div>', '<div>pints</div>'],
    ]);
    const section = carousel.parentElement;
    section.append(anchor);
  }
}
