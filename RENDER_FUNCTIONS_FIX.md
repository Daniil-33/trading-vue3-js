# Исправление render функций для Vue 3

## Проблема

В Vue 3 изменился синтаксис render функций. Функция `h` больше не передаётся как аргумент, её нужно импортировать из Vue.

## Ошибка

```
Uncaught TypeError: h is not a function
```

## Исправленные компоненты

### 1. Компоненты без визуального вывода

Эти компоненты не рендерят никаких элементов, поэтому render возвращает `null`:

- ✅ `src/components/Keyboard.vue`
- ✅ `src/components/KeyboardListener.vue`
- ✅ `src/components/Crosshair.vue`
- ✅ `src/mixins/overlay.js` (миксин для оверлеев)

**Изменение:**
```javascript
// Было (Vue 2)
render(h) { return h() }

// Стало (Vue 3)
render() { return null }
```

### 2. Компоненты с canvas элементами

Эти компоненты рендерят canvas, используя метод `create_canvas` из миксина. Требуют импорта `h`:

- ✅ `src/components/Sidebar.vue`
- ✅ `src/components/Botbar.vue`
- ✅ `src/components/Grid.vue`

**Изменение:**
```javascript
// Было (Vue 2)
export default {
    render(h) {
        return this.create_canvas(h, 'element-id', {...})
    }
}

// Стало (Vue 3)
import { h } from 'vue'

export default {
    render() {
        return this.create_canvas(h, 'element-id', {...})
    }
}
```

## Итого

- **Исправлено**: 7 компонентов/миксинов
- **Импорт h добавлен**: 3 компонента (Sidebar, Botbar, Grid)
- **Возврат null**: 4 компонента/миксина (Keyboard, KeyboardListener, Crosshair, overlay.js)

## Результат

✅ Все render функции совместимы с Vue 3
✅ Ошибка "h is not a function" исправлена
✅ Проект компилируется без ошибок
