// Test setup file for Jest
// This file runs before all tests to set up the environment

// Mock canvas and browser APIs
global.HTMLCanvasElement.prototype.getContext = function() {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'top',
    globalAlpha: 1,
    fillRect: () => {},
    strokeRect: () => {},
    clearRect: () => {},
    fillText: () => {},
    strokeText: () => {},
    measureText: () => ({ width: 0 }),
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    arcTo: () => {},
    ellipse: () => {},
    rect: () => {},
    fill: () => {},
    stroke: () => {},
    clip: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    transform: () => {},
    setTransform: () => {},
    resetTransform: () => {},
    drawImage: () => {},
    createLinearGradient: () => ({
      addColorStop: () => {}
    }),
    createRadialGradient: () => ({
      addColorStop: () => {}
    }),
    createPattern: () => {},
    getImageData: () => ({
      data: new Uint8ClampedArray(),
      width: 0,
      height: 0
    }),
    putImageData: () => {},
    setLineDash: () => {},
    getLineDash: () => [],
  };
};

// Mock performance.now()
let mockTime = Date.now();
if (!global.performance) {
  global.performance = {};
}
global.performance.now = () => mockTime;

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1920,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 1080,
});

// Mock localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};
global.localStorage = localStorageMock;

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 16);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};
