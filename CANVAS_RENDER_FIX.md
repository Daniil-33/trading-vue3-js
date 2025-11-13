# Исправление Vue 3 Render Function API

## Проблема

В Vue 3 изменился синтаксис для создания элементов в render функциях. Обработчики событий и атрибуты теперь передаются по-другому.

## Ошибка

```
Uncaught TypeError: Cannot read properties of null (reading 'style')
```

## Изменения в синтаксисе render функций Vue 3

### 1. Обработчики событий

**Vue 2:**
```javascript
h('canvas', {
    on: {
        mousemove: handler,
        mouseout: handler,
    }
})
```

**Vue 3:**
```javascript
h('canvas', {
    onMousemove: handler,  // Camel case с префиксом on
    onMouseout: handler,
})
```

### 2. Атрибуты

**Vue 2:**
```javascript
h('canvas', {
    attrs: {
        id: 'my-id',
        width: 100
    }
})
```

**Vue 3:**
```javascript
h('canvas', {
    id: 'my-id',  // Атрибуты передаются напрямую
    width: 100
})
```

## Исправленные файлы

### `src/mixins/canvas.js`

**Изменения:**
1. ✅ Обработчики событий изменены с `on: {}` на `onEventName`
2. ✅ Атрибуты перенесены из `attrs: {}` в корень объекта
3. ✅ Добавлена проверка на существование canvas элемента

**Было:**
```javascript
h('canvas', {
    on: {
        mousemove: e => this.renderer.mousemove(e),
        mouseout: e => this.renderer.mouseout(e),
    },
    attrs: Object.assign({
        id: `${this.$props.tv_id}-${id}-canvas`
    }, props.attrs),
    ref: 'canvas',
    style: props.style,
})
```

**Стало:**
```javascript
h('canvas', {
    onMousemove: e => this.renderer.mousemove(e),
    onMouseout: e => this.renderer.mouseout(e),
    onMouseup: e => this.renderer.mouseup(e),
    onMousedown: e => this.renderer.mousedown(e),
    ...Object.assign({
        id: `${this.$props.tv_id}-${id}-canvas`
    }, props.attrs),
    ref: 'canvas',
    style: props.style,
})
```

## Дополнительная защита

Добавлена проверка на существование canvas элемента:

```javascript
setup() {
    const canvas = document.getElementById(id)
    if (!canvas) {
        console.warn(`Canvas element not found: ${id}`)
        return
    }
    // ... rest of the code
}
```

## Результат

✅ Canvas элементы создаются корректно
✅ Обработчики событий работают
✅ Нет ошибок при монтировании компонентов

## Ссылки

- [Vue 3 Render Function API](https://vuejs.org/guide/extras/render-function.html)
- [Vue 3 Migration Guide - Render Functions](https://v3-migration.vuejs.org/breaking-changes/render-function-api.html)
