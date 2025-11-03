import './scss/main.css';
import * as THREE from 'three';
import { ArcballControls } from 'three/addons/controls/ArcballControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// === Splash Screen Logic ===
let isSplashComplete = false;

function initSplash() {
  const splashOverlay = document.getElementById('splashOverlay');
  const splashContainer = document.getElementById('splash-container');

  if (!splashOverlay || !splashContainer) {
    console.warn('Splash elements not found, completing splash immediately');
    completeSplash();
    return;
  }

  // Your splash animation code here
  // For example, you might have a video, animated canvas, or HTML animation
  // When ready to close splash, call completeSplash()

  // Example: Close splash on click/touch
  function handleSplashInteraction(e) {
    e.preventDefault();
    completeSplash();
  }

  splashOverlay.addEventListener('click', handleSplashInteraction);
  splashOverlay.addEventListener('touchend', handleSplashInteraction);

  // Auto-complete after 3 seconds (this ensures content always appears)
  setTimeout(completeSplash, 3000);
}

function completeSplash() {
  if (isSplashComplete) return;

  isSplashComplete = true;
  console.log('Splash complete - revealing experience');

  // Add the class to body to reveal main content
  document.body.classList.add('splash-complete');

  // Fade out and hide splash
  const splashOverlay = document.getElementById('splashOverlay');
  if (splashOverlay) {
    splashOverlay.classList.add('fade-out');

    setTimeout(() => {
      splashOverlay.classList.add('hidden');
      splashOverlay.style.display = 'none'; // Force hide
      window.dispatchEvent(new Event('splashComplete'));
      console.log('Splash hidden, experience should be visible');
    }, 1000);
  } else {
    // If no splash overlay, just dispatch the event
    window.dispatchEvent(new Event('splashComplete'));
  }
}

// Initialize splash when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSplash);
} else {
  initSplash();
}

// === Mobile Detection and Nina Protocol Button ===
function initMobileNinaButton() {
  const ninaButton = document.getElementById('nina-protocol-btn');
  const embedUrl = 'https://www.ninaprotocol.com/hubs/itsmandy';

  if (!ninaButton) {
    console.warn('Nina Protocol button not found');
    return;
  }

  // Check if mobile device
  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  }

  // Show/hide elements based on device
  function updateNinaSectionLayout() {
    const desktopEmbed = document.querySelector('.desktop-embed');
    if (!desktopEmbed) return;

    if (isMobileDevice()) {
      desktopEmbed.style.display = 'none';
      ninaButton.style.display = 'block';
    } else {
      desktopEmbed.style.display = 'block';
      ninaButton.style.display = 'none';
    }
  }

  // Initialize layout
  updateNinaSectionLayout();

  // Only add event listeners if on mobile
  if (isMobileDevice()) {
    // Touch handler for mobile (prevents 300ms delay)
    ninaButton.addEventListener('touchend', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Nina button touched - opening URL');
      window.open(embedUrl, '_blank');
    });

    // Prevent touch scroll
    ninaButton.addEventListener('touchstart', function(e) {
      e.preventDefault();
      console.log('Nina button touch started');
    });

    // Fallback click handler for mobile browsers
    ninaButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Nina button clicked - opening URL');
      window.open(embedUrl, '_blank');
    });
  }

  // Handle window resize
  window.addEventListener('resize', updateNinaSectionLayout);

  console.log('Nina Protocol mobile button initialized');
}

// === Section Navigation ===
window.jumpToSection = (sectionId) => {
  console.log('jumpToSection called with:', sectionId);

  // Hide all sections first
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(section => {
    section.classList.remove('active');
  });

  // Show the target section
  const targetSection = document.getElementById(sectionId);
  console.log('Target section found:', !!targetSection);

  if (targetSection) {
    targetSection.classList.add('active');
    console.log('Active class added to:', sectionId);

    // Prevent body scrolling when any section is active
    document.body.classList.add('section-active');

    // Special handling for curve section
    if (sectionId === 'section-curve') {
      // Keep experience visible but prevent interactions
      document.getElementById('experience').style.display = 'block';
      document.getElementById('experience').style.pointerEvents = 'none';
      console.log('Curve section opened');

      // Update Nina section layout when opened
      setTimeout(initMobileNinaButton, 100);
    } else {
      // Hide the 3D experience when other sections are open
      document.getElementById('experience').style.display = 'none';
      document.getElementById('experience').style.pointerEvents = 'auto';
    }
  }
};

// Close section function (called by the close buttons)
window.closeSection = () => {
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(section => {
    section.classList.remove('active');
  });

  // Remove section active class and restore scroll
  document.body.classList.remove('section-active');

  // Show and re-enable the 3D experience
  document.getElementById('experience').style.display = 'block';
  document.getElementById('experience').style.pointerEvents = 'auto';
};

// Optional: Close section when pressing Escape key
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    window.closeSection();
  }
});

// === Canvas & Scene ===
const canvas = document.querySelector('#experience-canvas');
const scene = new THREE.Scene();
const sizes = { width: window.innerWidth, height: window.innerHeight };

// === Lights ===
scene.add(new THREE.AmbientLight(0xffffff, 0.9));

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(0, -8, 6);

// Add mood with shadows and subtle effects
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;

// Add subtle rim light for depth
const rimLight = new THREE.DirectionalLight(0x445566, 0.3);
rimLight.position.set(0, 10, -5);
scene.add(rimLight);

scene.add(directionalLight);

// Optional: Add fog for atmosphere
scene.fog = new THREE.Fog(0x222233, 10, 30);

// === Camera ===
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(-0.27, 0, 7);
scene.add(camera);

// === Renderer ===
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = false;
renderer.setClearColor(0x000000, 0);

// === Controls ===
const controls = new ArcballControls(camera, renderer.domElement, scene);
controls.enablePan = false;
controls.enableZoom = true;
controls.enableRotate = true;
controls.minDistance = 5;
controls.maxDistance = 10;
controls.setGizmosVisible(false);

// === Raycaster ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const selectableObjects = [];

// === Drag Detection Variables ===
let isDragging = false;
let dragStartTime = 0;
let dragEndTime = 0;
const DRAG_THRESHOLD = 100; // milliseconds
const MOVE_THRESHOLD = 5; // pixels
const COOLDOWN_PERIOD = 50; // milliseconds

// UPDATED: Changed from URLs to section IDs
const objectLinks = {
  Cylinder: 'section-cylinder',
  mirror: 'section-mirror',
  Circle: 'section-circle',
  'Cylinder.001': 'section-cylinder2',
  Star: 'section-star',
  Curve: 'section-curve',
  lipstick: 'section-lipstick',
};

// === Drag Detection ===
function initInteractionEvents() {
  let dragStartX = 0;
  let dragStartY = 0;
  let isPotentialDrag = false;

  function updateMousePosition(event) {
    const clientX = event.clientX || (event.touches && event.touches[0].clientX);
    const clientY = event.clientY || (event.touches && event.touches[0].clientY);

    if (clientX && clientY) {
      mouse.x = (clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    }
  }

  function handleDragStart(event) {
    const clientX = event.clientX || (event.touches && event.touches[0].clientX);
    const clientY = event.clientY || (event.touches && event.touches[0].clientY);

    dragStartX = clientX;
    dragStartY = clientY;
    isPotentialDrag = true;
    dragStartTime = Date.now();
  }

  function handleDragMove(event) {
    if (!isPotentialDrag) return;

    const clientX = event.clientX || (event.touches && event.touches[0].clientX);
    const clientY = event.clientY || (event.touches && event.touches[0].clientY);

    const deltaX = Math.abs(clientX - dragStartX);
    const deltaY = Math.abs(clientY - dragStartY);

    // If movement exceeds threshold, consider it a drag
    if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
      isDragging = true;
      isPotentialDrag = false;
    }
  }

  function handleDragEnd() {
    const dragDuration = Date.now() - dragStartTime;
    dragEndTime = Date.now();

    // If it was a short click (not a drag), process the click
    if (!isDragging && dragDuration < DRAG_THRESHOLD) {
      handleIntersection();
    }

    // Reset drag state
    isDragging = false;
    isPotentialDrag = false;
  }

  function handleIntersection() {
    if (isDragging) return; // Ignore clicks if dragging

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(selectableObjects, false);

    if (intersects.length > 0) {
      let current = intersects[0].object;

      // Traverse up the hierarchy to find a named parent
      while (current && current !== scene) {
        if (current.name && objectLinks[current.name]) {
          console.log('Clicked:', current.name);
          // UPDATED: Jump to section instead of opening URL
          if (window.jumpToSection) {
            window.jumpToSection(objectLinks[current.name]);
          }
          break;
        }
        current = current.parent;
      }
    }
  }

  // Desktop events
  window.addEventListener('mousemove', (event) => {
    updateMousePosition(event);
    handleDragMove(event);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(selectableObjects, true);
    document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
  });

  window.addEventListener('mousedown', handleDragStart);
  window.addEventListener('mouseup', handleDragEnd);

  window.addEventListener('click', (event) => {
    if (!isDragging) {
      handleIntersection();
    }
  });

  // Mobile touch events
  window.addEventListener('touchstart', (event) => {
    updateMousePosition(event);
    handleDragStart(event);
  });

  window.addEventListener('touchmove', (event) => {
    updateMousePosition(event);
    handleDragMove(event);
  });

  window.addEventListener('touchend', (event) => {
    handleDragEnd();
    event.preventDefault(); // Prevent default browser behavior
  });

  console.log('Interaction events initialized with drag detection');
}

// Initialize interaction events only after splash completes
if (isSplashComplete) {
  initInteractionEvents();
} else {
  window.addEventListener('splashComplete', initInteractionEvents);
}

// === Setup Materials ===
function setupModelMaterials(model) {
  const tempSelectableObjects = [];

  model.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry) {
        child.geometry.computeVertexNormals();
        child.geometry.computeBoundingSphere();
        if (child.geometry.attributes.position) {
          child.geometry = BufferGeometryUtils.mergeVertices(child.geometry);
        }
      }

      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => {
            m.needsUpdate = true;
            m.envMapIntensity = 1.0;
            m.precision = 'mediump';
          });
        } else {
          child.material.needsUpdate = true;
          child.material.envMapIntensity = 1.0;
          child.material.precision = 'mediump';
        }
      }

      // Check both the child name AND parent names up the hierarchy
      let currentNode = child;
      while (currentNode && currentNode !== model) {
        if (currentNode.name && objectLinks[currentNode.name]) {
          tempSelectableObjects.push(child);
          break;
        }
        currentNode = currentNode.parent;
      }
    }
  });

  selectableObjects.length = 0;
  selectableObjects.push(...tempSelectableObjects);

  console.log('Selectable objects:', selectableObjects.length);
}

// === Fit Camera ===
function fitCameraToObject(model) {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
  cameraZ *= 1.5;
  camera.position.copy(center);
  camera.position.z += cameraZ;
  controls.target.copy(center);
  controls.update();
  camera.updateProjectionMatrix();
}

// === Load Magic 8-Ball ===
function loadMagic8Ball() {
  const container = document.getElementById('magic8ball-container');
  if (!container) return;

  // Create overlay to block clicks on experience
  const overlay = document.createElement('div');
  overlay.id = 'experience-overlay';
  document.body.appendChild(overlay);

  // Create toggle button - START HIDDEN
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'magic8ball-toggle';
  toggleBtn.innerHTML = '🎱';
  toggleBtn.setAttribute('aria-label', 'Toggle Magic 8-Ball');
  toggleBtn.classList.add('hidden'); // START HIDDEN
  document.body.appendChild(toggleBtn);

  // Create close button for inside the widget
  const closeBtn = document.createElement('button');
  closeBtn.className = 'magic8ball-close';
  closeBtn.innerHTML = '×';
  closeBtn.setAttribute('aria-label', 'Close Magic 8-Ball');

  const iframe = document.createElement('iframe');
  iframe.src = 'https://seabugs666.github.io/magic8ball/';
  iframe.style.background = 'transparent';
  iframe.style.border = 'none';

  container.appendChild(closeBtn);
  container.appendChild(iframe);

  // Toggle visibility function
  const toggleWidget = (isVisible) => {
    if (isVisible === undefined) {
      isVisible = !container.classList.contains('visible');
    }

    container.classList.toggle('visible', isVisible);
    toggleBtn.classList.toggle('hidden', isVisible);
    document.getElementById('experience').classList.toggle('blurred', isVisible);
    overlay.classList.toggle('active', isVisible);

    // Prevent body scroll when 8-ball is open
    if (isVisible) {
      document.body.classList.add('section-active');
    } else {
      document.body.classList.remove('section-active');
    }
  };

  // Function to show the toggle button after splash
  const showToggleButton = () => {
    toggleBtn.classList.remove('hidden');
    console.log('8-ball toggle button now visible with slow animation');
  };

  // Toggle on button click and touch
  function handleToggle() {
    toggleWidget();
  }

  // Desktop click
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent event from bubbling to overlay
    handleToggle();
  });

  // Mobile touch
  toggleBtn.addEventListener('touchend', (e) => {
    e.stopPropagation(); // Prevent event from bubbling to overlay
    e.preventDefault(); // Prevent default browser behavior
    handleToggle();
  });

  // Optional: Improve touch responsiveness
  toggleBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent any default touch behavior
  });

  // Close on close button click and touch (mobile only)
  function handleClose() {
    toggleWidget(false);
  }

  // Desktop click
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleClose();
  });

  // Mobile touch
  closeBtn.addEventListener('touchend', (e) => {
    e.stopPropagation();
    e.preventDefault();
    handleClose();
  });

  // Improve touch responsiveness
  closeBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
  });

  // Close when clicking on the overlay (outside the widget)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      toggleWidget(false);
    }
  });

  // Check if splash is already complete, otherwise wait for event
  if (isSplashComplete) {
    showToggleButton();
  } else {
    window.addEventListener('splashComplete', showToggleButton);
  }

  setTimeout(() => {
    container.style.opacity = 1;
  }, 300);
}

// === Load Model ===
const dracoLoader = new DRACOLoader();
// FIXED: Use BASE_URL for GitHub Pages
dracoLoader.setDecoderPath(`${import.meta.env.BASE_URL}draco/`);

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// FIXED: Use BASE_URL for GitHub Pages
gltfLoader.load(`${import.meta.env.BASE_URL}models/mandystar.glb`, (glb) => {
  const model = glb.scene;

  // DEBUG: Log all object names in the model
  console.log('=== Model Structure ===');
  model.traverse((child) => {
    if (child.name) {
      console.log(`${child.type}: "${child.name}"`);
    }
  });
  console.log('======================');

  setupModelMaterials(model);
  scene.add(model);
  fitCameraToObject(model);
  model.position.x -= 0.15;
  loadMagic8Ball();
}, undefined, (error) => {
  console.error('Error loading model:', error);
});

// === Resize ===
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
});

// === Animation Loop ===
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();

// === Mobile Close Button Touch Handling ===
function initCloseButtons() {
  const closeButtons = document.querySelectorAll('.section-close');
  console.log('Found close buttons:', closeButtons.length);

  closeButtons.forEach(button => {
    // Remove any existing event listeners to avoid duplicates
    button.replaceWith(button.cloneNode(true));
  });

  // Re-select after cloning
  const freshCloseButtons = document.querySelectorAll('.section-close');

  freshCloseButtons.forEach(button => {
    // Touch event for mobile
    button.addEventListener('touchend', (e) => {
      console.log('Close button touched');
      e.preventDefault();
      e.stopPropagation();
      window.closeSection();
    });

    // Click event for desktop
    button.addEventListener('click', (e) => {
      console.log('Close button clicked');
      e.preventDefault();
      e.stopPropagation();
      window.closeSection();
    });

    // Prevent default touch behavior
    button.addEventListener('touchstart', (e) => {
      e.preventDefault();
    });

    // Add visual feedback for mobile
    button.addEventListener('touchstart', () => {
      button.style.opacity = '0.7';
    });

    button.addEventListener('touchend', () => {
      button.style.opacity = '1';
    });

    button.addEventListener('touchcancel', () => {
      button.style.opacity = '1';
    });
  });
}

// Initialize close buttons when DOM is ready and after sections might be created
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCloseButtons);
} else {
  initCloseButtons();
}

// Also re-initialize when sections are opened (in case they're dynamically created)
const originalJumpToSection = window.jumpToSection;
window.jumpToSection = function(sectionId) {
  originalJumpToSection(sectionId);
  // Re-initialize close buttons after a short delay to ensure DOM is updated
  setTimeout(initCloseButtons, 100);
};

// === Cleanup ===
window.addEventListener('beforeunload', () => {
  renderer.dispose();
  controls.dispose();
  scene.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(m => m.dispose());
      } else {
        object.material.dispose();
      }
    }
  });
});

// === Load Shows from Google Sheets ===
const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnRQ8QejJlN5be3luBoaplehZmeLH5zYVbGDk4QsemytyzTMAfOsmXjL9WC_gyb0U87I3_9rlVP0rm/pub?output=csv";

async function loadShowsFromGoogleSheet() {
  try {
    const response = await fetch(sheetURL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const text = await response.text();
    const lines = text.trim().split('\n');

    const upcomingList = document.getElementById('upcoming-shows');
    const archiveList = document.getElementById('archived-shows');
    if (!upcomingList || !archiveList) return;

    upcomingList.innerHTML = '';
    archiveList.innerHTML = '';

    const today = new Date();

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split CSV respecting quotes and commas inside quotes
      const row = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(c => c.replace(/^"|"$/g, '').trim());
      if (!row || row.length < 3) continue;

      const [dateStr, venue, city] = row;

      // Skip lines that contain the word 'Archives'
      if (dateStr.toLowerCase().includes('archives')) continue;

      // Parse the date
      let showDate = new Date(dateStr);
      if (isNaN(showDate)) showDate = new Date(0); // fallback for invalid dates

      const li = document.createElement('li');
      li.textContent = `${dateStr} – ${venue} – ${city}`;

      if (showDate >= today) {
        upcomingList.appendChild(li);
      } else {
        archiveList.appendChild(li);
      }
    }
  } catch (err) {
    console.error('Error loading shows:', err);
    const upcomingList = document.getElementById('upcoming-shows');
    const archiveList = document.getElementById('archived-shows');
    if (upcomingList) upcomingList.textContent = 'Could not load shows.';
    if (archiveList) archiveList.textContent = 'Could not load shows.';
  }
}

// Initialize Nina Protocol mobile button when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileNinaButton);
} else {
  initMobileNinaButton();
}

// Also initialize when splash completes
window.addEventListener('splashComplete', initMobileNinaButton);

document.addEventListener('DOMContentLoaded', loadShowsFromGoogleSheet);