/*
 * 🍂class ImageOverlay.Rotated
 * 🍂inherits ImageOverlay
 *
 * Like `ImageOverlay`, use two points rotates and skews the image. 
 */

L.ImageOverlay.Rotated = L.ImageOverlay.extend({

	initialize: function (image, topRightMarker,bottomLeftMarker, options) {
		if (typeof(image) === 'string') {
			this._url = image;
		} else {
			// Assume that the first parameter is an instance of HTMLImage or HTMLCanvas
			this._rawImage = image;
		}

		this.topRightMarker = topRightMarker;
		this.bottomLeftMarker = bottomLeftMarker;
        this.angle = 0;

		L.setOptions(this, options);

		this._topLeft    = L.latLng(options.corners[0]);
		this._topRight   = L.latLng(options.corners[1]);
		this._bottomLeft = L.latLng(options.corners[3]);

		topRightMarker.on('drag dragend', this.reposition.bind(this));
		bottomLeftMarker.on('drag dragend', this.reposition.bind(this));
	},


	onAdd: function (map) {
		if (!this._image) {
			this._initImage();

			if (this.options.opacity < 1) {
				this._updateOpacity();
			}
		}

		if (this.options.interactive) {
			L.DomUtil.addClass(this._rawImage, 'leaflet-interactive');
			this.addInteractiveTarget(this._rawImage);
		}

		map.on('zoomend resetview', this._reset, this);

		this.getPane().appendChild(this._image);
		this._reset();
	},


    onRemove: function(map) {
        map.off('zoomend resetview', this._reset, this);
        L.ImageOverlay.prototype.onRemove.call(this, map);
    },


	_initImage: function () {
		var img = this._rawImage;
		if (this._url) {
			img = L.DomUtil.create('img');
			img.style.display = 'none';	// Hide while the first transform (zero or one frames) is being done

			if (this.options.crossOrigin) {
				img.crossOrigin = '';
			}

			img.src = this._url;
			this._rawImage = img;
		}
		L.DomUtil.addClass(img, 'leaflet-image-layer');

		// this._image is reused by some of the methods of the parent class and
		// must keep the name, even if it is counter-intuitive.
		var div = this._image = L.DomUtil.create('div',
				'leaflet-image-layer ' + (this._zoomAnimated ? 'leaflet-zoom-animated' : ''));

		// this._updateZIndex(); // apply z-index style setting to the div (if defined)
        if(this._updateZIndex){
            this._updateZIndex();
        }

		div.appendChild(img);

		div.onselectstart = L.Util.falseFn;
		div.onmousemove = L.Util.falseFn;

		img.onload = function(){
			this._reset();
			img.style.display = 'block';
			this.options.w = this._rawImage.width;
			this.options.h = this._rawImage.height;
			this.boundsRectBottomLeft= L.point(0, 0);// origin
			this.boundsRectTopRight= L.point(this.options.w, this.options.h);
			this.diagonalVector = this.boundsRectTopRight.subtract(this.boundsRectBottomLeft); 
			this.fire('load');

		}.bind(this);

		img.alt = this.options.alt;
	},


	_reset: function () {
		var div = this._image;

		// Project control points to container-pixel coordinates
		var pxTopLeft    = this._map.latLngToLayerPoint(this._topLeft);
		var pxTopRight   = this._map.latLngToLayerPoint(this._topRight);
		var pxBottomLeft = this._map.latLngToLayerPoint(this._bottomLeft);

		// Infer coordinate of bottom right
		var pxBottomRight = pxTopRight.subtract(pxTopLeft).add(pxBottomLeft);

		// pxBounds is mostly for positioning the <div> container
		var pxBounds = L.bounds([pxTopLeft, pxTopRight, pxBottomLeft, pxBottomRight]);
		var size = pxBounds.getSize();
		var pxTopLeftInDiv = pxTopLeft.subtract(pxBounds.min);

		// Calculate the skew angles, both in X and Y
		var vectorX = pxTopRight.subtract(pxTopLeft);
		var vectorY = pxBottomLeft.subtract(pxTopLeft);
		var skewX = Math.atan2( vectorX.y, vectorX.x );
		var skewY = Math.atan2( vectorY.x, vectorY.y );

        this.angle = ((Math.abs(skewX) + Math.abs(skewY))/2*180).toFixed(2);

		// LatLngBounds used for animations
		this._bounds = L.latLngBounds( this._map.layerPointToLatLng(pxBounds.min),
		                               this._map.layerPointToLatLng(pxBounds.max) );

		L.DomUtil.setPosition(div, pxBounds.min);

		//set pxBounds for dragging
		div.pxBounds  = pxBounds;
        // console.log('_reset: ', pxBounds);

		div.style.width  = size.x + 'px';
		div.style.height = size.y + 'px';

		var imgW = this._rawImage.width;
		var imgH = this._rawImage.height;
		if (!imgW || !imgH) {
			return;	// Probably because the image hasn't loaded yet.
		}

		this._rawImage.style.transformOrigin = '0 0';

		this._rawImage.style.transform =
			`matrix(${vectorX.x / imgW}, ${vectorX.y / imgW}, 
			        ${vectorY.x / imgH}, ${vectorY.y / imgH},
					${pxTopLeftInDiv.x}, ${pxTopLeftInDiv.y})`;

	},
    _animateZoom: function (e) {
        var scale = this._map.getZoomScale(e.zoom),
            newBounds = this._map._latLngBoundsToNewLayerBounds(this._bounds, e.zoom, e.center),
            offset = newBounds.min;
        L.DomUtil.setTransform(this._image, offset, scale);
    },

	reposition: function() {
		var tRlnglat = this.topRightMarker.getLatLng();
		var bLlnglat = this.bottomLeftMarker.getLatLng();
		var imgWidth = this.options.w;
        var imgHeight = this.options.h;
        
        var c1 = this.getCornerLatLng(L.point(0, imgHeight), bLlnglat, tRlnglat);  // raw image topleft
        var c2 = this.getCornerLatLng(L.point(imgWidth, imgHeight), bLlnglat, tRlnglat);  // raw image topright
        var c3 = this.getCornerLatLng(L.point(0, 0), bLlnglat, tRlnglat);  // raw image bottomLeft
		var c4 = this.getCornerLatLng(L.point(imgWidth, 0), bLlnglat, tRlnglat);
		
		this.options.corners = [c1,c2,c3,c4];

		this._topLeft    = L.latLng(c1);
		this._topRight   = L.latLng(c2);
		this._bottomLeft = L.latLng(c3);
		this._reset();

	},

	getCornerLatLng: function(point, bottomLeftMarkerLatLng, topRightMarkerLatLng){
		var boundsRectBottomLeft= this.boundsRectBottomLeft;
		var diagonalVector = this.diagonalVector;
		var pV = point.subtract(boundsRectBottomLeft); 
		var rotate90V = getClockWiseRotate90DegreePoint(diagonalVector);
		var scaleX = getDotProduction(diagonalVector, pV) / getDotProduction(diagonalVector, diagonalVector);
		var scaleY = -getDotProduction(rotate90V, pV) / getDotProduction(rotate90V, rotate90V);
		var bLMarkerPx = L.Projection.SphericalMercator.project(bottomLeftMarkerLatLng);
		var tRMarkerPx = L.Projection.SphericalMercator.project(topRightMarkerLatLng);
		var vx = bLMarkerPx.add(tRMarkerPx.subtract(bLMarkerPx).multiplyBy(scaleX));
		var vy = getClockWiseRotate90DegreePoint(bLMarkerPx.subtract(tRMarkerPx)).multiplyBy(scaleY);
		var p = vx.add(vy);
		return L.Projection.SphericalMercator.unproject(p);
	},

	setUrl: function (url) {
		this._url = url;

		if (this._rawImage) {
			this._rawImage.src = url;
		}
		return this;
	}
});


function getClockWiseRotate90DegreePoint(point){
	return L.point([point.y, -point.x]);
}

function getDotProduction(point1, point2){
	return point1.x * point2.x + point1.y * point2.y;
}

/* 🍂factory imageOverlay.rotated(imageUrl: String|HTMLImageElement|HTMLCanvasElement, topleft: LatLng, topright: LatLng, bottomleft: LatLng, options?: ImageOverlay options)
 * Instantiates a rotated/skewed image overlay, given the image URL and
 * the `LatLng`s of three of its corners.
 *
 * Alternatively to specifying the URL of the image, an existing instance of `HTMLImageElement`
 * or `HTMLCanvasElement` can be used.
 */
L.imageOverlay.rotated = function(imgSrc, topRightMarker, bottomLeftMarker, options) {
	return new L.ImageOverlay.Rotated(imgSrc, topRightMarker, bottomLeftMarker, options);
};
