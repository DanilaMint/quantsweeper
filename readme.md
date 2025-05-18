# QuantSweeper

[Open](https://danilakouzmenko.github.io/quantsweeper/)

[Don't know russian? Read it english!](#eng)

## Правила

QuantSweeper - квантовая версия "Сапёра", где мины находятся в суперпозиции между несколькими клетками. При открытии клетки с квантовой миной происходит коллапс в одну из возможных позиций. Используйте квантовые флажки для безопасного измерения позиций мин.

Отличия от классической игры:
- Мины находятся в суперпозиции внутри запутанных "групп" клеток
- Квантовые флажки позволяют безопасно измерить позиции мин
- Вероятности показывают возможные расположения мин

## Изменения

### 0.1.0
- Релиз игры

### 0.1.1
- Фикс бага отображения мины
- Убрать множественное открытие при мине
- Добавлен DebugMode

### 0.2.0
- Проведен рефакторинг Rust-кода: имплементация InternalField разделена на отдельные модули
- Добавлена валидация вводимых значений

### 0.2.1
- Валидация не ломается от undefined/NaN

### 0.2.2
- Исправлен баг с появлением мины на уже открытой клетке

### 0.2.3
- Исправлен баг пропажи мины после нажатия кнопки "Измерить"
- Изменен цвет активной лопаты

### 0.2.4
- Текстуры вынесены в папку `res`
- Добавлен значок сайта
- Временно убран счетчик очков

### 0.2.5
- Добавлена текстура правильно-поставленного флажка
- Добавлен рендеринг окончания игры

### 0.3.0
- Вся логика была перенесена в Rust
- Переименованы методы из `measure` в `collapse`
- Убран модуль `bytes`

### 0.3.1
- Добавлен значок сайту
- Немного сжат предзагрузочный скрипт

### 0.4.0
- Визуал перенесен на jQuery
- Предзагрузочный скрипт вынесен в отдельный файл

### 0.4.1
- Добавлена инструкция к игре

### 0.4.2
- Убрана возможность поставить флаг на еще не сгенерированное поле
- Дроби сокращаются

### 0.4.3
- Идентификаторы групп стали `i16`
- Добавлено взаимодействие с клавиатуры (`1` - лопата, `2` - обычный флажок, `3` - квантовый флажок, `e` - измерить, `r` - новая игра, `h` - инструкция)

### 0.4.4
- Исправлен баг с взаимодействием клавиатуры
- Попап появляется при нажатии `r`

#
<h3 id="eng"></h3>

## Game Rules

QuantSweeper is a quantum version of Minesweeper where mines exist in superposition across multiple tiles. When you reveal a tile with a quantum mine, it collapses to one possible position. Use quantum flags to safely collapse mine superpositions.

Key differences from classic Minesweeper:
- Mines exist in superposition across a "group" of tiles
- Quantum flags allow safe measurement of mine positions
- Probability values show potential mine locations

## Change Log

### 0.1.0
- Game Release

### 0.1.1
- Fixed of render mine
- Removed multiopening if that's mine
- Added DebugMode

### 0.2.0
- Rust-code refactoring: implementation `InternalField` split into module components
- Add input validation

### 0.2.1
- Validation can process undefined/NaN values

### 0.2.2
- Fixed mine appearing at already opened tile

### 0.2.3
- Fixed mine disappearing after press button "Измерить"
- Changed active shovel color

### 0.2.4
- Textures are moved to the `res` folder
- Added icon to game
- Score counter has been temporarily removed

### 0.2.5
- Added right-setted flag texture
- Added game over rendering

### 0.3.0
- All logic was moved to Rust
- Renamed methods from `measure` to `collapse`
- Removed `bytes` module

### 0.3.1
- Added favicon
- Compressed preload script

### 0.4.0
- GUI moved to jQuery
- Preload script moved into file

### 0.4.1
- Added instruction

### 0.4.2
- Fractions are recude

### 0.4.3
- Group identifiers became `i16`
- Added keyboard interation (`1` - showel, `2` - simple flag, `3` - quant flag, `e` - measure, `r` - new game, `h` - instruction)

### 0.4.4
- Fixed keyboard interaction
- Popup appears after pressing `r`