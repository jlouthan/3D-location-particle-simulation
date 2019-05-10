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

function render(){
  requestAnimationFrame(render);

  let timeDelta = clock.getDelta(); // in seconds
  // Rotate Earth
  earthMesh.rotateY( 1/5 * timeDelta );
  // Rotate clouds
  cloudMesh.rotateY( 1/3 * timeDelta);

  renderer.render(scene, camera);
}
render();
