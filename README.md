# 🌿 Cannabis VPD Calculator

A precision environmental control system for calculating and optimizing Vapor Pressure Deficit (VPD) for cannabis cultivation. This interactive web-based calculator helps growers maintain optimal growing conditions throughout different growth stages.

## 🚀 Features

- **Real-time VPD Calculations** - Instant feedback on current environmental conditions
- **Multi-Unit Support** - Temperature inputs in both Fahrenheit and Celsius
- **Growth Stage Optimization** - Tailored recommendations for seedling, vegetative, and flowering stages
- **Interactive VPD Chart** - Visual heat map showing optimal zones for your current growth stage
- **Leaf Temperature Mode** - More accurate calculations using leaf surface temperature
- **Smart Recommendations** - Actionable advice for reaching target VPD levels
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Cyberpunk Aesthetic** - Modern, professional interface with terminal-inspired styling

## 📊 Understanding VPD

Vapor Pressure Deficit (VPD) is the difference between the moisture content in the air and how much moisture the air can hold when saturated. It's a critical factor in cannabis cultivation that affects:

- **Transpiration rates** - How efficiently plants move water and nutrients
- **Stomatal behavior** - Plant breathing and gas exchange
- **Nutrient uptake** - Mineral absorption from the growing medium
- **Overall plant health** - Growth rate, stress tolerance, and yield potential

### Optimal VPD Ranges by Growth Stage

| Growth Stage | VPD Range (kPa) | Temperature | Humidity |
|-------------|----------------|-------------|----------|
| **Seedling** | 0.4 - 0.8 | 75-80°F (24-27°C) | 65-75% |
| **Vegetative** | 0.8 - 1.2 | 75-82°F (24-28°C) | 55-65% |
| **Flowering** | 1.0 - 1.5 | 70-78°F (21-26°C) | 45-55% |

## 🛠 Installation & Usage

### Quick Start

1. **Clone or Download** this repository to your local machine
2. **Open** `index.html` in any modern web browser
3. **Start calculating** - no additional setup required!

### Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## 🎯 How to Use

### Basic Operation

1. **Set Temperature** - Use slider or input field, toggle between °F/°C
2. **Set Humidity** - Adjust relative humidity percentage (30-90%)
3. **Select Growth Stage** - Choose seedling, vegetative, or flowering
4. **Monitor VPD** - View real-time calculation and status

### Advanced Features

#### Leaf Temperature Mode
- Enable for more accurate calculations
- Accounts for transpiration cooling (leaves are typically 2-5°F cooler than air)
- Adjust offset based on your growing conditions

#### Target VPD Settings
- Manually set custom target VPD (0.4-1.6 kPa)
- Use "Optimal for Stage" button for recommended values
- Get specific recommendations to reach your target

#### Visual Chart Analysis
- Interactive heat map shows VPD zones
- Your current reading displayed as black dot with crosshairs
- Color-coded zones indicate optimal, too high, too low, and danger areas

## 📱 Responsive Design

The calculator automatically adapts to different screen sizes:

- **Desktop** (1024px+): Full two-column layout with chart
- **Tablet** (768px-1024px): Stacked single-column layout  
- **Mobile** (<768px): Optimized touch interface with simplified controls

## 🔧 Technical Details

### VPD Calculation Formula

The calculator uses the Magnus-Tetens approximation for saturation vapor pressure:

```javascript
SVP = 0.6108 * exp((17.27 * T) / (T + 237.3))
VPD = SVP - (SVP * RH / 100)
```

Where:
- `SVP` = Saturation Vapor Pressure (kPa)
- `T` = Temperature in Celsius
- `RH` = Relative Humidity (%)
- `VPD` = Vapor Pressure Deficit (kPa)

### Input Validation

- Temperature: 60-95°F (15-35°C)
- Humidity: 30-90%
- Target VPD: 0.4-1.6 kPa
- Leaf offset: 1-6°F (0.5-3°C)

## 🎨 Customization

The interface uses CSS custom properties for easy theming. Key color variables:

- `--primary-green`: #00ff88
- `--dark-bg`: #0c1220
- `--accent-blue`: #1a202c

Modify `styles.css` to customize the appearance while maintaining functionality.

## 📈 Growing Tips

### Seedling Stage (0.4-0.8 kPa)
- Higher humidity supports initial root development
- Lower VPD reduces stress on young plants
- Monitor closely as small plants are more sensitive

### Vegetative Stage (0.8-1.2 kPa)
- Moderate VPD promotes healthy transpiration
- Plants can handle lower humidity as they mature
- Optimal zone for rapid vegetative growth

### Flowering Stage (1.0-1.5 kPa)
- Higher VPD prevents mold/mildew on dense buds
- Lower humidity maintains proper transpiration
- Critical for final flower development

## 🤝 Contributing

This is a community-focused tool for cannabis growers. Contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your improvements
4. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## ⚠️ Disclaimer

This tool is for educational purposes and general guidance. Always monitor your plants closely and adjust environmental conditions based on your specific growing setup, strain requirements, and local conditions. Environmental control is just one factor in successful cannabis cultivation.

## 📁 File Structure

```
vpd-calculator/
├── index.html      # Main HTML structure
├── styles.css      # Complete styling and responsive design
├── script.js       # VPD calculation logic and interactivity
└── README.md       # This documentation
```

---

**Happy Growing! 🌱**

*For questions, suggestions, or support, please open an issue in this repository.*