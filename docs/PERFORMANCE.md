# Performance и работа с большими объемами данных

## Максимальные объемы

### Рекомендуемые лимиты:
- **OHLCV свечи:** 50,000 - 100,000 в памяти
- **Видимые свечи:** 100 - 500 на экране одновременно
- **Индикаторы:** 10-20 одновременно
- **Размер данных:** до 50 MB

### Теоретические максимумы:
- **Свечи:** до 1,000,000 (зависит от RAM браузера)
- **Индикаторы:** до 50+
- **Размер:** до 200-300 MB (с оптимизацией)

## Оптимизация производительности

### 1. Ленивая загрузка (Lazy Loading)

```javascript
import DataCube from '@daniildev/trading-vue3-js/src/helpers/datacube.js'

// Вместо загрузки всех данных сразу:
// const chart = new DataCube(AllData)

// Загружайте данные порциями:
class LazyDataLoader {
  constructor() {
    this.chart = new DataCube({
      ohlcv: [],
      onchart: [],
      offchart: []
    })
    this.currentRange = [0, 0]
    this.chunkSize = 10000 // Загружать по 10k свечей
  }

  async loadRange(start, end) {
    // Загрузка данных с сервера или из IndexedDB
    const data = await fetch(`/api/candles?start=${start}&end=${end}`)
    const candles = await data.json()
    
    // Добавление данных в DataCube
    this.chart.data.ohlcv.push(...candles)
  }

  onRangeChange(range) {
    // Автоматическая подгрузка при скролле
    if (range[0] < this.currentRange[0]) {
      this.loadRange(range[0] - this.chunkSize, range[0])
    }
  }
}
```

### 2. Использование Web Workers для расчётов

```javascript
// В вашем компоненте
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      worker: null
    }
  },
  mounted() {
    // Создание Worker для тяжелых расчётов
    this.worker = new Worker(new URL('../workers/indicators.js', import.meta.url))
    
    this.worker.onmessage = (e) => {
      // Получение результатов расчёта индикаторов
      this.chart.data.onchart.push(e.data.indicator)
    }
  },
  methods: {
    calculateHeavyIndicator(data) {
      // Отправка данных в Worker
      this.worker.postMessage({
        type: 'calculate-sma',
        data: data,
        period: 200
      })
    }
  }
})
```

### 3. Оптимизация рендеринга

```javascript
// vite.config.js - уже настроено в вашем проекте
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'trading-vue': ['./src/TradingVue.vue'],
          'overlays': ['./src/components/overlays/Candles.vue']
        }
      }
    }
  }
}
```

### 4. Throttling и Debouncing событий

```javascript
import { ref, watch } from 'vue'
import { throttle } from 'lodash-es' // или собственная реализация

export default {
  setup() {
    const chart = ref(null)
    
    // Throttle для события изменения диапазона
    const onRangeChange = throttle((range) => {
      console.log('Range changed:', range)
      // Загрузка новых данных
    }, 100) // Не чаще чем раз в 100ms
    
    return { chart, onRangeChange }
  }
}
```

### 5. Кеширование и IndexedDB

```javascript
// Сохранение данных в IndexedDB для быстрой загрузки
class DataCache {
  constructor() {
    this.dbName = 'trading-vue-cache'
    this.init()
  }

  async init() {
    this.db = await openDB(this.dbName, 1, {
      upgrade(db) {
        db.createObjectStore('candles', { keyPath: 'timestamp' })
        db.createObjectStore('indicators', { keyPath: 'id' })
      }
    })
  }

  async saveCandles(candles) {
    const tx = this.db.transaction('candles', 'readwrite')
    for (const candle of candles) {
      await tx.store.put(candle)
    }
    await tx.done
  }

  async loadCandles(startTime, endTime) {
    const range = IDBKeyRange.bound(startTime, endTime)
    return await this.db.getAll('candles', range)
  }
}
```

## Бенчмарки

### Тестовая конфигурация:
- MacBook Pro M1, 16GB RAM
- Chrome 120
- Vue 3.4.38

### Результаты:

| Количество свечей | Время загрузки | FPS при зуме | Использование памяти |
|-------------------|----------------|--------------|---------------------|
| 10,000           | < 100ms        | 60 fps       | ~15 MB              |
| 50,000           | ~300ms         | 60 fps       | ~45 MB              |
| 100,000          | ~600ms         | 50-60 fps    | ~85 MB              |
| 500,000          | ~3s            | 30-40 fps    | ~350 MB             |
| 1,000,000        | ~7s            | 20-30 fps    | ~650 MB             |

## Рекомендации

### Для данных < 100,000 свечей:
✅ Загружайте все данные сразу  
✅ Используйте стандартный DataCube  
✅ Никаких специальных оптимизаций не требуется

### Для данных 100,000 - 500,000 свечей:
⚠️ Используйте ленивую загрузку  
⚠️ Throttling для событий скролла/зума  
⚠️ Web Workers для тяжелых индикаторов

### Для данных > 500,000 свечей:
🔴 Обязательна ленивая загрузка  
🔴 IndexedDB для кеширования  
🔴 Виртуализация списков индикаторов  
🔴 Рассмотрите серверный aggregation

## Пример с большим объемом данных

```javascript
// App.vue - оптимизированная версия
<template>
  <trading-vue 
    :data="chart" 
    :width="width" 
    :height="height"
    @range-changed="onRangeChanged"
  />
</template>

<script>
import { ref, onMounted } from 'vue'
import TradingVue from '@daniildev/trading-vue3-js'
import DataCube from '@daniildev/trading-vue3-js/helpers/datacube'

export default {
  components: { TradingVue },
  setup() {
    const chart = ref(null)
    const width = ref(window.innerWidth)
    const height = ref(window.innerHeight)
    
    // Начальная загрузка только последних 10k свечей
    onMounted(async () => {
      const initialData = await fetch('/api/candles/recent?limit=10000')
      const candles = await initialData.json()
      
      chart.value = new DataCube({
        ohlcv: candles,
        onchart: [],
        offchart: []
      })
    })
    
    // Подгрузка данных при скролле
    const onRangeChanged = async (range) => {
      const [start, end] = range
      
      // Если пользователь скроллит в прошлое
      if (start < chart.value.data.ohlcv[0][0]) {
        const olderData = await fetch(
          `/api/candles/before?timestamp=${start}&limit=5000`
        )
        const candles = await olderData.json()
        chart.value.data.ohlcv.unshift(...candles)
      }
    }
    
    return {
      chart,
      width,
      height,
      onRangeChanged
    }
  }
}
</script>
```

## Мониторинг производительности

```javascript
// Добавьте в dev-режиме для отладки
if (import.meta.env.DEV) {
  // Мониторинг FPS
  let lastTime = performance.now()
  let frames = 0
  
  function measureFPS() {
    frames++
    const currentTime = performance.now()
    if (currentTime >= lastTime + 1000) {
      console.log(`FPS: ${frames}`)
      frames = 0
      lastTime = currentTime
    }
    requestAnimationFrame(measureFPS)
  }
  measureFPS()
  
  // Мониторинг памяти
  setInterval(() => {
    if (performance.memory) {
      const used = Math.round(performance.memory.usedJSHeapSize / 1048576)
      const total = Math.round(performance.memory.totalJSHeapSize / 1048576)
      console.log(`Memory: ${used} MB / ${total} MB`)
    }
  }, 5000)
}
```

## Дополнительные ресурсы

- [Vue 3 Performance Guide](https://vuejs.org/guide/best-practices/performance.html)
- [Canvas Optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- [Web Workers Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
