"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Upload, FolderUp, Loader } from "lucide-react"
import { addFile, addFolder } from "@/lib/api"
import { AddedBag, FileMetadata } from "@/types/files"
import { useAppStore } from '@/store/useAppStore'
import { printSpace, readAllFiles } from "@/lib/utils"
import { FileInfo } from "@/types/files"
import { ErrorComponent } from "../error"
import { FilesUploadList } from "../files-upload-list"
import { useTonConnectUI } from '@tonconnect/ui-react';
import { safeDisconnect } from '@/lib/ton/safeDisconnect';
import { useIsMobile } from "@/hooks/useIsMobile";

declare module "react" {
  interface InputHTMLAttributes<T> extends React.AriaAttributes, React.DOMAttributes<T> {
    webkitdirectory?: string;
    mozdirectory?: string;
  }
}

const maxFileSize = 4 * 1024 * 1024 * 1024;

export default function StorageUpload() {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | React.ReactNode | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [description, setDescription] = useState<string>("")
  const [tonConnectUI] = useTonConnectUI();
  const { updateWidgetData } = useAppStore()
  const isMobile = useIsMobile();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    setError(null)
    e.preventDefault()
    setIsDragging(false)

    const items = Array.from(e.dataTransfer.items)

    if (items.length === 0) {
      setError("No files dropped.")
      return
    }

    const entries = items.map(item => item.webkitGetAsEntry()).filter(entry => entry !== null)

    if (entries.length === 0) {
      setError("No valid files or folders dropped.")
      return
    }

    try {
      const allFiles = await readAllFiles(entries)

      if (allFiles.length === 0) {
        setError("No files found in dropped items.")
        return
      }

      for (const file of allFiles) {
        const validationError = validateSize(file.size);
        if (validationError) {
          setError(validationError);
          return;
        }
      }

      setFiles(allFiles)
    } catch (error) {
      console.error("Error reading dropped files:", error)
      setError("Failed to read dropped files.")
    }
  }

  const validateSize = (size: number): string | React.ReactNode | null => {
    if (size > maxFileSize) {
      return (
        <span>
          File is too large. For files larger than 4GB use&nbsp;
          <a
            href="https://github.com/xssnick/TON-Torrent"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            TON Torrent
          </a>
        </span>
      );
    }

    return null;
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)

    const newFiles = Array.from(e.target.files || [])
    if (newFiles.length === 0) {
      return
    }

    for (const file of newFiles) {
      const validationError = validateSize(file.size);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Add files
    setFiles(prevFiles => [...prevFiles, ...newFiles])
  }

  const sendFiles = async () => {
    setIsLoading(true)
    if (files.length === 1) {
      const file = files[0]
      await sendFile(file, description, setProgress)
    } else {
      await sendFolder(files, description, setProgress)
    }

    setIsLoading(false)
    setProgress(0)
  }

  const sendFile = async (file: File, description: string, setProgressCallback: (progress: number) => void) => {
    const validationError = validateSize(file.size);
    if (validationError) {
      setError(validationError);
      return;
    }

    const resp = await addFile(file, { description } as FileMetadata, setProgressCallback)
    if (resp.status === 401) {
      setError('Unauthorized. Logging out.');
      console.error('addFile unauthorized. Logging out.');
      safeDisconnect(tonConnectUI);
      return;
    }
    const addedBag = resp.data as AddedBag
    if (addedBag) {
      updateWidgetData({
        selectedFiles: [{ name: file.name, size: file.size, path: file.webkitRelativePath || null } as FileInfo],
        newBagID: addedBag.bag_id,
      })
    } else if (resp.error) {
      setError(resp.error)
    }
  }

  const sendFolder = async (files: File[], description: string, setProgressCallback: (progress: number) => void) => {
    const totalSize = files.reduce((acc, file) => acc + file.size, 0)
    const validationError = validateSize(totalSize);
    if (validationError) {
      setError(validationError);
      return;
    }

    const resp = await addFolder(files, { description } as FileMetadata, setProgressCallback)
    if (resp.status === 401) {
      setError('Unauthorized. Logging out.');
      console.error('addFolder unauthorized. Logging out.');
      safeDisconnect(tonConnectUI);
      return;
    }
    const addedBag = resp.data as AddedBag
    if (addedBag) {
      updateWidgetData({
        selectedFiles: files.map(file => ({ name: file.name, size: file.size, path: file.webkitRelativePath || null } as FileInfo)),
        newBagID: addedBag.bag_id,
      })
    } else if (resp.error) {
      setError(resp.error)
    }
  }

  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)

    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) {
      setError("No files found.");
      return;
    }

    for (const file of newFiles) {
      const validationError = validateSize(file.size);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setFiles(newFiles)
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
  }

  const TextField = ({ label, name }: { label: string, name: string }) => {
    const [localValue, setLocalValue] = useState(description)

    useEffect(() => {
      setLocalValue(description)
    }, [description])

    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-700" htmlFor={name}>{label}</label>
        <input
          type="text"
          name={name}
          id={name}
          value={localValue}
          onChange={e => setLocalValue(e.target.value.slice(0, 100))}
          onBlur={e => setDescription(e.target.value.slice(0, 100))}
          className="border rounded px-2 py-1 focus:ring-2 focus:ring-blue-200"
          maxLength={100}
        />
      </div>
    )
  }

  return (
    <div>
      <ErrorComponent error={error} />

      <div className={`flex gap-4 items-stretch ${isMobile ? 'flex-col' : ''}`}>
        {/* Drop area */}
        <div
          className={`${isMobile ? 'w-full' : 'w-2/3'} relative overflow-hidden m-0 border-2 border-dashed rounded-lg mt-2 flex flex-col items-center justify-center ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="py-10 px-6 w-full">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <Loader className="animate-spin h-8 w-8 text-blue-500 mb-4" />
                <p className="text-sm text-gray-500">Processing files, please wait...</p>
              </div>
            ) : (
              <>
                {files.length > 0 ? (
                  <div className="w-full">
                    <FilesUploadList
                      files={files}
                      onRemoveFile={removeFile}
                      className="border-none p-0"
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">No Files Selected</h3>
                    {
                      !isMobile &&
                      <p className="text-sm text-gray-500">Drag and drop files here or use the buttons below</p>
                    }
                  </div>
                )}

                <div>
                  <div className={`flex justify-center ${isMobile ? 'flex-col gap-2' : ''}`}>
                    <button
                      className="btn text-md flex items-center gap-2 border rounded px-4 py-2 m-4 hover:bg-gray-100"
                      onClick={() => document.getElementById("fileInput")?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Add File(s)
                      <input
                        type="file"
                        id="fileInput"
                        className="hidden"
                        multiple
                        onChange={handleFileInputChange}
                      />
                    </button>
                    <button
                      className="btn text-md flex items-center gap-2 border rounded px-4 py-2 m-4 hover:bg-gray-100"
                      onClick={() => document.getElementById("folderInput")?.click()}
                    >
                      <FolderUp className="h-4 w-4" />
                      Select Folder
                      <input
                        type="file"
                        id="folderInput"
                        className="hidden"
                        {...({ webkitdirectory: "true", mozdirectory: "true" } as any)}
                        onChange={handleFolderInputChange}
                      />
                    </button>
                  </div>
                  {
                    !files || files.length === 0 && (
                      <p className="text-center text-xs text-gray-400">Max file size: {printSpace(maxFileSize)}</p>
                    )
                  }
                </div>
              </>
            )}
          </div>

          {/* Progress bar */}
          {progress > 0 && (
            <>
              <div className="absolute bottom-0 left-0 w-full select-none pointer-events-none">
                <div className="text-center text-gray-700">
                  <p>{progress}%</p>
                </div>
                <div className="h-2 w-full bg-gray-200/60 backdrop-blur-sm">
                  <div
                    className="h-full bg-blue-500 transition-[width] duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Configure file details */}
        <div className={`${isMobile ? 'w-full mb-4' : 'w-1/3 mt-2 ml-4'} p-4 flex flex-col border border-gray-200 rounded-lg bg-gray-50`}>
          <h3 className="text-lg font-medium mb-4">Details</h3>
          <div className="flex-1 flex flex-col">
            <TextField label="Add description:" name="description" />
            <div className={`flex ${isMobile ? 'justify-center' : 'justify-end'} mt-auto pt-4`}>
              <button
                className="btn bg-blue-500 text-white px-4 py-2 rounded"
                onClick={sendFiles}
                disabled={isLoading || files.length === 0}
              >Upload</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}