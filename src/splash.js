import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let splashScene, splashCamera, splashRenderer;
let mixer;
let animations = [];
let isPlaying = false;
let clock = new THREE.Clock(); // Add clock for delta time

// Add this at the top
export let isSplashComplete = false;

export function initSplash() {
  const splashOverlay = document.getElementById('splashOverlay');
  const container = document.getElementById('splash-container');

  if (!splashOverlay) return;

  // Set up Three.js scene for splash
  splashScene = new THREE.Scene();

  // Use Orthographic Camera
  const aspect = window.innerWidth / window.innerHeight;
  const frustumSize = 5;
  splashCamera = new THREE.OrthographicCamera(
    frustumSize * aspect / -2,
    frustumSize * aspect / 2,
    frustumSize / 2,
    frustumSize / -2,
    0.1,
    1000
  );

  splashRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  splashRenderer.setSize(window.innerWidth, window.innerHeight);
  splashRenderer.setClearColor(0x000000, 0);
  container.appendChild(splashRenderer.domElement);

  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  splashScene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  splashScene.add(directionalLight);

  // Load your GLB model
  const loader = new GLTFLoader();
  loader.load(
    '/models/shade.glb',
    (gltf) => {
      const model = gltf.scene;
      splashScene.add(model);

      // Set up animation mixer for ALL animations
      if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);

        // Load ALL animations but don't play them yet
        gltf.animations.forEach((clip, index) => {
          const action = mixer.clipAction(clip);
          action.setLoop(THREE.LoopOnce);
          action.clampWhenFinished = true;
          action.paused = true; // Start paused
          animations.push({
            action: action,
            clip: clip,
            originalTimeScale: 1 // Store original speed
          });
          console.log(`Loaded animation: ${clip.name}`);
        });

        console.log(`Total animations loaded: ${gltf.animations.length}`);
      }

      // Position camera for orthographic view
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      splashCamera.position.set(center.x, center.y, 5);
      splashCamera.lookAt(center);
    },
    (progress) => {
      console.log('Loading model...', (progress.loaded / progress.total) * 100 + '%');
    },
    (error) => {
      console.error('Error loading model:', error);
    }
  );

  // Click and touch to play animation and hide
  function handleSplashInteraction() {
    if (!isPlaying) {
      playSplashAnimation();
    }
  }

  // Desktop click
  splashOverlay.addEventListener('click', handleSplashInteraction);

  // Mobile touch
  splashOverlay.addEventListener('touchend', (event) => {
    event.preventDefault(); // Prevent default behavior
    handleSplashInteraction();
  });

  // Optional: Add touchstart for better mobile responsiveness
  splashOverlay.addEventListener('touchstart', (event) => {
    event.preventDefault(); // Prevent any default touch behavior
  });

  // Auto-hide after 30 seconds if no interaction
  setTimeout(() => {
    if (!splashOverlay.classList.contains('hidden') && !isPlaying) {
      playSplashAnimation();
    }
  }, 30000);

  // Animation loop - only update mixer when animation is playing
  function animate() {
    requestAnimationFrame(animate);

    if (mixer && isPlaying) {
      const delta = clock.getDelta();
      mixer.update(delta);

      // RAMP DOWN SPEED AT FRAME 10
      animations.forEach(anim => {
        const time = anim.action.time;
        const fps = 30; // Assuming 30fps animation
        const currentFrame = time * fps;

        if (currentFrame >= 10) {
          // Calculate how many frames past frame 10 we are
          const framesPast10 = currentFrame - 10;
          // Slow down gradually over the next 10 frames
          const slowDown = Math.max(0.1, 1 - (framesPast10 / 10));
          anim.action.setEffectiveTimeScale(slowDown);
        }
      });
    }

    splashRenderer.render(splashScene, splashCamera);
  }
  animate();

  // Handle window resize
  window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 5;

    splashCamera.left = frustumSize * aspect / -2;
    splashCamera.right = frustumSize * aspect / 2;
    splashCamera.top = frustumSize / 2;
    splashCamera.bottom = frustumSize / -2;

    splashCamera.updateProjectionMatrix();
    splashRenderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function playSplashAnimation() {
  const splashOverlay = document.getElementById('splashOverlay');

  if (isPlaying) return; // Prevent multiple clicks

  isPlaying = true;

  // Reset clock and time scales
  clock.start();

  if (mixer && animations.length > 0) {
    console.log(`Playing ${animations.length} animations`);

    // Play ALL animations simultaneously
    animations.forEach((anim, index) => {
      anim.action.reset();
      anim.action.setEffectiveTimeScale(1); // Reset to normal speed
      anim.action.paused = false;
      anim.action.play();
      console.log(`Playing animation ${index + 1}: ${anim.clip.name}`);
    });

    // Hide after animation completes
    const longestAnimation = Math.max(...animations.map(anim => anim.clip.duration));
    const hideDelay = (longestAnimation * 1000) + 500;

    console.log(`Longest animation: ${longestAnimation}s, hiding in: ${hideDelay}ms`);

    setTimeout(() => {
      // Add fade-out class for smooth opacity transition
      splashOverlay.classList.add('fade-out');

      // Wait for fade-out to complete before hiding and dispatching event
      setTimeout(() => {
        splashOverlay.classList.add('hidden');
        isPlaying = false;
        isSplashComplete = true;
        window.dispatchEvent(new CustomEvent('splashComplete'));
      }, 1000); // Match this with CSS transition duration
    }, hideDelay);

  } else {
    console.log('No animations found, hiding immediately');
    // Also add fade-out for the else case
    splashOverlay.classList.add('fade-out');
    setTimeout(() => {
      splashOverlay.classList.add('hidden');
      isPlaying = false;
      isSplashComplete = true;
      window.dispatchEvent(new CustomEvent('splashComplete'));
    }, 1000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initSplash);