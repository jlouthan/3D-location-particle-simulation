require([ 'bower_components/threex.planets/package.require.js'
	], function(){
	var renderer	= new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	var onRenderFcts= [];
	var scene	= new THREE.Scene();
	var camera	= new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000 );
	camera.position.z = 1.5;

	var light	= new THREE.AmbientLight( 0x888888 )
	scene.add( light )
	// var light	= new THREE.DirectionalLight( 'white', 1)
	// light.position.set(5,5,5)
	// light.target.position.set( 0, 0, 0 )
	// scene.add( light )

	var light	= new THREE.DirectionalLight( 0xcccccc, 1 )
	light.position.set(5,3,5)
	scene.add( light )

	//////////////////////////////////////////////////////////////////////////////////
	//		add an object and make it move					//
	//////////////////////////////////////////////////////////////////////////////////

	var earthMesh	= THREEx.Planets.createEarth()
	scene.add(earthMesh)
	onRenderFcts.push(function(delta, now){
		earthMesh.rotateY( 1/32 * delta )
	})

	var cloudMesh	= THREEx.Planets.createEarthCloud()
	scene.add(cloudMesh)
	onRenderFcts.push(function(delta, now){
		cloudMesh.rotateY( 1/16 * delta )
	})



	//////////////////////////////////////////////////////////////////////////////////
	//		add star field							//
	//////////////////////////////////////////////////////////////////////////////////

	var geometry  = new THREE.SphereGeometry(90, 32, 32)
	var material  = new THREE.MeshBasicMaterial()
	material.map   = THREE.ImageUtils.loadTexture('bower_components/threex.planets/examples/images/galaxy_starfield.png')
	material.side  = THREE.BackSide
	var mesh  = new THREE.Mesh(geometry, material)
	scene.add(mesh)

	//////////////////////////////////////////////////////////////////////////////////
	//		Camera Controls							//
	//////////////////////////////////////////////////////////////////////////////////
	var mouse	= {x : 0, y : 0}
	document.addEventListener('mousemove', function(event){
		mouse.x	= (event.clientX / window.innerWidth ) - 0.5
		mouse.y	= (event.clientY / window.innerHeight) - 0.5
	}, false)
	onRenderFcts.push(function(delta, now){
		camera.position.x += (mouse.x*5 - camera.position.x) * (delta*3)
		camera.position.y += (mouse.y*5 - camera.position.y) * (delta*3)
		camera.lookAt( scene.position )
	})


	//////////////////////////////////////////////////////////////////////////////////
	//		render the scene						//
	//////////////////////////////////////////////////////////////////////////////////
	onRenderFcts.push(function(){
		renderer.render( scene, camera );
	})

	//////////////////////////////////////////////////////////////////////////////////
	//		loop runner							//
	//////////////////////////////////////////////////////////////////////////////////
	var lastTimeMsec= null
	requestAnimationFrame(function animate(nowMsec){
		// keep looping
		requestAnimationFrame( animate );
		// measure time
		lastTimeMsec	= lastTimeMsec || nowMsec-1000/60
		var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec)
		lastTimeMsec	= nowMsec
		// call each update function
		onRenderFcts.forEach(function(onRenderFct){
			onRenderFct(deltaMsec/1000, nowMsec/1000)
		})
	})
})
