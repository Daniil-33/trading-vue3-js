# 🔧 Решение проблемы: Toolbar не отображается

## Проблема

При установке `:toolbar="true"` появляется ошибка:

```
TypeError: Cannot read properties of undefined (reading 'icon')
    at Proxy._sfc_render (Toolbar.vue:6:24)
```

## Причина

Компонент `Toolbar` ожидает, что в `data.tools` будет массив инструментов с полями `icon`, `type` и т.д. Если вы загружаете данные из JSON файла, который не содержит поле `tools` или оно пустое, Toolbar пытается прочитать `undefined.icon` и падает с ошибкой.

## Решение 1: Добавить tools вручную в mounted()

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
import TradingVue from './TradingVue.vue'
import Data from '../data/data.json'
import DataCube from './helpers/datacube.js'

export default {
  data() {
    return {
      chart: new DataCube(Data),
      width: window.innerWidth,
      height: window.innerHeight
    }
  },
  mounted() {
    // Инициализация базовых инструментов
    if (!this.chart.data.tools || this.chart.data.tools.length === 0) {
      this.chart.data.tools = [
        {
          type: 'Cursor',
          icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAgMAAAC5h23wAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAxQTFRFAAAATU1NTU1NTU1NwlMHHwAAAAR0Uk5TAOvhxbpPrUkAAAAkSURBVHicY2BgYHBggAByabxg1WoGBq2pRCk9AKUbcND43AEAufYHlSuusE4AAAAASUVORK5CYII='
        }
      ]
      this.chart.data.tool = 'Cursor'
    }
  }
}
</script>
```

## Решение 2: Добавить tools в JSON файл

Убедитесь, что ваш `data.json` содержит поле `tools`:

```json
{
  "chart": {
    "type": "Candles",
    "data": [ /* OHLCV данные */ ]
  },
  "onchart": [],
  "offchart": [],
  "tools": [
    {
      "type": "Cursor",
      "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAgMAAAC5h23wAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAxQTFRFAAAATU1NTU1NTU1NwlMHHwAAAAR0Uk5TAOvhxbpPrUkAAAAkSURBVHicY2BgYHBggAByabxg1WoGBq2pRCk9AKUbcND43AEAufYHlSuusE4AAAAASUVORK5CYII="
    }
  ],
  "tool": "Cursor"
}
```

## Решение 3: Создать данные программно с инструментами

```javascript
import DataCube from './helpers/datacube.js'
import Icons from './stuff/icons.json'

export default {
  data() {
    return {
      chart: new DataCube({
        chart: {
          type: 'Candles',
          data: [ /* ваши OHLCV данные */ ]
        },
        onchart: [],
        offchart: [],
        tools: [
          {
            type: 'Cursor',
            icon: Icons['cursor.png']
          },
          {
            type: 'LineTool:Segment',
            group: 'Lines',
            icon: Icons['segment.png']
          },
          {
            type: 'LineTool:Extended',
            group: 'Lines',
            icon: Icons['extended.png']
          },
          {
            type: 'LineTool:Ray',
            group: 'Lines',
            icon: Icons['ray.png']
          },
          {
            type: 'RangeTool:Price',
            group: 'Measurements',
            icon: Icons['price_range.png']
          },
          {
            type: 'RangeTool:Time',
            group: 'Measurements',
            icon: Icons['time_range.png']
          },
          {
            type: 'RangeTool:PriceTime',
            group: 'Measurements',
            icon: Icons['price_time.png']
          }
        ],
        tool: 'Cursor'
      }),
      width: window.innerWidth,
      height: window.innerHeight
    }
  }
}
```

## Решение 4: Использовать готовый пример с tools

Используйте тестовый файл данных, который уже содержит tools:

```javascript
import Data from '../data/data_tools.json' // Вместо data.json

export default {
  data() {
    return {
      chart: new DataCube(Data)
    }
  }
}
```

Файл `data_tools.json` находится в `/test/data/data_tools.json` и уже содержит все необходимые инструменты.

## Проверка правильности инициализации

Добавьте в `mounted()` проверку:

```javascript
mounted() {
  console.log('Tools:', this.chart.data.tools)
  console.log('Current tool:', this.chart.data.tool)
  
  if (!this.chart.data.tools) {
    console.error('⚠️ Toolbar не будет работать: tools не инициализированы!')
  } else {
    console.log('✅ Toolbar готов к работе, доступно инструментов:', 
                this.chart.data.tools.length)
  }
}
```

## Минимальный рабочий пример

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
            [1699203600000, 35200, 35800, 35100, 35600, 2345.67],
            // ... больше данных
          ]
        },
        onchart: [],
        offchart: [],
        tools: [
          {
            type: 'Cursor',
            icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAgMAAAC5h23wAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAxQTFRFAAAATU1NTU1NTU1NwlMHHwAAAAR0Uk5TAOvhxbpPrUkAAAAkSURBVHicY2BgYHBggAByabxg1WoGBq2pRCk9AKUbcND43AEAufYHlSuusE4AAAAASUVORK5CYII='
          }
        ],
        tool: 'Cursor'
      })
    })
    
    return { chart, width, height }
  }
}
</script>
```

## Дополнительные советы

### 1. **Всегда используйте DataCube**

```javascript
// ❌ Неправильно
const chart = ref(Data)

// ✅ Правильно
const chart = ref(new DataCube(Data))
```

### 2. **Проверяйте структуру данных**

Убедитесь, что ваши данные содержат все необходимые поля:

```javascript
{
  chart: { ... },
  onchart: [],
  offchart: [],
  tools: [ ... ],  // ← Обязательно для toolbar
  tool: 'Cursor'   // ← Текущий инструмент
}
```

### 3. **Используйте встроенные иконки**

```javascript
import Icons from '@daniildev/trading-vue3-js/src/stuff/icons.json'

// Все доступные иконки:
// Icons['cursor.png']
// Icons['segment.png']
// Icons['extended.png']
// Icons['ray.png']
// Icons['price_range.png']
// Icons['time_range.png']
// Icons['price_time.png']
```

## Заключение

Ошибка `Cannot read properties of undefined (reading 'icon')` возникает из-за отсутствия или неправильной инициализации поля `tools` в данных. Используйте одно из предложенных решений, и Toolbar будет работать корректно.

---

**Дата:** 16 ноября 2025  
**Версия библиотеки:** 1.0.5+
