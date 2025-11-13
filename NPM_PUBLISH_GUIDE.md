# 📦 Публикация npm пакета trading-vue3-js

## Пошаговая инструкция

### Шаг 1: Подготовка

#### 1.1. Создайте аккаунт на npmjs.com (если ещё нет)
1. Перейдите на https://www.npmjs.com/signup
2. Зарегистрируйтесь
3. Подтвердите email

#### 1.2. Войдите в npm через терминал

```bash
npm login
```

Введите:
- Username (имя пользователя на npmjs.com)
- Password
- Email
- One-time password (если включена 2FA)

### Шаг 2: Проверка пакета

#### 2.1. Проверьте package.json

```bash
cat package.json
```

Убедитесь:
- ✅ `name` уникально (проверьте на npmjs.com)
- ✅ `version` обновлена (текущая: 1.0.4)
- ✅ `description` заполнено
- ✅ `author` заполнено
- ✅ `license` указана (MIT)
- ✅ `repository` указан
- ✅ `keywords` добавлены

#### 2.2. Соберите библиотеку

```bash
npm run build
```

Проверьте, что создалась папка `dist/` с файлами:
- `trading-vue.es.js`
- `trading-vue.umd.js`
- `style.css` (если есть)

#### 2.3. Проверьте, что будет опубликовано

```bash
npm pack --dry-run
```

Это покажет список файлов, которые будут включены в пакет.

### Шаг 3: Публикация

#### 3.1. Проверьте, что имя свободно

```bash
npm view trading-vue3-js
```

Если пакет не найден - имя свободно! ✅

#### 3.2. Опубликуйте пакет

```bash
npm publish
```

Если имя занято, измените `name` в package.json:
```json
{
  "name": "@your-username/trading-vue3-js",
  "version": "1.0.4"
}
```

Для scoped пакетов (с @):
```bash
npm publish --access public
```

### Шаг 4: Проверка

После публикации проверьте:

1. Ваш пакет на npmjs.com:
   ```
   https://www.npmjs.com/package/trading-vue3-js
   ```

2. Установите локально и протестируйте:
   ```bash
   cd /tmp
   mkdir test-package
   cd test-package
   npm init -y
   npm install trading-vue3-js
   ```

### Шаг 5: Обновление версии (для будущих релизов)

Когда нужно опубликовать обновление:

```bash
# Увеличить patch версию (1.0.4 -> 1.0.5)
npm version patch

# Увеличить minor версию (1.0.4 -> 1.1.0)
npm version minor

# Увеличить major версию (1.0.4 -> 2.0.0)
npm version major

# Опубликовать
npm publish
```

## Использование пакета

После публикации пользователи смогут установить:

```bash
npm install trading-vue3-js
```

### Пример использования

```javascript
import { createApp } from 'vue'
import TradingVue from 'trading-vue3-js'

const app = createApp(App)
app.component('TradingVue', TradingVue)
app.mount('#app')
```

или:

```vue
<template>
  <TradingVue :data="chart" :width="800" :height="600" />
</template>

<script setup>
import TradingVue from 'trading-vue3-js'
import 'trading-vue3-js/dist/style.css'

const chart = {
  ohlcv: [/* данные */]
}
</script>
```

## Полезные команды

```bash
# Проверить, кто залогинен
npm whoami

# Посмотреть информацию о пакете
npm view trading-vue3-js

# Отменить публикацию (только в течение 72 часов!)
npm unpublish trading-vue3-js@1.0.4

# Пометить версию как устаревшую
npm deprecate trading-vue3-js@1.0.3 "Please upgrade to 1.0.4"

# Выйти из npm
npm logout
```

## Рекомендации

### ✅ Перед публикацией:

1. ✅ Проверьте, что код собирается без ошибок
2. ✅ Протестируйте основные функции
3. ✅ Обновите README.md
4. ✅ Обновите CHANGELOG.md (если есть)
5. ✅ Закоммитьте изменения в git
6. ✅ Создайте git tag для версии

### 📝 После публикации:

1. Создайте GitHub Release
2. Обновите документацию
3. Сообщите пользователям об обновлении
4. Добавьте badges в README.md

## Badges для README.md

```markdown
[![npm version](https://badge.fury.io/js/trading-vue3-js.svg)](https://www.npmjs.com/package/trading-vue3-js)
[![Downloads](https://img.shields.io/npm/dm/trading-vue3-js.svg)](https://www.npmjs.com/package/trading-vue3-js)
[![License](https://img.shields.io/npm/l/trading-vue3-js.svg)](https://github.com/SaViGnAnO/trading-vue3-js/blob/master/LICENSE.md)
```

## Troubleshooting

### Ошибка: "You do not have permission to publish"
- Проверьте, залогинены ли вы: `npm whoami`
- Проверьте, не занято ли имя другим пользователем

### Ошибка: "Package name too similar to existing package"
- Измените имя пакета на более уникальное
- Используйте scoped package: `@username/package-name`

### Ошибка: "Missing script: prepublishOnly"
- Это нормально, если у вас нет этого скрипта
- Или добавьте в package.json: `"prepublishOnly": "npm run build"`

## Полезные ссылки

- [npm Documentation](https://docs.npmjs.com/)
- [Publishing npm packages](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [npm scope](https://docs.npmjs.com/cli/v8/using-npm/scope)
