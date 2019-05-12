const WATER_COLOR = 0x4b7ccc;
const CLOUD_DIST_ABOVE_EARTH = 0.01;
const SPIN_ANIMATION_DURATION = 1000;

function Earth(radius, isTopo, mapCanvas) {
  this.radius = radius;
  this.cloudRadius = radius + CLOUD_DIST_ABOVE_EARTH;

  let earthGeo = new THREE.SphereGeometry(radius, 32, 32);
  let earthMat;

  // Use texture according to args passed
  if (isTopo) {
    earthMat = new THREE.MeshPhongMaterial({
      map: new THREE.TextureLoader().load('images/earthmap1k.jpg'),
      bumpMap: new THREE.TextureLoader().load('images/earthbump1k.jpg'),
      bumpScale: 0.05,
      specularMap: new THREE.TextureLoader().load('images/earthspec1k.jpg'),
      specular: new THREE.Color('grey')
    });
  } else {
    // Add base to make water blue
    let waterMat = new THREE.MeshBasicMaterial({
      color: WATER_COLOR,
      transparent: true
    });
    this.waterMesh = new THREE.Mesh(earthGeo, waterMat);
    earthMat = new THREE.MeshBasicMaterial({
      map: new THREE.Texture(mapCanvas.node()),
      transparent: true
    });
  }

  earthMat.map.needsUpdate = true;
  this.mesh = new THREE.Mesh(earthGeo, earthMat);
}

// Create and add the clouds
Earth.prototype.addClouds = function () {
  let cloudGeo = new THREE.SphereGeometry(this.cloudRadius, 32, 32);
  let cloudMat = new THREE.MeshPhongMaterial({
    map : new THREE.TextureLoader().load('images/fair_clouds_4k.png'),
    // side        : THREE.DoubleSide,
    // opacity     : 0.8,
    transparent : true,
    // depthWrite  : false,
  });
  this.cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
  this.mesh.add(this.cloudMesh);
};

// Returns Vector3 point on surface of earth mesh from
// given lat, long
Earth.prototype.pointFromLatLong = function (lat, long) {
  // Formula from https://stackoverflow.com/questions/28365948/javascript-latitude-longitude-to-xyz-position-on-earth-threejs
  var phi   = (90 - lat) * (Math.PI/180);
  var theta = (long + 180) * (Math.PI/180);
  let radius = this.cloudRadius;
  let x = -((radius) * Math.sin(phi) * Math.cos(theta));
  let z = ((radius) * Math.sin(phi) * Math.sin(theta));
  let y = ((radius) * Math.cos(phi));
  return new THREE.Vector3(x, y, z);
}

// Given a Vector3 startPoint and endPoint on the sphere, return Tween that
// spins the world around so that endPoint becomes startPoint
// Rotation code adapted from https://discourse.threejs.org/t/solved-using-quaternions-approach-to-rotate-sphere-from-clicked-point-towards-static-point/3272/8
Earth.prototype.spinToPoint = function (startPoint, endPoint, startNow) {
  let currentEarth = this;
  let startQuant = new THREE.Quaternion();
  startQuant.copy(currentEarth.mesh.quaternion).normalize();

  let endQuant = new THREE.Quaternion();
  endQuant.setFromUnitVectors(
    endPoint.clone().normalize(),
    startPoint.clone().normalize()
  );

  let euler = new THREE.Euler();
  let spinAnimation = new TWEEN.Tween(startQuant)
    .to(endQuant, SPIN_ANIMATION_DURATION)
    // .delay(500)
    // .easing(TWEEN.Easing.Exponential.InOut)
    .onUpdate(function () {
      euler.setFromQuaternion(startQuant);
      currentEarth.mesh.setRotationFromEuler(euler);
      currentEarth.waterMesh.setRotationFromEuler(euler);
    });
  if (startNow) {
    spinAnimation.start();
  }
  return spinAnimation;
}
