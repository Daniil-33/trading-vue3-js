# 📐 Руководство по инструментам рисования Trading Vue 3

## Доступные инструменты

В библиотеке **Trading Vue 3** встроены **2 основных типа** инструментов рисования:

---

## 🔧 1. LineTool - Инструменты для рисования линий

### Модификации LineTool:

| Инструмент | Описание | Тип |
|------------|----------|-----|
| **Segment** | Отрезок между двумя точками | `LineTool:Segment` |
| **Extended** | Линия, продлённая в обе стороны | `LineTool:Extended` |
| **Ray** | Луч (линия в одну сторону) | `LineTool:Ray` |

**Исходный код:** `src/components/overlays/LineTool.vue`

---

## 📏 2. RangeTool - Инструменты измерения

### Модификации RangeTool:

| Инструмент | Описание | Тип |
|------------|----------|-----|
| **Price** | Измерение изменения цены | `RangeTool:Price` |
| **Time** | Измерение временного интервала | `RangeTool:Time` |
| **PriceTime** | Измерение цены и времени | `RangeTool:PriceTime` |

**Исходный код:** `src/components/overlays/RangeTool.vue`

---

## 🚀 Быстрый старт

### Вариант 1: С встроенным Toolbar (самый простой)

```vue
<template>
  <trading-vue 
    :data="chart" 
    :width="width" 
    :height="height"
    :toolbar="true"
  />
</template>

<script>
import { ref, onMounted } from 'vue'
import TradingVue from '@daniildev/trading-vue3-js'
import DataCube from '@daniildev/trading-vue3-js/src/helpers/datacube.js'

export default {
  components: { TradingVue },
  setup() {
    const chart = ref(null)
    const width = ref(window.innerWidth)
    const height = ref(window.innerHeight)
    
    onMounted(() => {
      chart.value = new DataCube({
        chart: {
          type: 'Candles',
          data: [
            [1699200000000, 35000, 35500, 34800, 35200, 1234.56],
            // ... больше OHLCV данных
          ]
        }
      })
    })
    
    return { chart, width, height }
  }
}
</script>
```

✅ **Готово!** Toolbar появится автоматически с доступом ко всем инструментам.

---

### Вариант 2: Программное управление инструментами

```vue
<template>
  <div>
    <!-- Панель выбора инструментов -->
    <div class="tools-panel">
      <button @click="selectTool('Cursor')">
        🖱️ Курсор
      </button>
      <button @click="selectTool('LineTool:Segment')">
        📏 Отрезок
      </button>
      <button @click="selectTool('LineTool:Extended')">
        ↔️ Линия
      </button>
      <button @click="selectTool('LineTool:Ray')">
        ➡️ Луч
      </button>
      <button @click="selectTool('RangeTool:Price')">
        💰 Диапазон цены
      </button>
      <button @click="selectTool('RangeTool:Time')">
        ⏱️ Диапазон времени
      </button>
      <button @click="selectTool('RangeTool:PriceTime')">
        📊 Цена + Время
      </button>
      <button @click="clearAllDrawings" class="danger">
        🗑️ Очистить всё
      </button>
    </div>
    
    <trading-vue 
      ref="tvRef"
      :data="chart" 
      :width="width" 
      :height="height"
      @custom-event="onCustomEvent"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import TradingVue from '@daniildev/trading-vue3-js'
import DataCube from '@daniildev/trading-vue3-js/src/helpers/datacube.js'

export default {
  components: { TradingVue },
  setup() {
    const tvRef = ref(null)
    const chart = ref(null)
    const width = ref(window.innerWidth)
    const height = ref(window.innerHeight)
    
    onMounted(() => {
      chart.value = new DataCube({
        chart: {
          type: 'Candles',
          data: [ /* OHLCV данные */ ]
        },
        onchart: [], // Здесь будут храниться нарисованные объекты
        // Настройки инструментов
        tools: [
          {
            type: 'LineTool:Segment',
            group: 'Lines',
            settings: {
              color: '#42b883',
              lineWidth: 2
            }
          },
          {
            type: 'RangeTool:Price',
            group: 'Measurements',
            settings: {
              color: '#FF6B6B',
              lineWidth: 1
            }
          }
        ],
        tool: 'Cursor' // Текущий активный инструмент
      })
    })
    
    // Выбор инструмента
    const selectTool = (toolType) => {
      if (chart.value) {
        chart.value.data.tool = toolType
        
        // Эмитим событие для UI
        console.log(`Выбран инструмент: ${toolType}`)
      }
    }
    
    // Очистка всех рисунков
    const clearAllDrawings = () => {
      if (chart.value) {
        // Удаляем все инструменты из onchart
        chart.value.data.onchart = chart.value.data.onchart.filter(
          item => !item.type.includes('Tool')
        )
        console.log('Все рисунки очищены')
      }
    }
    
    // Обработка событий от инструментов
    const onCustomEvent = (event) => {
      if (event.event === 'drawing-mode-off') {
        console.log('Рисование завершено')
        // Автоматически возвращаемся к курсору
        selectTool('Cursor')
      }
    }
    
    return {
      tvRef,
      chart,
      width,
      height,
      selectTool,
      clearAllDrawings,
      onCustomEvent
    }
  }
}
</script>

<style scoped>
.tools-panel {
  display: flex;
  gap: 8px;
  padding: 10px;
  background: #2d2d2d;
  flex-wrap: wrap;
}

button {
  padding: 8px 16px;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

button:hover {
  background: #35a372;
  transform: translateY(-1px);
}

button.danger {
  background: #e54150;
}

button.danger:hover {
  background: #d32f3e;
}
</style>
```

---

## 🎨 Создание собственного инструмента

### Пример: Инструмент для рисования прямоугольника

```vue
<!-- src/components/overlays/RectangleTool.vue -->
<script>
import Overlay from '../../mixins/overlay.js'
import Tool from '../../mixins/tool.js'
import Pin from '../primitives/pin.js'

export default {
  name: 'RectangleTool',
  mixins: [Overlay, Tool],
  
  methods: {
    meta_info() {
      return { 
        author: 'YourName', 
        version: '1.0.0',
        desc: 'Инструмент для рисования прямоугольников'
      }
    },
    
    tool() {
      return {
        group: 'Shapes',
        type: 'Rectangle',
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAQMAAAD+JxcgAAAABlBMVEUAAABNTU0kJ+rOAAAAAnRSTlMAP9S7rgAAABxJREFUeJxjYMAOmBiYQAQTiFAAETwMDPr/AQQA2kEBnL7uXZAAAAAASUVORK5CYII=',
        hint: 'Нарисовать прямоугольник',
        data: [],
        settings: {
          color: '#42b883',
          lineWidth: 2,
          fillOpacity: 0.1
        }
      }
    },
    
    init() {
      // Первая точка (левый верхний угол)
      this.pins.push(new Pin(this, 'p1'))
      
      // Вторая точка (правый нижний угол, следует за курсором)
      this.pins.push(new Pin(this, 'p2', {
        state: 'tracking'
      }))
      
      // Завершение рисования
      this.pins[1].on('settled', () => {
        this.set_state('finished')
        this.$emit('drawing-mode-off')
      })
    },
    
    draw(ctx) {
      if (!this.p1 || !this.p2) return
      
      const layout = this.$props.layout
      
      // Преобразуем координаты данных в экранные
      const x1 = layout.t2screen(this.p1[0])
      const y1 = layout.$2screen(this.p1[1])
      const x2 = layout.t2screen(this.p2[0])
      const y2 = layout.$2screen(this.p2[1])
      
      // Рисуем заливку
      if (this.sett.fillOpacity > 0) {
        ctx.fillStyle = this.color + Math.round(this.sett.fillOpacity * 255).toString(16)
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1)
      }
      
      // Рисуем границу
      ctx.strokeStyle = this.color
      ctx.lineWidth = this.line_width
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
      
      // Рисуем точки управления
      this.render_pins(ctx)
    },
    
    use_for() { 
      return ['RectangleTool'] 
    },
    
    data_colors() { 
      return [this.color] 
    }
  },
  
  computed: {
    sett() {
      return this.$props.settings
    },
    color() {
      return this.sett.color || '#42b883'
    },
    line_width() {
      return this.sett.lineWidth || 2
    }
  }
}
</script>
```

### Использование кастомного инструмента:

```vue
<template>
  <trading-vue 
    :data="chart" 
    :overlays="[RectangleTool]"
  />
</template>

<script>
import RectangleTool from './components/overlays/RectangleTool.vue'

export default {
  setup() {
    const chart = ref(null)
    
    onMounted(() => {
      chart.value = new DataCube({
        chart: { /* ... */ },
        tools: [
          {
            type: 'RectangleTool',
            group: 'Shapes',
            settings: {
              color: '#FF6B6B',
              lineWidth: 2,
              fillOpacity: 0.2
            }
          }
        ]
      })
    })
    
    return { chart, RectangleTool }
  }
}
</script>
```

---

## 📋 Полный список встроенных инструментов

### Инструменты рисования линий:
```javascript
'LineTool:Segment'   // Отрезок
'LineTool:Extended'  // Продлённая линия
'LineTool:Ray'       // Луч
```

### Инструменты измерения:
```javascript
'RangeTool:Price'     // Измерение цены
'RangeTool:Time'      // Измерение времени
'RangeTool:PriceTime' // Измерение цены и времени
```

### Системные:
```javascript
'Cursor' // Режим курсора (по умолчанию)
```

---

## 🎯 API инструментов

### Основные методы Tool mixin:

```javascript
// Описание инструмента
tool() {
  return {
    group: 'Lines',           // Группа в toolbar
    type: 'MyTool',          // Тип инструмента
    icon: 'data:image/...',  // Base64 иконка
    hint: 'Подсказка',       // Текст подсказки
    data: [],                // Начальные данные
    settings: {              // Настройки по умолчанию
      color: '#42b883',
      lineWidth: 2
    },
    mods: {                  // Модификации инструмента
      'ModName': {
        settings: { /* ... */ },
        icon: 'data:image/...'
      }
    }
  }
}

// Инициализация инструмента
init() {
  this.pins.push(new Pin(this, 'p1'))
  this.pins.push(new Pin(this, 'p2', { state: 'tracking' }))
  
  this.pins[1].on('settled', () => {
    this.set_state('finished')
    this.$emit('drawing-mode-off')
  })
}

// Отрисовка
draw(ctx) {
  // Ваш код рисования на canvas
}

// Использование для типов
use_for() {
  return ['MyTool']
}
```

### Pin (точка управления):

```javascript
// Создание точки
new Pin(component, name, options)

// Options:
{
  state: 'settled' | 'tracking', // Состояние
  hidden: true | false,          // Видимость
  mouse_events: true | false     // Обработка событий мыши
}

// События
pin.on('settled', callback)  // Точка зафиксирована
pin.on('changed', callback)  // Точка перемещена
```

### Layout (система координат):

```javascript
layout.t2screen(timestamp)  // Время → X координата экрана
layout.$2screen(price)      // Цена → Y координата экрана
layout.screen2t(x)          // X координата → время
layout.screen2$(y)          // Y координата → цена
```

---

## 💡 Полезные советы

### 1. **Включите DataCube**
```javascript
// DataCube обязателен для работы инструментов
const chart = new DataCube(data)
```

### 2. **Сохранение рисунков**
```javascript
// Все рисунки автоматически сохраняются в data.onchart
console.log(chart.data.onchart)

// Экспорт рисунков
const drawings = chart.data.onchart.filter(item => 
  item.type.includes('Tool')
)
localStorage.setItem('drawings', JSON.stringify(drawings))

// Импорт рисунков
const saved = JSON.parse(localStorage.getItem('drawings'))
chart.data.onchart.push(...saved)
```

### 3. **Настройка цветов**
```javascript
// В settings инструмента
{
  color: '#42b883',      // Цвет линий
  backColor: '#42b88320', // Цвет фона с прозрачностью
  lineWidth: 2,          // Толщина линий
  fillOpacity: 0.1       // Прозрачность заливки
}
```

### 4. **Shift Mode**
```javascript
// Позволяет рисовать несколько объектов подряд
{
  mods: {
    'ShiftMode': {
      settings: { shiftMode: true },
      hidden: true
    }
  }
}
```

### 5. **События инструментов**
```vue
<trading-vue @custom-event="handleEvent" />

<script>
const handleEvent = (event) => {
  switch(event.event) {
    case 'tool-selected':
      console.log('Выбран инструмент:', event.args)
      break
    case 'drawing-mode-off':
      console.log('Рисование завершено')
      break
    case 'object-selected':
      console.log('Объект выбран:', event.args)
      break
  }
}
</script>
```

---

## 🔧 Troubleshooting

### Проблема: Инструменты не работают
```javascript
// ✅ Решение: Убедитесь, что используете DataCube
import DataCube from '@daniildev/trading-vue3-js/src/helpers/datacube.js'
const chart = new DataCube(data) // Не просто { chart: {...} }
```

### Проблема: Toolbar не отображается
```vue
<!-- ✅ Решение: Убедитесь, что prop установлен -->
<trading-vue :toolbar="true" :data="chart" />
```

### Проблема: Рисунки исчезают при обновлении
```javascript
// ✅ Решение: Не пересоздавайте DataCube, используйте merge
chart.merge('chart.data', newData) // Вместо chart = new DataCube(...)
```

### Проблема: Кастомный инструмент не появляется в toolbar
```javascript
// ✅ Решение: Передайте overlay в prop
<trading-vue :overlays="[CustomTool]" />

// И добавьте в tools
chart.data.tools = [{
  type: 'CustomTool',
  group: 'Custom'
}]
```

---

## 📚 Дополнительные ресурсы

- [API Documentation](./docs/api/README.md)
- [DataCube Guide](./docs/datacube/README.md)
- [Creating Overlays](./docs/guide/OVERLAYS.md)
- [GitHub Issues](https://github.com/tvjsx/trading-vue-js/issues)

---

## 🤝 Контрибуция

Хотите добавить свой инструмент в библиотеку?

1. Создайте overlay по шаблону выше
2. Добавьте документацию
3. Создайте Pull Request
4. Пример в `/test/tests/`

---

**Автор:** Trading Vue 3 Community  
**Версия:** 1.0.5+  
**Дата:** 16 ноября 2025
