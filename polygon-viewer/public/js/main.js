$(document).ready(function() {
	var map = L.map('map', {
		center: [44.7723, -0.6432],
		zoom: 8,
		maxZoom: 33
	});

	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);

	const getCoords = (map, ll) => {
		var tileSize = L.point(256, 256);

		var zoom = map.getZoom();
		var pixelPoint = map.project(ll, zoom).floor();
		var coords = pixelPoint.unscaleBy(tileSize).floor();

		return "/" + zoom + "/" + coords.x + "/" + coords.y;
	};

	const decodeHash = (str) => {
		const type = [
				'l8',
				's2',
				're'
			][parseInt(str[0], 16)]
			// const op = config.ops[parseInt(str[1], 16)]
		const date = parseInt(str.slice(3), 16)

		return {
			type,
			// op,
			date
		}
	}

	const urlParams = new URLSearchParams(window.location.search);

	if (urlParams.has('polyid') && urlParams.has('appid')) {
		const polygonId = urlParams.get('polyid');
		const appId = urlParams.get('appid');

		(async() => {
			try {
				const res = await fetch(`https://api.agromonitoring.com/agro/1.0/polygons/${polygonId}?appid=${appId}`);
				const polygon = await res.json();

				const layer = L.geoJSON(polygon.geo_json, {
					style: function(feature) {
						return {
							color: '#ff2222'
						};
					}
				// }).bindPopup(function(layer) {
				// 	return `name: ${polygon.name}<br />area: ${polygon.area}`;
				}).addTo(map);

				map.fitBounds(layer.getBounds());

				let date, type;
				if (urlParams.has('hash')) {

					const decoded = decodeHash(urlParams.get('hash'));

					date = new Date(decoded.date * 1000);
					type = decoded.type;

				} else if (urlParams.has('dt') && urlParams.has('type')) {
					const dt = urlParams.get('dt');
					const type = urlParams.get('type');

					date = new Date(dt * 1000);

				} else return;

				const day = `${date.getUTCFullYear()}-${('0' + (date.getUTCMonth() + 1)).substr(-2)}-${('0' + date.getUTCDate()).substr(-2)}`;
                const url = `http://{s}.sat.owm.io/sql/{z}/{x}/{y}?op=truecolor&from=${type}&where=day:${day}&appid=${appId}&overzoom=true`;
				var tileLayer = L.tileLayer(url, {
					attribution: '&copy; <a href="http://owm.io">VANE</a>',
					maxZoom: 33
				}).addTo(map);


				map.on('click', function(e) {
					var latlng = e.latlng.wrap();
					var zxy = getCoords(this, latlng);

					L.popup()
						.setLatLng(latlng)
						.setContent('<p>lat: ' + latlng.lat + '<br />lon: ' + latlng.lng + `<br />tile: <a target="new" href="${url.replace('{s}', 'a').replace('/{z}/{x}/{y}', zxy)}">` + zxy + '</a></p>')
						.openOn(map);
				});
			} catch (err) {
				alert(err.message);
			}
		})();

	} else {
		alert('Params "polyid", and "appid" are required!');
	}
});