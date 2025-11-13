# Vue 3 Migration Guide

Этот документ описывает все изменения, внесенные для полной совместимости с Vue 3.

## Основные изменения

### 1. Удаление `$set` и `$delete`

В Vue 3 реактивность работает на основе Proxy, поэтому `$set` и `$delete` больше не нужны.

**Было (Vue 2):**
```javascript
this.$set(obj, 'key', value)
this.$delete(obj, 'key')
```

**Стало (Vue 3):**
```javascript
obj.key = value
delete obj.key
```

### 2. Замена `$watch` на `watch` из Composition API

**Было (Vue 2):**
```javascript
this.tv.$watch(() => this.get_by_query('.settings'),
    (n, p) => this.on_settings(n, p))
```

**Стало (Vue 3):**
```javascript
import { watch } from 'vue'

watch(() => this.get_by_query('.settings'),
    (n, p) => this.on_settings(n, p))
```

### 3. Изменение render функций

В Vue 3 функция `h` больше не передаётся как аргумент, её нужно импортировать.

**Было (Vue 2):**
```javascript
export default {
    render(h) {
        return h('div', { class: 'my-class' })
    }
}
```

**Стало (Vue 3):**
```javascript
import { h } from 'vue'

export default {
    render() {
        return h('div', { class: 'my-class' })
    }
}
```

Для компонентов без визуального вывода:
```javascript
export default {
    render() {
        return null
    }
}
```

### 4. Изменение синтаксиса h() функции

В Vue 3 изменился формат передачи событий и атрибутов.

**Было (Vue 2):**
```javascript
h('canvas', {
    on: {
        mousemove: handler,
        click: handler
    },
    attrs: {
        id: 'my-id',
        width: 100
    }
})
```

**Стало (Vue 3):**
```javascript
h('canvas', {
    onMousemove: handler,  // CamelCase с префиксом on
    onClick: handler,
    id: 'my-id',          // Атрибуты напрямую в объекте
    width: 100
})
```

## Измененные файлы

### Helpers
- ✅ `src/helpers/dc_core.js` - заменены все `$set` и `$watch`
- ✅ `src/helpers/datacube.js` - заменены `$set` и `$delete`
- ✅ `src/helpers/dc_events.js` - заменены `$set`

### Components
- ✅ `src/components/Section.vue` - заменены `$set`
- ✅ `src/components/Chart.vue` - заменены `$set` и `$delete`
- ✅ `src/components/js/updater.js` - заменены `$set`
- ✅ `src/components/Keyboard.vue` - исправлена render функция
- ✅ `src/components/KeyboardListener.vue` - исправлена render функция
- ✅ `src/components/Crosshair.vue` - исправлена render функция
- ✅ `src/components/Sidebar.vue` - добавлен импорт `h`, исправлена render
- ✅ `src/components/Botbar.vue` - добавлен импорт `h`, исправлена render
- ✅ `src/components/Grid.vue` - добавлен импорт `h`, исправлена render

### Mixins
- ✅ `src/mixins/xcontrol.js` - заменены `$set`
- ✅ `src/mixins/uxlist.js` - заменены `$set`
- ✅ `src/mixins/overlay.js` - исправлена render функция
- ✅ `src/mixins/canvas.js` - обновлён синтаксис h() для Vue 3

## Проверка реактивности

В Vue 3 реактивность работает автоматически для:
- Прямых присваиваний (`obj.prop = value`)
- Присваиваний по индексу массива (`arr[0] = value`)
- Методов массива (`push`, `pop`, `splice` и т.д.)

## Дополнительные ресурсы

- [Vue 3 Migration Guide](https://v3-migration.vuejs.org/)
- [Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [Breaking Changes](https://v3-migration.vuejs.org/breaking-changes/)

## Web Workers в Vite

Web Workers импортируются с суффиксом `?worker`:

```javascript
import Worker from './worker.js?worker'
const worker = new Worker()
```

## Переменные окружения

Используйте `import.meta.env` вместо глобальных переменных:

```javascript
// Было
if (MOB_DEBUG) { ... }

// Стало
if (import.meta.env.VITE_MOB_DEBUG) { ... }
```
