const map = L.map('map').setView([20.5937, 78.9629], 5); // Default to India

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let startMarker, endMarker, routeLayer, distanceLabel;

function calculateRoute() {
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;

    if (!start || !end) {
        alert("Please enter both starting and destination points.");
        return;
    }

    const geocodeURL = (place) =>
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`;

    Promise.all([fetch(geocodeURL(start)), fetch(geocodeURL(end))])
        .then(responses => Promise.all(responses.map(res => res.json())))
        .then(([startData, endData]) => {
            if (!startData.length || !endData.length) {
                alert("Invalid location. Try again.");
                return;
            }

            const startCoords = [parseFloat(startData[0].lat), parseFloat(startData[0].lon)];
            const endCoords = [parseFloat(endData[0].lat), parseFloat(endData[0].lon)];

            if (startMarker) map.removeLayer(startMarker);
            if (endMarker) map.removeLayer(endMarker);
            if (routeLayer) map.removeLayer(routeLayer);
            if (distanceLabel) map.removeLayer(distanceLabel);

            startMarker = L.marker(startCoords).addTo(map).bindPopup("Start").openPopup();
            endMarker = L.marker(endCoords).addTo(map).bindPopup("End").openPopup();

            fetchRoute(startCoords, endCoords);
        })
        .catch(error => console.error('Error fetching geolocation:', error));
}

function fetchRoute(startCoords, endCoords) {
    const apiKey = '5b3ce3597851110001cf62481f2507981d064803bcb27a9847ffe992';
    const routeUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${startCoords[1]},${startCoords[0]}&end=${endCoords[1]},${endCoords[0]}`;

    fetch(routeUrl)
        .then(response => response.json())
        .then(data => {
            if (!data.routes || data.routes.length === 0) {
                alert("No route found. Try a different location.");
                return;
            }

            const route = data.routes[0];
            const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
            const distance = (route.summary.distance / 1000).toFixed(2); // Convert meters to km

            routeLayer = L.polyline(coords, { color: 'blue', weight: 5 }).addTo(map);
            map.fitBounds(routeLayer.getBounds());

            const midPoint = coords[Math.floor(coords.length / 2)];
            distanceLabel = L.marker(midPoint, {
                icon: L.divIcon({
                    className: 'distance-label',
                    html: `<div>${distance} km</div>`,
                    iconSize: [100, 30]
                })
            }).addTo(map);
        })
        .catch(error => {
            console.error('Error fetching route:', error);
            alert("Failed to fetch the route. Check your API key or try another location.");
        });
}
