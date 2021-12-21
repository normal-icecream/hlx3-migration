import {
  readBlockConfig,
} from '../../scripts/scripts.js';

export default function applyBlockMetadata(block) {
  const config = readBlockConfig(block);
  const target = block.previousElementSibling;
  if (target && [...target.classList].includes('block')) {
    target.setAttribute('data-block-meta', true);
    Object.keys(config).forEach((key) => {
      target.classList.add(`${key}-${config[key]}`);
    });
  }
}
