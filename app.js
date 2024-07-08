document.addEventListener('DOMContentLoaded', function() {
  const links = document.querySelectorAll('.menu ul li a, .menu ul li ion-icon');

  links.forEach(link => {
    link.addEventListener('click', function(event) {
      event.preventDefault(); // Prevent default link behavior

      // Remove 'active' class from all menu items
      document.querySelectorAll('.menu ul li').forEach(item => {
        item.classList.remove('active');
      });

      // Determine the clicked element type and its ID
      let clickedElementId = event.target.id || event.target.parentElement.id;

      // Handle click on the image (navigate icon)
      if (event.target.tagName === 'IMG' && event.target.id === 'navigate-img') {
        clickedElementId = 'navigate-link'; // Set ID to match the navigate link ID
      }

      // Add 'active' class to the clicked item for indicator
      const clickedItem = document.getElementById(clickedElementId);
      if (clickedItem) {
        clickedItem.closest('li').classList.add('active');
      }

      // Navigate to the respective HTML page
      if (clickedItem.getAttribute('href')) {
        window.location.href = clickedItem.getAttribute('href');
      }
    });
  });

  // Highlight the current page's link based on URL path
  const pathName = window.location.pathname;
  const currentPage = pathName.substring(pathName.lastIndexOf('/') + 1);

  document.querySelectorAll('.menu ul li a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.closest('li').classList.add('active');
    }
  });

  // Handle click on the "START NAVIGATION" button
  const startNavButton = document.getElementById('start-navigation-button');
  if (startNavButton) {
    startNavButton.addEventListener('click', function(event) {
      event.preventDefault();
      const navigateLink = document.getElementById('navigate-link');
      if (navigateLink) {
        navigateLink.closest('li').classList.add('active');
      }
      window.location.href = 'navigate.html';
    });
  }

  // Handle click on the "During" button specifically
  const duringButton = document.querySelector('.during');
  if (duringButton) {
    duringButton.addEventListener('click', function(event) {
      event.preventDefault();
      window.location.href = 'during.html'; // Load during.html content
    });
  }

  // Handle click on the "Before" button specifically
  const beforeButton = document.querySelector('.before');
  if (beforeButton) {
    beforeButton.addEventListener('click', function(event) {
      event.preventDefault();
      window.location.href = 'before.html'; // Load before.html content
    });
  }

  // Handle click on the "After" button specifically
  const afterButton = document.querySelector('.after');
  if (afterButton) {
    afterButton.addEventListener('click', function(event) {
      event.preventDefault();
      window.location.href = 'after.html'; // Load after.html content
    });
  }

  // Set active state for Before, During, After links on information.html
  const currentPageWithoutExtension = currentPage.split('.')[0]; // Remove .html extension
  if (currentPageWithoutExtension === 'before' || currentPageWithoutExtension === 'during' || currentPageWithoutExtension === 'after') {
    const infoLink = document.getElementById('info-link');
    if (infoLink) {
      infoLink.closest('li').classList.add('active');
    }
  }

  // Handle click on the image specifically
  const navigateImg = document.getElementById('navigate-img');
  if (navigateImg) {
    navigateImg.addEventListener('click', function(event) {
      event.preventDefault();
      const navigateLink = document.getElementById('navigate-link');
      navigateLink.closest('li').classList.add('active');
      window.location.href = navigateLink.getAttribute('href');
    });
  }
});


