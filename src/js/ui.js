// Format time for display
function formatTime(hours) {
    return hours < 1 ? `${Math.round(hours * 60)} min` : `${hours.toFixed(1)} hours`;
}

// Format cost for display
function formatCost(cost) {
    return `$${cost.toFixed(2)}`;
}

// Format distance for display
function formatDistance(distance) {
    return `${Math.round(distance)} km`;
}

// Format CO2 for display
function formatCO2(co2) {
    return `${co2.toFixed(2)} kg`;
}

// Calculate percentage for bar visualization
function calculatePercentage(value, maxValue) {
    if (maxValue === 0) return value === 0 ? 0 : 100;
    return Math.min(100, (value / maxValue) * 100);
}

// Capitalize first letter of a string
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Display results in the UI
function displayResults(distance, source, destination, selectedMode, resultsSection) {
    window.currentDistance = distance;
    window.selectedModeKey = selectedMode;
    
    // Update route info
    document.getElementById('routeInfo').textContent = `${capitalize(source)} → ${capitalize(destination)}`;
    
    // Get selected mode data
    const selectedModeData = transportModes[selectedMode];
    const selectedCO2 = distance * selectedModeData.emission;
    const selectedTime = distance / selectedModeData.speed;
    const selectedCost = distance * selectedModeData.cost;
    
    // Update selected mode display
    document.getElementById('selectedModeName').textContent = `${selectedModeData.icon} ${selectedModeData.name}`;
    document.getElementById('selectedCO2').textContent = formatCO2(selectedCO2);
    document.getElementById('selectedTime').textContent = formatTime(selectedTime);
    document.getElementById('selectedCost').textContent = formatCost(selectedCost);
    document.getElementById('selectedDistance').textContent = formatDistance(distance);
    
    // Calculate emissions, time, and cost for each mode
    window.currentModeResults = calculateAllModeResults(distance);
    
    // Generate environmental impact messages
    const { impactMsg, co2CostMsg } = calculateImpactMessages(
        selectedCO2, selectedTime, selectedMode, window.currentModeResults, distance
    );
    
    document.getElementById('impactMessage').textContent = impactMsg;
    document.getElementById('co2CostMessage').textContent = co2CostMsg;
    
    // Sort by emissions initially
    window.currentModeResults.sort((a, b) => a.co2 - b.co2);
    
    // Render modes
    renderModes();
    
    // Add sort listener
    const sortSelect = document.getElementById('sortMode');
    sortSelect.removeEventListener('change', renderModes);
    sortSelect.addEventListener('change', renderModes);
    
    // Show results with animation
    resultsSection.classList.add('results--visible');
    
    // Scroll to results
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// Render mode comparison cards
function renderModes() {
    const sortBy = document.getElementById('sortMode').value;
    const modesContainer = document.getElementById('modesComparison');
    modesContainer.innerHTML = '';
    
    // Sort based on selection
    const sortedResults = [...window.currentModeResults];
    if (sortBy === 'emission') {
        sortedResults.sort((a, b) => a.co2 - b.co2);
    } else if (sortBy === 'time') {
        sortedResults.sort((a, b) => a.time - b.time);
    } else if (sortBy === 'cost') {
        sortedResults.sort((a, b) => a.cost - b.cost);
    }
    
    // Get selected mode result for comparison
    const selectedResult = window.currentModeResults.find(r => r.key === window.selectedModeKey);
    
    // Find best for current sort
    const bestIndex = 0;
    const worstIndex = sortedResults.length - 1;
    
    // Create mode cards
    sortedResults.forEach((result, index) => {
        const modeCard = createModeCard(result, index, bestIndex, worstIndex, selectedResult);
        modesContainer.appendChild(modeCard);
    });
}

// Create a single mode comparison card
function createModeCard(result, index, bestIndex, worstIndex, selectedResult) {
    const modeCard = document.createElement('div');
    modeCard.className = 'results__mode-card';
    if (result.key === window.selectedModeKey) modeCard.classList.add('results__mode-card--selected');
    if (index === bestIndex) modeCard.classList.add('results__mode-card--best');
    if (index === worstIndex) modeCard.classList.add('results__mode-card--worst');
    
    const timeStr = formatTime(result.time).replace(' hours', 'h').replace(' min', 'm');
    const costStr = formatCost(result.cost);
    
    // Determine which badge to show (priority: Selected > Best > Worst)
    const badgeHTML = getBadgeHTML(result.key, index, bestIndex, worstIndex);
    
    // Calculate comparison with selected mode
    const comparisonText = getComparisonText(result, selectedResult);
    
    // Calculate comparison bars
    const { co2Percent, timePercent, costPercent } = getBarPercentages(result);
    
    modeCard.innerHTML = `
        <div class="results__mode-header">
            <div class="results__mode-icon">${result.mode.icon}</div>
            <div class="results__mode-title">
                <div class="results__mode-name">${result.mode.name}</div>
                <div class="results__mode-meta">${timeStr} • ${costStr}</div>
                ${comparisonText ? `<div class="results__mode-comparison">${comparisonText}</div>` : '<div class="results__mode-comparison">Your selection</div>'}
            </div>
            ${badgeHTML}
        </div>
        <div class="results__mode-bars">
            <div class="results__mode-bar">
                <span class="results__mode-bar-label">CO₂</span>
                <div class="results__mode-bar-track">
                    <div class="results__mode-bar-fill" style="width: ${co2Percent}%"></div>
                </div>
                <span class="results__mode-bar-value">${formatCO2(result.co2)}</span>
            </div>
            <div class="results__mode-bar">
                <span class="results__mode-bar-label">Time</span>
                <div class="results__mode-bar-track">
                    <div class="results__mode-bar-fill results__mode-bar-fill--time" style="width: ${timePercent}%"></div>
                </div>
                <span class="results__mode-bar-value">${timeStr}</span>
            </div>
            <div class="results__mode-bar">
                <span class="results__mode-bar-label">Cost</span>
                <div class="results__mode-bar-track">
                    <div class="results__mode-bar-fill results__mode-bar-fill--cost" style="width: ${costPercent}%"></div>
                </div>
                <span class="results__mode-bar-value">${costStr}</span>
            </div>
        </div>
    `;
    
    return modeCard;
}

// Get badge HTML based on mode status
function getBadgeHTML(modeKey, index, bestIndex, worstIndex) {
    if (modeKey === window.selectedModeKey) {
        return '<div class="results__mode-badge results__mode-badge--selected">Your Choice</div>';
    } else if (index === bestIndex) {
        return '<div class="results__mode-badge results__mode-badge--best">Best</div>';
    } else if (index === worstIndex) {
        return '<div class="results__mode-badge results__mode-badge--worst">Worst</div>';
    }
    return '';
}

// Get comparison text for a mode
function getComparisonText(result, selectedResult) {
    if (result.key === window.selectedModeKey) {
        return '';
    }
    
    const co2Diff = Math.abs(result.co2 - selectedResult.co2);
    
    if (result.co2 < selectedResult.co2) {
        return `${co2Diff.toFixed(2)} kg less CO₂`;
    } else if (result.co2 > selectedResult.co2) {
        return `${co2Diff.toFixed(2)} kg more CO₂`;
    } else {
        return 'Same emissions';
    }
}

// Get bar percentages for visualization
function getBarPercentages(result) {
    const maxCO2 = Math.max(...window.currentModeResults.map(r => r.co2));
    const maxTime = Math.max(...window.currentModeResults.map(r => r.time));
    const maxCost = Math.max(...window.currentModeResults.map(r => r.cost));
    
    return {
        co2Percent: calculatePercentage(result.co2, maxCO2),
        timePercent: calculatePercentage(result.time, maxTime),
        costPercent: calculatePercentage(result.cost, maxCost)
    };
}
