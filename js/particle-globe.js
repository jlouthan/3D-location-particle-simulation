// https://github.com/jeromeetienne/threex.planets
// http://learningthreejs.com/blog/2013/09/16/how-to-make-the-earth-in-webgl/
// http://blog.mastermaps.com/2013/09/creating-webgl-earth-with-threejs.html
// https://www.delimited.io/blog/2015/5/16/interactive-webgl-globes-with-threejs-and-d3
// http://bl.ocks.org/MaciejKus/61e9ff1591355b00c1c1caf31e76a668

// Draw the map for the default Earth texture so it's ready when we create mesh
let worldMap = new WorldMap();
worldMap.createDrawing().then(function () {

// Create a scene with a camera and renderer
let scene = new THREE.Scene();

const FIELD_OF_VIEW = 100;
const NEAR = 0.01;
const FAR = 1000;
const EARTH_RAD = 0.99;
const CLOUD_RAD = EARTH_RAD + 0.01;
const NUM_PARTICLES = 1000;
let camera	= new THREE.PerspectiveCamera(
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
let earth = new Earth(EARTH_RAD, false, worldMap.canvas);
if (earth.waterMesh) {
  scene.add(earth.waterMesh);
}
scene.add(earth.mesh);
earth.addClouds();

let particleCloud = new ParticleCloud(
  NUM_PARTICLES,
  0.01,
  0xffffff,
  earth.cloudMesh,
  earth.cloudRadius
);
earth.mesh.add(particleCloud.mesh);

// Render and update loop
let clock = new THREE.Clock();

// TODO make these nicer
let isRotating = true;
let isZooming = false;
let isZoomingOut = false;
let isZoomedIn = false;
let expandingParticles = false;
let expansionOffset = 0;
const EXPANSION_MAX = 0.2;
let shrinkingParticles = false;
let shrinkingOffset = EXPANSION_MAX;
const SHRINKING_MIN = 0.01
// TODO in the end, after all animation, particles expand out infinitely and
// become stars!

let initialFacingCamera = new THREE.Vector3(0, 0, 1);

function render(){
  requestAnimationFrame(render);

  let timeDelta = clock.getDelta(); // in seconds
  if (isRotating) {
    // Rotate Water
    // waterMesh.rotateY(1/5 * timeDelta);
    // // Rotate Earth
    // earthMesh.rotateY(1/5 * timeDelta);
    earth.waterMesh.rotateY(1/5 * timeDelta);
    // Rotate Earth
    earth.mesh.rotateY(1/5 * timeDelta);
    // Rotate clouds
    earth.cloudMesh.rotateY(1/3 * timeDelta);
  }
  if (isZooming) {
    camera.position.z -= 0.007;
    if (camera.position.z <= 1.1) {
      isZooming = false;
      isZoomedIn = true;
    }
  }
  if (isZoomingOut) {
    camera.position.z += 0.007;
    if (camera.position.z >= 1.505) {
      isZoomingOut = false;
      // We're zoomed back out, undo the rotation
      // TODO this doesn't go back to where it should...
      let rotation = spinToPoint(
        zoomPoint.clone(),
        // new THREE.Vector3(0, 0, 1)
        earth.mesh.worldToLocal(new THREE.Vector3(0, 0, 1))
      );

      // TODO refactor so there's not so much repeated here ad in swarm code
      let lineCurves = [];
      for (let i = 0; i < particleCloud.mesh.geometry.vertices.length; i++) {
        let startPoint = particleCloud.mesh.geometry.vertices[i];
        // TODO could be replaced with simple updates in the render loop. Is that
        // better or should I use Tween for everything for consistency??
        // Create a 3d line segment between the two points.
        lineCurves.push(
          new THREE.LineCurve3(startPoint.clone(), particleCloud.initialPositions[i].clone())
        );
      }
      // For each timestep, move the points to the spots along the line for
      // that timestep, projected onto the clouds
      let amountAbove = 0.02;
      let animation = new TWEEN.Tween({t: 0}).to({t: 1}, 1000)
        // .easing(TWEEN.Easing.Exponential.InOut)
        .onUpdate(function (obj) {
          for (let i = 0; i < particleCloud.mesh.geometry.vertices.length; i++) {
            let newPos = particleCloud.vertInClouds(
              lineCurves[i].getPoint(obj.t),
              amountAbove + obj.t * (EXPANSION_MAX - amountAbove)
            );
            particleCloud.mesh.geometry.vertices[i] = newPos;
          }
          particleCloud.mesh.geometry.verticesNeedUpdate = true;
        });

      animation
        .onComplete(function () {
          shrinkingParticles = true;
        }).start();
      rotation
        .onComplete(function () {
          isRotating = true;
        })
        .start();
    }
  }
  if (expandingParticles) {
    if (expansionOffset >= EXPANSION_MAX) {
      expandingParticles = false;
      expansionOffset = 0;
      swarmParticlesToPoint(zoomPoint.clone());
    } else {
      expansionOffset += 0.009;
      for (let i = 0; i < particleCloud.mesh.geometry.vertices.length; i++) {
        let particlePos = particleCloud.mesh.geometry.vertices[i];
        particleCloud.mesh.geometry.vertices[i] = particleCloud.vertInClouds(particlePos, expansionOffset);
      }
      particleCloud.mesh.geometry.verticesNeedUpdate = true
    }
  }
  if (shrinkingParticles) {
    if (shrinkingOffset <= SHRINKING_MIN) {
      shrinkingParticles = false;
      shrinkingOffset = EXPANSION_MAX;
    } else {
      shrinkingOffset -= 0.009;
      for (let i = 0; i < particleCloud.mesh.geometry.vertices.length; i++) {
        let particlePos = particleCloud.mesh.geometry.vertices[i];
        particleCloud.mesh.geometry.vertices[i] = particleCloud.vertInClouds(particlePos, shrinkingOffset);
      }
      particleCloud.mesh.geometry.verticesNeedUpdate = true
    }
  }
  renderer.render(scene, camera);
  TWEEN.update();
}
render();

// Create global point from lat/long
const edmondLat = 35.657295;
const edmondLong = -97.478256;
let zoomPoint = spherePointFromLatLong(edmondLat, edmondLong);
document.body.onclick = function () {

  if (isZoomedIn == false) {
    expandingParticles = true;
    expansionOffset = 0;
  } else {
    isZoomingOut = true;
    isZoomedIn = false;
  }

  // camera.lookAt(zoomPoint);
  // camera.lookAt(0, 0, 1);
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
function spinToPoint(startPoint, endPoint) {
  let startQuant = new THREE.Quaternion();
  startQuant.copy(earth.mesh.quaternion).normalize();

  let endQuant = new THREE.Quaternion();
  endQuant.setFromUnitVectors(
    endPoint.clone().normalize(),
    startPoint.clone().normalize()
  );

  let euler = new THREE.Euler();
  return new TWEEN.Tween(startQuant).to(endQuant, 1500)
    // .delay(500)
    // .easing(TWEEN.Easing.Exponential.InOut)
    .onUpdate(function () {
      euler.setFromQuaternion(startQuant);
      earth.mesh.setRotationFromEuler(euler);
      earth.waterMesh.setRotationFromEuler(euler);
    });
}

// Takes a Vector3 point on the sphere and animates particles swarming to
// just above that point
function swarmParticlesToPoint(point) {
  // TODO play with this
  isRotating = false;
  let amountAbove = 0.02;
  let endPoint = particleCloud.vertInClouds(point, amountAbove);
  // Create array of line segments between particles' start positions
  // and the desired end position.
  let lineCurves = [];
  for (let i = 0; i < particleCloud.mesh.geometry.vertices.length; i++) {
    let startPoint = particleCloud.mesh.geometry.vertices[i];
    // TODO could be replaced with simple updates in the render loop. Is that
    // better or should I use Tween for everything for consistency??
    // Create a 3d line segment between the two points.
    lineCurves.push(new THREE.LineCurve3(startPoint.clone(), endPoint.clone()));
  }
  // For each timestep, move the points to the spots along the line for
  // that timestep, projected onto the clouds
  let animation = new TWEEN.Tween({t: 0}).to({t: 1}, 1000)
    // .easing(TWEEN.Easing.Exponential.InOut)
    .onUpdate(function (obj) {
      for (let i = 0; i < particleCloud.mesh.geometry.vertices.length; i++) {
        let newPos = particleCloud.vertInClouds(
          lineCurves[i].getPoint(obj.t),
          EXPANSION_MAX - (EXPANSION_MAX - amountAbove) * obj.t
        );
        particleCloud.mesh.geometry.vertices[i] = newPos;
      }
      particleCloud.mesh.geometry.verticesNeedUpdate = true;
    });

  let rotation = spinToPoint(
    // earthMesh.worldToLocal(new THREE.Vector3(0, 0, 1)),
    // earthPointFacingCamera(),
    new THREE.Vector3(0, 0 , 1),
    zoomPoint.clone()
  );
  rotation.onComplete(function () {
    isZooming = true;
  });

  // Start at same time, don't need to be completely synchronized
  rotation.start();
  animation.start();
}

});
