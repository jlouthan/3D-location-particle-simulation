const WATER_COLOR = 0x4b7ccc;
const CLOUD_DIST_ABOVE_EARTH = 0.01;

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
}
