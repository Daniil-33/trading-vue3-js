# Проблема реактивности в инструментах рисования (LineTool, RangeTool)

## 🔍 Анализ проблемы

### Текущая реализация в LineTool.vue:

```javascript
computed: {
    sett() {
        return this.$props.settings
    },
    p1() {
        return this.$props.settings.p1  // ❌ НЕ РЕАКТИВНО!
    },
    p2() {
        return this.$props.settings.p2  // ❌ НЕ РЕАКТИВНО!
    },
}
```

## 📊 Откуда берется `this.$props.settings`?

### Поток данных:

```
1. DataCube (dc_events.js) → build_tool()
   ↓
2. Создает объект settings:
   let sett = Object.assign({}, proto.settings || {})
   sett.$selected = true
   sett.$state = 'wip'
   ↓
3. Добавляет overlay в data.onchart/offchart:
   this.add('onchart', {
       type: 'LineTool',
       settings: sett,  // ← Этот объект
       data: [],
       grid: { id: grid_id }
   })
   ↓
4. Chart.vue → overlay_subset() → Grid.vue → comp_list
   ↓
5. Grid.vue создает компонент LineTool:
   h(LineTool, {
       settings: x.settings,  // ← Передается как prop
       ...
   })
```

## ❌ Почему `p1` и `p2` не реактивны?

### Проблема 1: Свойства добавляются динамически

Когда Pin обновляет позицию, он emit'ит событие:

```javascript
// pin.js, строка 99
this.comp.$emit('change-settings', {
    [this.name]: [this.t, this.y$]
})
```

Это событие обрабатывается в `dc_events.js`:

```javascript
// dc_events.js, строка 424
change_settings(args) {
    let grid_id = args[args.length - 2]
    let id = args[args.length - 1]
    let obj = this.get_one(`${id}`)
    
    if (obj) {
        // ❌ ПРОБЛЕМА: Напрямую мутирует settings
        Object.assign(obj.settings, args[0])
        
        // Не вызывает Vue reactivity!
        obj.settings.p1 = [timestamp, price]
    }
}
```

**Проблема:** В Vue 3 простое присваивание свойств к уже существующему объекту не всегда триггерит реактивность, особенно если свойства добавляются динамически **после** создания объекта.

### Проблема 2: settings создается как plain object

```javascript
// dc_events.js, строка 352
let sett = Object.assign({}, proto.settings || {})
```

Этот объект создается как обычный JavaScript объект, а не как Vue reactive object. Когда он передается в компонент:

```javascript
// Grid.vue
h(LineTool, {
    settings: sett,  // Plain object, не Proxy!
})
```

Vue 3 оборачивает его в Proxy для реактивности, НО:
- Свойства `p1` и `p2` **отсутствуют** при создании компонента
- Они добавляются **позже** через `change-settings` event
- Vue может не отследить эти изменения

## ✅ Решение: Использовать реактивные источники

### Вариант 1: Computed с глубоким доступом (рекомендуется)

```javascript
computed: {
    sett() {
        return this.$props.settings
    },
    p1() {
        // ✅ Всегда проверяем существование
        return this.sett?.p1 || null
    },
    p2() {
        // ✅ Всегда проверяем существование
        return this.sett?.p2 || null
    },
    line_width() {
        return this.sett?.lineWidth || 0.9
    },
    color() {
        return this.sett?.color || '#42b28a'
    }
},
methods: {
    draw(ctx) {
        // ✅ Проверяем наличие точек перед рисованием
        if (!this.p1 || !this.p2) {
            console.log('LineTool: waiting for points...')
            return
        }
        
        console.log('LineTool: drawing with points:', this.p1, this.p2)

        ctx.lineWidth = this.line_width
        ctx.strokeStyle = this.color
        ctx.beginPath()

        if (this.sett.ray) {
            new Ray(this, ctx).draw(this.p1, this.p2)
        } else if (this.sett.extended) {
            new Line(this, ctx).draw(this.p1, this.p2)
        } else {
            new Seg(this, ctx).draw(this.p1, this.p2)
        }

        ctx.stroke()
        this.render_pins(ctx)
    }
}
```

### Вариант 2: Watch на settings (альтернатива)

```javascript
export default {
    name: 'LineTool',
    mixins: [Overlay, Tool],
    emits: ['drawing-mode-off', 'scroll-lock', 'object-selected', 'change-settings', 'remove-tool'],
    data() {
        return {
            localP1: null,
            localP2: null
        }
    },
    watch: {
        'settings.p1': {
            handler(newVal) {
                console.log('p1 changed:', newVal)
                this.localP1 = newVal
            },
            deep: true,
            immediate: true
        },
        'settings.p2': {
            handler(newVal) {
                console.log('p2 changed:', newVal)
                this.localP2 = newVal
            },
            deep: true,
            immediate: true
        }
    },
    computed: {
        p1() {
            return this.localP1 || this.$props.settings?.p1
        },
        p2() {
            return this.localP2 || this.$props.settings?.p2
        }
    }
}
```

### Вариант 3: Исправить в dc_events.js (глобальное решение)

```javascript
// dc_events.js
change_settings(args) {
    let grid_id = args[args.length - 2]
    let id = args[args.length - 1]
    let obj = this.get_one(`${id}`)
    
    if (obj) {
        // ✅ РЕШЕНИЕ: Создаем новый объект вместо мутации
        obj.settings = Object.assign({}, obj.settings, args[0])
        
        // Или используем Vue reactivity API:
        // import { reactive } from 'vue'
        // Object.keys(args[0]).forEach(key => {
        //     obj.settings[key] = args[0][key]
        // })
    }
}
```

## 🎯 Рекомендуемое решение

**Комбинированный подход:**

1. **В компоненте (LineTool.vue)** - добавить проверки существования:
```javascript
computed: {
    p1() {
        return this.$props.settings?.p1 || null
    },
    p2() {
        return this.$props.settings?.p2 || null
    }
}
```

2. **В dc_events.js** - обеспечить реактивность при создании:
```javascript
build_tool(grid_id, type) {
    let sett = Object.assign({}, proto.settings || {})
    
    // ✅ Инициализируем свойства сразу
    if (!sett.p1) sett.p1 = null
    if (!sett.p2) sett.p2 = null
    
    sett.legend = 'legend' in sett ? sett.legend : false
    sett['z-index'] = sett['z-index'] || 100
    sett.$selected = true
    sett.$state = 'wip'
    
    // ... rest of the code
}
```

3. **В change_settings** - использовать реактивное обновление:
```javascript
change_settings(args) {
    let obj = this.get_one(uuid)
    if (obj) {
        // ✅ Триггерим реактивность правильно
        const newSettings = Object.assign({}, obj.settings, args[0])
        obj.settings = newSettings
    }
}
```

## 🔧 Отладка реактивности

### Добавьте логирование в LineTool.vue:

```javascript
watch: {
    settings: {
        handler(newVal, oldVal) {
            console.log('Settings changed:', {
                p1: newVal?.p1,
                p2: newVal?.p2,
                old_p1: oldVal?.p1,
                old_p2: oldVal?.p2
            })
        },
        deep: true,
        immediate: true
    },
    p1(newVal) {
        console.log('p1 computed changed:', newVal)
    },
    p2(newVal) {
        console.log('p2 computed changed:', newVal)
    }
},
mounted() {
    console.log('LineTool mounted with settings:', this.$props.settings)
}
```

### Проверьте в консоли:

```javascript
// В DevTools Console:
const dc = window.dc  // DataCube из App.vue

// Проверить текущие overlays:
console.log('Onchart overlays:', dc.data.onchart)

// Проверить инструмент:
const tool = dc.data.onchart.find(x => x.type === 'LineTool')
console.log('LineTool settings:', tool?.settings)
console.log('Has p1?', 'p1' in tool?.settings)
console.log('Has p2?', 'p2' in tool?.settings)
```

## 📝 Вывод

Проблема реактивности возникает из-за того, что:

1. **settings создается как plain object** без предварительной инициализации свойств `p1` и `p2`
2. **Свойства добавляются динамически** после монтирования компонента через events
3. **Vue 3 может не отследить** динамическое добавление свойств к уже существующему объекту

**Решение:** Либо инициализировать все свойства заранее, либо использовать реактивные обновления (создание нового объекта вместо мутации), либо добавить watchers в компоненте.

---

**Дата:** 16 ноября 2025  
**Версия библиотеки:** Trading Vue 3 (v1.0.6+)
