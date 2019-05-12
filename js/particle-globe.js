// https://github.com/jeromeetienne/threex.planets
// http://learningthreejs.com/blog/2013/09/16/how-to-make-the-earth-in-webgl/
// http://blog.mastermaps.com/2013/09/creating-webgl-earth-with-threejs.html
// https://www.delimited.io/blog/2015/5/16/interactive-webgl-globes-with-threejs-and-d3
// http://bl.ocks.org/MaciejKus/61e9ff1591355b00c1c1caf31e76a668

// Constants
const FIELD_OF_VIEW = 100;
const NEAR = 0.01;
const FAR = 1000;
const EARTH_RAD = 0.99;
const CLOUD_RAD = EARTH_RAD + 0.01;
const NUM_PARTICLES = 1000;
const EXPANSION_MAX = 0.2;
const AMOUNT_POINT_ABOVE = 0.02;
const ZOOM_ANIMATION_DURATION = 800;

// Variables multiple functions need access to
let earth;
let particleCloud;
let camera, renderer, scene;
let isRotating = true;

// // Temp lat/longs
// let latLongs = [
//   [47.49801, 19.03991],
//   [29.951065, -90.071533],
//   [45.523064, -122.676483],
//   [40.332370, -74.656540]
// ];

let latLongs = facebookLocations;

// Initialize variables used to guide animations in render()
let clock = new THREE.Clock();
let currentDeltaLarge = 0;
let currentIndex = 0;

// Draw the map for the default Earth texture so it's ready when we create mesh
let worldMap = new WorldMap();
worldMap.createDrawing().then(function () {

  initScene();
  // TODO in the end, after all animation, particles expand out infinitely and
  // become stars!
  render();

});

function initScene() {
  // Create a scene with a camera and renderer
    scene = new THREE.Scene();
    camera	= new THREE.PerspectiveCamera(
      FIELD_OF_VIEW,
      window.innerWidth / window.innerHeight,
      NEAR,
      FAR
    );
    camera.position.z = 1.5;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add some light
    // TODO: play with this so it's not exactly same as demo
    let light	= new THREE.AmbientLight(0x888888);
    scene.add(light);
    let dirLight	= new THREE.DirectionalLight(0xcccccc, 0.5);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    // Create and add the Earth
    earth = new Earth(EARTH_RAD, false, worldMap.canvas);
    if (earth.waterMesh) {
      scene.add(earth.waterMesh);
    }
    scene.add(earth.mesh);
    earth.addClouds();

    particleCloud = new ParticleCloud(
      NUM_PARTICLES,
      0.01,
      0xffffff,
      earth.cloudMesh,
      earth.cloudRadius
    );
    earth.mesh.add(particleCloud.mesh);

}

// Render and update loop
function render() {
  requestAnimationFrame(render);

  let timeDelta = clock.getDelta(); // in seconds
  currentDeltaLarge += timeDelta;

  // Rotate the earth and clouds
  if (isRotating) {
    // Rotate Water
    earth.waterMesh.rotateY(1/5 * timeDelta);
    // Rotate Earth
    earth.mesh.rotateY(1/5 * timeDelta);
    // Rotate clouds
    earth.cloudMesh.rotateY(1/3 * timeDelta);
  }
  renderer.render(scene, camera);
  TWEEN.update();

  // Kick off the particle animation for next lat, long pair if needed
  if (currentDeltaLarge >= 10) {
    console.log('10 sec elapsed');
    currentDeltaLarge = 0;
    // Repeat the animation if it's ended
    if (currentIndex >= latLongs.length) {
      currentIndex = 0;
    }
    console.log('about to show index: ', currentIndex);
    let zoomPoint = earth.pointFromLatLong(
      latLongs[currentIndex][0],
      latLongs[currentIndex][1]
    );
    animateToPoint(zoomPoint, function () {
      animateAwayFromPoint(zoomPoint);
    });
    currentIndex++;
  }
}

function animateToPoint(point, callback) {
  let pointDestinations =
    particleCloud.getCopiesOfPointInClouds(point.clone(), AMOUNT_POINT_ABOVE);

  // Expand the particles
  return particleCloud.expand(0, EXPANSION_MAX, true)
    .onComplete(function () {
      isRotating = false;
      // Then rotate Earth and swarm to point simultaneously
      earth.spinToPoint(new THREE.Vector3(0, 0 , 1), point.clone(), true);
      particleCloud.swarmToPoints(
        pointDestinations,
        EXPANSION_MAX,
        AMOUNT_POINT_ABOVE,
        true
      ).onComplete(function () {
        // Finally zoom in
        zoomCamera(1.1, true, true).onComplete(callback);
      });
    });
}

function animateAwayFromPoint(point) {
  zoomCamera(1.5, false, true)
    .onComplete(function () {
      // Swarm back to starting positions
      particleCloud.swarmToPoints(
        particleCloud.initialPositions,
        AMOUNT_POINT_ABOVE,
        EXPANSION_MAX,
        true
      ).onComplete(function () {
        // Shrink particles
        particleCloud.expand(EXPANSION_MAX, 0, true);
      });
      // Spin back to normal perspective
      earth.spinToPoint(
        point.clone(),
        // new THREE.Vector3(0, 0, 1)
        earth.mesh.worldToLocal(new THREE.Vector3(0, 0, 1)),
        true,
      ).onComplete(function () {
        isRotating = true;
      });
    });
}

// Returns Tween that zooms camera from current position to endPosition.
function zoomCamera(endPosition, zoomingIn, startNow) {
  let zoomAnimation = new TWEEN.Tween({currentZoom: camera.position.z})
    .to({currentZoom: endPosition}, ZOOM_ANIMATION_DURATION)
    .onUpdate(function(obj) {
      camera.position.z = obj.currentZoom;
    });
  if (startNow) {
    zoomAnimation.start();
  }
  return zoomAnimation;
}
