import { createEl } from '../../scripts/lib.js';

function changeResultsVisibility(results, hide) {
  results.forEach((result) => result.setAttribute('aria-hidden', hide));
  if (!hide) {
    const noResults = [...results].find((result) => result.className === 'search-result-empty');
    noResults.setAttribute('aria-hidden', !hide);
  }
}

function updateSearchResults(results, input) {
  let query = input.value.trim().toLowerCase();
  let zipSearch = false;
  // eslint-disable-next-line eqeqeq
  if (query == parseInt(query, 10)) zipSearch = true;
  if (query) {
    // hide all results
    changeResultsVisibility(results, true);
    let visible = 0;
    if (zipSearch) { // search exclusively by zip code
      results.forEach((result) => {
        const zip = parseInt(result.getAttribute('data-zip'), 10);
        const qInt = parseInt(query, 10);
        if (qInt >= zip - 10 && qInt <= zip + 10) {
          result.setAttribute('aria-hidden', false);
          visible += 1;
        }
      });
    } else { // location, city, and state search
      results.forEach((result) => {
        if (result.className === 'search-result') {
          const location = result.getAttribute('data-location');
          const city = result.getAttribute('data-city');
          const state = result.getAttribute('data-state');
          // fuzzy capture slc
          const slcVariants = ['slc', 'salt lake'];
          if (slcVariants.includes(query)) query = 'salt lake city';
          if (location.includes(query) || city.includes(query) || state.includes(query)) {
            result.setAttribute('aria-hidden', false);
            visible += 1;
          }
        }
      });
    }
    // if no results, display no results message
    if (visible === 0) {
      const noResults = [...results].find((result) => result.className === 'search-result-empty');
      const span = noResults.querySelector('span');
      span.textContent = query;
      changeResultsVisibility(results, false);
      noResults.setAttribute('aria-hidden', false);
    }
  }
}

/**
 * decorates the search
 * @param {Element} block The search block element
 */
export default async function decorate(block) {
  const source = block.querySelector('a');
  block.innerHTML = '';

  if (source && source.href) {
    try {
      // fetch search content
      const resp = await fetch(source);
      if (resp.ok) {
        const { data } = await resp.json();
        if (data) {
          // create search results
          const wrapper = createEl('ul', {
            class: 'search-results',
          });
          // create fallback for no results
          const noResult = createEl('li', {
            class: 'search-result-empty',
            'aria-hidden': true,
            html: '<p>no results for <span></span>... but check out our other locations</p>',
          });
          wrapper.append(noResult);
          data.forEach((location) => {
            const result = createEl('li', {
              class: 'search-result',
              'data-location': location.location.toLowerCase(),
              'data-city': location.city.toLowerCase(),
              'data-state': location.state.toLowerCase(),
              'data-zip': location.zip,
              'aria-hidden': true,
              html: `<h3><a href="${location.link}">${location.name}</a></h3>
                ${location.location ? `<p><strong>${location.location}</strong></p>` : ''}
                <p>${location.address}, ${location.city}, ${location.state} ${location.zip}</p>
                <p><a href="tel:${location.phone.replaceAll('-', '')}">${location.phone}</a></p>
                ${location.type ? `<span>${location.type}</span>` : ''}`,
            });
            wrapper.append(result);
          });
          const results = wrapper.querySelectorAll('li');
          block.append(wrapper);
          // create search form
          const form = createEl('form', {
            class: 'search-form',
            html: `<div class="form-field">
                <input id="location-search" type="search" placeholder="search by city, state, or zip" />
                <label for="location-search">search by city, state, or zip</label>
              </div>
              <button type="submit" id="search-submit">search</button>
              <button type="button" id="search-show">show all locations</button>`,
          });
          const submitBtn = form.querySelector('#search-submit');
          submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            updateSearchResults(results, form.querySelector('input#location-search'));
          });
          const showBtn = form.querySelector('#search-show');
          showBtn.addEventListener('click', (e) => {
            e.preventDefault();
            form.querySelector('input#location-search').value = '';
            changeResultsVisibility(results, false);
          });
          // run search on keyboard form submit
          form.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const focused = document.activeElement;
              if (focused === showBtn) showBtn.click();
              else submitBtn.click();
            }
          });
          block.prepend(form);
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('could not fetch search results', error);
    }
  }
}
