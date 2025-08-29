"use client"

import { getUnpaid, removeFile } from "@/lib/api";
import { printSpace } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { FileText, Loader, Trash } from "lucide-react";
import React, { useEffect } from "react"
import { RenderField } from "./render-field";
import { CountdownTimer } from "./countdown-timer";
import { UnpaidBags } from "@/types/files";

// props
interface NewBagInfoProps {
  canCancel: boolean;
}

export default function NewBagInfo({ canCancel }: NewBagInfoProps) {
  const apiBase = (typeof process !== 'undefined' && process.env.PUBLIC_API_BASE) || "https://mytonstorage.org";
  const [isLoading, setIsLoading] = React.useState(false);
  const { upload, updateWidgetData, resetWidgetData } = useAppStore();
  const widgetData = upload.widgetData;

  useEffect(() => {
    if (!isLoading && widgetData.newBagID && widgetData.newBagID.length === 64 && !widgetData.bagInfo) {
      (async () => {
        setIsLoading(true);
        const resp = await getUnpaid();
        const bagInfo = resp.data as UnpaidBags;
        if (bagInfo && bagInfo.bags.length > 0) {
          updateWidgetData({
            bagInfo: bagInfo.bags[0],
            freeStorage: bagInfo.free_storage,
          })
        } else if (resp.error) {
          console.error("Failed to fetch bag info:", resp.error);
          console.error(resp.error)

          resetWidgetData();
        }

        setIsLoading(false);
      })();
    }
  }, [])

  const cancelStorage = async () => {
    setIsLoading(true);

    const resp = await removeFile(widgetData.newBagID as string);
    const ok = resp.data === true;
    if (ok) {
      console.log("Storage cancelled successfully");

      resetWidgetData();
    } else if (resp.error) {
      console.error("Failed to cancel storage:", resp.error);
    }

    setIsLoading(false);
  }

  if (!widgetData.selectedFiles || !widgetData.newBagID) {
    return null;
  }

  return (
    <div className="p-6 m-4 mb-8">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg pl-2 font-semibold text-gray-900">Bag info</h2>
        </div>
        {
          canCancel && (
            <div className="flex items-center">
              <Trash className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-700" />
              <button
                onClick={cancelStorage}
                className="pl-2 text-red-500 hover:text-red-700"
              >
                Cancel storage
              </button>
            </div>
          )
        }
      </div>

      {isLoading && (
        <div className="flex flex-col items-center">
          <Loader className="animate-spin h-8 w-8 text-blue-500 mb-4" />
          <p className="text-sm text-gray-500">Loading bag info, please wait...</p>
        </div>
      )}

      {!isLoading && !widgetData.bagInfo && (
        <p className="text-sm text-gray-500 text-center">No bag info available.</p>
      )}

      {!isLoading && widgetData.bagInfo && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <div>
                <RenderField
                  label="BagID"
                  value={widgetData.bagInfo.bag_id.toUpperCase()}
                  url={`${apiBase}/api/v1/gateway/${widgetData.bagInfo.bag_id.toUpperCase()}`}
                  copy={widgetData.bagInfo.bag_id.toUpperCase()} />
              </div>

              <div>
                <RenderField label="Description" value={widgetData.bagInfo.description || '—'} />
              </div>
            </div>

            <div className="space-y-3">

              <div>
                <RenderField label="Files Count" value={String(widgetData.bagInfo.files_count)} />
              </div>

              <div>
                <RenderField label="Bag size" value={printSpace(widgetData.bagInfo.bag_size)} />
              </div>

            </div>
          </div>
        </div>
      )}

      {
        widgetData && widgetData.bagInfo && (
          <div>
            <div className="flex mt-4 justify-end">
              <div className="flex items-center w-64">
                <span className="text-sm font-medium text-gray-700">Free storage:</span>
                <div className="mx-2">
                  <CountdownTimer
                    expirationTime={widgetData!.bagInfo!.created_at + (widgetData!.freeStorage || 0)}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>
  )
}
