"use client"

import React from 'react'
import { File, Folder, X } from 'lucide-react'
import { printSpace } from '@/lib/utils'

interface FilesUploadListProps {
    files: File[]
    onRemoveFile: (index: number) => void
    className?: string
}

export function FilesUploadList({ files, onRemoveFile, className = "" }: FilesUploadListProps) {
    if (files.length === 0) {
        return null
    }

    const totalSize = files.reduce((acc, file) => acc + file.size, 0)
    const isFolder = files.some(file => file.webkitRelativePath)

    const getFileIcon = (file: File) => {
        switch (file.type) {
            case "image/png":
            case "image/jpeg":
            case "image/gif":
            case "image/webp":
            case "image/svg+xml":
                return <img src={URL.createObjectURL(file)} alt={file.name} className="h-4 w-4 object-cover rounded" />
            case "application/pdf":
                return <File className="h-4 w-4 text-red-500" />
            case "text/plain":
            case "text/html":
            case "text/css":
            case "application/javascript":
            case "application/json":
            case "application/xml":
                return <File className="h-4 w-4 text-green-500" />
            case "application/zip":
            case "application/x-rar-compressed":
            case "application/x-7z-compressed":
            case "application/x-tar":
                return <File className="h-4 w-4 text-yellow-500" />
            case "video/mp4":
            case "video/webm":
            case "video/ogg":
                return <File className="h-4 w-4 text-purple-500" />
            case "audio/mpeg":
            case "audio/ogg":
            case "audio/wav":
                return <File className="h-4 w-4 text-pink-500" />
            default:
                return <File className="h-4 w-4 text-gray-500" />
        }
    }

    const getDisplayPath = (file: File) => {
        if (file.webkitRelativePath) {
            return file.webkitRelativePath
        }
        return file.name
    }

    return (
        <div className={`border-2 border-dashed border-gray-300 rounded-lg p-4 ${className}`}>
            <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Selected Files</h3>
                <div className="text-sm text-gray-600">
                    Total files: <span className="font-semibold">{files.length}</span>
                    {" "}({<span className="font-semibold">{printSpace(totalSize)}</span>})
                </div>
            </div>

            <div className="overflow-auto max-h-60 scrollbar">
                <table className="ton-table">
                    <thead>
                        <tr>
                            <th>
                                <div className="flex items-center">
                                    {isFolder ? <Folder className="h-4 w-4 mr-2 text-blue-500" /> : <File className="h-4 w-4 mr-2 text-gray-500" />}
                                    File
                                </div>
                            </th>
                            <th>
                                <div className="flex items-center">
                                    Size
                                </div>
                            </th>
                            <th className="w-10">
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {files.map((file, index) => (
                            <tr key={`${file.name}-${index}`} className={`group ${index % 2 ? "" : "bg-gray-50"} transition-colors duration-200`}>
                                <td>
                                    <div className="flex items-center">
                                        {getFileIcon(file)}
                                        <span className="ml-2 text-sm" title={getDisplayPath(file)}>
                                            {getDisplayPath(file)}
                                        </span>
                                    </div>
                                </td>
                                <td style={{ whiteSpace: "nowrap", minWidth: 100 }}>
                                    <div className="flex items-center">
                                        <span className="text-sm">{printSpace(file.size)}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="flex items-center">
                                        <button
                                            onClick={() => onRemoveFile(index)}
                                            className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
                                            title="Remove file"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
