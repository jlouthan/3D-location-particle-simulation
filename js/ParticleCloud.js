
function ParticleCloud(count, particleSize, color, cloudMesh, cloudRadius) {
  this.cloudMesh = cloudMesh;
  this.cloudRadius = cloudRadius;
  // Create and add some particles among the clouds
  let particleGeo = new THREE.Geometry();
  // TODO look at what all I can do with pointsmaterial! Opacity, etc.
  let particleMat = new THREE.PointsMaterial({
    size: particleSize,
    color: color
  });

  this.cloudMesh.geometry.computeBoundingBox();
  let cloudMin = this.cloudMesh.geometry.boundingBox.min;
  let cloudMax = this.cloudMesh.geometry.boundingBox.max;

  this.initialPositions = [];
  for (let i = 0; i < count; i++) {
    // Get random point in cloud bounding box
    let x = cloudMin.x +
    Math.random() * (cloudMax.x - cloudMin.x);
    let y = cloudMin.y +
    Math.random() * (cloudMax.y - cloudMin.y);
    let z = cloudMin.z +
    Math.random() * (cloudMax.z - cloudMin.z);
    let randomPos = new THREE.Vector3(x, y, z);
    // Project it into the clouds and add to mesh
    let particlePos = this.vertInClouds(randomPos, 0.01);
    this.initialPositions.push(particlePos);
    particleGeo.vertices.push(particlePos);

  }

  this.mesh = new THREE.Points(particleGeo, particleMat);
}

// Project given Vector3 point onto sphereical cloud surface,
// surfaceOffset above the clouds, e.g., surfaceOffset=0 will put
// the point into the clouds
ParticleCloud.prototype.vertInClouds = function (point, surfaceOffset) {
  // Get unit vector from sphere center to point, scale by sphere radius,
  // and add to sphere center
  return this.cloudMesh.position.clone().add(
    point.sub(this.cloudMesh.position).normalize()
    .multiplyScalar(this.cloudRadius + surfaceOffset)
  );
};
