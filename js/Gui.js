// Small object that just uses global variables to add
// dat gui for toggling parts of animation

let Gui = {
  setup : function () {
    gui = new dat.GUI();
    gui.add(settings, 'rotationSpeed', 0, 1);
    gui.add(settings, 'animationSpeed', 0, 1);
    gui.add(settings, 'secBetweenAnimations', 1, 10);
    // Control for changing number of particles
    let countControl = gui.add(settings, 'numParticles', 0, 10000);
    countControl.onFinishChange(function (newCount) {
      earth.mesh.remove(particleCloud.mesh);
      let newCloud = new ParticleCloud(
        Math.round(newCount),
        settings.particleSize,
        0xffffff,
        earth.cloudMesh,
        earth.cloudRadius
      );
      if (settings.globe === 'blazers') {
        newCloud.setBlazersMode(true);
      }
      earth.mesh.add(newCloud.mesh);
      particleCloud = newCloud;
    });
    // Control for changing Earth's appearance
    let earthControl = gui.add(settings, 'globe',
      ['flat map', 'topography', 'blazers']
    );
    earthControl.onFinishChange(function (newMap) {
      // Special case celebrating the Portland Trailblazers
      if (newMap === 'blazers') {
        earth.makeBlazers();
        particleCloud.setBlazersMode(true);
        return;
      } else {
        particleCloud.setBlazersMode(false);
      }
      scene.remove(earth.mesh);
      if (earth.waterMesh) {
        scene.remove(earth.waterMesh);
      }
      let newEarth = new Earth(
        EARTH_RAD,
        (newMap === 'topography'),
        worldMap.canvas
      );
      if (newEarth.waterMesh) {
        scene.add(newEarth.waterMesh);
      }
      scene.add(newEarth.mesh);
      newEarth.addClouds();
      newEarth.mesh.add(particleCloud.mesh);
      earth = newEarth;
    });
    // Control for forgetting the fancy stuff and just showing a
    // nice starfield with the particles
    let starFieldControl = gui.add(settings, 'starFieldState');
    starFieldControl.onFinishChange(function (showMeStars) {
      particleCloud.setStarfield(showMeStars);
    });
  }
}
