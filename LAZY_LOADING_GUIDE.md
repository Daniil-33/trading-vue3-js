# Ленивая загрузка данных (Lazy Loading) в Trading Vue 3

## Проблема

Когда пользователь достигает края графика и вы добавляете новые данные, возникает вопрос: **вызовет ли это полный ре-рендер и как сохранить позицию пользователя?**

## Ответ

✅ **НЕТ, полного ре-рендера НЕ происходит!** Trading Vue использует Vue 3 реактивность, и данные добавляются инкрементально.

❗ **НО**: После добавления данных график может немного сдвинуться, поэтому нужно **сохранить и восстановить позицию** пользователя.

---

## Решение: Сохранение позиции при добавлении данных

### 🎯 Алгоритм работы:

1. **Отслеживаем** событие `range-changed`
2. **Определяем**, когда пользователь близок к краю
3. **Сохраняем** текущий range через `getRange()`
4. **Добавляем** новые данные (push/unshift)
5. **Восстанавливаем** позицию через `setRange()`

---

## 📋 Полный рабочий пример

```vue
<template>
  <trading-vue 
    ref="tvjs"
    :data="chart" 
    :width="width" 
    :height="height"
    @range-changed="onRangeChanged"
  />
  <div class="loading-indicator" v-if="isLoadingLeft || isLoadingRight">
    Загрузка данных...
  </div>
</template>

<script>
import { ref } from 'vue'
import TradingVue from '@daniildev/trading-vue3-js'
import DataCube from '@daniildev/trading-vue3-js/src/helpers/datacube.js'

export default {
  components: { TradingVue },
  setup() {
    const tvjs = ref(null)
    const chart = ref(null)
    const isLoadingLeft = ref(false)
    const isLoadingRight = ref(false)
    
    // Обработчик изменения диапазона
    const onRangeChanged = async (range) => {
      const [startTime, endTime] = range
      const data = chart.value.data.chart.data
      
      if (!data || data.length === 0) return
      
      const firstTimestamp = data[0][0]      // Новейшая свеча (справа)
      const lastTimestamp = data[data.length - 1][0]  // Старейшая (слева)
      const interval = 3600000 // 1 час в миллисекундах
      const loadThreshold = interval * 20 // Загружаем за 20 свечей до края
      
      // Загрузка СТАРЫХ данных (слева, в прошлое)
      if (startTime <= lastTimestamp + loadThreshold && !isLoadingLeft.value) {
        await loadOlderData(lastTimestamp)
      }
      
      // Загрузка НОВЫХ данных (справа, в будущее)
      if (endTime >= firstTimestamp - loadThreshold && !isLoadingRight.value) {
        await loadNewerData(firstTimestamp)
      }
    }
    
    // Загрузка исторических данных
    const loadOlderData = async (beforeTimestamp) => {
      isLoadingLeft.value = true
      
      try {
        // 1. СОХРАНЯЕМ текущую позицию
        const currentRange = tvjs.value.getRange()
        console.log('📌 Сохранён range:', currentRange)
        
        // 2. Загружаем данные с сервера
        const response = await fetch(
          `/api/candles?end=${beforeTimestamp}&limit=100`
        )
        const oldCandles = await response.json()
        
        console.log(`✅ Загружено ${oldCandles.length} старых свечей`)
        
        // 3. Добавляем в КОНЕЦ массива (т.к. массив отсортирован от нового к старому)
        chart.value.data.chart.data.push(...oldCandles)
        
        // 4. ВОССТАНАВЛИВАЕМ позицию пользователя
        await nextTick() // Ждём обновления Vue
        tvjs.value.setRange(currentRange[0], currentRange[1])
        
        console.log('🔄 Позиция восстановлена')
        
      } catch (error) {
        console.error('Ошибка загрузки:', error)
      } finally {
        isLoadingLeft.value = false
      }
    }
    
    // Загрузка новых данных
    const loadNewerData = async (afterTimestamp) => {
      isLoadingRight.value = true
      
      try {
        const currentRange = tvjs.value.getRange()
        
        const response = await fetch(
          `/api/candles?start=${afterTimestamp}&limit=50`
        )
        const newCandles = await response.json()
        
        console.log(`✅ Загружено ${newCandles.length} новых свечей`)
        
        // Добавляем в НАЧАЛО массива
        chart.value.data.chart.data.unshift(...newCandles)
        
        await nextTick()
        tvjs.value.setRange(currentRange[0], currentRange[1])
        
      } catch (error) {
        console.error('Ошибка загрузки:', error)
      } finally {
        isLoadingRight.value = false
      }
    }
    
    return {
      tvjs,
      chart,
      isLoadingLeft,
      isLoadingRight,
      onRangeChanged
    }
  }
}
</script>

<style scoped>
.loading-indicator {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #4CAF50;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  font-weight: bold;
  z-index: 1000;
}
</style>
```

---

## 🔍 Детальное объяснение

### 1. Структура данных OHLCV

```javascript
// Массив ВСЕГДА отсортирован от НОВОГО к СТАРОМУ:
chart.data.chart.data = [
  [1699999999000, ...],  // ← Индекс 0 = НОВЕЙШАЯ свеча (справа на графике)
  [1699996399000, ...],  // ← Индекс 1
  [1699992799000, ...],  // ← Индекс 2
  // ...
  [1600000000000, ...]   // ← Последний индекс = СТАРЕЙШАЯ свеча (слева на графике)
]
```

### 2. Методы добавления данных

```javascript
// Добавление СТАРЫХ данных (в прошлое, слева)
chart.data.chart.data.push(...oldCandles)
// Или через DataCube API:
chart.merge('chart.data', oldCandles)

// Добавление НОВЫХ данных (в будущее, справа)
chart.data.chart.data.unshift(...newCandles)
```

### 3. API методы для работы с позицией

```javascript
// Получить текущий видимый диапазон [startTime, endTime]
const range = this.$refs.tvjs.getRange()
// → [1699900000000, 1699999999000]

// Установить видимый диапазон
this.$refs.tvjs.setRange(startTime, endTime)

// Перейти к конкретному времени
this.$refs.tvjs.goto(timestamp)

// Получить позицию курсора
const cursor = this.$refs.tvjs.getCursor()
// → { t: 1699950000000, y: 35000, ... }
```

---

## ⚡ Оптимизация производительности

### 1. Throttling для события range-changed

```javascript
import { throttle } from 'lodash-es'

const onRangeChanged = throttle(async (range) => {
  // Ваш код загрузки
}, 500) // Не чаще раза в 500ms
```

### 2. Проверка на дублирование запросов

```javascript
const loadOlderData = async (beforeTimestamp) => {
  // Предотвращаем множественные одновременные запросы
  if (isLoadingLeft.value) return
  isLoadingLeft.value = true
  
  try {
    // Проверяем, не загружали ли мы уже эти данные
    const existingTimestamps = new Set(
      chart.value.data.chart.data.map(c => c[0])
    )
    
    const newCandles = await fetchCandles(beforeTimestamp)
    const uniqueCandles = newCandles.filter(
      c => !existingTimestamps.has(c[0])
    )
    
    if (uniqueCandles.length > 0) {
      chart.value.data.chart.data.push(...uniqueCandles)
    }
  } finally {
    isLoadingLeft.value = false
  }
}
```

### 3. Кэширование в IndexedDB

```javascript
class CandleCache {
  async saveCandles(symbol, timeframe, candles) {
    const db = await this.openDB()
    const tx = db.transaction('candles', 'readwrite')
    
    for (const candle of candles) {
      await tx.store.put({
        symbol,
        timeframe,
        timestamp: candle[0],
        data: candle
      })
    }
  }
  
  async loadCandles(symbol, timeframe, startTime, endTime) {
    const db = await this.openDB()
    const index = db.transaction('candles').store.index('symbol_tf_time')
    const range = IDBKeyRange.bound(
      [symbol, timeframe, startTime],
      [symbol, timeframe, endTime]
    )
    return await index.getAll(range)
  }
}
```

---

## 🎯 Лучшие практики

### ✅ DO:

1. **Всегда сохраняйте range** перед добавлением данных
2. **Используйте флаги загрузки** (isLoadingLeft/Right)
3. **Добавляйте throttling** на range-changed
4. **Проверяйте дубликаты** перед добавлением
5. **Используйте $nextTick** или await перед setRange
6. **Показывайте индикатор загрузки** пользователю

### ❌ DON'T:

1. **НЕ заменяйте весь массив** (`chart.data = newData`)
2. **НЕ загружайте данные синхронно** - блокирует UI
3. **НЕ забывайте восстанавливать позицию**
4. **НЕ загружайте слишком много** данных за раз (100-500 свечей max)
5. **НЕ вызывайте resetChart()** - это сбросит позицию

---

## 🐛 Отладка

```javascript
const onRangeChanged = async (range) => {
  const [start, end] = range
  const data = chart.value.data.chart.data
  
  console.log('📊 Range Changed:', {
    range: [new Date(start), new Date(end)],
    visibleCandles: data.filter(c => c[0] >= start && c[0] <= end).length,
    totalCandles: data.length,
    firstCandle: new Date(data[0][0]),
    lastCandle: new Date(data[data.length - 1][0]),
    currentRange: tvjs.value.getRange()
  })
}
```

---

## 📈 Результат

С правильной реализацией вы получаете:

✅ **Плавную загрузку** данных без ре-рендера  
✅ **Сохранение позиции** пользователя  
✅ **Оптимальную производительность**  
✅ **Бесшовный UX** при скроллинге  

---

## 🚀 Готовый пример в App.vue

Я уже обновил `src/App.vue` с полной реализацией ленивой загрузки! Просто запустите:

```bash
npm run dev
```

И скроллите график влево (в прошлое) - данные будут автоматически подгружаться! 🎉
