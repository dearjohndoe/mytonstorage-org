"use client"

import type React from "react"

import { useState } from "react"
import { useTranslation } from "react-i18next";
import { Upload, FolderUp } from "lucide-react"
import { printSpace, readAllFiles } from "@/lib/utils"
import { ErrorComponent } from "../error"
import { FilesUploadList } from "../files-upload-list"
import { useIsMobile } from "@/hooks/useIsMobile";
import { useAppStore } from "@/store/useAppStore";

declare module "react" {
  interface InputHTMLAttributes<T> extends React.AriaAttributes, React.DOMAttributes<T> {
    webkitdirectory?: string;
    mozdirectory?: string;
  }
}

const maxFileSize = 4 * 1024 * 1024 * 1024;

export default function StorageUpload() {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | React.ReactNode | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const isMobile = useIsMobile();
  const { updateWidgetData } = useAppStore()
  const [manageFilesFirst, setManageFilesFirst] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const nextStep = (f: File[]) => {
    updateWidgetData({ selectedFiles: f })
  }

  const validateSize = (size: number): string | React.ReactNode | null => {
    if (size > maxFileSize) {
      return (
        <span>
          {t('upload.fileTooLarge')} &nbsp;
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

  const handleDrop = async (e: React.DragEvent) => {
    setError(null)
    e.preventDefault()
    setIsDragging(false)

    const items = Array.from(e.dataTransfer.items)

    if (items.length === 0) {
      setError(t('upload.noFilesDropped'))
      return
    }

    const entries = items.map(item => item.webkitGetAsEntry()).filter(entry => entry !== null)

    if (entries.length === 0) {
      setError(t('upload.noValidFilesOrFolders'))
      return
    }

    try {
      const allFiles = await readAllFiles(entries)

      handleFiles(allFiles)
    } catch (error) {
      console.error("Error reading dropped files:", error)
      setError(t('upload.failedToReadDropped'))
    }
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) {
      return;
    }

    handleFiles(newFiles);
  }

  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)

    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) {
      setError(t('upload.noFilesFound'));
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

  const addFilesButtons = () => {
    var buttonStyle = "btn text-md text-white flex items-center gap-2 rounded px-4 py-2 m-4 bg-blue-500 hover:bg-blue-400"
    var fileButtonTitle = t('upload.uploadFiles')

    if (!isMobile && files.length > 0 && manageFilesFirst) {
      buttonStyle = "btn text-md flex items-center gap-2 border rounded px-4 py-2 m-4 hover:bg-gray-100"
      fileButtonTitle = t('upload.addFiles')
    }
    
    return (
      <div className={`flex justify-center ${isMobile ? 'flex-col gap-2' : ''}`}>

        <button
          className={buttonStyle}
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          <Upload className="h-4 w-4" />
          {fileButtonTitle}
          <input
            type="file"
            id="fileInput"
            className="hidden"
            multiple
            onChange={handleFileInputChange}
          />
        </button>
        <button
          className={buttonStyle}
          onClick={() => document.getElementById("folderInput")?.click()}
        >
          <FolderUp className="h-4 w-4" />
          {t('upload.selectFolder')}
          <input
            type="file"
            id="folderInput"
            className="hidden"
            {...({ webkitdirectory: "true", mozdirectory: "true" } as any)}
            onChange={handleFolderInputChange}
          />
        </button>
      </div>
    )
  }

  const handleFiles = (newFiles: File[]) => {
    for (const file of newFiles) {
      const validationError = validateSize(file.size);
      if (validationError) {
        setError(validationError);
        return;
      }
    }


    const allFilesUnique = (() => {
      const seen = new Map<string, File>();
      const genKey = (f: File) => `${(f as any).webkitRelativePath || f.name}-${f.size}-${f.lastModified}`;
      for (const f of files) seen.set(genKey(f), f);
      for (const f of newFiles) {
        const key = genKey(f);
        if (!seen.has(key)) seen.set(key, f);
      }
      return Array.from(seen.values());
    })();
    const totalSize = allFilesUnique.reduce((acc, file) => acc + file.size, 0);
    const validationError = validateSize(totalSize);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFiles(allFilesUnique);

    if (manageFilesFirst) {
      console.info("Managing files first, not proceeding to next step yet.");
      return;
    }

    console.info("Proceeding to next step with files:", allFilesUnique);
    nextStep(allFilesUnique);
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
  }

  return (
    <div className="w-full">
      {/* Drop area */}
      <ErrorComponent error={error} />

      <div
        className={`w-full border-2 border-dashed rounded-lg ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="py-10 px-6 w-full">
          <>
            {files.length > 0 && manageFilesFirst ? (
              <div className="w-full">
                <FilesUploadList
                  files={files}
                  onRemoveFile={removeFile}
                  className="border-none p-0"
                />
              </div>
            ) : (
              <div className="text-center">
                {
                  !isMobile &&
                  <p className="text-sm text-gray-500">{t('upload.dragDropHint')}</p>
                }
              </div>
            )}

            <div>
              {
                addFilesButtons()
              }

              {
                !files || files.length === 0 && (
                  <p className="text-center text-xs text-gray-400">{t('upload.maxFileSize', { size: printSpace(maxFileSize) })}</p>
                )
              }
              {
                !isMobile && files.length === 0 && (
                  <div className="flex items-center justify-center mt-2">
                    <label className="flex items-center space-x-2 cursor-pointer select-none text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={manageFilesFirst}
                        onChange={e => setManageFilesFirst(e.target.checked)}
                        className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span>{t('upload.manageFilesFirst')}</span>
                    </label>
                  </div>
                )
              }

              {
                !isMobile && files.length > 0 && manageFilesFirst && (
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      className="btn text-md flex items-center gap-2 border rounded px-4 py-2 h-10 hover:bg-gray-100"
                      onClick={() => setFiles([])}
                    >
                      {t('upload.resetFiles')}
                    </button>
                    
                    <button
                      className="btn text-md text-white flex items-center gap-2 rounded px-4 py-2 h-10 bg-blue-500 hover:bg-blue-400"
                      onClick={() => nextStep(files)}
                    >
                      {t('upload.proceedToDetails')}
                    </button>
                  </div>
                )
              }
            </div>
          </>
        </div>
      </div>
    </div>
  )
}
