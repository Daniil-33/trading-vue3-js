# Changelog - v1.0.5

## 🐛 Bug Fixes

### Canvas Rendering Issues (Vue 3 Compatibility)

Исправлены критические проблемы с отрисовкой графиков после миграции на Vue 3.

#### Исправленные проблемы:

1. **Vue 3 Render Function API**
   - Обновлён синтаксис render функций в `Grid.vue`
   - Убраны устаревшие `props:` и `on:` обёртки
   - Все props и события теперь передаются напрямую

2. **Event Handling**
   - Исправлена обработка событий от overlay компонентов
   - Добавлен правильный диспетчер для `custom-event`
   - События `new-grid-layer`, `delete-grid-layer`, `show-grid-layer` теперь правильно обрабатываются

3. **Vue 3 Emits Declaration**
   - Добавлено объявление `emits` в `overlay.js` миксин
   - Добавлено объявление `emits` в `Crosshair.vue`
   - Соответствие требованиям Vue 3 для явного объявления событий

#### Технические детали:

**src/components/Grid.vue:**
```javascript
// Было (Vue 2):
h(Crosshair, {
    props: this.common_props(),
    on: this.layer_events
})

// Стало (Vue 3):
h(Crosshair, {
    ...this.common_props(),
    'onNew-grid-layer': this.layer_events['onNew-grid-layer'],
    // ... остальные события
})
```

**src/mixins/overlay.js:**
```javascript
// Добавлено объявление emits
export default {
    emits: ['new-grid-layer', 'delete-grid-layer', ...],
    // ...
}
```

**Event Dispatcher:**
```javascript
'onCustom-event': e => {
    if (e && e.event) {
        const eventMap = {
            'new-grid-layer': () => this.new_layer(...e.args),
            'delete-grid-layer': () => this.del_layer(...e.args),
            // ...
        }
        if (eventMap[e.event]) {
            eventMap[e.event]()
        }
    }
    this.$emit('custom-event', e)
}
```

## 📦 Что изменилось

- ✅ График теперь корректно отрисовывается
- ✅ Все overlay компоненты работают правильно
- ✅ События между компонентами передаются корректно
- ✅ Полная совместимость с Vue 3.4.38

## 🚀 Установка

```bash
npm install @daniildev/trading-vue3-js@1.0.5
```

## 📝 Использование

```javascript
import { createApp } from 'vue'
import TradingVue from '@daniildev/trading-vue3-js'
import '@daniildev/trading-vue3-js/dist/style.css'

const app = createApp(App)
app.component('TradingVue', TradingVue)
```

---

**Дата релиза:** 13 ноября 2025  
**Версия:** 1.0.5  
**Предыдущая версия:** 1.0.4
