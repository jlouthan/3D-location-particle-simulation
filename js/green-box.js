// Create a scene with a camera and renderer
let scene = new THREE.Scene();
const FIELD_OF_VIEW = 75;
const NEAR = 0.1;
const FAR = 1000;
let camera = new THREE.PerspectiveCamera(
  FIELD_OF_VIEW,
  window.innerWidth / window.innerHeight,
  NEAR,
  FAR
);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add green box to the scene
let geometry = new THREE.BoxGeometry(1, 1, 1);
let material = new THREE.MeshBasicMaterial({
  color: 0x00ff00
});
let cube = new THREE.Mesh(geometry, material);
scene.add(cube);
// Cube is added at 0, 0, 0 so zoom camera out a bit
camera.position.z = 5;

// Animate the scene for each frame
function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();
