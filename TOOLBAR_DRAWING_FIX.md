# Исправление проблемы с рисованием инструментов из Toolbar

## Дата: 19 ноября 2025

## Проблема
Инструменты рисования перестали отображаться в toolbar, хотя компонент Toolbar был включен.

## Причины

### 1. **Отсутствие инициализации `tools` в DataCube**
DataCube не инициализировал массив `tools` при создании, что приводило к `undefined` при попытке отобразить toolbar.

### 2. **Неправильная проверка в Toolbar watch**
В компоненте `Toolbar.vue` watch проверял `n?.tools`, но нужно было проверять `n?.data?.tools`, так как DataCube хранит инструменты в `dc.data.tools`.

### 3. **Асинхронная регистрация инструментов**
Компонент Grid регистрирует инструменты через событие `register-tools` после монтирования, но Toolbar монтировался раньше и не получал обновления.

## Решение

### 1. Инициализация `tools` в DataCube
**Файл:** `src/helpers/dc_core.js`

Добавили инициализацию массива `tools` в метод `init_data`:

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

### 2. Исправление watch в Toolbar
**Файл:** `src/components/Toolbar.vue`

Исправили проверку пути к `tools`:

```javascript
watch: {
    dc: {
        handler(n) {
            if (n?.data?.tools) {
                this.tool_count = n.data.tools.length
            } else if (n?.tools) {
                this.tool_count = n.tools.length
            }
        },
        deep: true
    },
    // ...
}
```

### 3. Добавление логирования
Добавили логирование в ключевых местах для отладки:

- `App.vue` - логирование при монтировании
- `Toolbar.vue` - логирование при монтировании и watch
- `dc_events.js` - логирование при регистрации инструментов

## Как работает система инструментов

### Поток данных:

1. **DataCube инициализируется** с пустым массивом `tools` и текущим инструментом `Cursor`
2. **Grid монтируется** и собирает все overlay компоненты (LineTool, RangeTool и т.д.)
3. **Grid вызывает событие** `register-tools` с информацией о доступных инструментах
4. **DataCube получает событие** и вызывает метод `register_tools` из `dc_events.js`
5. **register_tools создает список** инструментов:
   - Всегда добавляет `Cursor` первым
   - Добавляет все найденные инструменты (LineTool:Segment, LineTool:Extended, и т.д.)
6. **Toolbar реагирует** на изменение `dc.data.tools` через watch и обновляет отображение

### Структура данных инструментов:

```javascript
{
    type: 'LineTool:Segment',  // Уникальный идентификатор
    group: 'Lines',             // Группа инструментов
    icon: 'data:image/png...',  // Base64 иконка
    settings: {},               // Настройки по умолчанию
    // ... другие свойства
}
```

## Доступные инструменты

После регистрации доступны следующие инструменты:

1. **Cursor** - базовый курсор
2. **LineTool:Segment** - отрезок
3. **LineTool:Extended** - продленная линия
4. **LineTool:Ray** - луч
5. **RangeTool:Price** - измерение ценового диапазона
6. **RangeTool:Time** - измерение временного диапазона
7. **RangeTool:PriceTime** - измерение цены и времени

## Отладка

Для проверки состояния инструментов в консоли браузера:

```javascript
// Проверить DataCube
console.log(window.dc)

// Проверить список инструментов
console.log(window.dc.data.tools)

// Проверить текущий инструмент
console.log(window.dc.data.tool)
```

## Тестирование

1. Запустите dev сервер: `npm run dev`
2. Откройте http://localhost:8081/
3. Откройте DevTools (F12)
4. Проверьте консоль на наличие сообщений:
   - "App mounted - DataCube tools: []"
   - "🔧 register_tools called with: [...]"
   - "✅ Final tools list: [...]"
   - "Toolbar mounted"
5. Toolbar должен отображаться слева с доступными инструментами

## Результат

После внесения изменений:
- ✅ Toolbar корректно отображается
- ✅ Инструменты рисования загружаются автоматически
- ✅ Нет ошибок в консоли
- ✅ Toolbar реагирует на изменения списка инструментов

## Дополнительные улучшения

Для добавления пользовательских инструментов:

```javascript
// В App.vue mounted()
mounted() {
    window.addEventListener('resize', this.onResize)
    window.dc = this.chart
    
    // Можно добавить пользовательские настройки инструментов
    // после того, как Grid зарегистрирует все инструменты
    this.$nextTick(() => {
        console.log('Registered tools:', this.chart.data.tools)
    })
}
```

---

**Автор:** GitHub Copilot  
**Дата:** 19 ноября 2025  
**Версия:** 1.0.10
