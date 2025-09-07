let tempUnit = 'F';
let currentTemp = 75;
let currentHumidity = 60;
let currentStage = 'vegetative';
let targetVPD = 1.0;
let useLeafTemp = false;
let leafTemp = 72;
let useDLI = false;
let useCustomTarget = false;
let currentPPFD = 500;
let currentPhotoperiod = 12;

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

function calculateDLI(ppfd, photoperiod) {
    return (ppfd * photoperiod * 3600) / 1000000;
}

function updateDLI() {
    const dli = calculateDLI(currentPPFD, currentPhotoperiod);
    const dliDisplay = document.getElementById('dliDisplay');
    if (dliDisplay) {
        dliDisplay.textContent = dli.toFixed(1);
    }
    drawDLIChart();
}

function drawDLIChart() {
    const canvas = document.getElementById('dliChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set actual size in memory (scaled for high DPI displays)
    canvas.width = 600 * dpr;
    canvas.height = 300 * dpr;
    
    // Scale the context
    ctx.scale(dpr, dpr);
    
    const width = 600;
    const height = 300;
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Clear canvas
    ctx.fillStyle = '#2a3441';
    ctx.fillRect(0, 0, width, height);
    
    // DLI data by week (regular growth, high growth)
    const dliData = [
        [12, 16], [20, 25], [30, 38], [40, 50], [45, 55], [31, 45], [25, 35],
        [28, 38], [30, 42], [34, 45], [36, 48], [38, 50], [40, 50], [36, 45], [32, 40]
    ];
    
    const weeks = dliData.length;
    const maxDLI = 60;
    const barSpacing = chartWidth / weeks;
    
    // Growth stage boundaries (weeks)
    const stages = [
        { name: 'Seedling', start: 0, end: 2, color: 'rgba(52, 152, 219, 0.1)' },
        { name: 'Vegetative', start: 2, end: 8, color: 'rgba(46, 204, 113, 0.1)' },
        { name: 'Flowering', start: 8, end: 15, color: 'rgba(230, 126, 34, 0.1)' }
    ];
    
    // Draw stage backgrounds
    stages.forEach(stage => {
        const x1 = margin.left + (stage.start / weeks) * chartWidth;
        const x2 = margin.left + (stage.end / weeks) * chartWidth;
        ctx.fillStyle = stage.color;
        ctx.fillRect(x1, margin.top, x2 - x1, chartHeight);
    });
    
    // Draw grid lines and labels
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px SF Mono, Monaco, monospace';
    ctx.lineWidth = 1;
    
    // Y-axis grid and labels
    for (let i = 0; i <= 6; i++) {
        const value = i * 10;
        const y = margin.top + chartHeight - (value / maxDLI) * chartHeight;
        
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + chartWidth, y);
        ctx.stroke();
        
        ctx.textAlign = 'right';
        ctx.fillText(value.toString(), margin.left - 10, y + 4);
    }
    
    // X-axis grid and labels
    for (let i = 0; i < weeks; i++) {
        const x = margin.left + (i * barSpacing) + barSpacing / 2;
        
        if (i % 2 === 0) {
            ctx.beginPath();
            ctx.moveTo(x, margin.top);
            ctx.lineTo(x, margin.top + chartHeight);
            ctx.stroke();
        }
        
        ctx.textAlign = 'center';
        ctx.fillText(i.toString(), x, height - margin.bottom + 20);
    }
    
    // Draw axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.stroke();
    
    // Draw bars
    const barWidth = chartWidth / weeks * 0.7;
    dliData.forEach((weekData, week) => {
        const x = margin.left + (week * barSpacing) + (barSpacing - barWidth) / 2;
        
        // Regular growth bar (bottom)
        const regularHeight = (weekData[0] / maxDLI) * chartHeight;
        ctx.fillStyle = '#4ade80'; // Light green
        ctx.fillRect(x, margin.top + chartHeight - regularHeight, barWidth, regularHeight);
        
        // High growth bar (top portion)
        const highHeight = ((weekData[1] - weekData[0]) / maxDLI) * chartHeight;
        ctx.fillStyle = '#16a34a'; // Darker green
        ctx.fillRect(x, margin.top + chartHeight - regularHeight - highHeight, barWidth, highHeight);
        
        // Draw values
        ctx.fillStyle = '#1a202c';
        ctx.font = 'bold 10px SF Mono, Monaco, monospace';
        ctx.textAlign = 'center';
        
        // Regular growth value
        if (weekData[0] > 15) {
            ctx.fillText(weekData[0].toString(), x + barWidth/2, margin.top + chartHeight - regularHeight/2 + 3);
        }
        
        // High growth value
        if (weekData[1] > weekData[0] + 5) {
            ctx.fillText(weekData[1].toString(), x + barWidth/2, margin.top + chartHeight - regularHeight - highHeight/2 + 3);
        }
    });
    
    // Draw stage labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px SF Mono, Monaco, monospace';
    ctx.textAlign = 'center';
    
    stages.forEach(stage => {
        const centerX = margin.left + ((stage.start + stage.end) / 2 / weeks) * chartWidth;
        ctx.fillText(stage.name, centerX, margin.top - 15);
    });
    
    // Draw axis labels
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px SF Mono, Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Plant Age in Weeks', width / 2, height - 10);
    
    // Y-axis label (rotated)
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    
    // Draw "DLI" in main color
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px SF Mono, Monaco, monospace';
    ctx.fillText('DLI', -35, 0);
    
    // Draw units in muted color like notes
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 12px SF Mono, Monaco, monospace';
    ctx.fillText('(mol/m²/day)', 35, 0);
    
    ctx.restore();
    
    // Highlight current DLI if available
    if (useDLI) {
        const currentDLI = calculateDLI(currentPPFD, currentPhotoperiod);
        const y = margin.top + chartHeight - (currentDLI / maxDLI) * chartHeight;
        
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + chartWidth, y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Current DLI label
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 12px SF Mono, Monaco, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`Your DLI: ${currentDLI.toFixed(1)}`, margin.left + chartWidth - 10, y - 8);
    }
}

function calculateVPD(tempF, humidity) {
    let effectiveTemp = tempF;
    if (useLeafTemp) {
        effectiveTemp = leafTemp;
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
        effectiveTemp = leafTemp;
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
        leafTempDisplay.textContent = leafTemp.toFixed(1);
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
    const targetControlsContainer = document.getElementById('targetControlsContainer');
    
    useCustomTarget = checkbox ? checkbox.checked : false;
    
    if (useCustomTarget) {
        // Create controls if they don't exist
        if (targetControlsContainer && !document.getElementById('targetControls')) {
            const controlsDiv = document.createElement('div');
            controlsDiv.id = 'targetControls';
            controlsDiv.className = 'target-controls-active';
            controlsDiv.innerHTML = `
                <label for="targetVpd">Target VPD: <span id="targetDisplay">${targetVPD.toFixed(1)}</span> kPa</label>
                <input type="range" id="targetSlider" min="0.4" max="1.6" value="${targetVPD}" step="0.1">
                <input type="number" id="targetInput" min="0.4" max="1.6" value="${targetVPD}" step="0.1">
                <button class="unit-btn" onclick="setOptimalTarget()" style="margin-top: 10px; width: 100%;">Use Optimal for Stage</button>
            `;
            targetControlsContainer.appendChild(controlsDiv);
        }
        
        // Setup event listeners for the new controls
        setupTargetControlEvents();
    } else {
        // Remove controls
        const controls = document.getElementById('targetControls');
        if (controls) controls.remove();
        
        // Reset to optimal target for current stage when disabled
        targetVPD = stageRanges[currentStage].optimal;
        updateAllInputs();
    }
    
    updateVPD();
}

function setupTargetControlEvents() {
    const targetSlider = document.getElementById('targetSlider');
    const targetInput = document.getElementById('targetInput');
    
    if (targetSlider) {
        targetSlider.addEventListener('input', function() {
            targetVPD = parseFloat(this.value);
            updateAllInputs();
            updateVPD();
        });
    }
    
    if (targetInput) {
        targetInput.addEventListener('input', function() {
            targetVPD = parseFloat(this.value);
            updateAllInputs();
            updateVPD();
        });
    }
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
    
    // Track growth stage changes for better ad targeting
    trackUserEngagement('growth_stage_changed', { 
        stage: stage, 
        vpd: calculateVPD(currentTemp, currentHumidity).toFixed(2)
    });
    
    updateVPD();
}

function setTempUnit(unit) {
    if (unit === tempUnit) return;
    
    if (unit === 'C') {
        currentTemp = fahrenheitToCelsius(currentTemp);
        leafTemp = fahrenheitToCelsius(leafTemp);
        leafTempOffset = leafTempOffset * 5/9;
        document.getElementById('tempSlider').min = 15;
        document.getElementById('tempSlider').max = 35;
        document.getElementById('tempInput').min = 15;
        document.getElementById('tempInput').max = 35;
        
        const leafTempSlider = document.getElementById('leafTempSlider');
        const leafTempInput = document.getElementById('leafTempInput');
        if (leafTempSlider) {
            leafTempSlider.min = 15;
            leafTempSlider.max = 35;
        }
        if (leafTempInput) {
            leafTempInput.min = 15;
            leafTempInput.max = 35;
        }
        
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
        leafTemp = celsiusToFahrenheit(leafTemp);
        leafTempOffset = leafTempOffset * 9/5;
        document.getElementById('tempSlider').min = 60;
        document.getElementById('tempSlider').max = 95;
        document.getElementById('tempInput').min = 60;
        document.getElementById('tempInput').max = 95;
        
        const leafTempSlider = document.getElementById('leafTempSlider');
        const leafTempInput = document.getElementById('leafTempInput');
        if (leafTempSlider) {
            leafTempSlider.min = 60;
            leafTempSlider.max = 95;
        }
        if (leafTempInput) {
            leafTempInput.min = 60;
            leafTempInput.max = 95;
        }
        
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
    
    const leafTempSlider = document.getElementById('leafTempSlider');
    const leafTempInput = document.getElementById('leafTempInput');
    if (leafTempSlider) leafTempSlider.value = leafTemp.toFixed(1);
    if (leafTempInput) leafTempInput.value = leafTemp.toFixed(1);
    
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
        { id: 'leafTempSlider', event: 'input', handler: function(e) {
            const minTemp = tempUnit === 'F' ? 60 : 15;
            const maxTemp = tempUnit === 'F' ? 95 : 35;
            leafTemp = validateInput(e.target.value, minTemp, maxTemp, leafTemp);
            const leafTempInput = document.getElementById('leafTempInput');
            const leafTempDisplay = document.getElementById('leafTempDisplay');
            if (leafTempInput) leafTempInput.value = leafTemp.toFixed(1);
            if (leafTempDisplay) leafTempDisplay.textContent = leafTemp.toFixed(1);
            updateVPD();
        }},
        { id: 'leafTempInput', event: 'input', handler: function(e) {
            const minTemp = tempUnit === 'F' ? 60 : 15;
            const maxTemp = tempUnit === 'F' ? 95 : 35;
            leafTemp = validateInput(e.target.value, minTemp, maxTemp, leafTemp);
            const leafTempSlider = document.getElementById('leafTempSlider');
            const leafTempDisplay = document.getElementById('leafTempDisplay');
            if (leafTempSlider) leafTempSlider.value = leafTemp.toFixed(1);
            if (leafTempDisplay) leafTempDisplay.textContent = leafTemp.toFixed(1);
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
        { id: 'ppfdInput', event: 'input', handler: function(e) {
            currentPPFD = validateInput(e.target.value, 100, 2000, currentPPFD);
            const ppfdDisplay = document.getElementById('ppfdDisplay');
            if (ppfdDisplay) ppfdDisplay.textContent = currentPPFD;
            updateDLI();
        }},
        { id: 'photoperiodInput', event: 'input', handler: function(e) {
            currentPhotoperiod = validateInput(e.target.value, 8, 24, currentPhotoperiod);
            const photoperiodDisplay = document.getElementById('photoperiodDisplay');
            if (photoperiodDisplay) photoperiodDisplay.textContent = currentPhotoperiod;
            updateDLI();
        }},
        { id: 'targetVpdCheck', event: 'change', handler: toggleTargetVPD }
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
    updateDLI();
    
    // Ensure all optional sections start in correct state based on checkboxes
    toggleLeafTemp();
    toggleDLI();
    toggleTargetVPD(); // Ensure target controls are properly hidden when unchecked
    
    updateVPD();
});

window.addEventListener('resize', function() {
    setTimeout(drawChart, 100);
    setTimeout(drawDLIChart, 100);
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
        leafTemp: leafTemp,
        leafTempOffset: leafTempOffset,
        useDLI: useDLI,
        useCustomTarget: useCustomTarget,
        ppfd: currentPPFD,
        photoperiod: currentPhotoperiod,
        timestamp: new Date().toISOString()
    };
    
    try {
        localStorage.setItem('vpdCalculatorSettings', JSON.stringify(settings));
        updateStorageInfo('✅ Settings saved successfully!');
        setTimeout(() => updateStorageInfo('💡 Settings are saved locally in your browser'), 3000);
        
        // Track user engagement for ad targeting
        trackUserEngagement('settings_saved', { stage: currentStage, vpd: calculateVPD(currentTemp, currentHumidity).toFixed(2) });
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
        leafTemp = settings.leafTemp || leafTemp;
        leafTempOffset = settings.leafTempOffset || leafTempOffset;
        
        // Update UI elements
        updateAllInputs();
        setGrowthStage(currentStage);
        
        // Load PPFD and photoperiod if available
        currentPPFD = settings.ppfd || currentPPFD;
        currentPhotoperiod = settings.photoperiod || currentPhotoperiod;
        
        const ppfdInput = document.getElementById('ppfdInput');
        const ppfdDisplay = document.getElementById('ppfdDisplay');
        const photoperiodInput = document.getElementById('photoperiodInput');
        const photoperiodDisplay = document.getElementById('photoperiodDisplay');
        
        if (ppfdInput) ppfdInput.value = currentPPFD;
        if (ppfdDisplay) ppfdDisplay.textContent = currentPPFD;
        if (photoperiodInput) photoperiodInput.value = currentPhotoperiod;
        if (photoperiodDisplay) photoperiodDisplay.textContent = currentPhotoperiod;
        
        updateDLI();
        
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
    
    // Leaf temperature
    const leafTempSlider = document.getElementById('leafTempSlider');
    const leafTempInput = document.getElementById('leafTempInput');
    const leafTempDisplay = document.getElementById('leafTempDisplay');
    if (leafTempSlider) leafTempSlider.value = leafTemp.toFixed(1);
    if (leafTempInput) leafTempInput.value = leafTemp.toFixed(1);
    if (leafTempDisplay) leafTempDisplay.textContent = leafTemp.toFixed(1);
    
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
    const dliValue = useDLI ? calculateDLI(currentPPFD, currentPhotoperiod).toFixed(1) : 'N/A';
    const ppfdValue = useDLI ? currentPPFD : 'N/A';
    const photoperiodValue = useDLI ? currentPhotoperiod : 'N/A';
    
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
        dli: dliValue,
        ppfd: ppfdValue,
        photoperiod: photoperiodValue
    };
    
    // Convert to CSV format
    const csvHeader = 'Timestamp,Local Time,Temperature,Unit,Humidity (%),VPD (kPa),Growth Stage,Target VPD,Uses Leaf Temp,Leaf Temp Offset,DLI,PPFD,Photoperiod\n';
    const csvRow = `${data.timestamp},${data.localTime},${data.temperature},${data.temperatureUnit},${data.humidity},${data.vpd},${data.growthStage},${data.targetVPD},${data.useLeafTemp},${data.leafTempOffset},${data.dli},${data.ppfd},${data.photoperiod}\n`;
    
    const csvContent = csvHeader + csvRow;
    const filename = `vpd-reading-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.csv`;
    
    downloadCSV(csvContent, filename);
    
    // Track conversion - user downloaded data (high engagement)
    trackConversion('download_reading', 2.0);
    trackUserEngagement('reading_downloaded', { 
        stage: currentStage, 
        vpd: currentVPD.toFixed(2),
        export_type: 'single_reading'
    });
    
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
    
    const csvHeader = 'Timestamp,Local Time,Temperature,Unit,Humidity (%),VPD (kPa),Growth Stage,Target VPD,Uses Leaf Temp,Leaf Temp Offset,DLI,PPFD,Photoperiod\n';
    
    let csvContent = csvHeader;
    readings.forEach(reading => {
        csvContent += `${reading.timestamp},${reading.localTime},${reading.temperature},${reading.temperatureUnit},${reading.humidity},${reading.vpd},${reading.growthStage},${reading.targetVPD},${reading.useLeafTemp},${reading.leafTempOffset},${reading.dli},${reading.ppfd},${reading.photoperiod}\n`;
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
    const dliValue = useDLI ? calculateDLI(currentPPFD, currentPhotoperiod).toFixed(1) : 'N/A';
    const ppfdValue = useDLI ? currentPPFD : 'N/A';
    const photoperiodValue = useDLI ? currentPhotoperiod : 'N/A';
    
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
        dli: dliValue,
        ppfd: ppfdValue,
        photoperiod: photoperiodValue
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

// Google Ads Conversion Tracking Functions
function trackConversion(action, value) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'conversion', {
            'send_to': 'AW-CONVERSION_ID/CONVERSION_LABEL', // Replace with your conversion tracking details
            'value': value || 1.0,
            'currency': 'USD',
            'transaction_id': Date.now().toString()
        });
    }
    
    // Alternative method for AdSense (page engagement tracking)
    if (typeof window.adsbygoogle !== 'undefined') {
        // Track meaningful user interactions
        gtag('event', action, {
            'event_category': 'VPD Calculator',
            'event_label': action,
            'value': value || 1
        });
    }
}

// Enhanced event tracking for better ad targeting
function trackUserEngagement(eventName, customData = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
            'event_category': 'User Engagement',
            'event_label': eventName,
            'custom_parameter_1': customData.stage || currentStage,
            'custom_parameter_2': customData.vpd || calculateVPD(currentTemp, currentHumidity).toFixed(2),
            ...customData
        });
    }
}

// Privacy Policy Modal Functions
function openPrivacyModal() {
    document.getElementById('privacyModal').style.display = 'block';
}

function closePrivacyModal() {
    document.getElementById('privacyModal').style.display = 'none';
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('privacyModal');
    if (event.target == modal) {
        closePrivacyModal();
    }
}