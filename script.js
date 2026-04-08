let map;
let directionsService;
let directionsRenderer;
let infoWindow;
let userLocation = null;

function loadGoogleMapsApi() {
    // Replace the value below with your own valid Google Maps JavaScript API key.
    const apiKey = 'YOUR_GOOGLE_MAPS_API_KEY';
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
    script.defer = true;
    script.async = true;
    script.onerror = function() {
        const mapContainer = document.getElementById('map-container');
        if (mapContainer) {
            mapContainer.innerHTML = '<div class="map-error">Google Maps failed to load. Replace YOUR_GOOGLE_MAPS_API_KEY with a valid API key.</div>';
        }
    };
    document.head.appendChild(script);
}

window.initMap = initMap;
loadGoogleMapsApi();

function initMap() {
    const parkingLocations = {
        'Spanish Plaza Parking Garage': {
            coords: { lat: 29.9519, lng: -90.2726 },
            address: '1 Canal Street, New Orleans, LA',
            status: null,
            emoji: '🅿️'
        },
        'Harrah\'s Casino Parking': {
            coords: { lat: 29.9475, lng: -90.2689 },
            address: '228 Poydras Street, New Orleans, LA',
            status: null,
            emoji: '🅿️'
        },
        'Mercedes-Benz Superdome Parking': {
            coords: { lat: 29.9406, lng: -90.2813 },
            address: '1500 Poydras Street, New Orleans, LA',
            status: null,
            emoji: '🅿️'
        },
        'French Market Parking': {
            coords: { lat: 29.9593, lng: -90.2587 },
            address: '1001 Decatur Street, New Orleans, LA',
            status: null,
            emoji: '🅿️'
        },
        'Jackson Brewery Parking': {
            coords: { lat: 29.9582, lng: -90.2616 },
            address: '620 Decatur Street, New Orleans, LA',
            status: null,
            emoji: '🅿️'
        },
        'Audubon Aquarium Parking': {
            coords: { lat: 29.9394, lng: -90.2839 },
            address: '1 Canal Street, New Orleans, LA',
            status: null,
            emoji: '🅿️'
        },
        'Poydras Garage': {
            coords: { lat: 29.9483, lng: -90.2770 },
            address: '600 Poydras Street, New Orleans, LA',
            status: null,
            emoji: '🅿️'
        },
        'Tulane Downtown Center Parking': {
            coords: { lat: 29.9350, lng: -90.2750 },
            address: '365 Canal Street, New Orleans, LA',
            status: null,
            emoji: '🅿️'
        }
    };

    const savedData = localStorage.getItem('parkingData');
    if (savedData) {
        const saved = JSON.parse(savedData);
        for (let location in parkingLocations) {
            if (saved[location]) {
                parkingLocations[location].status = saved[location].status;
            }
        }
    }

    map = new google.maps.Map(document.getElementById('map-container'), {
        center: { lat: 29.9511, lng: -90.2623 },
        zoom: 13,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: '#6B4C9A',
            strokeWeight: 5,
            strokeOpacity: 0.75
        }
    });

    infoWindow = new google.maps.InfoWindow();

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    title: 'Your Location',
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: '#3388ff',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 2
                    }
                });
            },
            function() {
                console.log('Geolocation not available');
            }
        );
    }

    const markers = {};

    function getMarkerColor(status) {
        if (status === 'green') return '#2ECC71';
        if (status === 'yellow') return '#F39C12';
        if (status === 'red') return '#E74C3C';
        return '#9CA3AF';
    }

    function getMarkerIcon(status) {
        return {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 11,
            fillColor: getMarkerColor(status),
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
        };
    }

    function createMarkers() {
        for (let location in parkingLocations) {
            const locData = parkingLocations[location];
            const marker = new google.maps.Marker({
                position: locData.coords,
                map: map,
                title: location,
                icon: getMarkerIcon(locData.status)
            });

            marker.addListener('click', function() {
                openInfoWindow(location, marker);
            });

            markers[location] = marker;
        }
    }

    function openInfoWindow(location, marker) {
        const locData = parkingLocations[location];
        const safeId = location.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const content = `
            <div class="parking-popup">
                <h3>${location}</h3>
                <p class="popup-address">${locData.address}</p>
                <p>Status: <strong>${locData.status ? (locData.status.charAt(0).toUpperCase() + locData.status.slice(1)) : 'No Reports'}</strong></p>
                <div class="popup-buttons">
                    <button id="directions-btn-${safeId}" class="parking-popup-btn directions-btn" data-location="${location}">🗺️ Get Directions</button>
                    <button id="report-btn-${safeId}" class="parking-popup-btn report-btn" data-location="${location}">📝 Report</button>
                </div>
            </div>
        `;

        infoWindow.setContent(content);
        infoWindow.open(map, marker);

        google.maps.event.addListenerOnce(infoWindow, 'domready', function() {
            document.getElementById(`directions-btn-${safeId}`).addEventListener('click', function() {
                showDirections(location, locData.coords);
            });
            document.getElementById(`report-btn-${safeId}`).addEventListener('click', function() {
                selectReportLocation(location);
                infoWindow.close();
            });
        });
    }

    function showDirections(locationName, destination) {
        if (!userLocation) {
            alert('Please enable location services to get directions.');
            return;
        }

        directionsService.route(
            {
                origin: userLocation,
                destination: destination,
                travelMode: google.maps.TravelMode.DRIVING
            },
            function(response, status) {
                if (status === 'OK') {
                    directionsRenderer.setDirections(response);
                    const route = response.routes[0].legs[0];
                    updateDirectionsPanel(locationName, route);
                    document.getElementById('directions-panel').classList.remove('hidden');
                    const bounds = new google.maps.LatLngBounds();
                    bounds.extend(userLocation);
                    bounds.extend(destination);
                    map.fitBounds(bounds);
                } else {
                    alert('Unable to get directions. Please try again.');
                }
            }
        );
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

    document.getElementById('close-directions').addEventListener('click', function() {
        document.getElementById('directions-panel').classList.add('hidden');
        directionsRenderer.setDirections({ routes: [] });
    });

    function selectReportLocation(location) {
        document.getElementById('location-select').value = location;
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        document.querySelector('[data-tab="report"]').classList.add('active');
        document.getElementById('report').classList.add('active');
        setTimeout(() => google.maps.event.trigger(map, 'resize'), 100);
    }

    function updateMarkers() {
        for (let location in parkingLocations) {
            const locData = parkingLocations[location];
            const marker = markers[location];
            if (marker) {
                marker.setIcon(getMarkerIcon(locData.status));
            }
        }
    }

    createMarkers();

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
                setTimeout(() => google.maps.event.trigger(map, 'resize'), 100);
            }
        });
    });

    let selectedStatus = null;
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
