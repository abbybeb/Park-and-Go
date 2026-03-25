document.addEventListener('DOMContentLoaded', function() {
    // Real New Orleans Parking Garages with accurate coordinates and addresses
    const parkingLocations = {
        'Spanish Plaza Parking Garage': { 
            coords: [29.9519, -90.2726], 
            address: '1 Canal Street, New Orleans, LA',
            status: null, 
            emoji: '🅿️'
        },
        'Harrah\'s Casino Parking': { 
            coords: [29.9475, -90.2689], 
            address: '228 Poydras Street, New Orleans, LA',
            status: null, 
            emoji: '🅿️'
        },
        'Mercedes-Benz Superdome Parking': { 
            coords: [29.9406, -90.2813], 
            address: '1500 Poydras Street, New Orleans, LA',
            status: null, 
            emoji: '🅿️'
        },
        'French Market Parking': { 
            coords: [29.9593, -90.2587], 
            address: '1001 Decatur Street, New Orleans, LA',
            status: null, 
            emoji: '🅿️'
        },
        'Jackson Brewery Parking': { 
            coords: [29.9582, -90.2616], 
            address: '620 Decatur Street, New Orleans, LA',
            status: null, 
            emoji: '🅿️'
        },
        'Audubon Aquarium Parking': { 
            coords: [29.9394, -90.2839], 
            address: '1 Canal Street, New Orleans, LA',
            status: null, 
            emoji: '🅿️'
        },
        'Poydras Garage': { 
            coords: [29.9483, -90.2770], 
            address: '600 Poydras Street, New Orleans, LA',
            status: null, 
            emoji: '🅿️'
        },
        'Tulane Downtown Center Parking': { 
            coords: [29.9350, -90.2750], 
            address: '365 Canal Street, New Orleans, LA',
            status: null, 
            emoji: '🅿️'
        }
    };

    // Load data from localStorage if available
    const savedData = localStorage.getItem('parkingData');
    if (savedData) {
        const saved = JSON.parse(savedData);
        for (let location in parkingLocations) {
            if (saved[location]) {
                parkingLocations[location].status = saved[location].status;
            }
        }
    }

    // Initialize Leaflet map
    const map = L.map('map-container').setView([29.9511, -90.2623], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        tileSize: 256
    }).addTo(map);

    // For GPS tracking
    let userLocation = null;
    let routingControl = null;

    // Get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                userLocation = [position.coords.latitude, position.coords.longitude];
                
                // Add user location marker
                L.circleMarker(userLocation, {
                    radius: 8,
                    fillColor: '#3388ff',
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(map).bindPopup('📍 Your Location');
            },
            function(error) {
                console.log('Geolocation not available');
            }
        );
    }

    // Store markers for later updates
    const markers = {};

    // Function to get marker color based on status
    function getMarkerColor(status) {
        if (status === 'green') return '#2ECC71';
        if (status === 'yellow') return '#F39C12';
        if (status === 'red') return '#E74C3C';
        return '#9CA3AF'; // grey for no status
    }

    // Function to show directions
    function showDirections(locationName, destination) {
        if (!userLocation) {
            alert('Please enable location services to get directions.');
            return;
        }

        // Remove existing routing control
        if (routingControl) {
            map.removeControl(routingControl);
        }

        // Create routing control
        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(userLocation[0], userLocation[1]),
                L.latLng(destination[0], destination[1])
            ],
            routeWhileDragging: false,
            showAlternatives: false,
            createMarker: function() { return null; }, // Don't show routing markers
            lineOptions: {
                styles: [{color: '#6B4C9A', opacity: 0.7, weight: 5}]
            }
        }).on('routesfound', function(e) {
            const routes = e.routes;
            const route = routes[0];
            
            // Update directions panel
            updateDirectionsPanel(locationName, route);
            
            // Show directions panel
            const panel = document.getElementById('directions-panel');
            panel.classList.remove('hidden');
        }).addTo(map);
    }

    // Function to update directions panel
    function updateDirectionsPanel(locationName, route) {
        document.getElementById('directions-title').textContent = `Directions to ${locationName}`;
        
        // Convert meters to miles
        const distanceMiles = (route.summary.totalDistance / 1609.34).toFixed(1);
        document.getElementById('distance-value').textContent = `${distanceMiles} mi`;
        
        // Convert seconds to minutes
        const durationMinutes = Math.ceil(route.summary.totalTime / 60);
        document.getElementById('duration-value').textContent = `${durationMinutes} min`;
        
        // Build step-by-step directions
        const stepsContainer = document.getElementById('directions-steps');
        stepsContainer.innerHTML = '';
        
        let stepNumber = 1;
        route.instructions.forEach(instruction => {
            const stepEl = document.createElement('div');
            stepEl.className = 'direction-step';
            stepEl.innerHTML = `
                <span class="step-number">${stepNumber}.</span>
                <span class="step-text">${instruction.text}</span>
            `;
            stepsContainer.appendChild(stepEl);
            stepNumber++;
        });
    }

    // Close directions button
    document.getElementById('close-directions').addEventListener('click', function() {
        document.getElementById('directions-panel').classList.add('hidden');
        if (routingControl) {
            map.removeControl(routingControl);
            routingControl = null;
        }
    });

    // Function to create and add markers
    function createMarkers() {
        for (let location in parkingLocations) {
            const locData = parkingLocations[location];
            const color = getMarkerColor(locData.status);

            // Create a custom marker div
            const markerDiv = document.createElement('div');
            markerDiv.className = 'parking-marker';
            markerDiv.style.backgroundColor = color;
            markerDiv.textContent = '🅿️';

            // Create marker with custom div icon
            const customMarker = L.marker(locData.coords, {
                icon: L.divIcon({
                    html: markerDiv,
                    className: 'custom-parking-marker',
                    iconSize: [36, 36],
                    iconAnchor: [18, 18],
                    popupAnchor: [0, -18]
                })
            }).addTo(map);

            // Create popup content
            const popupContent = document.createElement('div');
            popupContent.className = 'parking-popup';
            popupContent.innerHTML = `
                <h3>${location}</h3>
                <p class="popup-address">${locData.address}</p>
                <p>Status: <strong>${locData.status ? (locData.status.charAt(0).toUpperCase() + locData.status.slice(1)) : 'No Reports'}</strong></p>
                <div class="popup-buttons">
                    <button class="parking-popup-btn directions-btn" data-location="${location}">🗺️ Get Directions</button>
                    <button class="parking-popup-btn report-btn" data-location="${location}">📝 Report</button>
                </div>
            `;

            // Handle directions button
            popupContent.querySelector('.directions-btn').addEventListener('click', function(e) {
                e.preventDefault();
                const loc = this.getAttribute('data-location');
                const locData = parkingLocations[loc];
                showDirections(loc, locData.coords);
            });

            // Handle report button
            popupContent.querySelector('.report-btn').addEventListener('click', function(e) {
                e.preventDefault();
                const loc = this.getAttribute('data-location');
                document.getElementById('location-select').value = loc;
                
                // Switch to report tab
                document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
                document.querySelector('[data-tab="report"]').classList.add('active');
                document.getElementById('report').classList.add('active');
                
                map.closePopup();
            });

            customMarker.bindPopup(popupContent);
            markers[location] = customMarker;
        }
    }

    // Create initial markers
    createMarkers();

    // Tab switching functionality
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
            
            // Invalidate map size when switching to map tab
            if (tabName === 'map') {
                setTimeout(() => map.invalidateSize(), 100);
            }
        });
    });

    // Update markers function
    function updateMarkers() {
        for (let location in parkingLocations) {
            const locData = parkingLocations[location];
            const color = getMarkerColor(locData.status);
            const marker = markers[location];

            if (marker) {
                // Update marker color
                const markerEl = marker.getElement();
                if (markerEl) {
                    markerEl.querySelector('.parking-marker').style.backgroundColor = color;
                    markerEl.querySelector('.parking-marker').style.animation = locData.status ? 'pulse 1s infinite' : 'none';
                }

                // Update popup content
                const popupContent = document.createElement('div');
                popupContent.className = 'parking-popup';
                popupContent.innerHTML = `
                    <h3>${location}</h3>
                    <p class="popup-address">${locData.address}</p>
                    <p>Status: <strong>${locData.status ? (locData.status.charAt(0).toUpperCase() + locData.status.slice(1)) : 'No Reports'}</strong></p>
                    <div class="popup-buttons">
                        <button class="parking-popup-btn directions-btn" data-location="${location}">🗺️ Get Directions</button>
                        <button class="parking-popup-btn report-btn" data-location="${location}">📝 Report</button>
                    </div>
                `;

                // Handle directions button
                popupContent.querySelector('.directions-btn').addEventListener('click', function(e) {
                    e.preventDefault();
                    const loc = this.getAttribute('data-location');
                    const locData = parkingLocations[loc];
                    showDirections(loc, locData.coords);
                });

                // Handle report button
                popupContent.querySelector('.report-btn').addEventListener('click', function(e) {
                    e.preventDefault();
                    const loc = this.getAttribute('data-location');
                    document.getElementById('location-select').value = loc;
                    
                    // Switch to report tab
                    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
                    document.querySelector('[data-tab="report"]').classList.add('active');
                    document.getElementById('report').classList.add('active');
                    
                    map.closePopup();
                });

                marker.setPopupContent(popupContent);
            }
        }
    }

    // Report form functionality
    let selectedStatus = null;

    // Update location select dropdown with real parking garages
    const locationSelect = document.getElementById('location-select');
    
    // Clear existing options except the first one
    while (locationSelect.options.length > 1) {
        locationSelect.remove(1);
    }
    
    // Add parking garage options
    for (let location in parkingLocations) {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationSelect.appendChild(option);
    }

    // Availability button selection
    const availabilityBtns = document.querySelectorAll('.availability-btn');
    availabilityBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            availabilityBtns.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            selectedStatus = this.getAttribute('data-status');
        });
    });

    // Submit report
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

        // Map status to marker color
        let markerStatus;
        if (selectedStatus === 'available') {
            markerStatus = 'green';
        } else if (selectedStatus === 'limited') {
            markerStatus = 'yellow';
        } else if (selectedStatus === 'full') {
            markerStatus = 'red';
        }

        // Update location status
        parkingLocations[selectedLocation].status = markerStatus;

        // Save to localStorage
        localStorage.setItem('parkingData', JSON.stringify(parkingLocations));

        // Update markers on map
        updateMarkers();

        // Show success message
        reportStatus.className = 'report-status success';
        reportStatus.textContent = '✅ Report submitted successfully for ' + selectedLocation + '!';
        reportStatus.style.display = 'block';

        // Reset form
        setTimeout(function() {
            document.getElementById('location-select').value = '';
            selectedStatus = null;
            availabilityBtns.forEach(b => b.classList.remove('selected'));
            reportStatus.style.display = 'none';
        }, 3000);
    });
});
