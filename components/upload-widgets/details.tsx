"use client"

import { useEffect, useState } from "react"
import { addFile, addFolder } from "@/lib/api"
import { FileMetadata, UnpaidBags } from "@/types/files"
import { useAppStore } from '@/store/useAppStore'
import { useTonConnectUI } from '@tonconnect/ui-react';
import { safeDisconnect } from '@/lib/ton/safeDisconnect';
import { Loader } from "lucide-react"
import { useIsMobile } from "@/hooks/useIsMobile"
import { useTranslation } from "react-i18next"
import { ErrorComponent } from "../error"

export default function Details() {
    const isMobile = useIsMobile();
    const [error, setError] = useState<string | React.ReactNode | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [description, setDescription] = useState<string>("")
    const [tonConnectUI] = useTonConnectUI()
    const { upload, updateWidgetData } = useAppStore()
    const { t } = useTranslation();

    const sendFiles = async () => {
        setIsLoading(true)
        if (upload.widgetData.selectedFiles.length === 1) {
            const file = upload.widgetData.selectedFiles[0]
            await sendFile(file, description, setProgress)
        } else {
            await sendFolder(upload.widgetData.selectedFiles, description, setProgress)
        }

        setIsLoading(false)
        setProgress(0)
    }

    const prevStep = () => {
        updateWidgetData({ selectedFiles: [] })
    }

    const sendFile = async (file: File, description: string, setProgressCallback: (progress: number) => void) => {
        const resp = await addFile(file, { description } as FileMetadata, setProgressCallback)
        if (resp.status === 401) {
            setError(t('errors.unauthorizedLoggingOut'));
            console.error('addFile unauthorized. Logging out.');
            safeDisconnect(tonConnectUI);
            return;
        }
        const addedBag = resp.data as UnpaidBags
        if (addedBag && addedBag.bags.length > 0) {
            updateWidgetData({
                selectedFiles: [file],
                newBagID: addedBag.bags[0].bag_id,
                bagInfo: {
                    bag_id: addedBag.bags[0].bag_id,
                    user_address: addedBag.bags[0].user_address,
                    created_at: Math.floor(Date.now() / 1000),
                    description: addedBag.bags[0].description,
                    files_count: addedBag.bags[0].files_count,
                    bag_size: addedBag.bags[0].bag_size,
                },
                freeStorage: addedBag.free_storage,
            })
        } else if (resp.error) {
            setError(resp.error)
        }
    }

    const sendFolder = async (files: File[], description: string, setProgressCallback: (progress: number) => void) => {
        const resp = await addFolder(files, { description } as FileMetadata, setProgressCallback)
        if (resp.status === 401) {
            setError(t('errors.unauthorizedLoggingOut'));
            console.error('addFolder unauthorized. Logging out.');
            safeDisconnect(tonConnectUI);
            return;
        }

        const addedBag = resp.data as UnpaidBags
        if (addedBag && addedBag.bags.length > 0) {
            updateWidgetData({
                selectedFiles: files,
                newBagID: addedBag.bags[0].bag_id,
                bagInfo: {
                    bag_id: addedBag.bags[0].bag_id,
                    user_address: addedBag.bags[0].user_address,
                    created_at: Math.floor(Date.now() / 1000),
                    description: addedBag.bags[0].description,
                    files_count: addedBag.bags[0].files_count,
                    bag_size: addedBag.bags[0].bag_size,
                },
                freeStorage: addedBag.free_storage,
            })
        } else if (resp.error) {
            setError(resp.error)
        }
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
        <>
            <ErrorComponent error={error} />

            {
                isLoading ? (
                    <div className={`w-full p-4 relative overflow-hidden flex flex-col border border-gray-200 rounded-lg bg-gray-50`}>
                        <div className="flex flex-col items-center ">
                            <Loader className="animate-spin h-8 w-8 text-blue-500 mb-4" />
                            <p className="text-sm text-gray-500 mb-8">{t('upload.processingFiles')}</p>
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
                        </div>
                    </div>
                ) : (
                    <div className="w-full">
                        {/* Configure file details */}
                        <div className={`w-full p-4 flex flex-col border border-gray-200 rounded-lg bg-gray-50`}>
                            <h3 className="text-lg font-medium mb-4">{t('upload.details')}</h3>
                            <div className="flex-1 flex flex-col">
                                <TextField label={t('upload.addDescription')} name="description" />
                                <div className={`flex mt-8 ${isMobile ? 'justify-center w-full' : 'justify-end'}`}>
                                    <button
                                        className="btn px-4 py-2 text-md text-gray-700 flex items-center border rounded mx-4 hover:bg-gray-100"
                                        onClick={prevStep}
                                    >
                                        {t('upload.back')}
                                    </button>

                                    <button
                                        className="btn px-4 py-2 rounded bg-blue-500 text-white mx-4 disabled:cursor-not-allowed"
                                        onClick={sendFiles}
                                        disabled={isLoading}
                                    >
                                        {t('upload.uploadButton')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    )
}
