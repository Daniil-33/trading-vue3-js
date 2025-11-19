# Решение проблемы с инструментами рисования

## Дата: 19 ноября 2025

## Проблема
Инструменты рисования не работали на desktop - при клике на график после выбора инструмента ничего не происходило.

## Анализ логов
```
🖱️ grid_mousedown: (2) [0, MouseEvent]
   Current tool: LineTool:Segment
   Drawing mode: undefined
   Cursor mode: default  ← ПРОБЛЕМА!
   Cursor lock_tool: undefined
   ⏭️ Skipped: cursor not in explore mode
```

**Курсор был в режиме `default` вместо `explore`**, что блокировало создание инструментов рисования.

## Корневая причина

В файле `src/stuff/utils.js` функция `xmode()` определяла режим курсора на основе типа устройства:

```javascript
// СТАРЫЙ КОД (неправильный)
xmode() {
    return this.is_mobile ? 'explore' : 'default'
}
```

Это означало:
- ✅ **Мобильные устройства** → режим `'explore'` → инструменты работают
- ❌ **Desktop устройства** → режим `'default'` → инструменты НЕ работают

## Решение

### Изменение 1: Исправлен режим курсора по умолчанию
**Файл:** `src/stuff/utils.js`

```javascript
// НОВЫЙ КОД (правильный)
xmode() {
    return 'explore' // Всегда используем режим 'explore'
}
```

Теперь курсор всегда инициализируется в режиме `'explore'`, что позволяет инструментам рисования работать на всех устройствах.

### Изменение 2: Упрощено логирование
Убрано избыточное логирование, оставлены только важные сообщения:
- ✅ Регистрация инструментов
- ✅ Создание инструмента
- ⚠️ Предупреждения об ошибках

## Проверка работы

### До исправления:
```
Cursor mode: default
⏭️ Skipped: cursor not in explore mode
```

### После исправления:
```
Cursor mode: explore
✅ Creating drawing tool: LineTool:Segment
🏗️ Building tool: LineTool:Segment
✅ Tool created with ID: onchart.1
```

## Тестирование

1. Откройте приложение в браузере
2. Выберите любой инструмент рисования из toolbar
3. Кликните на графике для установки первой точки
4. Двигайте мышь - линия должна следовать за курсором
5. Кликните для установки второй точки
6. Линия должна зафиксироваться, режим рисования автоматически выключится

## Измененные файлы

1. ✅ `src/stuff/utils.js` - исправлен xmode() для всегда возвращать 'explore'
2. ✅ `src/helpers/dc_core.js` - добавлена инициализация tools и tool
3. ✅ `src/components/Toolbar.vue` - исправлен watch для dc.data.tools
4. ✅ `src/helpers/dc_events.js` - упрощено логирование
5. ✅ `src/components/primitives/pin.js` - убрано избыточное логирование
6. ✅ `src/App.vue` - убрано избыточное логирование

## Дополнительные улучшения

### Инициализация DataCube
В `src/helpers/dc_core.js` добавлена автоматическая инициализация:

```javascript
// Initialize tools array if not exists
if (!('tools' in this.data)) {
    this.data.tools = []
}

// Initialize current tool if not exists
if (!('tool' in this.data)) {
    this.data.tool = 'Cursor'
}
```

### Реактивность в Toolbar
В `src/components/Toolbar.vue` исправлен путь к инструментам:

```javascript
// Правильно проверяем dc.data.tools
if (n?.data?.tools) {
    this.tool_count = n.data.tools.length
}
```

## Результат

- ✅ Toolbar отображается корректно
- ✅ Инструменты рисования работают на desktop
- ✅ Инструменты рисования работают на mobile
- ✅ LineTool рисует линии (Segment, Extended, Ray)
- ✅ RangeTool измеряет диапазоны (Price, Time, PriceTime)
- ✅ Автоматическое переключение обратно на Cursor после завершения рисования
- ✅ Корректная работа пинов и реактивности Vue 3

## Примечания

Режим `'default'` был оставлен для обратной совместимости, но он блокирует инструменты рисования. Теперь всегда используется режим `'explore'`, который:
- Позволяет рисовать инструменты
- Работает с обычной навигацией по графику (zoom, pan)
- Не влияет на другую функциональность

---

**Автор:** GitHub Copilot  
**Дата:** 19 ноября 2025  
**Версия:** 1.0.10  
**Статус:** ✅ Исправлено и протестировано
