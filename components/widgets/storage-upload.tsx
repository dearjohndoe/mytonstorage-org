"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Upload, FolderUp, Loader } from "lucide-react"
import { addFile, addFolder } from "@/lib/api"
import { AddedBag, FileMetadata } from "@/types/files"
import { useAppStore } from '@/store/useAppStore'
import { printSize, readAllFiles } from "@/lib/utils"
import { FileInfo } from "@/types/files"
import { ErrorComponent } from "../error"

declare module "react" {
  interface InputHTMLAttributes<T> extends React.AriaAttributes, React.DOMAttributes<T> {
    webkitdirectory?: string;
    mozdirectory?: string;
  }
}

export default function StorageUpload() {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [description, setDescription] = useState<string>("")
  const { updateWidgetData } = useAppStore()

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
        const validationError = validateFile(file);
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

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
    if (file.size > maxSize) {
      return `File "${file.name}" is too large. Maximum size is 10GB.`;
    }

    if (file.size === 0) {
      return `File "${file.name}" is empty.`;
    }

    return null;
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)

    const files = Array.from(e.target.files || [])
    if (files.length > 1) {
      setError("Only one file or folder can be uploaded at a time.")
      return
    }

    if (files.length === 0) {
      return
    }

    const validationError = validateFile(files[0]);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFiles(files)
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
    const resp = await addFile(file, { description } as FileMetadata, setProgressCallback)
    const addedBag = resp.data as AddedBag
    if (addedBag) {
      console.info("A")
      updateWidgetData({
        selectedFiles: [{ name: file.name, size: file.size, path: file.webkitRelativePath || null } as FileInfo],
        newBagID: addedBag.bag_id,
      })
    } else if (resp.error) {
      console.info("B")
      setError(resp.error)
    }
  }

  const sendFolder = async (files: File[], description: string, setProgressCallback: (progress: number) => void) => {
    const resp = await addFolder(files, { description } as FileMetadata, setProgressCallback)
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

    const files = Array.from(e.target.files || []);
    if (files.length === 0) {
      setError("No files found.");
      return;
    }

    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setFiles(files)
  }

  const TextField = ({ label, name }: { label: string, name: string }) => {
    const [localValue, setLocalValue] = useState(description)

    useEffect(() => {
      setLocalValue(description)
    }, [description])

    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-700" htmlFor={name}>{label}</label>
        <input type="text" name={name} id={name} value={localValue} onChange={e => setLocalValue(e.target.value)} onBlur={e => setDescription(e.target.value)} className="border rounded px-2 py-1 focus:ring-2 focus:ring-blue-200" />
      </div>
    )
  }

  return (
    <div>
      <ErrorComponent error={error} />

      <div className="grid grid-flow-col justify-stretch">
        {/* Drop area */}
        <div
          className={`w-full relative overflow-hidden m-0 border-2 border-dashed rounded-lg mt-8 flex flex-col items-center justify-center ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="m-10">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <Loader className="animate-spin h-8 w-8 text-blue-500 mb-4" />
                <p className="text-sm text-gray-500">Processing files, please wait...</p>
              </div>
            ) : (
              <>
                {files.length > 0 ? (
                  <div className="text-center">
                    {
                      files.length > 1 ? (
                        <>
                          <h3 className="text-lg font-medium mb-2">Selected Files</h3>
                          <p className="text-sm text-gray-500 mb-2">Total files: {files.length} ({printSize(files.reduce((acc, file) => acc + file.size, 0))})</p>
                        </>
                      ) : (
                        <>
                          <h3 className="text-lg font-medium mb-2">Selected File</h3>
                        </>
                      )}
                    <ul className="text-left text-sm text-gray-700">
                      {files.map((file, index) => (
                        <li key={index}>{file.webkitRelativePath || file.name} ({printSize(file.size)})</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">No Files Selected</h3>
                    <p className="text-sm text-gray-500">Drag and drop files here or use the buttons below</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    className="btn text-md flex items-center gap-2 border rounded px-4 py-2 m-4 hover:bg-gray-100"
                    onClick={() => document.getElementById("fileInput")?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {
                      files.length > 0 ? "Select Another File" : "Select File"
                    }
                    <input
                      type="file"
                      id="fileInput"
                      className="hidden"
                      onChange={handleFileInputChange}
                    />
                  </button>
                  <button
                    className="btn text-md flex items-center gap-2 border rounded px-4 py-2 m-4 hover:bg-gray-100"
                    onClick={() => document.getElementById("folderInput")?.click()}
                  >
                    <FolderUp className="h-4 w-4" />
                    {
                      files.length > 0 ? "Select Another Folder" : "Select Folder"
                    }
                    <input
                      type="file"
                      id="folderInput"
                      className="hidden"
                      {...({ webkitdirectory: "true", mozdirectory: "true" } as any)}
                      onChange={handleFolderInputChange}
                    />
                  </button>
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

        {files.length > 0 && (
          <div className="m-8 p-2 flex flex-col h-full">
            <h3 className="text-lg font-medium mb-2">Details</h3>
            <TextField label="Add description:" name="description" />
            <div className="flex justify-end mt-4">
              <button
                className="btn bg-blue-500 text-white px-4 py-2 rounded"
                onClick={sendFiles}
                disabled={isLoading || files.length === 0}
              >Upload</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
