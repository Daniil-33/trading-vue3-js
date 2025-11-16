# Тестирование инструментов рисования - Инструкция

## 🔧 Что было исправлено:

1. **Добавлен prop `dc` (DataCube)** во всю цепочку компонентов:
   - `TradingVue.vue` → `Chart.vue` → `Section.vue` → `Grid.vue` → `LineTool.vue`

2. **Инициализация свойств `p1` и `p2`** в `dc_events.js`:
   ```javascript
   // Теперь p1 и p2 инициализируются при создании инструмента
   if (!('p1' in sett)) sett.p1 = null
   if (!('p2' in sett)) sett.p2 = null
   ```

3. **Добавлено логирование** в `LineTool.vue` для отладки

4. **Улучшены computed свойства** с проверкой на существование

## 🧪 Как тестировать:

### Шаг 1: Запустить dev server
```bash
cd /Users/daniilkostuk/Desktop/trading-vue/trading-vue3-js
npm run dev
```

### Шаг 2: Открыть консоль браузера
Нажмите `F12` или `Cmd+Option+I` (Mac)

### Шаг 3: Выбрать инструмент линии
1. Кликните на иконку линии в тулбаре (слева)
2. В консоли должны появиться логи:
   ```
   Tool selected: LineToolSegment
   Initializing LineTool pins
   LineTool mounted with settings: {$selected: true, $state: 'wip', p1: null, p2: null, ...}
   ```

### Шаг 4: Нарисовать линию
1. **Зажмите и тяните мышь** на графике (не просто клик!)
2. В консоли должны появиться:
   ```
   LineTool: settings.p1 changed: [timestamp, price]
   LineTool p1 computed: [timestamp, price]
   LineTool: drawing line {p1: [...], p2: null}
   ```
3. **Отпустите кнопку мыши** для установки второй точки
4. В консоли:
   ```
   LineTool: settings.p2 changed: [timestamp, price]
   LineTool p2 computed: [timestamp, price]
   LineTool: drawing line {p1: [...], p2: [...]}
   LineTool drawing finished
   ```

### Шаг 5: Проверить DataCube
В консоли браузера выполните:
```javascript
// Получить DataCube
const dc = window.dc

// Проверить текущий инструмент
console.log('Current tool:', dc.data.tool)

// Проверить режим рисования
console.log('Drawing mode:', dc.data.drawingMode)

// Проверить все onchart overlays
console.log('Onchart overlays:', dc.data.onchart)

// Найти LineTool
const lineTool = dc.data.onchart.find(x => x.type === 'LineTool')
console.log('LineTool:', lineTool)
console.log('LineTool settings:', lineTool?.settings)
console.log('LineTool p1:', lineTool?.settings?.p1)
console.log('LineTool p2:', lineTool?.settings?.p2)
```

## 🐛 Возможные проблемы и их решения:

### Проблема 1: "LineTool: waiting for points..."
**Причина:** Инструмент создан, но Pin еще не установил координаты

**Решение:** 
- Убедитесь, что вы **зажимаете и тянете** мышь, а не просто кликаете
- В коде должна появиться подсказка: "Hodl+Drug to create, Tap to finish a tool"

### Проблема 2: Линия не рисуется после установки точек
**Причина:** Компонент не перерисовывается

**Проверка:**
```javascript
// В консоли
const grid = document.querySelector('canvas')
console.log('Canvas exists:', !!grid)
```

**Возможное решение:** Добавить принудительную перерисовку в `change_settings`

### Проблема 3: p1 или p2 всегда null
**Причина:** События `change-settings` не доходят до DataCube

**Отладка:**
1. Добавьте breakpoint в `dc_events.js` на строке с `change_settings`
2. Проверьте, вызывается ли метод при перемещении мыши
3. Проверьте args[0] - должен содержать `{p1: [t, y$]}` или `{p2: [t, y$]}`

### Проблема 4: Toolbar не отображается
**Причина:** prop `dc` не передается

**Проверка:**
```javascript
// В LineTool mounted():
console.log('LineTool dc:', this.$props.dc)
// Должен вывести DataCube object, не undefined
```

## 📊 Ожидаемое поведение:

### Правильная последовательность событий:

1. **Выбор инструмента:**
   ```
   → custom-event: tool-selected
   → dc.data.tool = 'LineToolSegment'
   ```

2. **Клик на графике (mousedown):**
   ```
   → custom-event: grid-mousedown
   → dc.data.drawingMode = true
   → build_tool() создает новый LineTool
   → LineTool монтируется с settings: {p1: null, p2: null, $state: 'wip'}
   ```

3. **Первый Pin инициализируется:**
   ```
   → Pin('p1') создается
   → update() вызывается
   → emit('change-settings', {p1: [t, y$]})
   → dc_events.change_settings() обновляет settings
   → LineTool.p1 computed пересчитывается
   → draw() вызывается, рисует первую точку
   ```

4. **Второй Pin отслеживает мышь:**
   ```
   → Pin('p2', {state: 'tracking'}) создается
   → mousemove() постоянно обновляет позицию
   → emit('change-settings', {p2: [t, y$]}) на каждом движении
   → draw() перерисовывает линию в реальном времени
   ```

5. **Клик для завершения (mouseup):**
   ```
   → Pin('p2') меняет state на 'settled'
   → emit('settled')
   → set_state('finished')
   → emit('drawing-mode-off')
   → dc.data.drawingMode = false
   → dc.data.tool = 'Cursor'
   ```

## 🎯 Критерии успеха:

✅ Toolbar отображается с иконками инструментов  
✅ При выборе инструмента он подсвечивается  
✅ При зажатии мыши на графике создается LineTool  
✅ Линия отображается во время перемещения мыши  
✅ После отпускания мыши линия остается на графике  
✅ Можно выбрать инструмент снова и нарисовать еще одну линию  
✅ Линии сохраняются при прокрутке/масштабировании  

## 📝 Дополнительные проверки:

### Проверить props в LineTool:
```javascript
// В консоли, после монтирования LineTool
const vueDevtools = window.__VUE_DEVTOOLS_GLOBAL_HOOK__
// Или используйте Vue DevTools расширение
```

### Проверить реактивность settings:
```javascript
// Вручную изменить settings
const lineTool = dc.data.onchart.find(x => x.type === 'LineTool')
lineTool.settings.p1 = [Date.now(), 50000]
// Должна перерисоваться линия
```

---

**Дата:** 16 ноября 2025  
**Версия:** Trading Vue 3 (v1.0.6+)
