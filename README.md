# Leaflet.ImageOverlay.Rotated-by-Two-Markers
I modified the image overlay plugin for better usage, the original plugin is this link:
https://github.com/IvanSanchez/Leaflet.ImageOverlay.Rotated

# usage
  ```
	var topLeftPoint = L.latLng(31.844586799627216, 117.19331510782506),
        topRightPoint = L.latLng(31.844602001694046, 117.19368499519082),
        bottomLeftPoint = L.latLng(31.84435113973027, 117.19332852958816),
        bottomRightPoint =  L.latLng(31.844366341835958, 117.19369841695394);
		
	var imgUrl = "demo.jpg";

    var map = new L.Map('map',
        {
            center: [31.844487, 117.193533],
            zoom: 20
        }
    );
    
    //two control points
    var topRightMarker = L.marker(topRightPoint, {draggable: true} ).addTo(map);
    var bottomLeftMarker = L.marker(bottomLeftPoint, {draggable: true} ).addTo(map);

    var overlay = L.imageOverlay.rotated(imgUrl, topRightMarker,bottomLeftMarker, {
		opacity: 0.9,
		interactive: true,
		corners:[topLeftPoint,
                 topRightPoint,
                 bottomRightPoint,
                 bottomLeftPoint]
    });
  ```

# Demo
![Alt Text](images/show.gif) 
