// https://codepen.io/antishow/pen/qOpOJP

(function(){
  'use strict';

  var tau = Math.PI * 2;
  var width, height;
  var mode;
  var scene, camera, renderer, pointCloud;

  THREE.ImageUtils.crossOrigin = '';

  var SETTINGS = [{
    name: 'Out of Control Spaceship',
    particleCount: 100000,
    material: new THREE.PointsMaterial({
      size: 1,
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    }),
    initialize: null,
    spawnBehavior: function(index){
      var x, y, z;

      x = (Math.random() * 2000) - 1000;
      y = (Math.random() * 2000) - 1000;
      z = (Math.random() * 2000) - 1000;
      return new THREE.Vector3(x, y, z);
    },
    frameBehavior: null,
    sceneFrameBehavior: function(){
      camera.rotation.x -= 0.002;
      camera.rotation.y += 0.0085;
      camera.rotation.z += 0.00425;
      camera.translateZ(-1);
    }
  },{
    name: 'Water Fountain',
    particleCount: 500,
    material: new THREE.PointsMaterial({
      size: 3,
      color: 0xccccff
    }),
    initialize: function(){
      camera.position.y = 60;
      camera.position.z = 200;
    },
    spawnBehavior: function(index){
      var v = new THREE.Vector3(0,0,0);
      var dX, dY, dZ;

      dY = (Math.random() * 20) + 10;
      dX = (Math.random() * 4) - 2;
      dZ = (Math.random() * 4) - 2;
      v.velocity = new THREE.Vector3(dX, dY, dZ);

      return v;
    },
    frameBehavior: function(particle){
      particle.x += particle.velocity.x;
      particle.y += particle.velocity.y;
      particle.z += particle.velocity.z;

      particle.velocity.y -= 0.5;

      if(particle.y < 0){
        particle.x = particle.y = particle.z = 0;
        var dX, dY, dZ;

        dY = (Math.random() * 4) + 10;
        dX = (Math.random() * 4) - 2;
        dZ = (Math.random() * 4) - 2;
        particle.velocity = new THREE.Vector3(dX, dY, dZ);
      }
    }
  },{
    name: 'Sine, Cosine, Discosine',
    particleCount: 400,
    material: new THREE.PointsMaterial({
      size: 10,
      vertexColors: THREE.VertexColors
    }),
    initialize: function(){
      camera.position.z = 50;
      camera.rotation.x = 45;
    },
    spawnBehavior: function(index){
      var v;
      var x, y;
      var rows, cols, row, col;
      var grid_width = 400,
          cell_size;

      rows = cols = 20;
      cell_size = grid_width / cols;
      row = Math.floor(index / rows);
      col = Math.floor(index % cols);

      x = (col * cell_size) - (grid_width / 2);
      y = (row * cell_size) - (grid_width / 2);

      v = new THREE.Vector3(x, y, 0);

      return v;
    },
    frameBehavior: function(particle, index){
      var grid_size = 20;
      var row = Math.floor(index / grid_size);
      var col = Math.floor(index % grid_size);

      var theta = tau * ((Date.now() % 1000) / 1000);
      var x = tau * Math.cos(col / (grid_size - 1));
      var y = tau * Math.sin(row / (grid_size - 1));

      var z = Math.sin((theta + x + y));
      particle.z = 10 * z;
      pointCloud.geometry.colors[index] = new THREE.Color().setHSL((z+1)/2, 1, 0.5);
    },
    sceneFrameBehavior: null
  },{
    name: 'Spooky Ghosts',
    particleCount: 5000,
    material: new THREE.PointsMaterial({
      size: 16,
      map: new THREE.TextureLoader()
      .load("http://matthewachase.com/tru-dat-boo.png"),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: false
    }),
    initialize: function(){
      camera.position.y = 50;
      camera.position.z = 200;

      pointCloud.sortParticles = true;
    },
    spawnBehavior: function(index){
      var x, y, z;
      var halfWidth = width / 2;

      x = (Math.random() * width) - halfWidth;
      y = (Math.random() * width) - halfWidth;
      z = (Math.random() * width) - halfWidth;
      var v = new THREE.Vector3(x, y, z);
      v.velocity = new THREE.Vector3(0,0,0);

      return v;
    },
    frameBehavior: function(particle, index){
      function push(){
        return (Math.random() * 0.125) - 0.0625;
      }

      particle.add(particle.velocity);
      particle.velocity.add(new THREE.Vector3(push(), push(), push()));
      particle.velocity.add(new THREE.Vector3(particle.x, particle.y, particle.z).multiplyScalar(-0.00001));
    },
    sceneFrameBehavior: null
  }];

  function onDocumentReady(){
    initialize();
  }

  function addModeButtons(){
    var buttons = document.getElementById('buttons');
    for (let i = 0; i < SETTINGS.length; i++) {
      let mode = SETTINGS[i];
    // _.forEach(SETTINGS, function(mode){
      var button = document.createElement('button');
      button.textContent = mode.name;

      button.addEventListener('click', function(){
        setMode(mode);
      });
      buttons.appendChild(button);
    // });
    }
  }

  function initialize(){
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(120, width / height, 1, 1000);
    renderer = new THREE.WebGLRenderer();
    document.body.appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize);
    onWindowResize();

    addModeButtons();

    scene.fog = new THREE.Fog(0, 1);
    setMode(SETTINGS[SETTINGS.length-1]);

    // AnimationController.registerAnimation(render);
    render();
  }

  function setMode(_mode){
    mode = _mode;
    scene.remove(pointCloud);
    resetCamera();

    var points = createPoints(mode.spawnBehavior);
    var material = mode.material;

    pointCloud = new THREE.Points(points, material);

    if(mode.initialize && typeof mode.initialize === 'function'){
      mode.initialize();
    }
    scene.add(pointCloud);
  }

  function createPoints(spawnBehavior){
    var ret = new THREE.Geometry();

    for (let i = 0; i < mode.particleCount; i++) {
    // _.times(mode.particleCount, function(index){
      // ret.vertices.push(spawnBehavior(index));
      ret.vertices.push(spawnBehavior(i));
    // })
    }

    return ret;
  }

  function onWindowResize(){
    width = window.innerWidth;
    height = window.innerHeight;
    updateRendererSize();
  }

  function resetCamera(){
    camera.position.x = camera.position.y = camera.position.z = camera.rotation.x = camera.rotation.y = camera.rotation.z = 0;
  }

  function updateRendererSize(){
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  function updateParticles(){
    if(mode.sceneFrameBehavior && typeof mode.sceneFrameBehavior === 'function'){
      mode.sceneFrameBehavior();
    }
    if(mode.frameBehavior && typeof mode.frameBehavior === 'function'){
      for (let i = 0; i < pointCloud.geometry.vertices.length; i++) {
        let prtcl = pointCloud.geometry.vertices[i];
        mode.frameBehavior(prtcl);
      }
      // _.forEach(pointCloud.geometry.vertices, mode.frameBehavior);
      pointCloud.geometry.verticesNeedUpdate = true;
      pointCloud.geometry.colorsNeedUpdate = true;
    }
  }

  function render(){
    requestAnimationFrame(render);
    updateParticles();
    renderer.render(scene, camera);
  }

  document.addEventListener('DOMContentLoaded', onDocumentReady);
})();
