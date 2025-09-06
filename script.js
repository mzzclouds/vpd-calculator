let tempUnit = 'F';
let currentTemp = 75;
let currentHumidity = 60;
let currentStage = 'vegetative';
let targetVPD = 1.0;
let useLeafTemp = false;
let leafTempOffset = 3;
let useDLI = false;
let useCustomTarget = false;

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
    const recContainer = document.getElementById('recommendations');
    const recContainerMobile = document.getElementById('recommendationsMobile');
    
    // Only show recommendations when custom target is enabled
    if (!useCustomTarget) {
        if (recContainer) recContainer.innerHTML = '';
        if (recContainerMobile) recContainerMobile.innerHTML = '';
        return;
    }
    
    const currentVPD = calculateVPD(currentTemp, currentHumidity);
    const difference = currentVPD - targetVPD;
    const tolerance = 0.05;
    
    let html = '';
    if (Math.abs(difference) <= tolerance) {
        html = '<div class="on-target">🎯 Perfect! You\'re right on target!</div>';
        if (recContainer) recContainer.innerHTML = html;
        if (recContainerMobile) recContainerMobile.innerHTML = html;
        return;
    }
    
    html = '<div class="rec-title">💡 Recommendations to reach ' + targetVPD.toFixed(1) + ' kPa:</div>';
    
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
    
    if (recContainer) recContainer.innerHTML = html;
    if (recContainerMobile) recContainerMobile.innerHTML = html;
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
    
    // Update both desktop and mobile VPD displays
    const vpdValueEl = document.getElementById('vpdValue');
    const vpdValueMobileEl = document.getElementById('vpdValueMobile');
    if (vpdValueEl) vpdValueEl.textContent = vpd.toFixed(2);
    if (vpdValueMobileEl) vpdValueMobileEl.textContent = vpd.toFixed(2);
    
    // Update both desktop and mobile status displays
    const statusEl = document.getElementById('vpdStatus');
    const statusMobileEl = document.getElementById('vpdStatusMobile');
    
    let statusText = '';
    let statusClass = 'vpd-status ';
    
    if (vpd < range.min - 0.2) {
        statusText = 'Dangerously Low - Risk of mold/mildew';
        statusClass += 'status-danger';
    } else if (vpd < range.min) {
        statusText = 'Too Low - Slow transpiration';
        statusClass += 'status-low';
    } else if (vpd >= range.min && vpd <= range.max) {
        const distance = Math.abs(vpd - range.optimal);
        const tolerance = 0.1;
        
        if (distance <= tolerance) {
            statusText = 'Perfect for ' + currentStage.charAt(0).toUpperCase() + currentStage.slice(1) + '!';
        } else {
            statusText = 'Good for ' + currentStage.charAt(0).toUpperCase() + currentStage.slice(1);
        }
        statusClass += 'status-optimal';
    } else if (vpd <= range.max + 0.4) {
        statusText = 'Too High - Stress risk';
        statusClass += 'status-high';
    } else {
        statusText = 'Dangerously High - Plant stress';
        statusClass += 'status-danger';
    }
    
    if (statusEl) {
        statusEl.textContent = statusText;
        statusEl.className = statusClass;
    }
    if (statusMobileEl) {
        statusMobileEl.textContent = statusText;
        statusMobileEl.className = statusClass;
    }
    
    updateTempComparison();
    generateRecommendations();
    drawChart();
}

function updateTempComparison() {
    const targetInfo = document.getElementById('targetInfo');
    const targetInfoMobile = document.getElementById('targetInfoMobile');
    
    let targetText = '';
    if (useCustomTarget) {
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
            
            targetText = 'Target: ' + targetVPD.toFixed(1) + ' kPa (using leaf temp)' + comparisonHTML;
        } else {
            targetText = 'Target: ' + targetVPD.toFixed(1) + ' kPa';
        }
    } else {
        targetText = 'Using optimal range for ' + currentStage + ' stage';
    }
    
    if (targetInfo) targetInfo.innerHTML = targetText;
    if (targetInfoMobile) targetInfoMobile.innerHTML = targetText;
    
    // Update leaf temperature display in the controls section
    updateLeafTempDisplay();
}

function updateLeafTempDisplay() {
    const leafTempDisplay = document.getElementById('leafTempDisplay');
    const leafTempUnit = document.getElementById('leafTempUnit');
    
    if (leafTempDisplay && leafTempUnit) {
        leafTempDisplay.textContent = leafTempOffset.toFixed(1);
        leafTempUnit.textContent = tempUnit;
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

function toggleDLI() {
    useDLI = document.getElementById('dliCheck').checked;
    const controls = document.getElementById('dliControls');
    
    if (useDLI) {
        controls.style.display = 'block';
    } else {
        controls.style.display = 'none';
    }
}

function toggleTargetVPD() {
    const checkbox = document.getElementById('targetVpdCheck');
    useCustomTarget = checkbox ? checkbox.checked : false;
    const controls = document.getElementById('targetControls');
    const controlsMobile = document.getElementById('targetControlsMobile');
    const mobileCheck = document.getElementById('targetVpdCheckMobile');
    
    // Sync both checkboxes
    if (mobileCheck) mobileCheck.checked = useCustomTarget;
    
    if (useCustomTarget) {
        if (controls) controls.style.display = 'block';
        if (controlsMobile) controlsMobile.style.display = 'block';
    } else {
        if (controls) controls.style.display = 'none';
        if (controlsMobile) controlsMobile.style.display = 'none';
        // Reset to optimal target for current stage when disabled
        targetVPD = stageRanges[currentStage].optimal;
        updateAllInputs();
    }
    
    updateVPD();
}

function toggleTargetVPDMobile() {
    useCustomTarget = document.getElementById('targetVpdCheckMobile').checked;
    const controls = document.getElementById('targetControls');
    const controlsMobile = document.getElementById('targetControlsMobile');
    const desktopCheck = document.getElementById('targetVpdCheck');
    
    // Sync both checkboxes
    if (desktopCheck) desktopCheck.checked = useCustomTarget;
    
    if (useCustomTarget) {
        if (controls) controls.style.display = 'block';
        if (controlsMobile) controlsMobile.style.display = 'block';
    } else {
        if (controls) controls.style.display = 'none';
        if (controlsMobile) controlsMobile.style.display = 'none';
        // Reset to optimal target for current stage when disabled
        targetVPD = stageRanges[currentStage].optimal;
        updateAllInputs();
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
    
    // Update both desktop and mobile optimal labels
    const optimalLabel = document.getElementById('optimalLabel');
    const optimalLabelMobile = document.getElementById('optimalLabelMobile');
    const labelText = 'Optimal for ' + stageNames[stage];
    
    if (optimalLabel) optimalLabel.textContent = labelText;
    if (optimalLabelMobile) optimalLabelMobile.textContent = labelText;
    
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
    // Draw on both desktop and mobile canvases
    const desktopCanvas = document.getElementById('vpdChartDesktop');
    const mobileCanvas = document.getElementById('vpdChartMobile');
    
    if (desktopCanvas) drawChartOnCanvas(desktopCanvas);
    if (mobileCanvas) drawChartOnCanvas(mobileCanvas);
}

function drawChartOnCanvas(canvas) {
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
            const targetSliderMobile = document.getElementById('targetSliderMobile');
            const targetInputMobile = document.getElementById('targetInputMobile');
            const targetDisplayMobile = document.getElementById('targetDisplayMobile');
            if (targetSlider) targetSlider.value = targetVPD;
            if (targetDisplay) targetDisplay.textContent = targetVPD.toFixed(1);
            if (targetSliderMobile) targetSliderMobile.value = targetVPD;
            if (targetInputMobile) targetInputMobile.value = targetVPD;
            if (targetDisplayMobile) targetDisplayMobile.textContent = targetVPD.toFixed(1);
            updateVPD();
        }},
        { id: 'targetSliderMobile', event: 'input', handler: function(e) {
            targetVPD = validateInput(e.target.value, 0.4, 1.6, targetVPD);
            const targetSlider = document.getElementById('targetSlider');
            const targetInput = document.getElementById('targetInput');
            const targetDisplay = document.getElementById('targetDisplay');
            const targetInputMobile = document.getElementById('targetInputMobile');
            const targetDisplayMobile = document.getElementById('targetDisplayMobile');
            if (targetSlider) targetSlider.value = targetVPD;
            if (targetInput) targetInput.value = targetVPD;
            if (targetDisplay) targetDisplay.textContent = targetVPD.toFixed(1);
            if (targetInputMobile) targetInputMobile.value = targetVPD;
            if (targetDisplayMobile) targetDisplayMobile.textContent = targetVPD.toFixed(1);
            updateVPD();
        }},
        { id: 'targetInputMobile', event: 'input', handler: function(e) {
            targetVPD = validateInput(e.target.value, 0.4, 1.6, targetVPD);
            const targetSlider = document.getElementById('targetSlider');
            const targetInput = document.getElementById('targetInput');
            const targetDisplay = document.getElementById('targetDisplay');
            const targetSliderMobile = document.getElementById('targetSliderMobile');
            const targetDisplayMobile = document.getElementById('targetDisplayMobile');
            if (targetSlider) targetSlider.value = targetVPD;
            if (targetInput) targetInput.value = targetVPD;
            if (targetDisplay) targetDisplay.textContent = targetVPD.toFixed(1);
            if (targetSliderMobile) targetSliderMobile.value = targetVPD;
            if (targetDisplayMobile) targetDisplayMobile.textContent = targetVPD.toFixed(1);
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
            updateLeafTempDisplay();
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
            updateLeafTempDisplay();
            updateVPD();
        }},
        { id: 'dliSlider', event: 'input', handler: function(e) {
            const dliValue = validateInput(e.target.value, 15, 60, 30);
            const dliInput = document.getElementById('dliInput');
            const dliDisplay = document.getElementById('dliDisplay');
            if (dliInput) dliInput.value = dliValue;
            if (dliDisplay) dliDisplay.textContent = dliValue;
        }},
        { id: 'dliInput', event: 'input', handler: function(e) {
            const dliValue = validateInput(e.target.value, 15, 60, 30);
            const dliSlider = document.getElementById('dliSlider');
            const dliDisplay = document.getElementById('dliDisplay');
            if (dliSlider) dliSlider.value = dliValue;
            if (dliDisplay) dliDisplay.textContent = dliValue;
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
    updateLeafTempDisplay();
    
    // Ensure all optional sections start in correct state based on checkboxes
    toggleLeafTemp();
    toggleDLI();
    // Don't call toggleTargetVPD here - let CSS display:none handle initial state
    
    updateVPD();
});

window.addEventListener('resize', function() {
    setTimeout(drawChart, 100);
});

// Local Storage Functions
function saveSettings() {
    const settings = {
        temperature: currentTemp,
        humidity: currentHumidity,
        tempUnit: tempUnit,
        growthStage: currentStage,
        targetVPD: targetVPD,
        useLeafTemp: useLeafTemp,
        leafTempOffset: leafTempOffset,
        useDLI: useDLI,
        useCustomTarget: useCustomTarget,
        dli: useDLI && document.getElementById('dliSlider') ? document.getElementById('dliSlider').value : 30,
        timestamp: new Date().toISOString()
    };
    
    try {
        localStorage.setItem('vpdCalculatorSettings', JSON.stringify(settings));
        updateStorageInfo('✅ Settings saved successfully!');
        setTimeout(() => updateStorageInfo('💡 Settings are saved locally in your browser'), 3000);
    } catch (error) {
        updateStorageInfo('❌ Error saving settings: ' + error.message);
    }
}

function loadSettings() {
    try {
        const saved = localStorage.getItem('vpdCalculatorSettings');
        if (!saved) {
            updateStorageInfo('⚠️ No saved settings found');
            setTimeout(() => updateStorageInfo('💡 Settings are saved locally in your browser'), 3000);
            return;
        }
        
        const settings = JSON.parse(saved);
        
        // Load temperature settings
        if (settings.tempUnit !== tempUnit) {
            setTempUnit(settings.tempUnit);
        }
        currentTemp = settings.temperature || currentTemp;
        
        // Load other settings
        currentHumidity = settings.humidity || currentHumidity;
        currentStage = settings.growthStage || currentStage;
        targetVPD = settings.targetVPD || targetVPD;
        useLeafTemp = settings.useLeafTemp || false;
        leafTempOffset = settings.leafTempOffset || leafTempOffset;
        
        // Update UI elements
        updateAllInputs();
        setGrowthStage(currentStage);
        
        // Load DLI if available
        const dliSlider = document.getElementById('dliSlider');
        const dliInput = document.getElementById('dliInput');
        const dliDisplay = document.getElementById('dliDisplay');
        if (settings.dli && dliSlider) {
            dliSlider.value = settings.dli;
            if (dliInput) dliInput.value = settings.dli;
            if (dliDisplay) dliDisplay.textContent = settings.dli;
        }
        
        // Load leaf temp settings
        document.getElementById('leafTempCheck').checked = useLeafTemp;
        toggleLeafTemp();
        
        // Load DLI settings
        useDLI = settings.useDLI || false;
        document.getElementById('dliCheck').checked = useDLI;
        toggleDLI();
        
        // Load custom target settings
        useCustomTarget = settings.useCustomTarget || false;
        document.getElementById('targetVpdCheck').checked = useCustomTarget;
        const targetCheckMobile = document.getElementById('targetVpdCheckMobile');
        if (targetCheckMobile) targetCheckMobile.checked = useCustomTarget;
        toggleTargetVPD();
        
        updateVPD();
        
        const saveDate = new Date(settings.timestamp).toLocaleDateString();
        updateStorageInfo('✅ Settings loaded from ' + saveDate);
        setTimeout(() => updateStorageInfo('💡 Settings are saved locally in your browser'), 3000);
        
    } catch (error) {
        updateStorageInfo('❌ Error loading settings: ' + error.message);
    }
}

function clearSettings() {
    if (confirm('Are you sure you want to clear all saved settings?')) {
        try {
            localStorage.removeItem('vpdCalculatorSettings');
            updateStorageInfo('✅ Saved settings cleared');
            setTimeout(() => updateStorageInfo('💡 Settings are saved locally in your browser'), 3000);
        } catch (error) {
            updateStorageInfo('❌ Error clearing settings: ' + error.message);
        }
    }
}

function updateStorageInfo(message) {
    const storageInfo = document.getElementById('storageInfo');
    if (storageInfo) {
        storageInfo.innerHTML = '<small>' + message + '</small>';
    }
}

function updateAllInputs() {
    // Temperature
    const tempSlider = document.getElementById('tempSlider');
    const tempInput = document.getElementById('tempInput');
    const tempDisplay = document.getElementById('tempDisplay');
    if (tempSlider) tempSlider.value = currentTemp;
    if (tempInput) tempInput.value = currentTemp.toFixed(1);
    if (tempDisplay) tempDisplay.textContent = Math.round(currentTemp);
    
    // Humidity
    const humSlider = document.getElementById('humiditySlider');
    const humInput = document.getElementById('humidityInput');
    const humDisplay = document.getElementById('humidityDisplay');
    if (humSlider) humSlider.value = currentHumidity;
    if (humInput) humInput.value = currentHumidity;
    if (humDisplay) humDisplay.textContent = currentHumidity;
    
    // Target VPD (both desktop and mobile)
    const targetSlider = document.getElementById('targetSlider');
    const targetInput = document.getElementById('targetInput');
    const targetDisplay = document.getElementById('targetDisplay');
    const targetSliderMobile = document.getElementById('targetSliderMobile');
    const targetInputMobile = document.getElementById('targetInputMobile');
    const targetDisplayMobile = document.getElementById('targetDisplayMobile');
    if (targetSlider) targetSlider.value = targetVPD;
    if (targetInput) targetInput.value = targetVPD.toFixed(1);
    if (targetDisplay) targetDisplay.textContent = targetVPD.toFixed(1);
    if (targetSliderMobile) targetSliderMobile.value = targetVPD;
    if (targetInputMobile) targetInputMobile.value = targetVPD.toFixed(1);
    if (targetDisplayMobile) targetDisplayMobile.textContent = targetVPD.toFixed(1);
    
    // Leaf temp offset
    const offsetSlider = document.getElementById('offsetSlider');
    const offsetInput = document.getElementById('offsetInput');
    const offsetDisplay = document.getElementById('offsetDisplay');
    if (offsetSlider) offsetSlider.value = leafTempOffset.toFixed(1);
    if (offsetInput) offsetInput.value = leafTempOffset.toFixed(1);
    if (offsetDisplay) offsetDisplay.textContent = leafTempOffset.toFixed(1);
}

// Download functionality
function downloadCurrentReading() {
    const now = new Date();
    const timestamp = now.toISOString();
    const localTime = now.toLocaleString();
    
    const currentVPD = calculateVPD(currentTemp, currentHumidity);
    const dliValue = useDLI && document.getElementById('dliSlider') ? document.getElementById('dliSlider').value : 'N/A';
    
    const data = {
        timestamp: timestamp,
        localTime: localTime,
        temperature: currentTemp.toFixed(1),
        temperatureUnit: tempUnit,
        humidity: currentHumidity,
        vpd: currentVPD.toFixed(2),
        growthStage: currentStage,
        targetVPD: targetVPD.toFixed(1),
        useLeafTemp: useLeafTemp,
        leafTempOffset: useLeafTemp ? leafTempOffset.toFixed(1) : 'N/A',
        dli: dliValue
    };
    
    // Convert to CSV format
    const csvHeader = 'Timestamp,Local Time,Temperature,Unit,Humidity (%),VPD (kPa),Growth Stage,Target VPD,Uses Leaf Temp,Leaf Temp Offset,DLI\n';
    const csvRow = `${data.timestamp},${data.localTime},${data.temperature},${data.temperatureUnit},${data.humidity},${data.vpd},${data.growthStage},${data.targetVPD},${data.useLeafTemp},${data.leafTempOffset},${data.dli}\n`;
    
    const csvContent = csvHeader + csvRow;
    const filename = `vpd-reading-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.csv`;
    
    downloadCSV(csvContent, filename);
    
    updateStorageInfo('✅ VPD reading downloaded as CSV');
    setTimeout(() => updateStorageInfo('💡 Download individual readings to track over time'), 3000);
}

function downloadAllReadings() {
    const readings = getStoredReadings();
    
    if (readings.length === 0) {
        updateStorageInfo('⚠️ No readings stored yet. Take some readings first!');
        setTimeout(() => updateStorageInfo('💡 Use "Log Reading" to store readings for download'), 3000);
        return;
    }
    
    const csvHeader = 'Timestamp,Local Time,Temperature,Unit,Humidity (%),VPD (kPa),Growth Stage,Target VPD,Uses Leaf Temp,Leaf Temp Offset,DLI\n';
    
    let csvContent = csvHeader;
    readings.forEach(reading => {
        csvContent += `${reading.timestamp},${reading.localTime},${reading.temperature},${reading.temperatureUnit},${reading.humidity},${reading.vpd},${reading.growthStage},${reading.targetVPD},${reading.useLeafTemp},${reading.leafTempOffset},${reading.dli}\n`;
    });
    
    const now = new Date();
    const filename = `vpd-readings-history-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.csv`;
    
    downloadCSV(csvContent, filename);
    
    updateStorageInfo(`✅ Downloaded ${readings.length} readings to CSV`);
    setTimeout(() => updateStorageInfo('💡 All stored readings exported'), 3000);
}

function logCurrentReading() {
    const now = new Date();
    const timestamp = now.toISOString();
    const localTime = now.toLocaleString();
    
    const currentVPD = calculateVPD(currentTemp, currentHumidity);
    const dliValue = useDLI && document.getElementById('dliSlider') ? document.getElementById('dliSlider').value : 'N/A';
    
    const reading = {
        timestamp: timestamp,
        localTime: localTime,
        temperature: currentTemp.toFixed(1),
        temperatureUnit: tempUnit,
        humidity: currentHumidity,
        vpd: currentVPD.toFixed(2),
        growthStage: currentStage,
        targetVPD: targetVPD.toFixed(1),
        useLeafTemp: useLeafTemp,
        leafTempOffset: useLeafTemp ? leafTempOffset.toFixed(1) : 'N/A',
        dli: dliValue
    };
    
    storeReading(reading);
    
    const readings = getStoredReadings();
    updateStorageInfo(`✅ Reading logged! (${readings.length} total readings stored)`);
    setTimeout(() => updateStorageInfo('💡 Logged readings can be downloaded as CSV'), 3000);
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function storeReading(reading) {
    try {
        const readings = getStoredReadings();
        readings.push(reading);
        
        // Keep only the last 100 readings to prevent storage bloat
        if (readings.length > 100) {
            readings.splice(0, readings.length - 100);
        }
        
        localStorage.setItem('vpdReadingsHistory', JSON.stringify(readings));
    } catch (error) {
        console.error('Error storing reading:', error);
        updateStorageInfo('❌ Error storing reading: ' + error.message);
    }
}

function getStoredReadings() {
    try {
        const stored = localStorage.getItem('vpdReadingsHistory');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading readings:', error);
        return [];
    }
}

function clearStoredReadings() {
    if (confirm('Are you sure you want to clear all logged readings? This cannot be undone.')) {
        try {
            localStorage.removeItem('vpdReadingsHistory');
            updateStorageInfo('✅ All logged readings cleared');
            setTimeout(() => updateStorageInfo('💡 Start logging new readings'), 3000);
        } catch (error) {
            updateStorageInfo('❌ Error clearing readings: ' + error.message);
        }
    }
}