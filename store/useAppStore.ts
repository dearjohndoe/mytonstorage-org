import { BagInfoShort, Transaction } from '@/lib/types'
import { StorageContractFull } from '@/types/blockchain'
import { AddedBag, BagInfo, FileInfo } from '@/types/files'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface UploadFile {
  contractAddress: string
  txLt: string
  createdAt: number
  expiresAt: number | null
  info: BagInfoShort | null
  contractInfo: StorageContractFull | null
  lastContractUpdate: number | null
  status: 'uploaded' | 'uploading' | 'error' // -
}

export interface Blockchain {
  lt: string | null
  lastUpdate: number | null
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
    blockchain: Blockchain,
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
  setFiles: (files: UploadFile[]) => void
  setBlockchain: (lt: string, lastUpdate: number) => void
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
    blockchain: {
      lt: null,
      lastUpdate: null
    },
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

      setFiles: (files) =>
        set((state) => ({
          files: {
            ...state.files,
            list: files
          }
        })),

      setBlockchain: (lt, lastUpdate) =>
        set((state) => ({
          files: {
            ...state.files,
            blockchain: {
              lt,
              lastUpdate
            }
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
          blockchain: state.files.blockchain,
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
