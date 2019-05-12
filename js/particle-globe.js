// https://github.com/jeromeetienne/threex.planets
// http://learningthreejs.com/blog/2013/09/16/how-to-make-the-earth-in-webgl/
// http://blog.mastermaps.com/2013/09/creating-webgl-earth-with-threejs.html
// https://www.delimited.io/blog/2015/5/16/interactive-webgl-globes-with-threejs-and-d3
// http://bl.ocks.org/MaciejKus/61e9ff1591355b00c1c1caf31e76a668

const FIELD_OF_VIEW = 100;
const NEAR = 0.01;
const FAR = 1000;
const EARTH_RAD = 0.99;
const CLOUD_RAD = EARTH_RAD + 0.01;
const NUM_PARTICLES = 1000;

let isRotating = true;
let isZoomedIn = false;
const EXPANSION_MAX = 0.2;
const AMOUNT_POINT_ABOVE = 0.02;

let earth;
let particleCloud;
let camera;

// Draw the map for the default Earth texture so it's ready when we create mesh
let worldMap = new WorldMap();
worldMap.createDrawing().then(function () {

// Create a scene with a camera and renderer
  let scene = new THREE.Scene();
  camera	= new THREE.PerspectiveCamera(
    FIELD_OF_VIEW,
    window.innerWidth / window.innerHeight,
    NEAR,
    FAR
  );
  camera.position.z = 1.5;


  let renderer = new THREE.WebGLRenderer();
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

  // Render and update loop
  let clock = new THREE.Clock();

  // TODO in the end, after all animation, particles expand out infinitely and
  // become stars!

  function render(){
    requestAnimationFrame(render);

    let timeDelta = clock.getDelta(); // in seconds
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
  }

  render();
});

// Create global point from lat/long
// const edmondLat = 35.657295;
// const edmondLong = -97.478256;
// let zoomPoint = spherePointFromLatLong(edmondLat, edmondLong);
const budaLat = 47.49801;
const budaLong = 19.03991;
const nolaLat = 29.951065;
const nolaLong = -90.071533;
const pdxLat = 45.523064;
const pdxLong = -122.676483;
let zoomPoint = spherePointFromLatLong(pdxLat, pdxLong);
let zoomPoint2 = spherePointFromLatLong(nolaLat, nolaLong);
let count = 0;
document.body.onclick = function () {

  if (!isZoomedIn) {
    if (count % 2 == 0) {
      animateToPoint(zoomPoint);
    } else {
      animateToPoint(zoomPoint2);
    }
  } else {
    // Zoom out
    if (count % 2 == 0) {
      animateAwayFromPoint(zoomPoint);
    } else {
      animateAwayFromPoint(zoomPoint2);
    }
    count++;
  }

}

function animateToPoint(point) {
  let pointDestinations =
    particleCloud.getCopiesOfPointInClouds(point.clone(), AMOUNT_POINT_ABOVE);

  // Expand the particles
  particleCloud.expand(0, EXPANSION_MAX, true)
    .onComplete(function () {
      isRotating = false;
      // Then rotate Earth and swarm to point simultaneously
      spinToPoint(new THREE.Vector3(0, 0 , 1), point.clone(), true);
      particleCloud.swarmToPoints(
        pointDestinations,
        EXPANSION_MAX,
        AMOUNT_POINT_ABOVE,
        true
      ).onComplete(function () {
        // Finally zoom in
        zoomCamera(1.1, true, true);
      });
    });
}

function animateAwayFromPoint(point) {
  zoomCamera(1.5, false, true)
    .onComplete(function () {
      isZoomedIn = false;
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
      spinToPoint(
        point.clone(),
        // new THREE.Vector3(0, 0, 1)
        earth.mesh.worldToLocal(new THREE.Vector3(0, 0, 1)),
        true,
      ).onComplete(function () {
        isRotating = true;
      });
    });
}

// Returns Vector3 point on surface of earth mesh from
// given lat, long
function spherePointFromLatLong(lat, long) {
  // Formula from https://stackoverflow.com/questions/28365948/javascript-latitude-longitude-to-xyz-position-on-earth-threejs
  var phi   = (90 - lat) * (Math.PI/180);
  var theta = (long + 180) * (Math.PI/180);
  let radius = CLOUD_RAD;
  let x = -((radius) * Math.sin(phi) * Math.cos(theta));
  let z = ((radius) * Math.sin(phi) * Math.sin(theta));
  let y = ((radius) * Math.cos(phi));
  return new THREE.Vector3(x, y, z);
}

// Given a Vector3 startPoint and endPoint on the sphere, return Tween that
// spins the world around so that endPoint becomes startPoint
// Rotation code adapted from https://discourse.threejs.org/t/solved-using-quaternions-approach-to-rotate-sphere-from-clicked-point-towards-static-point/3272/8
function spinToPoint(startPoint, endPoint, startNow) {
  let startQuant = new THREE.Quaternion();
  startQuant.copy(earth.mesh.quaternion).normalize();

  let endQuant = new THREE.Quaternion();
  endQuant.setFromUnitVectors(
    endPoint.clone().normalize(),
    startPoint.clone().normalize()
  );

  let euler = new THREE.Euler();
  let spinAnimation = new TWEEN.Tween(startQuant).to(endQuant, 1500)
    // .delay(500)
    // .easing(TWEEN.Easing.Exponential.InOut)
    .onUpdate(function () {
      euler.setFromQuaternion(startQuant);
      earth.mesh.setRotationFromEuler(euler);
      earth.waterMesh.setRotationFromEuler(euler);
    });
  if (startNow) {
    spinAnimation.start();
  }
  return spinAnimation;
}

// Returns Tween that zooms camera from current position to endPosition.
function zoomCamera(endPosition, zoomingIn, startNow) {
  let zoomAnimation = new TWEEN.Tween({currentZoom: camera.position.z})
    .to({currentZoom: endPosition}, 1000)
    .onUpdate(function(obj) {
      camera.position.z = obj.currentZoom;
    })
    .onComplete(function () {
      isZoomedIn = zoomingIn;
    });
  if (startNow) {
    zoomAnimation.start();
  }
  return zoomAnimation;
}
