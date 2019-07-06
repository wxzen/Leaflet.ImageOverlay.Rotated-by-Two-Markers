function getMarkerCoordinate(topRightMarkerLatLng, topRightLatLng, bottomLeftLatLng, w, h){
	var d,p,g,
		topRightMarkerPx = L.Projection.SphericalMercator.project(topRightMarkerLatLng),
		topRightPx = L.Projection.SphericalMercator.project(topRightLatLng),
		bottomLeftPx = L.Projection.SphericalMercator.project(bottomLeftLatLng),
		y = L.Projection.SphericalMercator.project(
			(d = Math.atan2(w, h),
					p = getClockWiseRotate90DegreePoint(topRightPx.subtract(bottomLeftPx)),
					g = bottomLeftPx.add(p.multiplyBy(-Math.cos(d) * Math.sin(d)))
						.add(topRightPx.subtract(bottomLeftPx)
							.multiplyBy(Math.pow(Math.cos(d), 2))),
					L.Projection.SphericalMercator.unproject(g)
			)
		),
		v = topRightMarkerPx.subtract(bottomLeftPx),
		b = topRightPx.subtract(y),
		I = getMagnitude(v) * Math.cos(getAngle(v,b)) * w /getMagnitude(b),
		_ = getMagnitude(v) * Math.sin(getAngle(v, b)) * w / getMagnitude(b);
	return L.point(I, _);
}

//transformation: [x, y]->[y, x]->[y, -x]
function getClockWiseRotate90DegreePoint(point){
	return L.point([point.y, -point.x]);
}

function getMagnitude(point){
	return Math.sqrt(getDotProduction(point, point));
}

function getDotProduction(point1, point2){
	return point1.x * point2.x + point1.y * point2.y;
}

//余弦定理求夹角
function getAngle(point1, point2){
	return 0 === getMagnitude(point1) || 0 === getMagnitude(point2)
		? 0 : Math.acos(
			getDotProduction(point1, point2) / (getMagnitude(point1) * getMagnitude(point2))
		);
}

function getCornerLatLng(point, bottomLeftMarkerPoint, bottomLeftMarkerLatLng,
						 topRightMarkerPoint, topRightMarkerLatLng){
	var r = topRightMarkerPoint.subtract(bottomLeftMarkerPoint),
		i = point.subtract(bottomLeftMarkerPoint),
		s = getClockWiseRotate90DegreePoint(r),
		l = getDotProduction(r, i) / Math.pow(getMagnitude(r), 2),
		c = -getDotProduction(s, i) / Math.pow(getMagnitude(s), 2),
		bLMarkerPx = L.Projection.SphericalMercator.project(bottomLeftMarkerLatLng),
		tRMarkerPx = L.Projection.SphericalMercator.project(topRightMarkerLatLng);

	var vx = bLMarkerPx.add(tRMarkerPx.subtract(bLMarkerPx).multiplyBy(l));
	var vy = getClockWiseRotate90DegreePoint(bLMarkerPx.subtract(tRMarkerPx)).multiplyBy(c);
	var p = vx.add(vy);
	return L.Projection.SphericalMercator.unproject(p);
}


