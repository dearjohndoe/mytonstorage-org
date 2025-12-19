"use client"

import { ListChecks, PackageOpen, RefreshCw } from "lucide-react";
import React, { useEffect } from "react"
import { useTranslation } from "react-i18next";
import { NumberField } from "../input-number-field";
import { PeriodField } from "../input-period-field";
import { getProviders } from "@/lib/thirdparty";
import { Provider, Providers } from "@/types/mytonstorage";
import { filterAndSortProviders } from "@/lib/utils";
import { TextField } from "../input-text-field";
import { useAppStore } from "@/store/useAppStore";
import { getDeployTransaction, getOffers } from "@/lib/api";
import { InitStorageContract, ProviderInfo, Transaction } from "@/lib/types";
import { Offers, ProviderDecline } from "@/types/files";
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { safeDisconnect } from '@/lib/ton/safeDisconnect';
import { useIsMobile } from "@/hooks/useIsMobile";
import { ProvidersListMobile } from "./providers-list-mobile";
import { ProvidersListDesktop } from "./providers-list-desktop";
import { FiltersSection, locationStates, sortingStates } from "../filters";
import { StoragePeriodBalance } from "./storage-period-balance";
import { DAY_SECONDS, WEEK_DAYS } from "@/lib/storage-constants";

export default function ChooseProviders() {
  const { t } = useTranslation();
  const { upload, updateWidgetData } = useAppStore();
  const widgetData = upload.widgetData;
  const userAddress = useTonAddress(true);
  const [tonConnectUI] = useTonConnectUI();
  const isMobile = useIsMobile();

  const [isLoading, setIsLoading] = React.useState(false);
  const [offersLoading, setOffersLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [warn, setWarn] = React.useState<string | null>(null);
  const [providers, setProviders] = React.useState<ProviderInfo[]>([]);
  const [selectedProvidersCount, setSelectedProvidersCount] = React.useState(3);
  const [newProviderPubkey, setNewProviderPubkey] = React.useState("");
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [initialBalance, setInitialBalance] = React.useState<number>(0);
  const [hasDeclines, setHasDeclines] = React.useState<boolean>(false);
  const [canContinue, setCanContinue] = React.useState<boolean>(false);

  const [locationFilter, setLocationFilter] = React.useState<keyof typeof locationStates>("differentCountries");
  const [sortingFilter, setSortingFilter] = React.useState<keyof typeof sortingStates>("noSorting");

  const [allProviders, setAllProviders] = React.useState<Provider[]>([]);

  const [advanced, setAdvanced] = React.useState(false);

  const [proofPeriodDays, setProofPeriodDays] = React.useState<number>(WEEK_DAYS);   // one for all providers

  useEffect(() => {
    loadProviders();
  }, [widgetData.bagInfo]);

  useEffect(() => {
    setProofPeriodDays(WEEK_DAYS);
  }, [advanced]);

  useEffect(() => {
    if (allProviders.length > 0) {
      applyFilters();
    }
  }, [allProviders, locationFilter, sortingFilter, selectedProvidersCount]);

  useEffect(() => {
    if (!isLoading) {
      loadProviders();
    }
  }, [locationFilter, sortingFilter, selectedProvidersCount]);

  useEffect(() => {
    if (allProviders.length > 0) {
      const proofPeriodSec = proofPeriodDays * DAY_SECONDS;
      const hasProvidersToFilter = providers.find(p => p.provider.min_span >= proofPeriodSec || p.provider.max_span <= proofPeriodSec);
      if (hasProvidersToFilter) {
        applyFilters();
      }
    }
  }, [proofPeriodDays]);

  const handleLocationFilterChange = (newLocation: keyof typeof locationStates) => {
    setLocationFilter(newLocation);
  };

  const handleSortingFilterChange = (newSorting: keyof typeof sortingStates) => {
    setSortingFilter(newSorting);
  };

  const applyFilters = () => {
    const filteredProviders = filterAndSortProviders(
      allProviders,
      selectedProvidersCount,
      proofPeriodDays,
      locationFilter,
      sortingFilter
    );
    setProviders(filteredProviders.map(provider => ({
      provider,
      offer: null,
      decline: null
    } as ProviderInfo)));
  };

  useEffect(() => {
    const hasDeclinesUpdate = providers.some(p => p.decline != null && p.decline !== undefined);
    setHasDeclines(hasDeclinesUpdate);

    var notLoading = !offersLoading && !isLoading
    var dataIsValid = providers.length !== 0 && !hasDeclinesUpdate
    var hasEmptyOffers = providers.some(p => p.offer === null);

    setCanContinue(notLoading && dataIsValid && !hasEmptyOffers)
  }, [providers, offersLoading, isLoading]);

  const removeProvider = (pubkey: string) => {
    if (widgetData!.bagInfo!.created_at + widgetData!.freeStorage! < Math.floor(Date.now() / 1000)) {
      console.log("Bag storage time expired");
      setError(t('errors.storageTimeExpired'));
      return;
    }

    setProviders((prev) => prev.filter((p) => p.provider.pubkey !== pubkey));
    setWarn(null);
  };

  const addProvider = async (pubkey: string) => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setWarn(null);

    if (widgetData!.bagInfo!.created_at + widgetData!.freeStorage! < Math.floor(Date.now() / 1000)) {
      console.log("Bag storage time expired");
      setError(t('errors.storageTimeExpired'));
      return;
    }

    if (providers.find(p => p.provider.pubkey === pubkey)) {
      setWarn(t('chooseProviders.providerAlreadyAdded'));
      setIsLoading(false);
      return;
    }

    var newProviders: Provider[] = [];

    const resp = await getProviders([pubkey]);
    const prs = resp.data as Providers;
    if (prs) {
      newProviders = prs.providers;
      if (newProviders.length === 0) {
        setWarn(t('chooseProviders.noProvidersFound'));
        setIsLoading(false);
        return;
      }

      setProviders((prev) => [...prev, { provider: newProviders[0], offer: null, decline: null }]);
    } else if (resp && resp.error) {
      console.error("Failed to load providers:", resp.error);
      setError(resp.error);
    }

    setIsLoading(false);
    setNewProviderPubkey("");
  }

  const loadOffers = async () => {
    if (isLoading || offersLoading) {
      return;
    }

    setError(null);
    setWarn(null);

    if (widgetData!.bagInfo!.created_at + widgetData!.freeStorage! < Math.floor(Date.now() / 1000)) {
      console.log("Bag storage time expired");
      setError(t('errors.storageTimeExpired'));
      return;
    }

    if (providers.length === 0) {
      return;
    }

    setOffersLoading(true);

    const resp = await getOffers(providers.map(p => p.provider.pubkey), widgetData!.bagInfo!.bag_id, 0, proofPeriodDays * DAY_SECONDS);
    if (resp.status === 401) {
      setError(t('errors.unauthorizedLoggingOut'));
      console.error('getOffers unauthorized. Logging out.');
      safeDisconnect(tonConnectUI);
      setOffersLoading(false);
      return;
    }
    const data = resp.data as Offers;
    if (data) {
      if (data.offers && data.offers.length > 0) {
        // todo: update initialbalance based on offers

        const updatedProviders = providers.map(provider => {
          const offer = data.offers.find(o => o.provider.key.toLowerCase() === provider.provider.pubkey.toLowerCase()) || null;
          var decline: ProviderDecline | null = null;
          if (data.declines) {
            decline = data.declines.find(d => d.provider_key.toLowerCase() === provider.provider.pubkey.toLowerCase()) || null;
          }

          return { provider: provider.provider, offer: offer, decline: decline?.reason } as ProviderInfo;
        });

        if (data.declines && data.declines.length > 0) {
          setWarn(t('chooseProviders.someProvidersDeclinedWarn'));
        }

        setProviders(updatedProviders);
      }
    } else if (resp && resp.error) {
      console.error("Failed to fetch offers:", resp.error);
      setError(resp.error);
    }

    setOffersLoading(false);
  }

  const getDeployTx = async () => {
    if (isLoading) {
      return;
    }

    setError(null);
    setWarn(null);

    if (widgetData!.bagInfo!.created_at + widgetData!.freeStorage! < Math.floor(Date.now() / 1000)) {
      console.log("Bag storage time expired");
      setError(t('errors.storageTimeExpired'));
      return;
    }

    if (!initialBalance || !userAddress || !widgetData.newBagID || providers.length === 0) {
      console.error("Missing required data for deployment", initialBalance, userAddress, widgetData.newBagID, providers);
      return;
    }

    setIsLoading(true);
    try {
      const req = {
        bag_id: widgetData.newBagID,
        providers: providers.map((p) => {
          return p.provider.pubkey;
        }),
        amount: initialBalance,
        owner_address: userAddress,
        span: proofPeriodDays * DAY_SECONDS,
      } as InitStorageContract;
      const resp = await getDeployTransaction(req);
      if (resp.status === 401) {
        setError(t('errors.unauthorizedLoggingOut'));
        console.error('getDeployTransaction unauthorized. Logging out.');
        safeDisconnect(tonConnectUI);
        setIsLoading(false);
        return;
      }
      var tx = resp.data as Transaction;
      if (tx) {
        console.log("Got deploy transaction:", tx);

        updateWidgetData({
          providersCount: providers.length,
          selectedProviders: providers.map(p => p.provider.pubkey),
          transaction: tx,
        })
      } else if (resp && resp.error) {
        console.error("Failed to get deploy transaction:", resp.error);
        setError(resp.error);
      }
    } catch (error) {
      console.error("Failed to get deploy transaction:", error);
      setError(t('chooseProviders.failedToGetDeployTransaction'));
    } finally {
      setIsLoading(false);
    }
  }

  const loadProviders = async () => {
    if (isLoading) {
      return;
    }

    if (widgetData!.bagInfo!.created_at + widgetData!.freeStorage! < Math.floor(Date.now() / 1000)) {
      console.log("Bag storage time expired");
      setError(t('errors.storageTimeExpired'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setWarn(null);

    const resp = await getProviders();
    const prv = resp.data as Providers;
    if (prv) {
      console.info("Loaded providers:", prv);
      if (prv.providers.length === allProviders.length) {
        applyFilters();
      } else {
        setAllProviders(prv.providers);
      }
    } else if (resp && resp.error) {
      console.error("Failed to load providers:", resp.error);
      setError(resp.error);
    }

    setIsLoading(false);
  };

  return (
    <div>
      {/* Provider list */}
      <div className="p-6 m-4 mb-2">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center">
            <ListChecks className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg pl-2 font-semibold text-gray-900">{t('chooseProviders.title')}</h2>
          </div>
        </div>

        {/* Error message */}
        {!isLoading && error && (
          <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg ">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        {
          !error && warn && (
            <div className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg">
              <p>{warn}</p>
            </div>
          )
        }

        <div className={`flex ${isMobile ? 'flex-col' : 'justify-center items-end'} gap-4 mt-4`}>
          <NumberField
            label={t('chooseProviders.chooseProvidersCount')}
            initialValue={selectedProvidersCount}
            min={1}
            max={256}
            isFloating={false}
            onChange={setSelectedProvidersCount}
          />
          <button
            className={`btn flex items-center border rounded px-4 py-2 hover:bg-gray-100 ${isMobile ? 'mt-2 justify-center' : 'mb-4'
              }`}
            onClick={loadProviders}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t('chooseProviders.reloadProviders')}
          </button>
        </div>

        {/* Filters */}
        <FiltersSection
          locationFilter={locationFilter}
          sortingFilter={sortingFilter}
          onLocationFilterChange={handleLocationFilterChange}
          onSortingFilterChange={handleSortingFilterChange}
          isMobile={isMobile}
        />

        <div className="mt-6 relative">
          {!isLoading && providers.length > 0 && (
            <>
              <div className="flex justify-end -mb-0 relative z-10">
                <button
                  onClick={() => {
                    setProofPeriodDays(WEEK_DAYS);
                    setAdvanced(!advanced);
                  }}
                  disabled={isLoading || offersLoading || canContinue}
                  className="absolute -top-6 right-0 text-sm text-gray-600 hover:text-gray-800 disabled:cursor-not-allowed"
                >
                  {advanced ? t('chooseProviders.hideAdvanced') : t('chooseProviders.showAdvanced')}
                </button>
              </div>

              {
                advanced && (
                  <div className="rounded-lg border bg-gray-50 border-gray-50">
                    {/* Proof period selector */}
                    <div className="mt-4 mb-2">
                      <PeriodField
                        label={t('chooseProviders.storageProofEach')}
                        suffix={t('time.day')}
                        value={proofPeriodDays}
                        onChange={setProofPeriodDays}
                        disabled={isLoading || offersLoading}
                        isMobile={isMobile ?? false}
                      />
                    </div>

                    <div className={`flex ${isMobile ? 'flex-col' : 'justify-center items-end'} gap-4 mt-2`}>
                      <TextField
                        label={t('chooseProviders.addCustomProvider')}
                        onChange={(value) => setNewProviderPubkey(value)}
                        placeholder={t('chooseProviders.placeholderPubkey')}
                      />
                      {
                        newProviderPubkey && newProviderPubkey.length === 64 &&
                        <button
                          className={`btn text-md flex items-center border rounded px-4 py-2 hover:bg-gray-100 ${isMobile ? 'mt-2 justify-center' : 'mb-4'
                            }`}
                          onClick={() => addProvider(newProviderPubkey)}
                          disabled={isLoading || !newProviderPubkey}
                        >
                          <PackageOpen className="h-4 w-4 mr-2" />
                          {t('chooseProviders.loadInfo')}
                        </button>
                      }
                    </div>
                  </div>
                )
              }

              {isMobile ? (
                <ProvidersListMobile
                  providers={providers}
                  copiedKey={copiedKey}
                  setCopiedKey={setCopiedKey}
                  removeProvider={removeProvider}
                />
              ) : (
                <ProvidersListDesktop
                  providers={providers}
                  copiedKey={copiedKey}
                  advanced={advanced}
                  setCopiedKey={setCopiedKey}
                  removeProvider={removeProvider}
                />
              )}

              {/* Selected providers count */}
              <div className={`${isMobile ? 'px-1' : 'm-4'}`}>
                  <p className={`text-sm text-gray-600 ${isMobile ? 'text-center mt-4' : 'text-right'}`}>
                  {t('chooseProviders.providersCountInfo', { count: providers.length })}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Storage period and balance */}
        <StoragePeriodBalance
          proofPeriodDays={proofPeriodDays}
          providers={providers}
          initialStorageDays={WEEK_DAYS * 4}
          disabled={isLoading || offersLoading}
          isMobile={isMobile ?? false}
          onBalanceChange={(balance) => {
            setInitialBalance(balance);
          }}
        />

        {/* Go next step */}
        {canContinue ? (
          <div className="flex flex-col gap-4">
            <div className={`flex ${isMobile ? 'justify-center' : 'justify-end'} mt-8`}>
                <button
                className="btn px-4 py-2 rounded bg-blue-500 text-white"
                onClick={getDeployTx}
                disabled={hasDeclines || isLoading}
              >
                {t('chooseProviders.confirmContinue')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-6 h-16">
            <div className={`flex ${isMobile ? 'justify-center' : 'justify-end'} mt-8`}>
              <button
                className="btn flex items-center border rounded px-4 py-2 hover:bg-gray-100"
                onClick={loadOffers}
                disabled={offersLoading || hasDeclines || isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${offersLoading ? 'animate-spin' : ''}`} />
                {t('chooseProviders.loadOffers')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
