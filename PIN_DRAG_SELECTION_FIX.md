# Pin Drag & Selection Fix

## Проблемы (Before)

### 1. Клик на pin не выбирал объект
- **Симптом**: Когда вы кликали на pin (точку для перетаскивания), объект не становился выбранным, trash icon не появлялся
- **Причина**: Pin.js использовал прямой `this.comp.$emit()` вместо `custom_event()`, поэтому события не доходили до DataCube
- **Логи показывали**: `[Tool.mousedown] Collision detected {selected: true}` - но НЕТ `object-selected` события

### 2. График не фиксировался при drag
- **Симптом**: При перетаскивании нарисованного объекта за pin, график тоже двигался
- **Причина**: Pin.js emit'ил `scroll-lock`, но через прямой `$emit`, а не через `custom_event()`
- **Ожидалось**: `scroll_lock = true` → блокировка panstart в grid.js

### 3. drawing-mode-off emit'ился при drag существующего объекта
- **Симптом**: При отпускании pin после drag, toolbar переключался на Cursor (неправильно)
- **Причина**: LineTool/RangeTool подписывались на `pins[1].on('settled')` и всегда emit'или `drawing-mode-off`
- **Ожидалось**: `drawing-mode-off` только при первичном создании, НЕ при drag

## Решение

### 1. Pin.js - использовать custom_event()

**Файл**: `src/components/primitives/pin.js`

#### mousedown():
```javascript
// OLD (прямой emit):
this.comp.$emit('scroll-lock', true)
this.comp.$emit('object-selected')

// NEW (через custom_event):
if (this.comp.custom_event) {
    this.comp.custom_event('scroll-lock', true)
    this.comp.custom_event('object-selected')
} else {
    this.comp.$emit('scroll-lock', true)
    this.comp.$emit('object-selected')
}
```

**Почему это работает**:
- `custom_event()` (из overlay.js) автоматически добавляет metadata (grid_id, id, uuid)
- События идут через `_$emit('custom-event', {event, args})` → DataCube.on_custom_event()
- DataCube получает правильные параметры для `object_selected([grid_id, id, uuid])`

#### mouseup():
```javascript
// OLD:
this.comp.$emit('scroll-lock', false)

// NEW:
if (this.comp.custom_event) {
    this.comp.custom_event('scroll-lock', false)
} else {
    this.comp.$emit('scroll-lock', false)
}
```

### 2. LineTool.vue - проверять состояние перед drawing-mode-off

**Файл**: `src/components/overlays/LineTool.vue`

```javascript
this.pins[1].on('settled', () => {
    // ВАЖНО: Emit'ить drawing-mode-off ТОЛЬКО при первичном создании
    // (state !== 'finished'). Если уже 'finished', это просто drag.
    if (this.$props.settings.$state !== 'finished') {
        console.log('[LineTool.settled] Drawing finished, emitting drawing-mode-off')
        this.set_state('finished')
        if (this.custom_event) {
            this.custom_event('drawing-mode-off')
        }
    } else {
        console.log('[LineTool.settled] Already finished, this is a drag - NOT emitting drawing-mode-off')
    }
})
```

**Логика**:
- **Первое создание**: state = undefined → emit `drawing-mode-off` → set state = 'finished'
- **Последующий drag**: state = 'finished' → НЕ emit `drawing-mode-off`

### 3. RangeTool.vue - та же логика

**Файл**: `src/components/overlays/RangeTool.vue`

Аналогичные изменения - проверка `this.$props.settings.$state !== 'finished'`

## Event Flow (After Fix)

### Scenario 1: Клик на pin существующего объекта

```
1. User clicks on pin
   ↓
2. Pin.mousedown() → state: 'settled' → 'dragging'
   ↓
3. Pin calls: comp.custom_event('scroll-lock', true)
                comp.custom_event('object-selected')
   ↓
4. Overlay.custom_event() adds metadata:
   - object-selected: [grid_id, id, uuid]
   - scroll-lock: [true]
   ↓
5. overlay._$emit('custom-event', {event: 'object-selected', args: [0, 'LineTool_0', 'uuid']})
   ↓
6. DataCube.on_custom_event() receives:
   - 'object-selected' → object_selected([0, 'LineTool_0', 'uuid'])
   - 'scroll-lock' → on_scroll_lock(true)
   ↓
7. DataCube:
   - Sets selected = 'uuid' → trash icon appears
   - Sets scrollLock = true
   ↓
8. Chart.vue watch(data) → cursor.scroll_lock = true
   ↓
9. Grid.panstart checks: if (scroll_lock) return ← БЛОКИРОВКА!
```

**Result**: 
✅ Объект выбран (trash icon)
✅ График зафиксирован (не двигается при drag)

### Scenario 2: Drag pin и отпускание

```
1. User drags and releases pin
   ↓
2. Pin.mouseup() → state: 'dragging' → 'settled'
   ↓
3. Pin calls: on_settled() callback
   ↓
4. LineTool callback checks: $state === 'finished'?
   - YES → console.log('Already finished, NOT emitting drawing-mode-off')
   - NO (first time) → emit 'drawing-mode-off' → toolbar switches to Cursor
   ↓
5. Pin calls: comp.custom_event('scroll-lock', false)
   ↓
6. DataCube.on_scroll_lock(false) → scrollLock = false
   ↓
7. Chart → cursor.scroll_lock = false → график разблокирован
```

**Result**:
✅ Toolbar НЕ переключается на Cursor (остается выбранный tool или Cursor)
✅ График разблокирован после drop

## Logging Added

### 1. Pin.js
- `[Pin.mousedown] Starting drag, emitting scroll-lock and object-selected`
- `[Pin.mouseup] Drag finished, emitting scroll-lock false`

### 2. LineTool.vue / RangeTool.vue
- `[LineTool.settled] Already finished, this is a drag - NOT emitting drawing-mode-off`
- `[RangeTool.settled] Already finished, this is a drag - NOT emitting drawing-mode-off`

### 3. dc_events.js
- `[DataCube.on_scroll_lock] {flag, before, after}`

### 4. Chart.vue
- `[Chart.watch.data] ScrollLock changed {from, to}`
- `[Chart.watch.data] ScrollLock=true, unlocking cursor`

### 5. grid.js
- `[Grid.panstart] Blocked by scroll_lock`

## Testing

### Test 1: Click on pin to select object
1. Draw a line
2. Click anywhere on empty space (deselect)
3. **Click on pin** (red circle)
4. ✅ Expected logs:
   ```
   [Pin.mousedown] Starting drag
   [Overlay.custom_event] {event: 'object-selected'}
   [DataCube.object_selected] Selecting: onchart.LineTool0-xxx
   [Toolbar.is_selected] {tool: 'System:Remove', selected: false}
   ```
5. ✅ Expected: Trash icon appears, object selected

### Test 2: Drag pin without moving chart
1. Draw a line
2. Click on pin and hold
3. **Move mouse** (drag pin)
4. ✅ Expected logs:
   ```
   [Pin.mousedown] Starting drag
   [DataCube.on_scroll_lock] {flag: true}
   [Chart.watch.data] ScrollLock changed {from: false, to: true}
   [Grid.panstart] Blocked by scroll_lock  ← IF YOU TRY TO PAN
   ```
5. ✅ Expected: Chart does NOT move, only pin moves
6. Release mouse
7. ✅ Expected logs:
   ```
   [Pin.mouseup] Drag finished
   [LineTool.settled] Already finished, NOT emitting drawing-mode-off
   [DataCube.on_scroll_lock] {flag: false}
   ```
8. ✅ Expected: Toolbar stays on current tool (not switched to Cursor)

### Test 3: First-time drawing still works
1. Click LineTool in toolbar
2. Click to place first point
3. Move mouse
4. **Click to place second point**
5. ✅ Expected logs:
   ```
   [LineTool.settled] Drawing finished, emitting drawing-mode-off
   [DataCube.drawing_mode_off] Called {currentTool: 'LineTool:Segment'}
   [DataCube.drawing_mode_off] After: tool = Cursor
   [Toolbar.is_selected] {tool: 'Cursor', selected: true}
   ```
6. ✅ Expected: Toolbar switches to Cursor automatically

## Technical Details

### Why Pin needs custom_event()

**Vue 3 Component Event System**:
- Component events (`$emit`) stay within parent-child boundary
- TradingVue → Chart → Section → Grid → Overlays (LineTool, etc.)
- Pin is NOT a Vue component, it's a JS class
- Pin calls `comp.$emit()` → emits to Overlay component
- Overlay parent is Grid, Grid parent is Section, etc.
- **Events don't reach TradingVue/DataCube!**

**custom_event() Pattern**:
- Overlay mixin provides `custom_event()` method
- Adds metadata (grid_id, id, uuid) to args
- Emits single 'custom-event' to parent with `{event, args}`
- Bubbles up to TradingVue → `dc.watcher.on('custom-event')` → DataCube

**Fix**:
- Pin now calls `comp.custom_event()` instead of `comp.$emit()`
- Works because Pin has reference to overlay component via `this.comp`
- Overlay has `custom_event()` method from mixin

### State Management

**settings.$state**:
- `undefined` - новый объект (только создается)
- `'finished'` - объект завершен (нарисован)
- Используется для различия первичного создания vs drag существующего

**DataCube.data.scrollLock**:
- Reactive property watched by Chart.vue
- `true` → cursor.scroll_lock = true → grid.js blocks panstart
- `false` → normal panning allowed

**DataCube.data.selected**:
- UUID выбранного объекта
- `null` → ничего не выбрано
- Controls trash icon visibility

## Files Modified

1. ✅ `src/components/primitives/pin.js` - custom_event() for scroll-lock and object-selected
2. ✅ `src/components/overlays/LineTool.vue` - check $state before drawing-mode-off
3. ✅ `src/components/overlays/RangeTool.vue` - check $state before drawing-mode-off
4. ✅ `src/helpers/dc_events.js` - logging in on_scroll_lock()
5. ✅ `src/components/Chart.vue` - logging in watch(data) for scrollLock
6. ✅ `src/components/js/grid.js` - logging in panstart when blocked

## Summary

**Проблема**: Pin использовал прямой `$emit`, события не доходили до DataCube

**Решение**: Pin теперь использует `comp.custom_event()`, который:
1. Добавляет metadata (grid_id, id, uuid)
2. Emit'ит через систему custom-event
3. Достигает DataCube.on_custom_event()
4. Правильно обрабатывается (selection, scroll-lock)

**Результат**:
- ✅ Клик на pin выбирает объект
- ✅ График фиксируется при drag
- ✅ Toolbar не переключается на Cursor при drag
- ✅ Первичное создание работает как раньше
