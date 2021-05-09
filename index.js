class PageDetails {
  constructor() {
    this.artList = [];
    this.currentPage = 1;
    this.pageSize = 6;
    this.searchText = '';
    this.isFetching = false;
  }

  // Url constructor method
  getFetchUrl = () => {
    const fields = ['id', 'title', 'artist_display', 'date_display', 'thumbnail', 'image_id'];
    return this.searchText
      ? `https://api.artic.edu/api/v1/artworks/search?q=${this.searchText}&page=${this.currentPage}&limit=${this.pageSize}&fields=${fields.join(',')}`
      : `https://api.artic.edu/api/v1/artworks?page=${this.currentPage}&limit=${this.pageSize}&fields=${fields.join(',')}`;
  }

  // Increments current page
  incrementPage = () => {
    this.currentPage = this.currentPage + 1;
  }

  // Decrements current page
  decrementPage = () => {
    this.currentPage = this.currentPage - 1;
  }

  // Adds an artwork object to the list of artworks
  addArtwork = (artwork) => {
    this.artList.push(artwork);
  }

  // Clears the artworkList element of previously rendered artwork
  clearContents = () => {
    document.getElementById('artworkList').innerHTML = '';
  }

  // Shows loader when fetch request is being made
  startLoading = () => {
    this.isFetching = true;
    this.clearContents();
    document.getElementById('loader').classList.remove('hidden');
  }

  // Removes loader when fetch request is complete
  finishLoading = () => {
    this.isFetching = false;
    document.getElementById('loader').classList.add('hidden');
  }

  // Manages search information
  search = (searchText) => {
    this.artList = [];
    this.currentPage = 1;
    this.searchText = searchText;
  }
}
const pageDetails = new PageDetails();

class Artwork {
  constructor(id, title, artist, date, alt_text, image_id) {
    this.id = id;
    this.title = title;
    this.artist = artist;
    this.date = date;
    this.alt_text = alt_text;
    this.image_id = image_id;
    this.image = null;
  }

  // Fetch method to retrieve the artwork image
  fetchImage = async () => {
    if (this.image_id) {
      try {
        const response = await fetch(`https://www.artic.edu/iiif/2/${this.image_id}/full/843,/0/default.jpg`);
        const image = await response.blob();
        const imageUrl = URL.createObjectURL(image);
        this.image = imageUrl;
      } catch (err) {
        this.image = null;
      }
    } else {
      this.image = null;
    }
  }

  // Render method for artwork object
  render = async () => {
    const fields = [
      {
        fieldName: 'title',
        displayClass: 'artwork-container__title'
      },
      {
        fieldName: 'artist',
        displayClass: 'artwork-container__artist'
      },
      {
        fieldName: 'date',
        displayClass: 'artwork-container__date'
      },
    ];

    // Render the artwork details
    const renderDetails = (container) => {
      fields.forEach(field => {
        let textElement = document.createElement('p');
        textElement.classList.add(field.displayClass);
        textElement.textContent = this[field.fieldName] || 'Unavailable';
        container.appendChild(textElement);
      });
    }

    // Render the image element
    const renderImage = (container) => {
      if (this.image) {
        const element = document.createElement('img');
        element.setAttribute('src', this.image);
        element.setAttribute('alt', this.alt_text);
        element.classList.add('artwork-container__image-container__image');
        container.appendChild(element);
      } else {
        const element = document.createElement('p');
        element.textContent = "Image unavailable";
        container.appendChild(element);
      }
    }

    // Render the artwork container
    let container = document.createElement('div');
    let imgContainer = document.createElement('div');
    let detailsContainer = document.createElement('div');

    container.classList.add('artwork-container');
    imgContainer.classList.add('artwork-container__image-container');
    container.appendChild(imgContainer);
    container.appendChild(detailsContainer);
    document.getElementById('artworkList').appendChild(container);
    renderDetails(detailsContainer);
    // If the image has not already been fetched, try and retrieve the image
    if (!this.image) await this.fetchImage();
    renderImage(imgContainer);
  }
}

// Loop through previously fetched artwork and re-render
const renderArtwork = () => {
  let start = (pageDetails.currentPage - 1) * pageDetails.pageSize;

  pageDetails.clearContents();
  for (let i = start; i < start + pageDetails.pageSize; i++) {
    pageDetails.artList[i].render();
  }
}

// Fetch request
const fetchArtwork = async () => {
  if (!pageDetails.isFetching) {
    try {
      pageDetails.startLoading();
      const response = await fetch(pageDetails.getFetchUrl());
      const artworks = await response.json();
      pageDetails.finishLoading();
      // Add results to artwork container
      if (artworks.data.length > 0) {
        artworks.data.forEach(art => {
          pageDetails.addArtwork(
            new Artwork(
              art.id,
              art.title,
              art.artist_display,
              art.date_display,
              art.thumbnail ? art.thumbnail.alt_text : art.title,
              art.image_id
            )
          );
        });
        renderArtwork();
      } else {
        document.getElementById('artworkList').textContent = 'No available artwork';
      }
    } catch (err) {
      alert(err);
    }
  }
}

const registerEventListeners = () => {
  // Click listener for next button
  const manageNext = () => {
    pageDetails.incrementPage();
    // If artwork has already been loaded for this range, do not refetch
    if (pageDetails.artList.length >= (pageDetails.currentPage * pageDetails.pageSize)) {
      renderArtwork();
    } else {
      fetchArtwork();
    }
    // If the current page is not the first page, enable the previous button
    if (pageDetails.currentPage !== 1) {
      previousBtn.removeAttribute('disabled');
    }
  }

  // Click listener for previous button =
  const managePrevious = () => {
    pageDetails.decrementPage();
    renderArtwork();

    // If the current page is the first page, disable the previous button
    if (pageDetails.currentPage === 1) {
      previousBtn.setAttribute('disabled', true);
    }
  }

  // Click listener for search button
  const manageSearch = () => {
    const searchInput = document.getElementById('searchInput');
    const searchText = searchInput.value;
    pageDetails.search(searchText);
    fetchArtwork();
  }

  // Register click listeners
  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn) nextBtn.addEventListener('click', manageNext);
  const previousBtn = document.getElementById('previousBtn');
  if (previousBtn) previousBtn.addEventListener('click', managePrevious);
  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) searchBtn.addEventListener('click', manageSearch);
}

// Initialize the page
(() => {
  registerEventListeners();
  fetchArtwork();
})();