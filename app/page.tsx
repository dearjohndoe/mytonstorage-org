"use client"

import { useIsMobile } from "@/hooks/useIsMobile"
import { useAppStore } from "@/store/useAppStore"
import React, { useEffect, useState } from "react";
import { useTonWallet, useTonConnectUI } from "@tonconnect/ui-react";
import { login, proofPayload } from "@/lib/api"
import NewBagInfo from "@/components/new-bag-info"
import WidgetsMap from "@/components/widgets-map"
import StorageUpload from "@/components/upload-widgets/storage-upload";
import Payment from "@/components/upload-widgets/payment";
import StorageInfo from "@/components/upload-widgets/storage-info";
import ChooseProviders from "@/components/upload-widgets/choose-providers";
import { FilesList } from "@/components/files-list-widgets/files-list";

function HomeContent() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet()
  const { currentPage, setCurrentPage, upload, files, _hasHydrated } = useAppStore()
  const [fallbackTimer, setFallbackTimer] = useState(false)
  const widgetData = upload.widgetData

  useEffect(() => {
    tonConnectUI.onStatusChange(async (w: any) => {
      console.log("TonConnect status changed:", w);
      if (!w) return;
      if (w.connectItems?.tonProof && "proof" in w.connectItems.tonProof) {
        try {
          console.log("Attempting to login with TON proof");
          const ok = await login(
            w.account.address,
            w.connectItems.tonProof.proof,
            w.account.walletStateInit
          );
          if (ok) {
            console.log("Login successful");
          } else {
            console.error("Login failed");
            await tonConnectUI.disconnect();
          }
        } catch (e) {
          console.error("Failed to login: " + e);
          await tonConnectUI.disconnect();
        }
      }

      tonConnectUI.setConnectRequestParameters(null);
    });

    tonConnectUI.setConnectRequestParameters({ state: "loading" });

    (async () => {
      const resp = await proofPayload();
      const payload = resp.data as string | null;
      if (payload) {
        tonConnectUI.setConnectRequestParameters({
          state: "ready",
          value: { tonProof: payload },
        });
      } else {
        tonConnectUI.setConnectRequestParameters(null);
      }
    })();
  }, [tonConnectUI]);

  // Fallback in case if onRehydrateStorage doesn't work
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!_hasHydrated) {
        setFallbackTimer(true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [_hasHydrated])

  // Switch widgets
  useEffect(() => {
    if (widgetData.selectedFiles && widgetData.newBagID && widgetData.newBagID.length === 64) {
      if (widgetData.selectedProviders && widgetData.selectedProviders.length > 0 && widgetData.transaction) {
        if (widgetData.storageContractAddress && widgetData.paymentStatus === 'success') {
          useAppStore.getState().setCurrentWidget(4)
        } else {
          useAppStore.getState().setCurrentWidget(3)
        }
      } else {
        useAppStore.getState().setCurrentWidget(2)
      }
    } else {
      useAppStore.getState().setCurrentWidget(1)
    }
  }, [widgetData])

  if ((!_hasHydrated && !fallbackTimer)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="mt-1 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!wallet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="mt-1 text-gray-600">Connect wallet to continue.</p>
        </div>
      </div>
    )
  }

  const renderUploadWidget = () => {
    switch (upload.currentWidget) {
      case 1:
        return (
          <div>
            <StorageUpload />
          </div>
        )
      case 2:
        return (
          <div>
            <NewBagInfo
              canCancel={true}
            />
            <ChooseProviders />
          </div>
        )
      case 3:
        return (
          <div>
            <NewBagInfo
              canCancel={true}
            />
            <Payment />
          </div>
        )
      case 4:
        return (
          <div>
            <NewBagInfo
              canCancel={false}
            />
            <StorageInfo />
          </div>
        )
      default:
        return (
          <div>
            <StorageUpload />
          </div>
        )
    }
  }

  return (
    <div className="relative">
      <div className="space-y-12 min-w-80 py-12 max-w-7xl mx-auto px-4">
        <div className="flex justify-center space-x-20">
          <button
            className={`${currentPage === 1 ? "text-blue-500 font-bold" : "text-gray-700 font-bold"
              }`}
            onClick={() => setCurrentPage(1)}
          >
            Upload new Bag
          </button>
          <button
            className={`${currentPage === 2 ? "text-blue-500 font-bold" : "text-gray-700 font-bold"
              }`}
            onClick={() => setCurrentPage(2)}
          >
            My stored Bags <span className="text-gray-500 font-normal">({files.list.length})</span>
          </button>
        </div>

        {currentPage === 1 && (
          <div>
            <WidgetsMap />
            {renderUploadWidget()}
          </div>
        )}

        {currentPage === 2 && (
          <div>
            <FilesList />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)

  if (isMobile || isMobile === undefined) {
    return <div className="text-center">Mobile view is not supported yet. Please use desktop version.</div>
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="mt-1 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return <HomeContent />
}
