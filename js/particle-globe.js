// https://github.com/jeromeetienne/threex.planets
// http://learningthreejs.com/blog/2013/09/16/how-to-make-the-earth-in-webgl/
// http://blog.mastermaps.com/2013/09/creating-webgl-earth-with-threejs.html

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
var light	= new THREE.AmbientLight(0x888888);
scene.add(light);
var light	= new THREE.DirectionalLight(0xcccccc, 0.5);
light.position.set(5, 3, 5);
scene.add(light);

// Create and add the Earth
let earthGeo = new THREE.SphereGeometry(EARTH_RAD, 32, 32);
let earthMat  = new THREE.MeshPhongMaterial({
  map: new THREE.TextureLoader().load('images/earthmap1k.jpg'),
  bumpMap: new THREE.TextureLoader().load('images/earthbump1k.jpg'),
  bumpScale: 0.05,
  specularMap: new THREE.TextureLoader().load('images/earthspec1k.jpg'),
  specular: new THREE.Color('grey')
});
let earthMesh = new THREE.Mesh(earthGeo, earthMat);
scene.add(earthMesh)
// earthMesh.material.needsUpdate = true;

// Create and add the clouds
let cloudGeo = new THREE.SphereGeometry(CLOUD_RAD, 32, 32)
let cloudMat  = new THREE.MeshPhongMaterial({
  map : new THREE.TextureLoader().load('images/fair_clouds_4k.png'),
  // side        : THREE.DoubleSide,
  // opacity     : 0.8,
  transparent : true,
  // depthWrite  : false,
});
var cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
earthMesh.add(cloudMesh)

// Create and add some particles among the clouds
let particleGeo = new THREE.Geometry();
// TODO look at what all I can do with pointsmaterial! Opacity, etc.
let particleMat = new THREE.PointsMaterial({
  size: 0.01,
  color: 0xffffff
});
cloudGeo.computeBoundingBox();
let cloudMin = cloudGeo.boundingBox.min;
let cloudMax = cloudGeo.boundingBox.max;

// Get random point on cloud surface
function randomVertInClouds() {
  // Get random point in cloud bounding box
  // TODO ensure this math is correct if I move the sphere
  let x = cloudMin.x +
  Math.random() * (cloudMax.x - cloudMin.x);
  let y = cloudMin.y +
  Math.random() * (cloudMax.y - cloudMin.y);
  let z = cloudMin.z +
  Math.random() * (cloudMax.z - cloudMin.z);
  // TODO If the point's not in the sphere do something?
  let randomPos = new THREE.Vector3(x, y, z);
  // Project point onto sphere by getting unit vector from sphere
  // center to point, scaling by sphere radius, and adding to
  // sphere center
  return cloudMesh.position.clone().add(
    randomPos.sub(cloudMesh.position).normalize()
    .multiplyScalar(CLOUD_RAD)
  );
}

for (let i = 0; i < NUM_PARTICLES; i++) {
  particleGeo.vertices.push(randomVertInClouds());
};
let particlesCloud = new THREE.Points(particleGeo, particleMat);
cloudMesh.add(particlesCloud);


// Render and update loop
let clock = new THREE.Clock();

// TODO make these nicer
let isRotating = true;
let isZooming = false;
function render(){
  requestAnimationFrame(render);

  let timeDelta = clock.getDelta(); // in seconds
  if (isRotating) {
    // Rotate Earth
    earthMesh.rotateY( 1/5 * timeDelta );
    // Rotate clouds
    cloudMesh.rotateY( 1/3 * timeDelta);
  }
  if (isZooming) {
    camera.position.z -= 0.007;
    if (camera.position.z <= 1.005) {
      isZooming = false;
    }
  }
  renderer.render(scene, camera);
  TWEEN.update();
}
render();

document.body.onclick = function () {
  // Testing zoom into given lat/long
  isRotating = false;

  // Create point from lat/long
  const edmondLat = 35.657295;
  const edmondLong = -97.478256;
  let zoomPoint = spherePointFromLatLong(edmondLat, edmondLong);
  // Zoom into pre-defined point
  // TODO chain a Tween zoom out
  let rotation = zoomIntoPoint(zoomPoint);
  rotation.start();

  // camera.lookAt(zoomPoint);
  // camera.lookAt(0, 0, 1);
}

// Returns Vector3 point on surface of earth mesh from
// given lat, long
function spherePointFromLatLong(lat, long) {
  // TODO my formula doesn't work :( Find out why???
  // let y = Math.cos(lat) * CLOUD_RAD;
  // let x = (Math.tan(long) * CLOUD_RAD - Math.tan(long) * y)
  //   / (1 + Math.tan(long));
  // let z = x / Math.tan(long);
  // // return new THREE.Vector3(x, y, z);
  // console.log("my result is: ", new THREE.Vector3(x, y, z));

  // Formula from https://stackoverflow.com/questions/28365948/javascript-latitude-longitude-to-xyz-position-on-earth-threejs
  var phi   = (90 - lat) * (Math.PI/180);
  var theta = (long + 180) * (Math.PI/180);
  let radius = CLOUD_RAD;
  let x = -((radius) * Math.sin(phi) * Math.cos(theta));
  let z = ((radius) * Math.sin(phi) * Math.sin(theta));
  let y = ((radius) * Math.cos(phi));
  return new THREE.Vector3(x, y, z);
}

// Given a Vector3 point on the sphere, return Tween that spins
// the world around so that point is facing camera, then zoom
// camera into the point
// Rotation code adapted from https://discourse.threejs.org/t/solved-using-quaternions-approach-to-rotate-sphere-from-clicked-point-towards-static-point/3272/8
function zoomIntoPoint(focusPoint) {
  let startQuant = new THREE.Quaternion();
  startQuant.copy(earthMesh.quaternion).normalize();

  let endQuant = new THREE.Quaternion();
  let pointCameraLooksAt = new THREE.Vector3(0, 0, 1);
  endQuant.setFromUnitVectors(
    focusPoint.clone().normalize(),
    pointCameraLooksAt.clone().normalize()
  );

  let euler = new THREE.Euler();
  return new TWEEN.Tween(startQuant).to(endQuant, 2000)
    // .delay(500)
    .easing(TWEEN.Easing.Exponential.InOut)
    .onUpdate(function () {
      euler.setFromQuaternion(startQuant);
      earthMesh.setRotationFromEuler(euler);
    })
    .onComplete(function () {
      isZooming = true;
    });
}
