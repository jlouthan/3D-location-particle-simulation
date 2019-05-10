// https://codepen.io/antishow/post/three-js-particles
let TAU = Math.PI * 2;
let NUM_PARTICLES = 1000;
// Global variables
let width, height;
let scene, camera, renderer, pointCloud;

// Initialization
// TODO maybe this is separate function?
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(
  120,
  16 / 9,
  1,
  1000
);

renderer = new THREE.WebGLRenderer();
document.body.appendChild(renderer.domElement);
window.addEventListener('resize', onWindowResize);
onWindowResize();

// Create Particle System
let pMaterial = new THREE.PointsMaterial({
  size: 5,
  vertexColors: THREE.VertexColors
});
let pGeometry = new THREE.Geometry();
for (let i = 0; i < NUM_PARTICLES; i++) {
  let x = Math.random() * 800 - 400;
  let y = Math.random() * 800 - 400;
  let z = Math.random() * 800 - 400;
  pGeometry.vertices.push(
    new THREE.Vector3(x, y, z)
  );
  // Color it too
  pGeometry.colors.push(
    new THREE.Color(
      Math.random(),
      Math.random(),
      Math.random()
    )
  );
}

pointCloud = new THREE.Points(pGeometry, pMaterial);
scene.add(pointCloud);

function render(){
  requestAnimationFrame(render);
  // Move around particles w/ Brownian motion
  for (let i = 0; i < pGeometry.vertices.length; i++) {
    let particle = pGeometry.vertices[i];
    let dX = Math.random() * 2 - 1;
    let dY = Math.random() * 2 - 1;
    let dZ = Math.random() * 2 - 1;
    particle.add(new THREE.Vector3(dX, dY, dZ));
    // Colors change randomly each frame
    pGeometry.colors[i] = new THREE.Color(
      Math.random(),
      Math.random(),
      Math.random()
    );
  }
  pGeometry.verticesNeedUpdate = true;
  renderer.render(scene, camera);
}

render();

function onWindowResize(){
  width = window.innerWidth;
  height = window.innerHeight;
  // update renderer size
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
