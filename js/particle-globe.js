// https://github.com/jeromeetienne/threex.planets
// http://learningthreejs.com/blog/2013/09/16/how-to-make-the-earth-in-webgl/
// http://blog.mastermaps.com/2013/09/creating-webgl-earth-with-threejs.html

// Create a scene with a camera and renderer
let scene = new THREE.Scene();

const FIELD_OF_VIEW = 45;
const NEAR = 0.01;
const FAR = 1000;
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
var light	= new THREE.DirectionalLight(0xcccccc, 1);
light.position.set(5, 3, 5);
scene.add(light);

// Create and add the Earth
let earthGeo = new THREE.SphereGeometry(0.5, 32, 32);
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
let cloudGeo = new THREE.SphereGeometry(0.51, 32, 32)
let cloudMat  = new THREE.MeshPhongMaterial({
  map : new THREE.TextureLoader().load('images/fair_clouds_4k.png'),
  // side        : THREE.DoubleSide,
  // opacity     : 0.8,
  transparent : true,
  // depthWrite  : false,
});
var cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
earthMesh.add(cloudMesh)

// Render and update loop
let clock = new THREE.Clock();

function render(){
  requestAnimationFrame(render);

  let timeDelta = clock.getDelta(); // in seconds
  // Rotate Earth
  earthMesh.rotateY( 1/32 * timeDelta );
  // Rotate clouds
  cloudMesh.rotateY( 1/16 * timeDelta);

  renderer.render(scene, camera);
}
render();
