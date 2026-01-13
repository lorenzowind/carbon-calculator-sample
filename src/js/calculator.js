// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Calculate emissions for all transport modes
function calculateAllModeResults(distance) {
    const results = [];
    for (const [key, mode] of Object.entries(transportModes)) {
        const co2 = distance * mode.emission;
        const time = distance / mode.speed;
        const cost = distance * mode.cost;
        results.push({ key, mode, co2, time, cost });
    }
    return results;
}

// Calculate environmental impact and cost messaging
function calculateImpactMessages(selectedCO2, selectedTime, selectedModeKey, modeResults, distance) {
    // Sort by emissions for finding best/worst
    const sortedByEmission = [...modeResults].sort((a, b) => a.co2 - b.co2);
    const lowestEmissionMode = sortedByEmission[0];
    const worstMode = sortedByEmission[sortedByEmission.length - 1];
    
    // Determine "best" option considering both emissions AND reasonable time
    let bestMode = lowestEmissionMode;
    const avgTime = modeResults.reduce((sum, r) => sum + r.time, 0) / modeResults.length;
    
    // If lowest emission option takes unreasonably long, find practical best
    if (lowestEmissionMode.time > avgTime * 2 && lowestEmissionMode.time > 10) {
        const practicalOptions = sortedByEmission.filter(r => r.time < avgTime * 1.5);
        if (practicalOptions.length > 0) {
            bestMode = practicalOptions[0];
        }
    }
    
    // Calculate CO2 cost at $25 per ton (standard carbon pricing)
    const co2PricePerKg = 0.025; // $25 per ton = $0.025 per kg
    const selectedCO2Cost = selectedCO2 * co2PricePerKg;
    const bestCO2Cost = bestMode.co2 * co2PricePerKg;
    const worstCO2Cost = worstMode.co2 * co2PricePerKg;
    
    // Generate environmental impact message
    let impactMsg = '';
    let co2CostMsg = '';
    
    const timeInHours = selectedTime;
    const bestTimeInHours = bestMode.time;
    const timeDifference = Math.abs(selectedTime - bestMode.time);
    
    if (selectedCO2 === bestMode.co2 && selectedModeKey === bestMode.key) {
        // User selected the best option
        impactMsg = `✅ Perfect choice! You've selected the best option for environmental impact with ${selectedCO2.toFixed(2)} kg CO₂ emissions and ${timeInHours.toFixed(1)} hours travel time.`;
        co2CostMsg = `Your carbon cost: $${selectedCO2Cost.toFixed(2)}. You're making the most environmentally responsible choice!`;
    } else if (selectedCO2 === lowestEmissionMode.co2) {
        if (selectedTime > avgTime * 2) {
            impactMsg = `✅ You've chosen the lowest emission option (${selectedCO2.toFixed(2)} kg CO₂), but this journey takes ${timeInHours.toFixed(1)} hours. ${bestMode.key !== selectedModeKey ? `Consider ${bestMode.mode.name} (${bestMode.co2.toFixed(2)} kg CO₂, ${bestMode.time.toFixed(1)} hours) for a better balance of time and emissions.` : ''}`;
        } else {
            impactMsg = `✅ Excellent choice! You've selected the most eco-friendly option with the lowest CO₂ emissions and reasonable travel time.`;
        }
        co2CostMsg = `Your carbon footprint costs $${selectedCO2Cost.toFixed(2)} (carbon price). You're minimizing environmental impact!`;
    } else if (selectedCO2 === worstMode.co2) {
        const potentialSavings = selectedCO2 - bestMode.co2;
        const costSavings = selectedCO2Cost - bestCO2Cost;
        impactMsg = `⚠️ This is the highest emission option (${selectedCO2.toFixed(2)} kg CO₂). Travel time: ${timeInHours.toFixed(1)} hours. You could reduce ${potentialSavings.toFixed(2)} kg CO₂ by switching to ${bestMode.mode.name.toLowerCase()} (${bestMode.time.toFixed(1)} hours).`;
        co2CostMsg = `Your carbon cost: $${selectedCO2Cost.toFixed(2)}. Switching to ${bestMode.mode.name.toLowerCase()} would save $${costSavings.toFixed(2)} in carbon costs and significantly reduce environmental harm.`;
    } else {
        const excessEmissions = selectedCO2 - bestMode.co2;
        const potentialSavings = selectedCO2Cost - bestCO2Cost;
        const percentMore = ((selectedCO2 / bestMode.co2 - 1) * 100).toFixed(0);
        const timeComparison = selectedTime < bestMode.time ? 
            `${timeDifference.toFixed(1)} hours faster` : 
            `${timeDifference.toFixed(1)} hours slower`;
        impactMsg = `Your choice emits ${excessEmissions.toFixed(2)} kg more CO₂ than ${bestMode.mode.name} (${percentMore}% higher). Travel time: ${timeInHours.toFixed(1)} hours vs ${bestMode.time.toFixed(1)} hours (${timeComparison}). Consider if the time saved justifies the environmental cost.`;
        co2CostMsg = `Carbon cost: $${selectedCO2Cost.toFixed(2)}. Switching to ${bestMode.mode.name.toLowerCase()} could save $${potentialSavings.toFixed(2)} in carbon costs with ${bestMode.time.toFixed(1)} hours travel time. Balance speed with environmental responsibility!`;
    }
    
    // Add tree absorption context
    const treesNeeded = (selectedCO2 / 21.77).toFixed(1);
    impactMsg += ` This journey requires ${treesNeeded} tree${treesNeeded != 1 ? 's' : ''} to absorb the CO₂ over one year.`;
    
    return { impactMsg, co2CostMsg };
}
