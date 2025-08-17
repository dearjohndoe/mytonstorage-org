import React, { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { UnpaidFilesList } from './unpaid-list'
import { ReceiptText } from 'lucide-react'
import { ErrorComponent } from './error'

export function FilesList() {
  const [ error, setError ] = useState<string | null>(null);
  const { files, setSearchQuery, setSortBy, removeFile } = useAppStore()

  const filteredFiles = files.list.filter(file =>
    file.name.toLowerCase().includes((files.searchQuery || '').toLowerCase())
  )

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    const sortBy = files.sortBy || 'date'
    const order = files.sortOrder === 'asc' ? 1 : -1

    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name) * order
      case 'size':
        return (a.size - b.size) * order
      case 'date':
        return (new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()) * order
      default:
        return 0
    }
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-4">

      {/* Unpaid - from backend */}
      <UnpaidFilesList />

      <br />

      {/* Paid - from blockchain */}
      <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center">
              <ReceiptText className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg pl-2 font-semibold text-gray-900">Storage contracts</h2>
          </div>
      </div>

      <ErrorComponent error={error} />

      {/* Поиск и сортировка */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search files..."
            value={files.searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={`${files.sortBy}-${files.sortOrder}`}
            onChange={(e) => {
              const [sortBy, order] = e.target.value.split('-') as [typeof files.sortBy, typeof files.sortOrder]
              setSortBy(sortBy!, order!)
            }}
            className="p-2 border rounded"
          >
            <option value="date-desc">Date (newest first)</option>
            <option value="date-asc">Date (oldest first)</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="size-desc">Size (largest first)</option>
            <option value="size-asc">Size (smallest first)</option>
          </select>
        </div>
      </div>

      {/* Список файлов */}
      {sortedFiles.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {files.list.length === 0 ? 'No files uploaded yet' : 'No files match your search'}
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedFiles.map((file) => (
            <div key={file.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-lg truncate">{file.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{formatDate(file.uploadDate)}</span>
                    <span className={`px-2 py-1 rounded text-xs ${file.status === 'uploaded' ? 'bg-green-100 text-green-800' :
                        file.status === 'uploading' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                      }`}>
                      {file.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {file.url && (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Download
                    </a>
                  )}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="btn bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
