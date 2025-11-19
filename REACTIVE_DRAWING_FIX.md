# Fix: Реактивная отрисовка инструментов (v1.0.15)

## Проблема

После установки первой точки инструмента, при движении мыши для установки второй точки:
- Линия НЕ отображается в реальном времени
- Координаты второй точки (p2) НЕ обновляются во время tracking
- Линия появляется только после:
  - Клика (фиксации второй точки)
  - Зума графика
  - Панорамирования графика

## Анализ логов

Логи показали что:
1. ✅ Pin p1 создается правильно
2. ✅ Pin p2 создается в режиме `tracking`
3. ✅ DataCube merge работает корректно
4. ✅ LineTool.draw() вызывается многократно
5. ❌ **НО**: p1 и p2 имеют одинаковые координаты!
6. ❌ **НО**: `Pin.mousemove()` НЕ вызывается во время движения мыши
7. ✅ После зума/панорамирования - координаты обновляются

## Корневая причина

**События `mousemove` не передавались в overlays во время начального рисования!**

### Проблема 1: Grid.vue - Cursor Lock
В Grid.vue watcher на `cursor` проверял `cursor.locked` и не вызывал `redraw()`:

```javascript
// БЫЛО (v1.0.14):
cursor: {
    handler: function() {
        if (!this.$props.cursor.locked) this.redraw()  // ❌ Не перерисовывает если locked
    }
}

// СТАЛО (v1.0.15):
cursor: {
    handler: function() {
        this.redraw()  // ✅ Всегда перерисовывает
    }
}
```

**Объяснение**: `scroll-lock` должен блокировать только скролл/панорамирование, но НЕ перерисовку графика!

### Проблема 2: grid.js - panmove propagate

**ГЛАВНАЯ ПРОБЛЕМА**: В `src/components/js/grid.js` событие `panmove` НЕ вызывало `propagate('mousemove')` на десктопе!

```javascript
// БЫЛО (v1.0.14):
mc.on('panmove', event => {
    if (Utils.is_mobile) {  // ❌ Только для мобильных!
        this.calc_offset()
        this.propagate('mousemove', this.touch2mouse(event))
    }
    if (this.drug) {
        this.mousedrag(...)
    }
})

// СТАЛО (v1.0.15):
mc.on('panmove', event => {
    this.calc_offset()  // ✅ Всегда вызывается
    const mouseEvent = Utils.is_mobile ? this.touch2mouse(event) : event
    this.propagate('mousemove', mouseEvent)  // ✅ Всегда propagate!
    
    if (this.drug) {
        this.mousedrag(...)
    }
})
```

**Объяснение**: 
- Hammer.js захватывает все события мыши через event `pan`
- Когда пользователь кликает и двигает мышью, Hammer создает `panstart` и `panmove` events
- Обычный DOM event `onMousemove` больше НЕ срабатывает
- Поэтому нужно **обязательно** вызывать `propagate('mousemove')` в обработчике `panmove`!
- Раньше это работало только на мобильных (где pan используется для скролла)
- На десктопе pan НЕ означает скролл, но events mousemove все равно нужны!

## Поток событий (исправленный)

1. Пользователь выбирает инструмент рисования (например, Line)
2. Кликает на графике → создается Pin p1 в состоянии `settled`
3. Создается Pin p2 в состоянии `tracking`
4. Pin p2 подписывается на `this.mouse.on('mousemove', ...)`
5. Пользователь двигает мышью:
   - Hammer.js генерирует `panmove` event
   - grid.js вызывает `propagate('mousemove', event)` ✅
   - Mouse объект получает event через `mouse.emit('mousemove', event)`
   - Pin p2 получает callback и вызывает `this.update()`
   - `this.update()` обновляет координаты из `cursor.t` и `cursor.y$`
   - Pin вызывает `custom_event('change-settings', {p2: [t, y$]})`
   - DataCube выполняет merge
   - Grid.vue watcher на `cursor` вызывает `redraw()` ✅
   - LineTool.draw() рисует линию с обновленными p1 и p2 ✅

## Изменения

### 1. src/components/Grid.vue
```javascript
cursor: {
    handler: function() {
        // Always redraw on cursor change, even when locked
        // (locked prevents scrolling, not redrawing)
        this.redraw()
    },
    deep: true
}
```

### 2. src/components/js/grid.js
```javascript
mc.on('panmove', event => {
    this.calc_offset()
    const mouseEvent = Utils.is_mobile ? this.touch2mouse(event) : event
    this.propagate('mousemove', mouseEvent)
    
    if (this.drug) {
        this.mousedrag(
            this.drug.x + event.deltaX,
            this.drug.y + event.deltaY,
        )
        this.comp.$emit('cursor-changed', {
            grid_id: this.id,
            x: event.center.x + this.offset_x,
            y: event.center.y + this.offset_y
        })
    } else if (this.cursor.mode === 'aim') {
        this.emit_cursor_coord(event)
    }
})
```

## Публикация

```bash
npm version patch  # 1.0.14 → 1.0.15
npm publish
```

## Результат

✅ Инструменты рисования теперь отображаются в реальном времени во время tracking  
✅ Pin p2 корректно обновляет координаты при движении мыши  
✅ Линия рисуется плавно от p1 к текущей позиции курсора  
✅ Работает как на десктопе, так и на мобильных устройствах  
