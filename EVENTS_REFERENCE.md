# Trading Vue 3 - Полный справочник событий (Events Reference)

Этот документ содержит полный перечень всех событий, которые могут быть emit'нуты компонентами библиотеки Trading Vue 3.

---

## 📋 Оглавление

1. [Основные события TradingVue](#основные-события-tradingvue)
2. [События курсора](#события-курсора)
3. [События диапазона и масштабирования](#события-диапазона-и-масштабирования)
4. [События инструментов рисования](#события-инструментов-рисования)
5. [События слоёв и оверлеев](#события-слоёв-и-оверлеев)
6. [События сайдбара](#события-сайдбара)
7. [События легенды](#события-легенды)
8. [События тулбара](#события-тулбара)
9. [События клавиатуры](#события-клавиатуры)
10. [События шейдеров](#события-шейдеров)
11. [Служебные события](#служебные-события)

---

## Основные события TradingVue

### `custom-event`
**Источники:** Grid.vue, Chart.vue, Section.vue, TradingVue.vue, Toolbar.vue, UxLayer.vue, UxWrapper.vue, Interface mixin, Overlay mixin, DataTrack mixin

**Описание:** Универсальное событие для передачи пользовательских данных между компонентами. Используется как транспорт для множества специфичных событий.

**Параметры:**
```javascript
{
  event: string,  // Название вложенного события
  args: any[]     // Аргументы события
}
```

**Примеры вложенных событий:**
- `register-tools` - регистрация инструментов рисования
- `data-len-changed` - изменение длины данных
- `tool-selected` - выбор инструмента из тулбара
- `grid-mousedown` - клик мыши на сетке
- `rezoom-range` - изменение масштаба
- `exec-script` - выполнение скрипта
- `show-grid-layer` - показ слоя на сетке
- `new-grid-layer` - создание нового слоя сетки
- `delete-grid-layer` - удаление слоя сетки
- `layer-meta-props` - обновление meta-свойств слоя

**Пример использования:**
```vue
<trading-vue 
  :data="chart" 
  @custom-event="handleCustomEvent"
/>

<script>
methods: {
  handleCustomEvent(event) {
    console.log('Event:', event.event)
    console.log('Args:', event.args)
    
    switch(event.event) {
      case 'tool-selected':
        console.log('Selected tool:', event.args[0])
        break
      case 'data-len-changed':
        console.log('New data length:', event.args[0])
        break
    }
  }
}
</script>
```

---

## События курсора

### `cursor-changed`
**Источник:** grid.js (через Grid.vue)

**Описание:** Срабатывает при изменении позиции или состояния курсора на графике.

**Параметры:**
```javascript
{
  x: number,      // X координата (пиксели)
  y: number,      // Y координата (пиксели)
  t: number,      // Временная метка (timestamp)
  y$: number,     // Y координата в логарифмической шкале
  grid_id: number,// ID сетки
  price?: number, // Цена в точке курсора
  index?: number  // Индекс данных
}
```

**Пример:**
```vue
<trading-vue 
  :data="chart" 
  @cursor-changed="onCursorChanged"
/>

<script>
methods: {
  onCursorChanged(cursor) {
    console.log('Time:', new Date(cursor.t))
    console.log('Price:', cursor.price)
    console.log('Grid ID:', cursor.grid_id)
  }
}
</script>
```

### `cursor-locked`
**Источник:** grid.js (через Grid.vue → Section.vue)

**Описание:** Указывает, заблокирован ли курсор (например, при перетаскивании).

**Параметры:**
```javascript
boolean // true = заблокирован, false = разблокирован
```

**Пример:**
```vue
<trading-vue 
  :data="chart" 
  @cursor-locked="onCursorLocked"
/>

<script>
methods: {
  onCursorLocked(isLocked) {
    if (isLocked) {
      console.log('Cursor is locked (dragging)')
    } else {
      console.log('Cursor is free')
    }
  }
}
</script>
```

---

## События диапазона и масштабирования

### `range-changed`
**Источники:** grid.js (через Grid.vue → Section.vue → Chart.vue → TradingVue.vue)

**Описание:** Срабатывает при изменении видимого диапазона графика (прокрутка или масштабирование).

**Параметры:**
```javascript
[startTime, endTime] // Массив из двух timestamp'ов
```

**Пример использования (ленивая загрузка данных):**
```vue
<trading-vue 
  :data="chart" 
  @range-changed="onRangeChanged"
/>

<script>
methods: {
  onRangeChanged([start, end]) {
    console.log('Visible range:')
    console.log('Start:', new Date(start))
    console.log('End:', new Date(end))
    
    // Загрузка дополнительных данных
    if (start < this.firstLoadedTimestamp) {
      this.loadHistoricalData(start, this.firstLoadedTimestamp)
    }
    
    if (end > this.lastLoadedTimestamp) {
      this.loadRecentData(this.lastLoadedTimestamp, end)
    }
  },
  
  async loadHistoricalData(from, to) {
    const newData = await fetchOHLCV(this.symbol, from, to)
    this.chart.data.ohlcv.unshift(...newData)
  }
}
</script>
```

### `rezoom-range`
**Источник:** grid.js (через custom-event)

**Описание:** Запрос на изменение масштаба диапазона.

**Параметры:**
```javascript
{
  grid_id: number,
  z: number,      // Коэффициент масштабирования
  pivot: number   // Точка привязки масштабирования
}
```

---

## События инструментов рисования

### `scroll-lock`
**Источники:** pin.js, tool.js (Tool mixin)

**Описание:** Блокирует/разблокирует прокрутку графика во время использования инструмента рисования.

**Параметры:**
```javascript
boolean // true = заблокировать, false = разблокировать
```

**Примеры использования:**
- При начале рисования линии - блокируется прокрутка
- При завершении рисования - прокрутка возвращается
- При перетаскивании инструмента - блокируется прокрутка

### `drawing-mode-off`
**Источники:** LineTool.vue, RangeTool.vue

**Описание:** Срабатывает при завершении рисования инструмента (когда установлена вторая точка).

**Параметры:** нет

**Пример:**
```vue
<trading-vue 
  :data="chart" 
  @drawing-mode-off="onDrawingComplete"
/>

<script>
methods: {
  onDrawingComplete() {
    console.log('Drawing completed, switching back to Cursor')
    // Автоматически возвращается к инструменту "Cursor"
  }
}
</script>
```

### `object-selected`
**Источник:** pin.js, tool.js (Tool mixin)

**Описание:** Срабатывает при выборе инструмента на графике (клик по нему).

**Параметры:** нет

**Пример:**
```vue
<trading-vue 
  :data="chart" 
  @object-selected="onObjectSelected"
/>

<script>
methods: {
  onObjectSelected() {
    console.log('Drawing tool selected')
    // Можно показать контекстное меню или параметры
  }
}
</script>
```

### `change-settings`
**Источники:** pin.js, tool.js (Tool mixin)

**Описание:** Срабатывает при изменении настроек инструмента (например, перемещение точки).

**Параметры:**
```javascript
{
  [settingName]: newValue  // Объект с изменёнными настройками
}
```

**Пример:**
```javascript
// При перемещении точки p1 линии
{
  p1: [timestamp, price]
}
```

### `remove-tool`
**Источник:** tool.js (Tool mixin)

**Описание:** Запрос на удаление выбранного инструмента (Delete/Backspace).

**Параметры:** нет

**Пример:**
```vue
<trading-vue 
  :data="chart" 
  @remove-tool="onRemoveTool"
/>

<script>
methods: {
  onRemoveTool() {
    console.log('Tool removed by user (Delete/Backspace key)')
  }
}
</script>
```

### `tool-selected`
**Источник:** Toolbar.vue (через custom-event)

**Описание:** Срабатывает при выборе инструмента из тулбара.

**Параметры:**
```javascript
string // Название инструмента: 'Cursor', 'LineToolSegment', 'RangeTool', etc.
```

**Пример:**
```vue
<trading-vue 
  :data="chart"
  :toolbar="true"
  @tool-selected="onToolSelected"
/>

<script>
methods: {
  onToolSelected(toolName) {
    console.log('Tool selected:', toolName)
    
    switch(toolName) {
      case 'Cursor':
        console.log('Navigation mode')
        break
      case 'LineToolSegment':
        console.log('Draw line mode')
        break
      case 'RangeTool':
        console.log('Measure range mode')
        break
    }
  }
}
</script>
```

---

## События слоёв и оверлеев

### `layer-meta-props`
**Источники:** Grid.vue, Section.vue, Overlay mixin

**Описание:** Обновление мета-свойств слоя (например, для отображения в легенде).

**Параметры:**
```javascript
{
  layer_id: string,
  legend?: Function,  // Функция для генерации легенды
  data_colors?: string[], // Цвета данных
  y_range?: Function  // Функция для расчёта Y-диапазона
}
```

### `new-grid-layer`
**Источники:** Crosshair.vue, Overlay mixin

**Описание:** Создание нового слоя на сетке.

**Параметры:**
```javascript
{
  name: string,      // Название компонента слоя
  id: string,        // Уникальный ID слоя
  params: object     // Параметры слоя
}
```

### `delete-grid-layer`
**Источник:** Overlay mixin

**Описание:** Удаление слоя с сетки.

**Параметры:**
```javascript
string // ID слоя для удаления
```

### `show-grid-layer`
**Источник:** Overlay mixin (через custom-event)

**Описание:** Показать/скрыть слой на сетке.

**Параметры:**
```javascript
{
  id: string,
  display: boolean  // true = показать, false = скрыть
}
```

### `redraw-grid`
**Источник:** Crosshair.vue

**Описание:** Запрос на перерисовку сетки.

**Параметры:** нет

### `exec-script`
**Источник:** Overlay mixin (через custom-event)

**Описание:** Выполнение скрипта в оверлее.

**Параметры:**
```javascript
{
  uuid: string,    // ID оверлея
  src: string,     // Исходный код скрипта
  env: object      // Окружение выполнения
}
```

---

## События сайдбара

### `sidebar-transform`
**Источники:** grid.js, sidebar.js, Section.vue

**Описание:** Изменение трансформации сайдбара (Y-масштаб).

**Параметры:**
```javascript
{
  grid_id: number,
  zoom: number,     // Коэффициент масштабирования
  auto: boolean,    // Автоматическое масштабирование
  range: [min, max] // Видимый диапазон Y
}
```

**Пример:**
```vue
<trading-vue 
  :data="chart" 
  @sidebar-transform="onSidebarTransform"
/>

<script>
methods: {
  onSidebarTransform(transform) {
    console.log('Grid:', transform.grid_id)
    console.log('Y range:', transform.range)
    console.log('Zoom:', transform.zoom)
    console.log('Auto scale:', transform.auto)
  }
}
</script>
```

---

## События легенды

### `legend-button-click`
**Источники:** LegendButton.vue, ButtonGroup.vue, Legend.vue, Section.vue, Chart.vue

**Описание:** Клик по кнопке в легенде графика.

**Параметры:**
```javascript
{
  button: string,  // ID кнопки ('display', 'settings', 'remove', etc.)
  grid: number,    // ID сетки
  index: number,   // Индекс оверлея
  layer: object    // Данные слоя
}
```

**Пример:**
```vue
<trading-vue 
  :data="chart"
  :legend-buttons="['display', 'settings', 'remove']"
  @legend-button-click="onLegendButton"
/>

<script>
methods: {
  onLegendButton(event) {
    console.log('Button:', event.button)
    console.log('Layer:', event.layer)
    
    switch(event.button) {
      case 'display':
        // Переключить видимость
        event.layer.display = !event.layer.display
        break
      case 'settings':
        // Открыть настройки
        this.showSettings(event.layer)
        break
      case 'remove':
        // Удалить индикатор
        this.removeOverlay(event.grid, event.index)
        break
    }
  }
}
</script>
```

---

## События тулбара

### `register-tools`
**Источник:** Grid.vue (через custom-event)

**Описание:** Регистрация доступных инструментов рисования при инициализации.

**Параметры:**
```javascript
[
  {
    use_for: string[],  // Массив названий инструментов
    info: object        // Информация об инструменте (из метода tool())
  }
]
```

**Пример структуры info:**
```javascript
{
  group: 'Lines',
  icon: 'data:image/png;base64,...',
  type: 'Segment',
  hint: 'Draw line segment',
  data: [],
  settings: {},
  mods: {
    'Extended': { ... },
    'Ray': { ... }
  }
}
```

### `item-selected`
**Источники:** ToolbarItem.vue, ItemList.vue

**Описание:** Выбор элемента в тулбаре или выпадающем списке.

**Параметры:**
```javascript
object // Данные выбранного элемента (tool или mod)
```

### `close-list`
**Источник:** ItemList.vue

**Описание:** Закрытие выпадающего списка инструментов.

**Параметры:** нет

---

## События клавиатуры

### `register-kb-listener`
**Источники:** KeyboardListener.vue, Grid.vue, Section.vue

**Описание:** Регистрация слушателя клавиатуры для компонента.

**Параметры:**
```javascript
{
  id: string,           // ID слушателя
  keydown: Function,    // Обработчик keydown
  keyup: Function,      // Обработчик keyup
  keypress: Function    // Обработчик keypress
}
```

### `remove-kb-listener`
**Источники:** KeyboardListener.vue, Grid.vue, Section.vue

**Описание:** Удаление слушателя клавиатуры.

**Параметры:**
```javascript
{
  id: string  // ID слушателя для удаления
}
```

### `keydown` / `keyup` / `keypress`
**Источник:** KeyboardListener.vue

**Описание:** Стандартные события клавиатуры, перенаправленные компонентом.

**Параметры:**
```javascript
KeyboardEvent // Нативное событие клавиатуры
```

---

## События шейдеров

### `new-shader`
**Источники:** price.js, документация

**Описание:** Создание нового шейдера для отрисовки на canvas.

**Параметры:**
```javascript
{
  target: string,      // 'sidebar' | 'botbar' | 'grid'
  draw: Function,      // Функция отрисовки (ctx) => {}
  id?: string,         // Уникальный ID шейдера
  z_index?: number     // Z-индекс для порядка отрисовки
}
```

**Пример:**
```javascript
// В overlay компоненте
this.$emit('new-shader', {
  target: 'sidebar',
  draw: ctx => {
    ctx.strokeStyle = '#42b883'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, 100)
    ctx.lineTo(60, 100)
    ctx.stroke()
  },
  id: 'my-custom-line'
})
```

---

## Служебные события

### `data-len-changed`
**Источник:** DataTrack mixin (через custom-event)

**Описание:** Изменение количества свечей в данных.

**Параметры:**
```javascript
number // Новая длина массива данных
```

**Пример:**
```vue
<trading-vue 
  :data="chart" 
  @data-len-changed="onDataLengthChanged"
/>

<script>
methods: {
  onDataLengthChanged(newLength) {
    console.log('Data length changed:', newLength)
    // Можно пересчитать индикаторы или обновить UI
  }
}
</script>
```

### `grid-mousedown`
**Источник:** grid.js (через custom-event)

**Описание:** Клик мыши на сетке графика.

**Параметры:**
```javascript
MouseEvent // Нативное событие мыши
```

### `signal`
**Источник:** dc_events.js

**Описание:** Сигнал от WebWorker (для скриптов и индикаторов).

**Параметры:**
```javascript
any // Данные, переданные из WebWorker
```

### `remove-me`
**Источник:** TheTip.vue

**Описание:** Запрос на удаление всплывающей подсказки.

**Параметры:** нет

---

## 📊 Сводная таблица событий

| Событие | Тип | Основное использование |
|---------|-----|------------------------|
| `custom-event` | Universal | Транспорт для множества событий |
| `cursor-changed` | Cursor | Отслеживание позиции курсора |
| `cursor-locked` | Cursor | Блокировка курсора при drag |
| `range-changed` | Range | Ленивая загрузка данных |
| `rezoom-range` | Range | Изменение масштаба |
| `scroll-lock` | Tools | Блокировка скролла при рисовании |
| `drawing-mode-off` | Tools | Завершение рисования |
| `object-selected` | Tools | Выбор инструмента |
| `change-settings` | Tools | Изменение параметров инструмента |
| `remove-tool` | Tools | Удаление инструмента |
| `tool-selected` | Toolbar | Выбор инструмента из тулбара |
| `layer-meta-props` | Layers | Обновление свойств слоя |
| `new-grid-layer` | Layers | Создание слоя |
| `delete-grid-layer` | Layers | Удаление слоя |
| `show-grid-layer` | Layers | Показ/скрытие слоя |
| `redraw-grid` | Layers | Перерисовка сетки |
| `exec-script` | Layers | Выполнение скрипта |
| `sidebar-transform` | Sidebar | Изменение Y-масштаба |
| `legend-button-click` | Legend | Клик по кнопке легенды |
| `register-tools` | Toolbar | Регистрация инструментов |
| `item-selected` | Toolbar | Выбор элемента |
| `close-list` | Toolbar | Закрытие списка |
| `register-kb-listener` | Keyboard | Регистрация слушателя |
| `remove-kb-listener` | Keyboard | Удаление слушателя |
| `keydown/keyup/keypress` | Keyboard | События клавиатуры |
| `new-shader` | Shaders | Создание шейдера |
| `data-len-changed` | Data | Изменение данных |
| `grid-mousedown` | Mouse | Клик на сетке |
| `signal` | WebWorker | Сигнал от воркера |

---

## 🎯 Практические примеры

### Пример 1: Полный мониторинг событий

```vue
<template>
  <trading-vue 
    :data="chart"
    :toolbar="true"
    @cursor-changed="log('cursor-changed', $event)"
    @cursor-locked="log('cursor-locked', $event)"
    @range-changed="log('range-changed', $event)"
    @custom-event="log('custom-event', $event)"
    @tool-selected="log('tool-selected', $event)"
    @drawing-mode-off="log('drawing-mode-off')"
    @legend-button-click="log('legend-button-click', $event)"
  />
</template>

<script>
export default {
  methods: {
    log(eventName, data) {
      console.log(`[${new Date().toISOString()}] ${eventName}:`, data)
    }
  }
}
</script>
```

### Пример 2: Синхронизация двух графиков

```vue
<template>
  <div class="charts-container">
    <trading-vue 
      ref="chart1"
      :data="chart1Data"
      @cursor-changed="syncCursor($event, 'chart2')"
      @range-changed="syncRange($event, 'chart2')"
    />
    
    <trading-vue 
      ref="chart2"
      :data="chart2Data"
      @cursor-changed="syncCursor($event, 'chart1')"
      @range-changed="syncRange($event, 'chart1')"
    />
  </div>
</template>

<script>
export default {
  data() {
    return {
      syncing: false
    }
  },
  methods: {
    syncCursor(cursor, targetChart) {
      if (this.syncing) return
      this.syncing = true
      
      // Синхронизировать курсор на другом графике
      this.$refs[targetChart].setCursor(cursor.t)
      
      this.$nextTick(() => {
        this.syncing = false
      })
    },
    
    syncRange(range, targetChart) {
      if (this.syncing) return
      this.syncing = true
      
      // Синхронизировать диапазон на другом графике
      this.$refs[targetChart].setRange(...range)
      
      this.$nextTick(() => {
        this.syncing = false
      })
    }
  }
}
</script>
```

### Пример 3: Сохранение состояния инструментов

```vue
<script>
export default {
  data() {
    return {
      drawingHistory: []
    }
  },
  methods: {
    handleCustomEvent(event) {
      // Сохранение истории рисования
      if (event.event === 'tool-selected') {
        this.drawingHistory.push({
          type: 'tool-selected',
          tool: event.args[0],
          timestamp: Date.now()
        })
      }
    },
    
    handleSettingsChange(settings) {
      this.drawingHistory.push({
        type: 'settings-changed',
        settings: JSON.parse(JSON.stringify(settings)),
        timestamp: Date.now()
      })
    },
    
    saveDrawings() {
      localStorage.setItem('drawings', JSON.stringify({
        tools: this.chart.data.tools,
        history: this.drawingHistory
      }))
    },
    
    loadDrawings() {
      const saved = localStorage.getItem('drawings')
      if (saved) {
        const { tools, history } = JSON.parse(saved)
        this.chart.data.tools = tools
        this.drawingHistory = history
      }
    }
  }
}
</script>
```

---

## 🔧 Отладка событий

### Включение логирования всех событий

```javascript
// В main.js или App.vue
import { getCurrentInstance } from 'vue'

const logAllEvents = (component) => {
  const instance = getCurrentInstance()
  const originalEmit = instance?.emit
  
  if (originalEmit) {
    instance.emit = function(event, ...args) {
      console.log(`[EMIT] ${event}`, args)
      return originalEmit.call(this, event, ...args)
    }
  }
}

// Использование в компоненте
export default {
  mounted() {
    if (process.env.NODE_ENV === 'development') {
      logAllEvents(this)
    }
  }
}
```

---

## 📚 Дополнительные ресурсы

- [Руководство по оверлеям](./docs/guide/OVERLAYS.md)
- [Руководство по рисованию](./DRAWING_TOOLS_GUIDE.md)
- [API документация](./docs/api/README.md)
- [Примеры использования](./docs/guide/README.md)

---

**Версия документа:** 1.0.0  
**Дата обновления:** 16 ноября 2025  
**Библиотека:** Trading Vue 3 (v1.0.6+)


'custom-event',
'range-changed',
'rezoom-range',
'scroll-lock',
'drawing-mode-off',
'object-selected',
'change-settings',
'remove-tool',
'tool-selected',
'layer-meta-props',
'new-grid-layer',
'delete-grid-layer',
'show-grid-layer',
'redraw-grid',
'exec-script',
'register-tools',
'sidebar-transform',
'legend-button-click',
'legend-button-click',
'item-selected',
'register-kb-listener',
'remove-kb-listener',
'keydown',
'keyup',
'keypress',
'new-shader',
'data-len-changed',
'grid-mousedown',
'signal'