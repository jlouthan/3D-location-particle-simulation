// Class that creates and stores map of world with U.S. state outlines on
// canvas off screen. Can be used for Three.js textures.
function WorldMap() {
  this.projection = d3.geoEquirectangular()
    .translate([512, 256])
    .scale(163);
}

// Draw the map on a new canvas and set this.canvas to it.
// Returns a promise that resolves when drawing is completed.
WorldMap.prototype.createDrawing = function () {

  let currentMap = this;
  return d3.json('data/combined2.json').then(function (data) {
    let countries = topojson.feature(data, data.objects.countries);
    let states = topojson.feature(data, data.objects.states);

    currentMap.canvas = d3.select("body").append("canvas")
      .style("display", "none")
      .attr("width", "1024px")
      .attr("height", "512px");

    let context = currentMap.canvas.node().getContext("2d");

    let path = d3.geoPath().projection(currentMap.projection).context(context);

    context.strokeStyle = "#333";
    context.lineWidth = 0.5;
    context.fillStyle = "#fff";

    context.beginPath();

    path(countries);
    path(states);

    context.fill();
    context.stroke();

    return;
  });

};
