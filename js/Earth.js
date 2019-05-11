const WATER_COLOR = 0x4b7ccc;

function Earth(radius, isTopo, mapCanvas) {
  let earthGeo = new THREE.SphereGeometry(radius, 32, 32);
  let earthMat;

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
