import { BagInfoShort, Transaction } from '@/lib/types'
import { StorageContractFull } from '@/types/blockchain'
import { AddedBag, FileInfo, UserBag } from '@/types/files'
import { ContractStatus } from '@/types/mytonstorage'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface UploadFile {
  contractAddress: string
  updatedAt: number
  expiresAt: number | null
  info: BagInfoShort | null
  contractChecks: ContractStatus[]
  contractInfo: StorageContractFull | null
  lastContractUpdate: number | null
  status: 'closed' | 'uploaded' | 'uploading' | 'error' // -
}

export interface Blockchain {
  lt: string | undefined
  lastUpdate: number | null
  headLt?: string | undefined
}

export interface UploadWidgetData {
  // Widget 1: File upload
  selectedFiles: FileInfo[]
  newBagID?: string
  newBagInfo?: AddedBag
  bagInfo?: UserBag
  freeStorage?: number
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

    // Настройки отображения
    hideClosed: boolean
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
  setHeadLt: (headLt: string) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sortBy: 'name' | 'date' | 'size', order: 'asc' | 'desc') => void
  setHideClosed: (value: boolean) => void

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
      lt: undefined,
      lastUpdate: null,
      headLt: undefined,
    },
    list: [],
    searchQuery: '',
    sortBy: 'date',
    sortOrder: 'desc',
    hideClosed: false,
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

      setFiles: (files) => {
        // combine statuses
        const uniqueFilesMap = new Map<string, UploadFile>()
        files
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .forEach(file => {
            if (!uniqueFilesMap.has(file.contractAddress)) {
              uniqueFilesMap.set(file.contractAddress, file)
            }
          })
        const dedupedFiles = Array.from(uniqueFilesMap.values())

        set((state) => ({
          files: {
            ...state.files,
            list: dedupedFiles
          }
        }))
      },

      setBlockchain: (lt, lastUpdate) =>
        set((state) => ({
          files: {
            ...state.files,
            blockchain: {
              lt,
              lastUpdate,
              headLt: state.files.blockchain.headLt
            }
          }
        })),

      setHeadLt: (headLt) =>
        set((state) => ({
          files: {
            ...state.files,
            blockchain: {
              ...state.files.blockchain,
              headLt,
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

      setHideClosed: (value) =>
        set((state) => ({
          files: {
            ...state.files,
            hideClosed: value,
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
          sortOrder: state.files.sortOrder,
          hideClosed: state.files.hideClosed,
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
