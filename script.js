let tempUnit = 'F';
let currentTemp = 75;
let currentHumidity = 60;
let currentStage = 'vegetative';
let targetVPD = 1.0;
let useLeafTemp = false;
let leafTempOffset = 3;

const stageRanges = {
    seedling: { min: 0.4, max: 0.8, optimal: 0.6 },
    vegetative: { min: 0.8, max: 1.2, optimal: 1.0 },
    flowering: { min: 1.0, max: 1.5, optimal: 1.25 }
};

function celsiusToFahrenheit(c) {
    return (c * 9/5) + 32;
}

function fahrenheitToCelsius(f) {
    return (f - 32) * 5/9;
}

function calculateSVP(tempC) {
    return 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
}

function calculateVPD(tempF, humidity) {
    let effectiveTemp = tempF;
    if (useLeafTemp) {
        effectiveTemp = tempF - leafTempOffset;
    }
    const tempC = tempUnit === 'F' ? fahrenheitToCelsius(effectiveTemp) : effectiveTemp;
    const svp = calculateSVP(tempC);
    const avp = svp * (humidity / 100);
    return svp - avp;
}

function generateRecommendations() {
    const currentVPD = calculateVPD(currentTemp, currentHumidity);
    const difference = currentVPD - targetVPD;
    const tolerance = 0.05;
    
    const recContainer = document.getElementById('recommendations');
    
    if (Math.abs(difference) <= tolerance) {
        recContainer.innerHTML = '<div class="on-target">🎯 Perfect! You\'re right on target!</div>';
        return;
    }
    
    let html = '<div class="rec-title">💡 Recommendations to reach ' + targetVPD.toFixed(1) + ' kPa:</div>';
    
    if (difference > 0) {
        html += '<div class="rec-title" style="font-size: 0.9rem; margin-bottom: 15px;">VPD is ' + Math.abs(difference).toFixed(2) + ' kPa too high. Try:</div>';
        
        const targetHumidity = findTargetHumidity(currentTemp, targetVPD);
        const humidityChange = targetHumidity - currentHumidity;
        if (targetHumidity >= 30 && targetHumidity <= 90) {
            html += '<div class="rec-option">';
            html += '<span class="rec-action">💧 Increase humidity</span>';
            html += '<span class="rec-change">+' + humidityChange.toFixed(0) + '% (to ' + targetHumidity.toFixed(0) + '%)</span>';
            html += '</div>';
        }
        
        const targetTemp = findTargetTemperature(currentHumidity, targetVPD);
        const tempChange = currentTemp - targetTemp;
        const minTemp = tempUnit === 'F' ? 65 : 18;
        const maxTemp = tempUnit === 'F' ? 85 : 29;
        
        if (targetTemp >= minTemp && targetTemp <= maxTemp) {
            html += '<div class="rec-option">';
            html += '<span class="rec-action">❄️ Decrease temperature</span>';
            html += '<span class="rec-change">-' + tempChange.toFixed(1) + '°' + tempUnit + ' (to ' + targetTemp.toFixed(1) + '°' + tempUnit + ')</span>';
            html += '</div>';
        }
        
    } else {
        html += '<div class="rec-title" style="font-size: 0.9rem; margin-bottom: 15px;">VPD is ' + Math.abs(difference).toFixed(2) + ' kPa too low. Try:</div>';
        
        const targetHumidity = findTargetHumidity(currentTemp, targetVPD);
        const humidityChange = currentHumidity - targetHumidity;
        if (targetHumidity >= 30 && targetHumidity <= 90) {
            html += '<div class="rec-option">';
            html += '<span class="rec-action">💨 Decrease humidity</span>';
            html += '<span class="rec-change">-' + humidityChange.toFixed(0) + '% (to ' + targetHumidity.toFixed(0) + '%)</span>';
            html += '</div>';
        }
        
        const targetTemp = findTargetTemperature(currentHumidity, targetVPD);
        const tempChange = targetTemp - currentTemp;
        const minTemp = tempUnit === 'F' ? 65 : 18;
        const maxTemp = tempUnit === 'F' ? 85 : 29;
        
        if (targetTemp >= minTemp && targetTemp <= maxTemp) {
            html += '<div class="rec-option">';
            html += '<span class="rec-action">🔥 Increase temperature</span>';
            html += '<span class="rec-change">+' + tempChange.toFixed(1) + '°' + tempUnit + ' (to ' + targetTemp.toFixed(1) + '°' + tempUnit + ')</span>';
            html += '</div>';
        }
    }
    
    recContainer.innerHTML = html;
}

function findTargetHumidity(temp, targetVPD) {
    let effectiveTemp = temp;
    if (useLeafTemp) {
        effectiveTemp = temp - leafTempOffset;
    }
    
    const tempC = tempUnit === 'F' ? fahrenheitToCelsius(effectiveTemp) : effectiveTemp;
    const svp = calculateSVP(tempC);
    const avp = svp - targetVPD;
    return Math.max(30, Math.min(90, (avp / svp) * 100));
}

function findTargetTemperature(humidity, targetVPD) {
    let low = tempUnit === 'F' ? 65 : 18;
    let high = tempUnit === 'F' ? 85 : 29;
    
    for (let i = 0; i < 20; i++) {
        const mid = (low + high) / 2;
        const vpd = calculateVPD(mid, humidity);
        
        if (Math.abs(vpd - targetVPD) < 0.01) return mid;
        
        if (vpd > targetVPD) {
            high = mid;
        } else {
            low = mid;
        }
    }
    
    return (low + high) / 2;
}

function getVPDColor(vpd) {
    const range = stageRanges[currentStage];
    
    if (vpd < range.min - 0.2) {
        return [142, 68, 173];
    } else if (vpd < range.min) {
        const factor = (vpd - (range.min - 0.2)) / 0.2;
        const r = Math.floor(142 - (90 * factor));
        const g = Math.floor(68 + (84 * factor));
        const b = Math.floor(173 + (46 * factor));
        return [r, g, b];
    } else if (vpd >= range.min && vpd <= range.max) {
        const center = range.optimal;
        const distance = Math.abs(vpd - center);
        const maxDistance = Math.max(center - range.min, range.max - center);
        const intensity = Math.max(0, 1 - (distance / maxDistance));
        
        const r = Math.floor(39 + (20 * (1 - intensity)));
        const g = Math.floor(174 + (80 * intensity));
        const b = Math.floor(96 + (20 * (1 - intensity)));
        return [r, g, b];
    } else if (vpd <= range.max + 0.4) {
        const factor = (vpd - range.max) / 0.4;
        const r = Math.floor(230 + (25 * factor));
        const g = Math.floor(126 - (50 * factor));
        const b = Math.floor(34 - (10 * factor));
        return [r, g, b];
    } else {
        return [139, 0, 0];
    }
}

function updateVPD() {
    const vpd = calculateVPD(currentTemp, currentHumidity);
    const range = stageRanges[currentStage];
    
    document.getElementById('vpdValue').textContent = vpd.toFixed(2);
    
    const statusEl = document.getElementById('vpdStatus');
    statusEl.className = 'vpd-status ';
    
    if (vpd < range.min - 0.2) {
        statusEl.textContent = 'Dangerously Low - Risk of mold/mildew';
        statusEl.className += 'status-danger';
    } else if (vpd < range.min) {
        statusEl.textContent = 'Too Low - Slow transpiration';
        statusEl.className += 'status-low';
    } else if (vpd >= range.min && vpd <= range.max) {
        const distance = Math.abs(vpd - range.optimal);
        const tolerance = 0.1;
        
        if (distance <= tolerance) {
            statusEl.textContent = 'Perfect for ' + currentStage.charAt(0).toUpperCase() + currentStage.slice(1) + '!';
        } else {
            statusEl.textContent = 'Good for ' + currentStage.charAt(0).toUpperCase() + currentStage.slice(1);
        }
        statusEl.className += 'status-optimal';
    } else if (vpd <= range.max + 0.4) {
        statusEl.textContent = 'Too High - Stress risk';
        statusEl.className += 'status-high';
    } else {
        statusEl.textContent = 'Dangerously High - Plant stress';
        statusEl.className += 'status-danger';
    }
    
    updateTempComparison();
    generateRecommendations();
    drawChart();
}

function updateTempComparison() {
    const targetInfo = document.getElementById('targetInfo');
    
    if (useLeafTemp) {
        const airTemp = currentTemp;
        const leafTemp = currentTemp - leafTempOffset;
        
        const comparisonHTML = '<div class="temp-comparison">' +
            '<div class="temp-type">' +
            '<div>Air Temp</div>' +
            '<div class="temp-value">' + airTemp.toFixed(1) + '°' + tempUnit + '</div>' +
            '</div>' +
            '<div style="color: #00ff88;">→</div>' +
            '<div class="temp-type">' +
            '<div>Leaf Temp</div>' +
            '<div class="temp-value">' + leafTemp.toFixed(1) + '°' + tempUnit + '</div>' +
            '</div>' +
            '</div>';
        
        targetInfo.innerHTML = 'Target: ' + targetVPD.toFixed(1) + ' kPa (using leaf temp)' + comparisonHTML;
    } else {
        targetInfo.innerHTML = 'Target: ' + targetVPD.toFixed(1) + ' kPa';
    }
}

function toggleLeafTemp() {
    useLeafTemp = document.getElementById('leafTempCheck').checked;
    const controls = document.getElementById('leafTempControls');
    
    if (useLeafTemp) {
        controls.style.display = 'block';
    } else {
        controls.style.display = 'none';
    }
    
    updateVPD();
}

function setOptimalTarget() {
    targetVPD = stageRanges[currentStage].optimal;
    document.getElementById('targetSlider').value = targetVPD;
    document.getElementById('targetInput').value = targetVPD;
    document.getElementById('targetDisplay').textContent = targetVPD.toFixed(1);
    updateVPD();
}

function setGrowthStage(stage) {
    currentStage = stage;
    
    document.querySelectorAll('.stage-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-stage="' + stage + '"]').classList.add('active');
    
    const stageNames = {
        seedling: 'Seedling',
        vegetative: 'Vegetative', 
        flowering: 'Flowering'
    };
    document.getElementById('optimalLabel').textContent = 'Optimal for ' + stageNames[stage];
    
    updateVPD();
}

function setTempUnit(unit) {
    if (unit === tempUnit) return;
    
    if (unit === 'C') {
        currentTemp = fahrenheitToCelsius(currentTemp);
        leafTempOffset = leafTempOffset * 5/9;
        document.getElementById('tempSlider').min = 15;
        document.getElementById('tempSlider').max = 35;
        document.getElementById('tempInput').min = 15;
        document.getElementById('tempInput').max = 35;
        
        const offsetSlider = document.getElementById('offsetSlider');
        const offsetInput = document.getElementById('offsetInput');
        if (offsetSlider) {
            offsetSlider.min = 0.5;
            offsetSlider.max = 3;
            offsetSlider.step = 0.1;
        }
        if (offsetInput) {
            offsetInput.min = 0.5;
            offsetInput.max = 3;
            offsetInput.step = 0.1;
        }
    } else {
        currentTemp = celsiusToFahrenheit(currentTemp);
        leafTempOffset = leafTempOffset * 9/5;
        document.getElementById('tempSlider').min = 60;
        document.getElementById('tempSlider').max = 95;
        document.getElementById('tempInput').min = 60;
        document.getElementById('tempInput').max = 95;
        
        const offsetSlider = document.getElementById('offsetSlider');
        const offsetInput = document.getElementById('offsetInput');
        if (offsetSlider) {
            offsetSlider.min = 1;
            offsetSlider.max = 6;
            offsetSlider.step = 0.5;
        }
        if (offsetInput) {
            offsetInput.min = 1;
            offsetInput.max = 6;
            offsetInput.step = 0.5;
        }
    }
    
    tempUnit = unit;
    document.getElementById('tempUnit').textContent = unit;
    const offsetUnit = document.getElementById('offsetUnit');
    if (offsetUnit) offsetUnit.textContent = unit;
    
    document.querySelectorAll('.unit-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.getElementById('tempSlider').value = Math.round(currentTemp);
    document.getElementById('tempInput').value = currentTemp.toFixed(1);
    document.getElementById('tempDisplay').textContent = Math.round(currentTemp);
    
    const offsetSlider = document.getElementById('offsetSlider');
    const offsetInput = document.getElementById('offsetInput');
    const offsetDisplay = document.getElementById('offsetDisplay');
    
    if (offsetSlider) offsetSlider.value = leafTempOffset.toFixed(1);
    if (offsetInput) offsetInput.value = leafTempOffset.toFixed(1);
    if (offsetDisplay) offsetDisplay.textContent = leafTempOffset.toFixed(1);
    
    updateVPD();
}

function drawChart() {
    const canvas = document.getElementById('vpdChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    const margin = 60;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    
    const tempMin = tempUnit === 'F' ? 65 : 18;
    const tempMax = tempUnit === 'F' ? 85 : 29;
    const humMin = 40;
    const humMax = 80;
    
    const stepSize = 1.0;
    
    for (let temp = tempMin; temp < tempMax; temp += stepSize) {
        for (let hum = humMin; hum < humMax; hum += stepSize) {
            const vpd = calculateVPD(temp, hum);
            const color = getVPDColor(vpd);
            
            const x = margin + ((temp - tempMin) / (tempMax - tempMin)) * chartWidth;
            const y = margin + ((humMax - hum) / (humMax - humMin)) * chartHeight;
            
            const rectWidth = (stepSize / (tempMax - tempMin)) * chartWidth + 1;
            const rectHeight = (stepSize / (humMax - humMin)) * chartHeight + 1;
            
            ctx.fillStyle = 'rgba(' + color[0] + ', ' + color[1] + ', ' + color[2] + ', 0.7)';
            ctx.fillRect(x, y, rectWidth, rectHeight);
        }
    }
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.stroke();
    
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    
    for (let temp = tempMin; temp <= tempMax; temp += 5) {
        const x = margin + ((temp - tempMin) / (tempMax - tempMin)) * chartWidth;
        ctx.fillText(temp + '°' + tempUnit, x, height - margin + 20);
    }
    
    ctx.textAlign = 'right';
    for (let hum = humMin; hum <= humMax; hum += 10) {
        const y = margin + ((humMax - hum) / (humMax - humMin)) * chartHeight;
        ctx.fillText(hum + '%', margin - 10, y + 4);
    }
    
    ctx.textAlign = 'center';
    ctx.font = '16px Arial';
    ctx.fillText('Temperature (' + tempUnit + ')', width / 2, height - 10);
    
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Relative Humidity (%)', 0, 0);
    ctx.restore();
    
    const currentX = margin + ((currentTemp - tempMin) / (tempMax - tempMin)) * chartWidth;
    const currentY = margin + ((humMax - currentHumidity) / (humMax - humMin)) * chartHeight;
    
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(currentX, margin);
    ctx.lineTo(currentX, height - margin);
    ctx.moveTo(margin, currentY);
    ctx.lineTo(width - margin, currentY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(currentX, currentY, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.stroke();
}

function validateInput(value, min, max, defaultValue) {
    const num = parseFloat(value);
    if (isNaN(num) || num < min || num > max) {
        return defaultValue;
    }
    return num;
}

function setupEventListeners() {
    const elements = [
        { id: 'tempSlider', event: 'input', handler: function(e) {
            const minTemp = tempUnit === 'F' ? 60 : 15;
            const maxTemp = tempUnit === 'F' ? 95 : 35;
            currentTemp = validateInput(e.target.value, minTemp, maxTemp, currentTemp);
            const tempInput = document.getElementById('tempInput');
            const tempDisplay = document.getElementById('tempDisplay');
            if (tempInput) tempInput.value = currentTemp;
            if (tempDisplay) tempDisplay.textContent = Math.round(currentTemp);
            updateVPD();
        }},
        { id: 'tempInput', event: 'input', handler: function(e) {
            const minTemp = tempUnit === 'F' ? 60 : 15;
            const maxTemp = tempUnit === 'F' ? 95 : 35;
            currentTemp = validateInput(e.target.value, minTemp, maxTemp, currentTemp);
            const tempSlider = document.getElementById('tempSlider');
            const tempDisplay = document.getElementById('tempDisplay');
            if (tempSlider) tempSlider.value = currentTemp;
            if (tempDisplay) tempDisplay.textContent = Math.round(currentTemp);
            updateVPD();
        }},
        { id: 'humiditySlider', event: 'input', handler: function(e) {
            currentHumidity = validateInput(e.target.value, 30, 90, currentHumidity);
            const humidityInput = document.getElementById('humidityInput');
            const humidityDisplay = document.getElementById('humidityDisplay');
            if (humidityInput) humidityInput.value = currentHumidity;
            if (humidityDisplay) humidityDisplay.textContent = currentHumidity;
            updateVPD();
        }},
        { id: 'humidityInput', event: 'input', handler: function(e) {
            currentHumidity = validateInput(e.target.value, 30, 90, currentHumidity);
            const humiditySlider = document.getElementById('humiditySlider');
            const humidityDisplay = document.getElementById('humidityDisplay');
            if (humiditySlider) humiditySlider.value = currentHumidity;
            if (humidityDisplay) humidityDisplay.textContent = currentHumidity;
            updateVPD();
        }},
        { id: 'targetSlider', event: 'input', handler: function(e) {
            targetVPD = validateInput(e.target.value, 0.4, 1.6, targetVPD);
            const targetInput = document.getElementById('targetInput');
            const targetDisplay = document.getElementById('targetDisplay');
            if (targetInput) targetInput.value = targetVPD;
            if (targetDisplay) targetDisplay.textContent = targetVPD.toFixed(1);
            updateVPD();
        }},
        { id: 'targetInput', event: 'input', handler: function(e) {
            targetVPD = validateInput(e.target.value, 0.4, 1.6, targetVPD);
            const targetSlider = document.getElementById('targetSlider');
            const targetDisplay = document.getElementById('targetDisplay');
            if (targetSlider) targetSlider.value = targetVPD;
            if (targetDisplay) targetDisplay.textContent = targetVPD.toFixed(1);
            updateVPD();
        }},
        { id: 'offsetSlider', event: 'input', handler: function(e) {
            const minOffset = tempUnit === 'F' ? 1 : 0.5;
            const maxOffset = tempUnit === 'F' ? 6 : 3;
            leafTempOffset = validateInput(e.target.value, minOffset, maxOffset, leafTempOffset);
            const offsetInput = document.getElementById('offsetInput');
            const offsetDisplay = document.getElementById('offsetDisplay');
            if (offsetInput) offsetInput.value = leafTempOffset;
            if (offsetDisplay) offsetDisplay.textContent = leafTempOffset.toFixed(1);
            updateVPD();
        }},
        { id: 'offsetInput', event: 'input', handler: function(e) {
            const minOffset = tempUnit === 'F' ? 1 : 0.5;
            const maxOffset = tempUnit === 'F' ? 6 : 3;
            leafTempOffset = validateInput(e.target.value, minOffset, maxOffset, leafTempOffset);
            const offsetSlider = document.getElementById('offsetSlider');
            const offsetDisplay = document.getElementById('offsetDisplay');
            if (offsetSlider) offsetSlider.value = leafTempOffset;
            if (offsetDisplay) offsetDisplay.textContent = leafTempOffset.toFixed(1);
            updateVPD();
        }}
    ];

    elements.forEach(function(element) {
        const el = document.getElementById(element.id);
        if (el) {
            el.addEventListener(element.event, element.handler);
        }
    });
}

window.addEventListener('load', function() {
    setupEventListeners();
    updateVPD();
});

window.addEventListener('resize', function() {
    setTimeout(drawChart, 100);
});