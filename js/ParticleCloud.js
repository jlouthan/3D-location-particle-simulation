const EXPAND_ANIMATION_DURATION = 750;
const SWARM_ANIMATION_DURATION = 1125;

function ParticleCloud(count, particleSize, color, cloudMesh, cloudRadius) {
  this.particleSize = particleSize;
  this.cloudMesh = cloudMesh;
  this.cloudRadius = cloudRadius;
  // Create and add some particles among the clouds
  let particleGeo = new THREE.Geometry();
  let particleMat = new THREE.PointsMaterial({
    size: particleSize,
    color: color,
    map: new THREE.TextureLoader()
      .load("images/spark.png"),
    blending: THREE.AdditiveBlending,
    // alphaTest helps A LOT to remove square particle overlapping effect
    alphaTest: 0.5,
    transparent: true
    // depthTest: false
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
// the point into the clouds, surfaceOffset > 0 will hover it above
ParticleCloud.prototype.vertInClouds = function (point, surfaceOffset) {
  // Get unit vector from sphere center to point, scale by sphere radius,
  // and add to sphere center
  return this.cloudMesh.position.clone().add(
    point.sub(this.cloudMesh.position).normalize()
    .multiplyScalar(this.cloudRadius + surfaceOffset)
  );
};

// Given a point in the cloud's bounding box, project it into the clouds with
// given offset and return an array containing count copies of that point
// (this is a useful helper for animating all particles swarming to a single point)
ParticleCloud.prototype.getCopiesOfPointInClouds = function (point, surfaceOffset) {
  let pointCopies = []
  for (let i = 0; i < this.mesh.geometry.vertices.length; i++) {
    pointCopies.push(this.vertInClouds(point.clone(), surfaceOffset));
  }
  return pointCopies;
}

ParticleCloud.prototype.jiggleUpdate = function () {
  // Move around particles w/ Brownian motion
  for (let i = 0; i < this.mesh.geometry.vertices.length; i++) {
    let particle = this.mesh.geometry.vertices[i];
    let dX = Math.random() * 0.008 - 0.004;
    let dY = Math.random() * 0.008 - 0.004;
    let dZ = Math.random() * 0.008 - 0.004;
    particle.add(new THREE.Vector3(dX, dY, dZ));
    // Colors change randomly each frame
    this.mesh.geometry.colors[i] = new THREE.Color(
      Math.random(),
      Math.random(),
      Math.random()
    );
  }
  this.mesh.geometry.verticesNeedUpdate = true;
}

// Returns Tween that expanda particles from startOffset above clouds to
// endOffset above clouds. Kicks off animation immediately if startNow=true.
ParticleCloud.prototype.expand = function (startOffset, endOffset, startNow) {
  let currentGeo = this.mesh.geometry;
  let cloud = this;

  let expansionAnimation = new TWEEN.Tween({currentOffset: startOffset})
    .to({currentOffset: endOffset}, (1 - settings.animationSpeed) * 2 * EXPAND_ANIMATION_DURATION)
    .onUpdate(function(obj) {
      for (let i = 0; i < currentGeo.vertices.length; i++) {
        let particlePos = currentGeo.vertices[i];
        currentGeo.vertices[i] =
          cloud.vertInClouds(particlePos, obj.currentOffset);
      }
      currentGeo.verticesNeedUpdate = true
    });

  if (startNow) {
    expansionAnimation.start();
  }
  return expansionAnimation;
};

// Takes an array of Vector3 points on the sphere and returns Tween animation
// of particle i swarming to point i. Particles will start at startOffset above
// the clouds and end at endOffset above the clouds.
// Kicks off the animation immediately if startNow=true
ParticleCloud.prototype.swarmToPoints = function(endPoints, startOffset, endOffset, startNow) {
  let currentGeo = this.mesh.geometry;
  let cloud = this;
  // Create array of line segments between particles' start positions
  // and the desired end position.
  let lineCurves = [];
  for (let i = 0; i < currentGeo.vertices.length; i++) {
    let startPoint = currentGeo.vertices[i];
    // Create a 3d line segment between the two points.
    lineCurves.push(new THREE.LineCurve3(startPoint.clone(), endPoints[i].clone()));
  }
  // For each timestep, move the points to the spots along the line for
  // that timestep, projected onto the clouds
  let animation = new TWEEN.Tween({t: 0}).to({t: 1}, (1 - settings.animationSpeed) * 2 * SWARM_ANIMATION_DURATION)
    // .easing(TWEEN.Easing.Exponential.InOut)
    .onUpdate(function (obj) {
      for (let i = 0; i < currentGeo.vertices.length; i++) {
        let newPos = cloud.vertInClouds(
          lineCurves[i].getPoint(obj.t),
          startOffset + (endOffset - startOffset) * obj.t
        );
        currentGeo.vertices[i] = newPos;
      }
      currentGeo.verticesNeedUpdate = true;
    });

  if (startNow) {
    animation.start();
  }
  return animation;
}

ParticleCloud.prototype.setStarfield = function (isStarfield) {
  if (isStarfield) {
    this.mesh.material.map = new THREE.TextureLoader()
      .load("images/snowflake1.png");
    this.expand(0, 0.5, true);
  } else {
    this.mesh.material.map = new THREE.TextureLoader()
      .load("images/spark.png");
  }
  this.mesh.material.needsUpdate = true;
}

// Special case celebrating the Portland Trailblazers
// (just for fun)
ParticleCloud.prototype.setBlazersMode = function (isBlazers) {
  if (isBlazers) {
    this.mesh.material.size = this.particleSize * 3;
    this.mesh.material.transparent = false;
    this.mesh.material.map = new THREE.TextureLoader()
      .load("images/lillard-face.png");
  } else {
    this.mesh.material.size = this.particleSize;
    this.mesh.material.transparent = true;
    this.mesh.material.map = new THREE.TextureLoader()
      .load("images/spark.png");
  }
  this.mesh.material.needsUpdate = true;
}
