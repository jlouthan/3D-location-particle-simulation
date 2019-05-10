// https://aerotwist.com/tutorials/creating-particles-with-three-js/
// view-source:https://aerotwist.com/static/tutorials/creating-particles-with-three-js/demo/

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


// End old green box settings, Begin settings from tutorial source
// // set the scene size
// 	var WIDTH = 400,
// 	    HEIGHT = 300;
//
// 	// set some camera attributes
// 	var VIEW_ANGLE = 45,
// 	    ASPECT = WIDTH / HEIGHT,
// 	    NEAR = 0.1,
// 	    FAR = 10000;
//
// 	// get the DOM element to attach to
// 	// - assume we've got jQuery to hand
// 	// var $container = $('#container');
//
// 	// create a WebGL renderer, camera
// 	// and a scene
// 	var renderer = new THREE.WebGLRenderer();
// 	var camera = new THREE.Camera(  VIEW_ANGLE,
// 	                                ASPECT,
// 	                                NEAR,
// 	                                FAR  );
// 	var scene = new THREE.Scene();
//
// 	// the camera starts at 0,0,0 so pull it back
// 	// camera.position.z = 300;
//
// 	// start the renderer - set the clear colour
// 	// to a full black
// 	// renderer.setClearColor(new THREE.Color(0, 1));
// 	// renderer.setSize(WIDTH, HEIGHT);
//
// 	// attach the render-supplied DOM element
// 	// $container.append(renderer.domElement);
//   document.getElementById('container').append(renderer.domElement);

// End settings from tutorial source

// Create particle material
const P_COUNT = 1800;
let pGeometry = new THREE.Geometry();
let pMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 8,
  map: new THREE.TextureLoader()
  .load('images/particle-aero.png')
});

// Create individual particles
for (let i = 0; i < P_COUNT; i++) {
  // random x, y, z for each particle
  let pX = Math.random() * 500 - 250;
  let pY = Math.random() * 500 - 250;
  let pZ = Math.random() * 500 - 250;

  let particle = new THREE.Vector3(pX, pY, pZ);

  // create a velocity vector
  particle.velocity = new THREE.Vector3(
			0,				// x
			-Math.random(),	// y
			0);				// z
  pGeometry.vertices.push(particle);
}

// pGeometry.computeBoundingSphere();

let particleSystem = new THREE.Points(
  pGeometry,
  pMaterial
);

scene.add(particleSystem);
camera.position.z = 5;

// Animate the scene for each frame
function animate() {
  requestAnimationFrame(animate);
  updateParticles();
  renderer.render(scene, camera);
}
animate();

function updateParticles() {
  // Animate particle cloud as a whole (spin around)
  particleSystem.rotation.y += 0.01;
  // Animate particles individually
  for (let i = 0; i < P_COUNT; i++) {

    // get the particle
    let particle = pGeometry.vertices[i];
    // check if we need to reset
    if (particle.y < -200) {
      particle.y = 200;
      // TODO could make particle its own class with velocity that can be updated
      // particle.velocity.y = 0;
    }

    // update the velocity with
    // a splat of randomniz
    particle.velocity.y -= Math.random() * .1;
    // let velocity = Math.random() * .1;

    // and the position
    // particle.position.addSelf(particle.velocity);
    // TODO could make particle its own class with position field
    particle.y += particle.y * particle.velocity.y;
  }

  // flag to the particle system
  // that we've changed its vertices.
  // particleSystem.
  //   geometry.
  //   __dirtyVertices = true;

  // particleSystem.geometry.verticesNeedUpdate = true;
  pGeometry.verticesNeedUpdate = true;
}
