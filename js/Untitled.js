function getQuaternionFromPoints(initPoint, endPoint) {
    var startVector = (initPoint === undefined ? new THREE.Vector3() : initPoint.normalize())
    var endVector = (endPoint === undefined ? new THREE.Vector3() : endPoint.normalize())
    var q = new THREE.Quaternion();

    q.setFromUnitVectors(startVector, endVector)

    return q
}

const euler = new THREE.Euler()
 const startQuaternion = new THREE.Quaternion()
 const endQuaternion = getQuaternionFromPoints(pickerPoint, staticPoint.position)

  startQuaternion.copy(sphere.quaternion).normalize()

  const worldRotation = new TWEEN.Tween(startQuaternion)
                                 .to( endQuaternion, 2000)
  				                 .delay(500)
                                 .easing(TWEEN.Easing.Exponential.InOut)
                                 .onUpdate( function() {
                                               euler.setFromQuaternion(startQuaternion)
                                               sphere.setRotationFromEuler(euler)
                                  });
  worldRotation.start()



public static LatLon FromVector3(Vector3 position, float sphereRadius)
      {
          float lat = (float)Math.Acos(position.Y / sphereRadius); //theta
          float lon = (float)Math.Atan(position.X / position.Z); //phi
          return new LatLon(lat, lon);
      }
