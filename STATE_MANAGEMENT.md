# Zustand State Management для MyTonStorage

## Описание

Этот проект использует Zustand с модулем persist для управления состоянием приложения. Состояние автоматически сохраняется в localStorage и восстанавливается при перезагрузке страницы.

## Структура стейта

### Основные разделы:
1. **currentPage** - текущая страница (1 - загрузка, 2 - список файлов)
2. **upload** - данные для страницы загрузки
3. **files** - данные для страницы со списком файлов

### Upload состояние:
- `currentWidget` - текущий виджет (1-4)
- `widgetData` - данные всех виджетов:
  - Виджет 1: загрузка файла/папки
  - Виджет 2: настройка параметров хранения
  - Виджет 3: оплата
  - Виджет 4: инфо

### Files состояние:
- `list` - массив загруженных файлов
- `searchQuery` - поисковый запрос
- `sortBy` - поле для сортировки
- `sortOrder` - порядок сортировки

## Использование

### Импорт стейта:
```typescript
import { useAppStore } from '@/store/useAppStore'
```

### Основные действия:
```typescript
const {
  // Текущее состояние
  currentPage,
  upload,
  files,
  
  // Действия для навигации
  setCurrentPage,
  
  // Действия для виджетов
  setCurrentWidget,
  nextWidget,
  prevWidget,
  updateWidgetData,
  resetWidgetData,
  
  // Действия для файлов
  addFile,
  updateFile,
  removeFile,
  setSearchQuery,
  setSortBy,
  
  // Сброс
  resetAll
} = useAppStore()
```

## Примеры использования

### Переключение страниц:
```typescript
setCurrentPage(1) // Страница загрузки
setCurrentPage(2) // Страница файлов
```

### Работа с виджетами:
```typescript
// Переход к следующему виджету
nextWidget()

// Обновление данных виджета
updateWidgetData({
  fileName: 'example.pdf',
  description: 'Important document'
})
```

### Управление файлами:
```typescript
// Добавление файла
addFile({
  id: '123',
  name: 'document.pdf',
  size: 1024000,
  uploadDate: new Date().toISOString(),
  status: 'uploaded'
})

// Поиск файлов
setSearchQuery('document')

// Сортировка
setSortBy('name', 'asc')
```

## Persist настройки

Стейт автоматически сохраняется в localStorage под ключом `app-storage`. При перезагрузке страницы все данные восстанавливаются, включая:
- Текущую страницу
- Текущий виджет, его данные и данные других виджетов
- Список файлов
- Настройки поиска и сортировки

## Структура компонентов

1. **page.tsx** - главная страница с навигацией
2. **upload-widgets.tsx** - 4 виджета для загрузки файлов
3. **files-list.tsx** - компонент списка файлов с поиском и сортировкой

Все компоненты автоматически реагируют на изменения стейта и сохраняют свое состояние между сессиями.
