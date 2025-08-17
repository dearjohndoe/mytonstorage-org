import { Transaction } from '@/lib/types'
import { AddedBag, BagInfo, FileInfo } from '@/types/files'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface UploadFile {
  id: string
  name: string
  size: number
  uploadDate: string
  status: 'uploaded' | 'uploading' | 'error'
  url?: string
}

export interface UploadWidgetData {
  // Widget 1: File upload
  selectedFiles: FileInfo[]
  newBagID?: string
  newBagInfo?: AddedBag
  bagInfo?: BagInfo
  description?: string

  // Widget 2: Choose providers
  providersCount?: number
  selectedProviders?: string[]
  transaction?: Transaction

  // Widget 3: Payment
  storageContractAddress?: string
  paymentStatus?: 'pending' | 'success' | 'failed'
}

export interface AppState {
  // Флаг для отслеживания инициализации persist
  _hasHydrated: boolean

  // Текущая страница (1 - загрузка, 2 - список файлов)
  currentPage: 1 | 2

  // Данные для страницы загрузки
  upload: {
    currentWidget: 1 | 2 | 3 | 4
    widgetData: UploadWidgetData
  }

  // Данные для страницы со списком файлов
  files: {
    list: UploadFile[]
    searchQuery?: string
    sortBy?: 'name' | 'date' | 'size'
    sortOrder?: 'asc' | 'desc'
  }
}

export interface AppActions {
  // Управление страницами
  setCurrentPage: (page: 1 | 2) => void

  // Управление виджетами загрузки
  setCurrentWidget: (widget: 1 | 2 | 3 | 4) => void

  // Управление данными виджетов
  updateWidgetData: (data: Partial<UploadWidgetData>) => void
  resetWidgetData: () => void

  // Управление файлами
  addFile: (file: UploadFile) => void
  updateFile: (id: string, updates: Partial<UploadFile>) => void
  removeFile: (id: string) => void
  setFiles: (files: UploadFile[]) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sortBy: 'name' | 'date' | 'size', order: 'asc' | 'desc') => void

  // Сброс состояния
  resetAll: () => void
}

type AppStore = AppState & AppActions

const initialState: AppState = {
  _hasHydrated: false,
  currentPage: 1,
  upload: {
    currentWidget: 1,
    widgetData: {
      selectedFiles: []
    }
  },
  files: {
    list: [],
    searchQuery: '',
    sortBy: 'date',
    sortOrder: 'desc'
  }
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Управление страницами
      setCurrentPage: (page) => set({ currentPage: page }),

      // Управление виджетами
      setCurrentWidget: (widget) =>
        set((state) => ({
          upload: {
            ...state.upload,
            currentWidget: widget
          }
        })),

      // Управление данными виджетов
      updateWidgetData: (data) =>
        set((state) => ({
          upload: {
            ...state.upload,
            widgetData: {
              ...state.upload.widgetData,
              ...data
            }
          }
        })),

      resetWidgetData: () =>
        set((state) => ({
          upload: {
            ...state.upload,
            widgetData: {
              selectedFiles: []
            }
          }
        })),

      // Управление файлами
      addFile: (file) =>
        set((state) => ({
          files: {
            ...state.files,
            list: [...state.files.list, file]
          }
        })),

      updateFile: (id, updates) =>
        set((state) => ({
          files: {
            ...state.files,
            list: state.files.list.map(file =>
              file.id === id ? { ...file, ...updates } : file
            )
          }
        })),

      removeFile: (id) =>
        set((state) => ({
          files: {
            ...state.files,
            list: state.files.list.filter(file => file.id !== id)
          }
        })),

      setFiles: (files) =>
        set((state) => ({
          files: {
            ...state.files,
            list: files
          }
        })),

      setSearchQuery: (query) =>
        set((state) => ({
          files: {
            ...state.files,
            searchQuery: query
          }
        })),

      setSortBy: (sortBy, order) =>
        set((state) => ({
          files: {
            ...state.files,
            sortBy,
            sortOrder: order
          }
        })),

      // todo: unused?
      resetAll: () => set(initialState)
    }),

    {
      name: 'app-storage', // имя в localStorage
      storage: createJSONStorage(() => localStorage),
      // Можно указать какие части стейта сохранять (исключаем _hasHydrated)
      partialize: (state) => ({
        currentPage: state.currentPage,
        upload: state.upload,
        files: {
          list: state.files.list,
          searchQuery: state.files.searchQuery,
          sortBy: state.files.sortBy,
          sortOrder: state.files.sortOrder
        }
      }),

      onRehydrateStorage: () => (state, error) => {
        if (!error) {
          setTimeout(() => {
            useAppStore.setState({ _hasHydrated: true })
          }, 0)
        }
      },
    }
  )
)
