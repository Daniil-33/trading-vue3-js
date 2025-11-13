# Trading Vue 3 JS

[![npm version](https://badge.fury.io/js/trading-vue3-js.svg)](https://www.npmjs.com/package/trading-vue3-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> Customizable charting library for traders. **Vue 3 + Vite** version. Based on [trading-vue-js](https://github.com/C451/trading-vue-js) by C451.

## ✨ Features

- ⚡️ **Vue 3** - Latest Vue version with Composition API
- 🚀 **Vite** - Lightning fast build tool
- 📊 **Candlestick charts** - OHLCV data visualization
- 🎨 **Customizable** - Colors, fonts, and styles
- 📈 **Technical indicators** - Built-in overlays and custom indicators
- 🖱️ **Interactive** - Zoom, pan, and drawing tools
- 📱 **Responsive** - Works on all screen sizes
- 🔧 **Extensible** - Create custom overlays and tools

## 📦 Installation

```bash
npm install trading-vue3-js
```

or with yarn:

```bash
yarn add trading-vue3-js
```

## 🚀 Quick Start

### Global Registration

```javascript
import { createApp } from 'vue'
import TradingVue from 'trading-vue3-js'
import 'trading-vue3-js/dist/style.css'
import App from './App.vue'

const app = createApp(App)
app.use(TradingVue)
app.mount('#app')
```

### Component Registration

```vue
<template>
  <TradingVue 
    :data="chartData" 
    :width="800" 
    :height="600"
    :color-back="colors.colorBack"
    :color-grid="colors.colorGrid"
  />
</template>

<script setup>
import { ref } from 'vue'
import TradingVue from 'trading-vue3-js'
import 'trading-vue3-js/dist/style.css'

const chartData = ref({
  chart: {
    type: 'Candles',
    data: [
      // [timestamp, open, high, low, close, volume]
      [1551128400000, 33, 37.1, 14.3, 14.6, 196],
      [1551132000000, 13.7, 30, 6.6, 30, 206],
      [1551135600000, 29.9, 33, 21.3, 21.8, 74],
      // ... more data
    ]
  },
  onchart: [],  // On-chart overlays
  offchart: []  // Off-chart overlays
})

const colors = ref({
  colorBack: '#1c1c1c',
  colorGrid: '#333',
  colorText: '#fff'
})
</script>
```

## 📖 Documentation

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | Object | - | Chart data structure |
| `width` | Number | - | Chart width in pixels |
| `height` | Number | - | Chart height in pixels |
| `color-back` | String | `'#1c1c1c'` | Background color |
| `color-grid` | String | `'#333'` | Grid color |
| `color-text` | String | `'#fff'` | Text color |
| `toolbar` | Boolean | `false` | Show toolbar |

### Data Structure

```javascript
{
  chart: {
    type: 'Candles',  // Chart type
    data: [            // OHLCV data
      [timestamp, open, high, low, close, volume],
      // ...
    ]
  },
  onchart: [          // Overlays on the main chart
    {
      name: 'EMA',
      type: 'EMA',
      data: [[timestamp, value], ...],
      settings: {}
    }
  ],
  offchart: [         // Separate chart panes
    {
      name: 'RSI',
      type: 'RSI',
      data: [[timestamp, value], ...],
      settings: {}
    }
  ]
}
```

## 🎨 Customization

### Colors

```vue
<TradingVue
  :data="chartData"
  :colors="{
    colorBack: '#1a1a1a',
    colorGrid: '#2a2a2a',
    colorText: '#ffffff',
    colorTitle: '#ffffff',
    colorScale: '#888888',
    colorCross: '#888888'
  }"
/>
```

### Custom Overlays

Create custom overlays by extending the Overlay mixin:

```javascript
import { Overlay } from 'trading-vue3-js'

export default {
  name: 'MyIndicator',
  mixins: [Overlay],
  methods: {
    draw(ctx) {
      // Your drawing code here
      const layout = this.$props.layout
      // ...
    }
  }
}
```

## 🔧 Development

### Setup

```bash
# Clone the repository
git clone https://github.com/SaViGnAnO/trading-vue3-js.git
cd trading-vue3-js

# Install dependencies
npm install

# Run development server
npm run dev

# Build library
npm run build
```

## 📝 Migration from Vue 2

This is a complete Vue 3 + Vite migration of the original trading-vue-js library. See [MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md) for details.

### Key Changes:
- ✅ Vue 3 Composition API support
- ✅ Vite instead of Webpack
- ✅ Removed deprecated `$set`, `$delete`, `$watch`
- ✅ Updated render functions for Vue 3
- ✅ Modern build system

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE.md](./LICENSE.md)

## 🙏 Credits

- Original library: [trading-vue-js](https://github.com/C451/trading-vue-js) by C451
- Vue 3 migration: SaViGnAnO

## 📞 Support

- 🐛 [Report Issues](https://github.com/SaViGnAnO/trading-vue3-js/issues)
- 💬 [Discussions](https://github.com/SaViGnAnO/trading-vue3-js/discussions)

## ⚡️ Performance

Built with Vite for optimal performance:
- 🚀 **25-50x faster** cold start compared to Webpack
- ⚡️ **20-60x faster** Hot Module Replacement
- 📦 Smaller bundle size with tree-shaking

---

Made with ❤️ for the trading community
