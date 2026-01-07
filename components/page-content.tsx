"use client"

import { useAppStore } from "@/store/useAppStore"
import { useEffect, useState } from "react";
import { useTonWallet, useTonConnectUI, useIsConnectionRestored } from "@tonconnect/ui-react";
import { login, proofPayload } from "@/lib/api"
import { safeDisconnect } from "@/lib/ton/safeDisconnect"
import WidgetsMap from "@/components/widgets-map"
import StorageUpload from "@/components/upload-widgets/storage-upload";
import StorageInfo from "@/components/upload-widgets/storage-info";
import ChooseProviders from "@/components/upload-widgets/choose-providers";
import { FilesList } from "@/components/files-list-widgets/files-list";
import { useTranslation } from "react-i18next";
import Details from "@/components/upload-widgets/details";
import { useIsMobile } from "@/hooks/useIsMobile";
import ChooseStoragePeriod from "@/components/upload-widgets/choose-storage-period";

export function PageContent() {
  const { t } = useTranslation();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet()
  const isConnectionRestored = useIsConnectionRestored();
  const { currentPage, setCurrentPage, upload, files, _hasHydrated } = useAppStore()
  const [fallbackTimer, setFallbackTimer] = useState(false)
  const widgetData = upload.widgetData
  const isMobile = useIsMobile();

  useEffect(() => {
    tonConnectUI.onStatusChange(async (w: any) => {
      console.log("TonConnect status changed:", w);

      if (!w) {
        useAppStore.getState().resetAll();
        return;
      }

      if (w.connectItems?.tonProof && "proof" in w.connectItems.tonProof) {
        try {
          console.log("Attempting to login with TON proof");
          const result = await login(
            w.account.address,
            w.connectItems.tonProof.proof,
            w.account.walletStateInit
          );
          if (result.status === 401) {
            console.error('login unauthorized. Logging out.');
            await safeDisconnect(tonConnectUI);
            return;
          }
          if (result.data === true) {
            console.log("Login successful");
          } else {
            console.error("Login failed. Logging out.");
            await safeDisconnect(tonConnectUI);
          }
        } catch (e) {
          console.error("Failed to login: \"" + e + "\". Logging out.");
          await safeDisconnect(tonConnectUI);
        }
      }

      tonConnectUI.setConnectRequestParameters(null);
    });

    tonConnectUI.setConnectRequestParameters({ state: "loading" });

    (async () => {
      const resp = await proofPayload();
      if (resp.status === 401) {
        console.error('proofPayload unauthorized. Logging out.');
        await safeDisconnect(tonConnectUI);
        return;
      }
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!_hasHydrated) {
        setFallbackTimer(true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [_hasHydrated])

  useEffect(() => {
    console.debug("Widget data changed:", widgetData);

    if (widgetData.selectedFiles && widgetData.newBagID && widgetData.newBagID.length === 64) {
      if (widgetData.selectedProviders && widgetData.selectedProviders.length > 0) {
        if (widgetData.storageContractAddress && widgetData.paymentStatus === 'success') {
          useAppStore.getState().setCurrentWidget(5)
        } else {
          useAppStore.getState().setCurrentWidget(4)
        }
      } else {
        useAppStore.getState().setCurrentWidget(3)
      }
    } else {
      if (widgetData.selectedFiles && widgetData.selectedFiles.length > 0) {
        useAppStore.getState().setCurrentWidget(2)
      } else {
        useAppStore.getState().setCurrentWidget(1)
      }
    }
  }, [widgetData])

  useEffect(() => {
    if (currentPage === 1 && widgetData.newBagID && (upload.currentWidget === 3 || upload.currentWidget === 4 || upload.currentWidget === 5)) {
      window.history.replaceState({}, '', `/${widgetData.newBagID}`);
    }
  }, [currentPage, widgetData.newBagID, upload.currentWidget])

  if ((!_hasHydrated && !fallbackTimer) || !isConnectionRestored) {
    return (<></>)
  }

  if (!wallet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="mt-1 text-gray-600">{t('connectWallet')}</p>
        </div>
      </div>
    )
  }

  const renderUploadWidget = () => {
    switch (upload.currentWidget) {
      case 1:
        return (
          <StorageUpload />
        )
      case 2:
        return (
          <Details />
        )
      case 3:
        return (
          <div className="w-full">
            <ChooseProviders />
          </div>
        )
      case 4:
        return (
          <div className="w-full">
            <ChooseStoragePeriod />
          </div>
        )
      case 5:
        return (
          <div className="w-full">
            <StorageInfo />
          </div>
        )
      default:
        return (
          <StorageUpload />
        )
    }
  }

  return (
    <div className="relative">
      <div className="space-y-8 sm:space-y-12 min-w-80 py-6 sm:py-12 max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex justify-center space-x-4 sm:space-x-20">
          <button
            className={`px-3 py-2 rounded-lg text-sm sm:text-base font-bold transition-colors ${currentPage === 1
              ? "text-blue-500 bg-blue-50"
              : "text-gray-700 hover:text-blue-500"
              }`}
            onClick={() => {
              window.location.href = '/';
            }}
          >
            <span className="hidden sm:inline">{t('layout.bagsUpload')}</span>
            <span className="sm:hidden">{t('layout.upload')}</span>
          </button>
          <button
            className={`px-3 py-2 rounded-lg text-sm sm:text-base font-bold transition-colors ${currentPage === 2
              ? "text-blue-500 bg-blue-50"
              : "text-gray-700 hover:text-blue-500"
              }`}
            onClick={() => {
              window.location.href = '/bags';
            }}
          >
            <span className="hidden sm:inline">{t('layout.myStoredBags')}</span>
            <span className="sm:hidden">{t('layout.myBags')}</span>
            <span className="text-gray-500 font-normal ml-1">({files.list.length})</span>
          </button>
        </div>

        {currentPage === 1 && (
          <div className={`flex flex-col items-center ${isMobile ? '' : 'w-4/5 mx-auto'}`}>
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
