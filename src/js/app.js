let selectedTransportMode = null; // No default selection

// Autocomplete functionality
function setupAutocomplete(inputElement, autocompleteElement) {
    // Show all cities on focus
    inputElement.addEventListener('focus', function() {
        const value = this.value.toLowerCase().trim();
        if (!value) {
            showAllCities();
        }
    });

    function showAllCities() {
        closeAllLists();

        cityNames.forEach((city, index) => {
            const item = document.createElement('div');
            item.className = 'form__autocomplete-item';
            item.textContent = city.charAt(0).toUpperCase() + city.slice(1);
            
            // Add click event
            item.addEventListener('click', function() {
                inputElement.value = city.charAt(0).toUpperCase() + city.slice(1);
                closeAllLists();
                checkInputs();
            });
            
            autocompleteElement.appendChild(item);
        });
    }

    inputElement.addEventListener('input', function() {
        const value = this.value.toLowerCase().trim();
        closeAllLists();
        
        if (!value) {
            showAllCities();
            return;
        }

        // Filter cities that match the input
        const matches = cityNames.filter(city => city.startsWith(value));

        if (matches.length === 0) return;

        // Create autocomplete items
        matches.forEach((city, index) => {
            const item = document.createElement('div');
            item.className = 'form__autocomplete-item';
            
            // Highlight matching part
            const matchLength = value.length;
            item.innerHTML = `<strong>${city.substring(0, matchLength)}</strong>${city.substring(matchLength)}`;
            
            // Add click event
            item.addEventListener('click', function() {
                inputElement.value = city.charAt(0).toUpperCase() + city.slice(1);
                closeAllLists();
                checkInputs();
            });
            
            autocompleteElement.appendChild(item);
        });
    });
}

function closeAllLists() {
    sourceAutocomplete.innerHTML = '';
    destinationAutocomplete.innerHTML = '';
    transportAutocomplete.innerHTML = '';
}

// Close autocomplete when clicking outside
function handleClickOutside(e) {
    if (e.target !== sourceInput && e.target !== destinationInput && e.target !== transportModeInput) {
        closeAllLists();
    }
}

document.addEventListener('click', handleClickOutside);

// Setup autocomplete for transport mode
function setupTransportAutocomplete() {
    // Show all modes on focus
    transportModeInput.addEventListener('focus', function() {
        const value = this.value.toLowerCase().trim();
        if (!value || transportModesList.some(mode => mode.display === this.value)) {
            showAllModes();
        }
    });

    function showAllModes() {
        transportAutocomplete.innerHTML = '';

        transportModesList.forEach((mode) => {
            const item = document.createElement('div');
            item.className = 'form__autocomplete-item';
            item.textContent = mode.display;
            
            // Add click event
            item.addEventListener('click', function() {
                transportModeInput.value = mode.display;
                selectedTransportMode = mode.key;
                transportAutocomplete.innerHTML = '';
                checkInputs();
            });
            
            transportAutocomplete.appendChild(item);
        });
    }

    transportModeInput.addEventListener('input', function() {
        const value = this.value.toLowerCase().trim();
        transportAutocomplete.innerHTML = '';
        
        if (!value) {
            showAllModes();
            return;
        }

        // Filter modes that match the input
        const matches = transportModesList.filter(mode => 
            mode.display.toLowerCase().includes(value)
        );

        if (matches.length === 0) return;

        // Create autocomplete items
        matches.forEach((mode) => {
            const item = document.createElement('div');
            item.className = 'form__autocomplete-item';
            
            // Highlight matching part
            const displayLower = mode.display.toLowerCase();
            const matchIndex = displayLower.indexOf(value);
            if (matchIndex !== -1) {
                const before = mode.display.substring(0, matchIndex);
                const match = mode.display.substring(matchIndex, matchIndex + value.length);
                const after = mode.display.substring(matchIndex + value.length);
                item.innerHTML = `${before}<strong>${match}</strong>${after}`;
            } else {
                item.textContent = mode.display;
            }
            
            // Add click event
            item.addEventListener('click', function() {
                transportModeInput.value = mode.display;
                selectedTransportMode = mode.key;
                transportAutocomplete.innerHTML = '';
                checkInputs();
            });
            
            transportAutocomplete.appendChild(item);
        });
    });
}

// Setup autocomplete for both inputs
setupAutocomplete(sourceInput, sourceAutocomplete);
setupAutocomplete(destinationInput, destinationAutocomplete);
setupTransportAutocomplete();

// Enable button when both inputs have values
function checkInputs() {
    const sourceValue = sourceInput.value.trim();
    const destinationValue = destinationInput.value.trim();
    calculateButton.disabled = !(sourceValue && destinationValue);
}

sourceInput.addEventListener('input', checkInputs);
destinationInput.addEventListener('input', checkInputs);

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();

    const source = sourceInput.value.trim().toLowerCase();
    const destination = destinationInput.value.trim().toLowerCase();
    const selectedMode = selectedTransportMode;

    // Check if cities exist in database
    if (!cityCoordinates[source]) {
        alert(`City "${sourceInput.value}" not found in database. Try: New York, London, Paris, Tokyo, Sydney, etc.`);
        return;
    }

    if (!cityCoordinates[destination]) {
        alert(`City "${destinationInput.value}" not found in database. Try: New York, London, Paris, Tokyo, Sydney, etc.`);
        return;
    }

    // Calculate distance
    const sourceCoords = cityCoordinates[source];
    const destCoords = cityCoordinates[destination];
    const distance = calculateDistance(
        sourceCoords.lat, sourceCoords.lon,
        destCoords.lat, destCoords.lon
    );

    // Display results with animation
    displayResults(distance, source, destination, selectedMode, resultsSection);
}

calculatorForm.addEventListener('submit', handleFormSubmit);
