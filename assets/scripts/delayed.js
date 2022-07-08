// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './scripts.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
function externalizeLinks() {
  document.querySelectorAll('main a[href]').forEach((a) => {
    try {
      const host = new URL(a.href)?.host;
      if (window.location.host !== host) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noreferrer');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Could not externalize ${a.href}`, error);
    }
  });
}

externalizeLinks();
