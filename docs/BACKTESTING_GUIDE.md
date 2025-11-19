# Backtesting на Trading-Vue3

## Почему Trading-Vue идеален для бектестинга?

✅ **Визуализация сделок** - отображение входов/выходов прямо на графике  
✅ **Web Workers** - встроенная поддержка для тяжелых вычислений  
✅ **Script Engine** - можно писать стратегии прямо в коде  
✅ **Overlays** - кастомные индикаторы и визуализация  
✅ **События мыши** - интерактивный анализ сделок  

## Архитектура бектестинг системы

```
┌─────────────────────────────────────────┐
│          Vue 3 Application              │
├─────────────────────────────────────────┤
│  ┌──────────────┐  ┌─────────────────┐ │
│  │ Trading-Vue3 │  │  Backtest UI    │ │
│  │   Chart      │  │  • Controls     │ │
│  │              │  │  • Statistics   │ │
│  └──────┬───────┘  │  • Results      │ │
│         │          └─────────────────┘ │
│         │                               │
│  ┌──────▼──────────────────────────┐   │
│  │   Backtesting Engine            │   │
│  │   • Strategy Runner             │   │
│  │   • Position Manager            │   │
│  │   • Risk Calculator             │   │
│  └──────┬──────────────────────────┘   │
│         │                               │
│  ┌──────▼──────────────────────────┐   │
│  │   Data Provider                 │   │
│  │   • Historical Data             │   │
│  │   • Indicators                  │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Пример 1: Простая визуализация сделок

```vue
<!-- BacktestChart.vue -->
<template>
  <div class="backtest-container">
    <trading-vue 
      :data="chart" 
      :width="width" 
      :height="height"
      :overlays="customOverlays"
      @range-changed="onRangeChanged"
    />
    
    <div class="backtest-controls">
      <button @click="runBacktest">Run Backtest</button>
      <button @click="stepForward">Step Forward</button>
      <button @click="reset">Reset</button>
    </div>
    
    <div class="backtest-stats">
      <div>Total Trades: {{ stats.totalTrades }}</div>
      <div>Win Rate: {{ stats.winRate }}%</div>
      <div>Profit: {{ stats.totalProfit }}$</div>
      <div>Max Drawdown: {{ stats.maxDrawdown }}%</div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import TradingVue from '@daniildev/trading-vue3-js'
import DataCube from '@daniildev/trading-vue3-js/src/helpers/datacube.js'
import TradeMarkers from './overlays/TradeMarkers.vue'
import EquityCurve from './overlays/EquityCurve.vue'

export default {
  name: 'BacktestChart',
  components: { TradingVue },
  setup() {
    const chart = ref(null)
    const width = ref(window.innerWidth)
    const height = ref(window.innerHeight - 200)
    const stats = ref({
      totalTrades: 0,
      winRate: 0,
      totalProfit: 0,
      maxDrawdown: 0
    })
    
    // Кастомные overlays для отображения сделок
    const customOverlays = [TradeMarkers, EquityCurve]
    
    onMounted(async () => {
      // Загружаем исторические данные
      const response = await fetch('/data/btc_historical.json')
      const historicalData = await response.json()
      
      chart.value = new DataCube({
        ohlcv: historicalData.ohlcv,
        onchart: [],
        offchart: [
          {
            name: 'EquityCurve',
            type: 'EquityCurve',
            data: [],
            settings: {}
          }
        ]
      })
    })
    
    // Запуск бектеста
    const runBacktest = async () => {
      const strategy = new SimpleMAStrategy()
      const engine = new BacktestEngine(chart.value.data.ohlcv, strategy)
      
      const results = await engine.run()
      
      // Добавляем маркеры сделок на график
      chart.value.data.onchart.push({
        name: 'Trades',
        type: 'TradeMarkers',
        data: results.trades,
        settings: {
          buyColor: '#00ff00',
          sellColor: '#ff0000'
        }
      })
      
      // Добавляем кривую эквити
      chart.value.data.offchart[0].data = results.equity
      
      // Обновляем статистику
      stats.value = calculateStats(results)
    }
    
    return {
      chart,
      width,
      height,
      stats,
      customOverlays,
      runBacktest
    }
  }
}
</script>

<style scoped>
.backtest-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.backtest-controls {
  padding: 10px;
  background: #1e1e1e;
  display: flex;
  gap: 10px;
}

.backtest-stats {
  padding: 10px;
  background: #2d2d2d;
  display: flex;
  gap: 20px;
  color: white;
}
</style>
```

## Пример 2: Overlay для маркеров сделок

```vue
<!-- overlays/TradeMarkers.vue -->
<script>
import Overlay from '@daniildev/trading-vue3-js/src/mixins/overlay.js'

export default {
  name: 'TradeMarkers',
  mixins: [Overlay],
  methods: {
    meta_info() {
      return { 
        author: 'Your Name', 
        version: '1.0.0',
        desc: 'Trade entry/exit markers'
      }
    },
    
    use_for() { 
      return ['TradeMarkers'] 
    },
    
    draw(ctx) {
      const layout = this.$props.layout
      const trades = this.$props.data
      
      trades.forEach(trade => {
        const x = layout.t2screen(trade.timestamp)
        const y = layout.$2screen(trade.price)
        
        if (x < 0 || x > layout.width) return
        
        // Рисуем маркер
        ctx.beginPath()
        
        if (trade.type === 'buy') {
          // Зеленый треугольник вверх
          ctx.fillStyle = this.sett.buyColor || '#00ff00'
          ctx.moveTo(x, y + 10)
          ctx.lineTo(x - 8, y + 20)
          ctx.lineTo(x + 8, y + 20)
        } else {
          // Красный треугольник вниз
          ctx.fillStyle = this.sett.sellColor || '#ff0000'
          ctx.moveTo(x, y - 10)
          ctx.lineTo(x - 8, y - 20)
          ctx.lineTo(x + 8, y - 20)
        }
        
        ctx.closePath()
        ctx.fill()
        
        // Добавляем текст с P&L
        if (trade.pnl) {
          ctx.font = '12px Arial'
          ctx.fillStyle = trade.pnl > 0 ? '#00ff00' : '#ff0000'
          ctx.fillText(
            `${trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}`,
            x + 10,
            y
          )
        }
      })
    },
    
    // Определение диапазона Y для автомасштабирования
    y_range() {
      return [null, null] // Не влияет на масштаб
    }
  },
  computed: {
    sett() {
      return this.$props.settings
    }
  }
}
</script>
```

## Пример 3: Backtesting Engine

```javascript
// lib/BacktestEngine.js

export class BacktestEngine {
  constructor(ohlcv, strategy, options = {}) {
    this.ohlcv = ohlcv
    this.strategy = strategy
    this.options = {
      initialCapital: options.initialCapital || 10000,
      commission: options.commission || 0.001, // 0.1%
      slippage: options.slippage || 0.0005, // 0.05%
      leverage: options.leverage || 1,
      ...options
    }
    
    this.position = null
    this.capital = this.options.initialCapital
    this.trades = []
    this.equity = []
    this.peak = this.capital
    this.maxDrawdown = 0
  }
  
  async run() {
    console.log('Starting backtest...')
    
    // Инициализация стратегии
    this.strategy.init(this.ohlcv)
    
    // Проход по всем барам
    for (let i = 0; i < this.ohlcv.length; i++) {
      const bar = this.ohlcv[i]
      const [timestamp, open, high, low, close, volume] = bar
      
      // Получаем сигнал от стратегии
      const signal = this.strategy.onBar(i, {
        timestamp, open, high, low, close, volume
      })
      
      // Обработка сигнала
      if (signal) {
        this.processSignal(signal, bar, i)
      }
      
      // Обновление открытой позиции
      if (this.position) {
        this.updatePosition(bar, i)
      }
      
      // Запись эквити
      this.recordEquity(timestamp, close)
      
      // Прогресс
      if (i % 1000 === 0) {
        console.log(`Progress: ${((i / this.ohlcv.length) * 100).toFixed(1)}%`)
      }
    }
    
    // Закрываем открытую позицию в конце
    if (this.position) {
      const lastBar = this.ohlcv[this.ohlcv.length - 1]
      this.closePosition(lastBar, this.ohlcv.length - 1, 'end')
    }
    
    console.log('Backtest completed!')
    
    return {
      trades: this.trades,
      equity: this.equity,
      stats: this.calculateStatistics()
    }
  }
  
  processSignal(signal, bar, index) {
    const [timestamp, open, high, low, close] = bar
    
    if (signal.type === 'buy' && !this.position) {
      // Открываем длинную позицию
      const price = this.applySlippage(close, 'buy')
      const commission = price * this.options.commission
      const size = (this.capital * this.options.leverage) / price
      
      this.position = {
        type: 'long',
        entryPrice: price,
        entryTime: timestamp,
        entryIndex: index,
        size: size,
        commission: commission
      }
      
      this.capital -= commission
      
    } else if (signal.type === 'sell' && this.position?.type === 'long') {
      // Закрываем длинную позицию
      this.closePosition(bar, index, signal.reason || 'signal')
      
    } else if (signal.type === 'short' && !this.position) {
      // Открываем короткую позицию
      const price = this.applySlippage(close, 'short')
      const commission = price * this.options.commission
      const size = (this.capital * this.options.leverage) / price
      
      this.position = {
        type: 'short',
        entryPrice: price,
        entryTime: timestamp,
        entryIndex: index,
        size: size,
        commission: commission
      }
      
      this.capital -= commission
    }
  }
  
  closePosition(bar, index, reason) {
    if (!this.position) return
    
    const [timestamp, open, high, low, close] = bar
    const exitPrice = this.applySlippage(close, 
      this.position.type === 'long' ? 'sell' : 'cover')
    
    let pnl
    if (this.position.type === 'long') {
      pnl = (exitPrice - this.position.entryPrice) * this.position.size
    } else {
      pnl = (this.position.entryPrice - exitPrice) * this.position.size
    }
    
    const commission = exitPrice * this.options.commission
    pnl -= (this.position.commission + commission)
    
    this.capital += pnl
    
    // Обновление максимального drawdown
    if (this.capital > this.peak) {
      this.peak = this.capital
    }
    const drawdown = ((this.peak - this.capital) / this.peak) * 100
    if (drawdown > this.maxDrawdown) {
      this.maxDrawdown = drawdown
    }
    
    // Запись сделки
    this.trades.push({
      type: this.position.type,
      entryTime: this.position.entryTime,
      entryPrice: this.position.entryPrice,
      entryIndex: this.position.entryIndex,
      exitTime: timestamp,
      exitPrice: exitPrice,
      exitIndex: index,
      size: this.position.size,
      pnl: pnl,
      pnlPercent: (pnl / this.position.entryPrice / this.position.size) * 100,
      reason: reason,
      duration: timestamp - this.position.entryTime
    })
    
    this.position = null
  }
  
  updatePosition(bar, index) {
    // Проверка стоп-лосса и тейк-профита
    const [timestamp, open, high, low, close] = bar
    
    if (this.position.stopLoss) {
      if (this.position.type === 'long' && low <= this.position.stopLoss) {
        this.closePosition(bar, index, 'stop-loss')
        return
      } else if (this.position.type === 'short' && high >= this.position.stopLoss) {
        this.closePosition(bar, index, 'stop-loss')
        return
      }
    }
    
    if (this.position.takeProfit) {
      if (this.position.type === 'long' && high >= this.position.takeProfit) {
        this.closePosition(bar, index, 'take-profit')
        return
      } else if (this.position.type === 'short' && low <= this.position.takeProfit) {
        this.closePosition(bar, index, 'take-profit')
        return
      }
    }
  }
  
  applySlippage(price, side) {
    const slippage = this.options.slippage
    if (side === 'buy' || side === 'cover') {
      return price * (1 + slippage)
    } else {
      return price * (1 - slippage)
    }
  }
  
  recordEquity(timestamp, price) {
    let equity = this.capital
    
    if (this.position) {
      let unrealizedPnl
      if (this.position.type === 'long') {
        unrealizedPnl = (price - this.position.entryPrice) * this.position.size
      } else {
        unrealizedPnl = (this.position.entryPrice - price) * this.position.size
      }
      equity += unrealizedPnl
    }
    
    this.equity.push([timestamp, equity])
  }
  
  calculateStatistics() {
    const totalTrades = this.trades.length
    const winningTrades = this.trades.filter(t => t.pnl > 0)
    const losingTrades = this.trades.filter(t => t.pnl < 0)
    
    const totalProfit = this.trades.reduce((sum, t) => sum + t.pnl, 0)
    const winRate = (winningTrades.length / totalTrades) * 100
    
    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length
      : 0
    
    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length)
      : 0
    
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0
    
    const returns = this.equity.map((e, i) => 
      i > 0 ? ((e[1] - this.equity[i-1][1]) / this.equity[i-1][1]) : 0
    )
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    )
    
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0
    
    return {
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: winRate.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      totalReturn: (((this.capital - this.options.initialCapital) / this.options.initialCapital) * 100).toFixed(2),
      avgWin: avgWin.toFixed(2),
      avgLoss: avgLoss.toFixed(2),
      profitFactor: profitFactor.toFixed(2),
      maxDrawdown: this.maxDrawdown.toFixed(2),
      sharpeRatio: sharpeRatio.toFixed(2),
      finalCapital: this.capital.toFixed(2)
    }
  }
}
```

## Пример 4: Простая стратегия (MA Crossover)

```javascript
// strategies/SimpleMAStrategy.js

export class SimpleMAStrategy {
  constructor(options = {}) {
    this.fastPeriod = options.fastPeriod || 10
    this.slowPeriod = options.slowPeriod || 30
    this.ohlcv = null
    this.fastMA = []
    this.slowMA = []
  }
  
  init(ohlcv) {
    this.ohlcv = ohlcv
    
    // Предварительный расчет MA
    console.log('Calculating moving averages...')
    
    for (let i = 0; i < ohlcv.length; i++) {
      // Fast MA
      if (i >= this.fastPeriod - 1) {
        const sum = ohlcv.slice(i - this.fastPeriod + 1, i + 1)
          .reduce((s, bar) => s + bar[4], 0)
        this.fastMA[i] = sum / this.fastPeriod
      }
      
      // Slow MA
      if (i >= this.slowPeriod - 1) {
        const sum = ohlcv.slice(i - this.slowPeriod + 1, i + 1)
          .reduce((s, bar) => s + bar[4], 0)
        this.slowMA[i] = sum / this.slowPeriod
      }
    }
  }
  
  onBar(index, bar) {
    // Нужно минимум данных для расчета
    if (index < this.slowPeriod) return null
    
    const prevFast = this.fastMA[index - 1]
    const prevSlow = this.slowMA[index - 1]
    const currFast = this.fastMA[index]
    const currSlow = this.slowMA[index]
    
    // Бычье пересечение - покупаем
    if (prevFast <= prevSlow && currFast > currSlow) {
      return {
        type: 'buy',
        reason: 'ma-crossover-bullish'
      }
    }
    
    // Медвежье пересечение - продаем
    if (prevFast >= prevSlow && currFast < currSlow) {
      return {
        type: 'sell',
        reason: 'ma-crossover-bearish'
      }
    }
    
    return null
  }
}
```

## Пример 5: Продвинутая стратегия с индикаторами

```javascript
// strategies/AdvancedStrategy.js

import { SMA, EMA, RSI, MACD, BollingerBands } from '../indicators'

export class AdvancedStrategy {
  constructor(options = {}) {
    this.options = {
      rsiPeriod: 14,
      rsiOverbought: 70,
      rsiOversold: 30,
      bbPeriod: 20,
      bbStdDev: 2,
      stopLossPercent: 2,
      takeProfitPercent: 5,
      ...options
    }
    
    this.indicators = {}
    this.position = null
  }
  
  init(ohlcv) {
    console.log('Calculating indicators...')
    
    const closes = ohlcv.map(bar => bar[4])
    
    this.indicators.rsi = RSI(closes, this.options.rsiPeriod)
    this.indicators.bb = BollingerBands(closes, this.options.bbPeriod, this.options.bbStdDev)
    this.indicators.macd = MACD(closes, 12, 26, 9)
    
    console.log('Indicators calculated')
  }
  
  onBar(index, bar) {
    if (index < 50) return null // Недостаточно данных
    
    const rsi = this.indicators.rsi[index]
    const bb = this.indicators.bb[index]
    const macd = this.indicators.macd[index]
    
    // Условия для входа
    if (!this.position) {
      // Покупка: RSI перепродан + цена касается нижней полосы BB + MACD бычий
      if (rsi < this.options.rsiOversold && 
          bar.close <= bb.lower &&
          macd.histogram > 0) {
        
        return {
          type: 'buy',
          reason: 'oversold-bounce',
          stopLoss: bar.close * (1 - this.options.stopLossPercent / 100),
          takeProfit: bar.close * (1 + this.options.takeProfitPercent / 100)
        }
      }
    } else {
      // Выход: RSI перекуплен или пересечение BB верхней линии
      if (rsi > this.options.rsiOverbought || bar.close >= bb.upper) {
        return {
          type: 'sell',
          reason: 'overbought-exit'
        }
      }
    }
    
    return null
  }
}
```

## Пример 6: Web Worker для тяжелых вычислений

```javascript
// workers/backtest.worker.js

import { BacktestEngine } from '../lib/BacktestEngine'
import { SimpleMAStrategy } from '../strategies/SimpleMAStrategy'

self.onmessage = async (e) => {
  const { type, data } = e.data
  
  if (type === 'run-backtest') {
    const { ohlcv, strategyParams, engineOptions } = data
    
    // Создаем стратегию и движок
    const strategy = new SimpleMAStrategy(strategyParams)
    const engine = new BacktestEngine(ohlcv, strategy, engineOptions)
    
    // Запускаем бектест
    const results = await engine.run()
    
    // Отправляем результаты обратно
    self.postMessage({
      type: 'backtest-complete',
      results: results
    })
  }
}
```

```vue
<!-- Использование Worker в компоненте -->
<script>
import { ref } from 'vue'

export default {
  setup() {
    const runBacktestInWorker = () => {
      const worker = new Worker(
        new URL('../workers/backtest.worker.js', import.meta.url),
        { type: 'module' }
      )
      
      worker.onmessage = (e) => {
        if (e.data.type === 'backtest-complete') {
          console.log('Backtest results:', e.data.results)
          // Обновляем UI с результатами
          updateChartWithResults(e.data.results)
        }
      }
      
      worker.postMessage({
        type: 'run-backtest',
        data: {
          ohlcv: chart.value.data.ohlcv,
          strategyParams: { fastPeriod: 10, slowPeriod: 30 },
          engineOptions: { initialCapital: 10000, commission: 0.001 }
        }
      })
    }
    
    return { runBacktestInWorker }
  }
}
</script>
```

## Полный пример приложения

Создайте полноценное приложение для бектестинга:

```bash
# Структура проекта
trading-vue3-backtester/
├── src/
│   ├── components/
│   │   ├── BacktestChart.vue       # Главный компонент графика
│   │   ├── StrategyEditor.vue      # Редактор стратегий
│   │   ├── ResultsPanel.vue        # Панель результатов
│   │   └── TradesList.vue          # Список сделок
│   ├── overlays/
│   │   ├── TradeMarkers.vue        # Маркеры сделок
│   │   ├── EquityCurve.vue         # Кривая эквити
│   │   └── Drawdown.vue            # Визуализация drawdown
│   ├── lib/
│   │   ├── BacktestEngine.js       # Движок бектестинга
│   │   ├── PositionManager.js      # Управление позициями
│   │   └── RiskManager.js          # Управление рисками
│   ├── strategies/
│   │   ├── SimpleMAStrategy.js
│   │   ├── RSIStrategy.js
│   │   └── MLStrategy.js           # ML-based стратегия
│   ├── indicators/
│   │   ├── SMA.js
│   │   ├── EMA.js
│   │   ├── RSI.js
│   │   ├── MACD.js
│   │   └── BollingerBands.js
│   └── workers/
│       └── backtest.worker.js
├── package.json
└── vite.config.js
```

## Продвинутые функции

### 1. Walk-Forward Analysis

```javascript
class WalkForwardAnalyzer {
  constructor(ohlcv, strategy, options) {
    this.ohlcv = ohlcv
    this.strategy = strategy
    this.inSamplePercent = options.inSamplePercent || 70
    this.windowSize = options.windowSize || 1000
    this.stepSize = options.stepSize || 250
  }
  
  async analyze() {
    const results = []
    
    for (let i = 0; i < this.ohlcv.length - this.windowSize; i += this.stepSize) {
      const window = this.ohlcv.slice(i, i + this.windowSize)
      const splitPoint = Math.floor(window.length * this.inSamplePercent / 100)
      
      const inSample = window.slice(0, splitPoint)
      const outSample = window.slice(splitPoint)
      
      // Оптимизация на in-sample
      const optimizedParams = await this.optimize(inSample)
      
      // Тест на out-sample
      const engine = new BacktestEngine(outSample, this.strategy)
      const result = await engine.run()
      
      results.push({
        period: [i, i + this.windowSize],
        params: optimizedParams,
        performance: result.stats
      })
    }
    
    return results
  }
}
```

### 2. Monte Carlo Simulation

```javascript
class MonteCarloSimulator {
  constructor(trades, simulations = 1000) {
    this.trades = trades
    this.simulations = simulations
  }
  
  run() {
    const results = []
    
    for (let i = 0; i < this.simulations; i++) {
      // Случайная перестановка сделок
      const shuffled = this.shuffle([...this.trades])
      const equity = this.calculateEquity(shuffled)
      results.push(equity)
    }
    
    return this.analyzeResults(results)
  }
  
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }
}
```

## Заключение

Trading-Vue3 предоставляет отличную основу для создания профессионального бектестинг софта:

✅ **Производительность** - Web Workers для тяжелых вычислений  
✅ **Визуализация** - Canvas-based рендеринг  
✅ **Гибкость** - Кастомные overlays и индикаторы  
✅ **Интерактивность** - События мыши и клавиатуры  
✅ **Масштабируемость** - Поддержка больших объемов данных  

Следующие шаги:
1. Реализовать базовый BacktestEngine
2. Создать несколько простых стратегий
3. Добавить визуализацию сделок
4. Расширить функционал (оптимизация, walk-forward, Monte Carlo)
5. Интегрировать с реальными данными (API бирж)

Нужна помощь с реализацией какой-то конкретной части? 🚀
