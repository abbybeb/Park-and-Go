let map;
let markers = {};
let userLocation = null;
let routeLayer = null;

const parkingLocations = {
    'Spanish Plaza Parking Garage': {
        coords: { lat: 29.9496, lng: -90.0683 },
        address: '1 Canal Street, New Orleans, LA',
        status: null
    },
    'Harrah\'s Casino Parking': {
        coords: { lat: 29.9478, lng: -90.0695 },
        address: '228 Poydras Street, New Orleans, LA',
        status: null
    },
    'Mercedes-Benz Superdome Parking': {
        coords: { lat: 29.9508, lng: -90.0814 },
        address: '1500 Poydras Street, New Orleans, LA',
        status: null
    },
    'French Market Parking': {
        coords: { lat: 29.9583, lng: -90.0627 },
        address: '1001 Decatur Street, New Orleans, LA',
        status: null
    },
    'Jackson Brewery Parking': {
        coords: { lat: 29.9582, lng: -90.0644 },
        address: '620 Decatur Street, New Orleans, LA',
        status: null
    },
    'Audubon Aquarium Parking': {
        coords: { lat: 29.9488, lng: -90.0664 },
        address: '1 Canal Street, New Orleans, LA',
        status: null
    },
    'Poydras Garage': {
        coords: { lat: 29.9474, lng: -90.0715 },
        address: '600 Poydras Street, New Orleans, LA',
        status: null
    },
    'Tulane Downtown Center Parking': {
        coords: { lat: 29.9489, lng: -90.0641 },
        address: '365 Canal Street, New Orleans, LA',
        status: null
    }
};

function initMap() {
    const savedData = localStorage.getItem('parkingData');
    if (savedData) {
        const saved = JSON.parse(savedData);
        for (let location in parkingLocations) {
            if (saved[location]) {
                parkingLocations[location].status = saved[location].status;
            }
        }
    }

    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }

    if (typeof L === 'undefined') {
        mapContainer.innerHTML = '<div class="map-error">Leaflet is not loaded. Check the Leaflet script tag in index.html.</div>';
        return;
    }

    map = L.map('map-container').setView([29.9511, -90.0715], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    map.whenReady(() => map.invalidateSize());
    L.control.scale().addTo(map);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                userLocation = [position.coords.latitude, position.coords.longitude];
                L.circleMarker(userLocation, {
                    radius: 8,
                    fillColor: '#3388ff',
                    fillOpacity: 1,
                    color: '#ffffff',
                    weight: 2
                }).addTo(map).bindPopup('Your Location');
            },
            function() {
                console.log('Geolocation not available');
            }
        );
    }

    createMarkers();
    populateLocationSelect();
    setupTabButtons();
    setupReportForm();

    document.getElementById('close-directions').addEventListener('click', closeDirections);
}

function getMarkerColor(status) {
    if (status === 'green') return '#2ECC71';
    if (status === 'yellow') return '#F39C12';
    if (status === 'red') return '#E74C3C';
    return '#9CA3AF';
}

function createMarkers() {
    for (let location in parkingLocations) {
        const locData = parkingLocations[location];
        const marker = L.circleMarker([locData.coords.lat, locData.coords.lng], {
            radius: 10,
            fillColor: getMarkerColor(locData.status),
            fillOpacity: 1,
            color: '#ffffff',
            weight: 2
        }).addTo(map);

        marker.bindPopup(getPopupContent(location));
        marker.bindTooltip(location, {
            permanent: true,
            direction: 'top',
            className: 'marker-label',
            offset: [0, -12]
        });

        marker.on('popupopen', function() {
            attachPopupButtons(location);
        });

        markers[location] = marker;
    }
}

function getPopupContent(location) {
    const locData = parkingLocations[location];
    const safeId = location.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const statusText = locData.status ? locData.status.charAt(0).toUpperCase() + locData.status.slice(1) : 'No Reports';

    return `
        <div class="parking-popup">
            <h3>${location}</h3>
            <p class="popup-address">${locData.address}</p>
            <p>Status: <strong>${statusText}</strong></p>
            <div class="popup-buttons">
                <button id="directions-btn-${safeId}" class="parking-popup-btn directions-btn" data-location="${location}">🗺️ Get Directions</button>
                <button id="report-btn-${safeId}" class="parking-popup-btn report-btn" data-location="${location}">📝 Report</button>
            </div>
        </div>
    `;
}

function attachPopupButtons(location) {
    const safeId = location.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const directionsBtn = document.getElementById(`directions-btn-${safeId}`);
    const reportBtn = document.getElementById(`report-btn-${safeId}`);

    if (directionsBtn) {
        directionsBtn.onclick = function() {
            showDirections(location, parkingLocations[location].coords);
        };
    }

    if (reportBtn) {
        reportBtn.onclick = function() {
            selectReportLocation(location);
            map.closePopup();
        };
    }
}

function showDirections(locationName, destination) {
    if (!userLocation) {
        alert('Please enable location services to get directions.');
        return;
    }

    if (routeLayer) {
        map.removeLayer(routeLayer);
    }

    const routePoints = [userLocation, [destination.lat, destination.lng]];
    routeLayer = L.polyline(routePoints, { color: '#6B4C9A', weight: 5, opacity: 0.75 }).addTo(map);

    const distanceMeters = getDistanceMeters(userLocation, [destination.lat, destination.lng]);
    const route = {
        distance: { text: formatDistance(distanceMeters) },
        duration: { text: estimateDuration(distanceMeters) },
        steps: [
            { instructions: `Travel from your location to ${locationName}.` }
        ]
    };

    updateDirectionsPanel(locationName, route);
    document.getElementById('directions-panel').classList.remove('hidden');
    map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
}

function updateDirectionsPanel(locationName, route) {
    document.getElementById('directions-title').textContent = `Directions to ${locationName}`;
    document.getElementById('distance-value').textContent = route.distance.text;
    document.getElementById('duration-value').textContent = route.duration.text;

    const stepsContainer = document.getElementById('directions-steps');
    stepsContainer.innerHTML = '';

    route.steps.forEach((step, index) => {
        const stepEl = document.createElement('div');
        stepEl.className = 'direction-step';
        stepEl.innerHTML = `
            <span class="step-number">${index + 1}.</span>
            <span class="step-text">${step.instructions}</span>
        `;
        stepsContainer.appendChild(stepEl);
    });
}

function closeDirections() {
    document.getElementById('directions-panel').classList.add('hidden');
    if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
    }
}

function selectReportLocation(location) {
    document.getElementById('location-select').value = location;
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelector('[data-tab="report"]').classList.add('active');
    document.getElementById('report').classList.add('active');
    setTimeout(() => map.invalidateSize(), 100);
}

function updateMarkers() {
    for (let location in parkingLocations) {
        const locData = parkingLocations[location];
        const marker = markers[location];
        if (marker) {
            marker.setStyle({ fillColor: getMarkerColor(locData.status) });
            marker.setPopupContent(getPopupContent(location));
        }
    }
}

function populateLocationSelect() {
    const locationSelect = document.getElementById('location-select');
    while (locationSelect.options.length > 1) {
        locationSelect.remove(1);
    }
    for (let location in parkingLocations) {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationSelect.appendChild(option);
    }
}

function setupTabButtons() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            tabButtons.forEach(function(btn) {
                btn.classList.remove('active');
            });
            tabPanes.forEach(function(pane) {
                pane.classList.remove('active');
            });
            this.classList.add('active');
            document.getElementById(tabName).classList.add('active');

            if (tabName === 'map') {
                setTimeout(() => map.invalidateSize(), 100);
            }
        });
    });
}

function setupReportForm() {
    let selectedStatus = null;
    const availabilityBtns = document.querySelectorAll('.availability-btn');
    availabilityBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            availabilityBtns.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            selectedStatus = this.getAttribute('data-status');
        });
    });

    document.getElementById('submit-report').addEventListener('click', function() {
        const selectedLocation = document.getElementById('location-select').value;
        const reportStatus = document.getElementById('report-status');

        if (!selectedLocation) {
            reportStatus.className = 'report-status error';
            reportStatus.textContent = '❌ Please select a location!';
            reportStatus.style.display = 'block';
            return;
        }

        if (!selectedStatus) {
            reportStatus.className = 'report-status error';
            reportStatus.textContent = '❌ Please select parking availability!';
            reportStatus.style.display = 'block';
            return;
        }

        let markerStatus;
        if (selectedStatus === 'available') {
            markerStatus = 'green';
        } else if (selectedStatus === 'limited') {
            markerStatus = 'yellow';
        } else if (selectedStatus === 'full') {
            markerStatus = 'red';
        }

        parkingLocations[selectedLocation].status = markerStatus;
        localStorage.setItem('parkingData', JSON.stringify(parkingLocations));
        updateMarkers();

        reportStatus.className = 'report-status success';
        reportStatus.textContent = '✅ Report submitted successfully for ' + selectedLocation + '!';
        reportStatus.style.display = 'block';

        setTimeout(function() {
            document.getElementById('location-select').value = '';
            selectedStatus = null;
            availabilityBtns.forEach(b => b.classList.remove('selected'));
            reportStatus.style.display = 'none';
        }, 3000);
    });
}

function getDistanceMeters(from, to) {
    const toRad = x => x * Math.PI / 180;
    const lat1 = from[0];
    const lon1 = from[1];
    const lat2 = to[0];
    const lon2 = to[1];
    const R = 6371e3;
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function formatDistance(meters) {
    if (meters >= 1000) {
        return (meters / 1000).toFixed(1) + ' km';
    }
    return Math.round(meters) + ' m';
}

function estimateDuration(meters) {
    const speedMetersPerSec = 13.9;
    const seconds = meters / speedMetersPerSec;
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
}

window.addEventListener('DOMContentLoaded', initMap);
