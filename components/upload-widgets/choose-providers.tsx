"use client"

import { ListChecks, PackageOpen, RefreshCw } from "lucide-react";
import React, { useEffect } from "react"
import { NumberField } from "../input-number-field";
import { getProviders } from "@/lib/thirdparty";
import { Provider, Providers } from "@/types/mytonstorage";
import { shuffleProviders } from "@/lib/utils";
import { TextField } from "../input-text-field";
import { useAppStore } from "@/store/useAppStore";
import { getDeployTransaction, getOffers } from "@/lib/api";
import { InitStorageContract, ProviderInfo, Transaction } from "@/lib/types";
import { Offers, ProviderDecline } from "@/types/files";
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { safeDisconnect } from '@/lib/ton/safeDisconnect';
import { ThreeStateField } from "../tri-state-field";
import { TwoStateField } from "../two-state-field";
import { useIsMobile } from "@/hooks/useIsMobile";
import { ProvidersListMobile } from "./providers-list-mobile";
import { ProvidersListDesktop } from "./providers-list-desktop";

const defaultInitBalance = 500000000; // 0.5 TON
const feeMin = 50000000; // 0.05 TON

export default function ChooseProviders() {
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
  const [initialBalance, setInitialBalance] = React.useState<number>(defaultInitBalance);
  const [minInitialBalance, setMinInitialBalance] = React.useState<number>(defaultInitBalance);
  const [hasDeclines, setHasDeclines] = React.useState<boolean>(false);
  const [canContinue, setCanContinue] = React.useState<boolean>(false);

  const [allProviders, setAllProviders] = React.useState<Provider[]>([]);
  const [locationFilter, setLocationFilter] = React.useState<boolean>(true);
  const [sortingFilter, setSortingFilter] = React.useState<boolean>(true);
  const [randomFilter, setRandomFilter] = React.useState<boolean>(true);

  useEffect(() => {
    loadProviders();
  }, [widgetData.bagInfo]);

  useEffect(() => {
    if (allProviders.length > 0) {
      applyFilters();
    }
  }, [allProviders, locationFilter, sortingFilter, randomFilter, selectedProvidersCount]);

  const handleLocationFilterChange = (value: boolean) => {
    setLocationFilter(value);
    setRandomFilter(false);
  };

  const handleSortingFilterChange = (value: boolean) => {
    setSortingFilter(value);
    setRandomFilter(false);
  };

  const applyFilters = () => {
    const filteredProviders = filterAndSortProviders(allProviders, selectedProvidersCount);
    setProviders(filteredProviders.map(provider => ({
      provider,
      offer: null,
      decline: null
    } as ProviderInfo)));
  };

  useEffect(() => {
    updateMinPrice();
  }, [providers]);

  const filterAndSortProviders = (providersToFilter: Provider[], count: number): Provider[] => {
    let filteredProviders = [...providersToFilter];

    if (randomFilter === false) {
      // Filtering by location/city
      if (locationFilter === true) {
        const countriesMap = new Map<string, Provider[]>();
        filteredProviders.forEach(provider => {
          const country = provider.location?.country || 'Unknown';
          if (!countriesMap.has(country)) {
            countriesMap.set(country, []);
          }
          countriesMap.get(country)!.push(provider);
        });

        filteredProviders = [];
        for (const countryProviders of countriesMap.values()) {
          const bestProvider = countryProviders.sort((a, b) => {
            if (sortingFilter === true) {
              return (b.rating || 0) - (a.rating || 0);
            }

            return (b.price || 0) - (a.price || 0);
          })[0];
          filteredProviders.push(bestProvider);
        }
      } else if (locationFilter === false) {
        const citiesMap = new Map<string, Provider[]>();
        filteredProviders.forEach(provider => {
          const city = provider.location?.city || provider.location?.country || 'Unknown';
          if (!citiesMap.has(city)) {
            citiesMap.set(city, []);
          }
          citiesMap.get(city)!.push(provider);
        });

        filteredProviders = [];
        for (const cityProviders of citiesMap.values()) {
          const bestProvider = cityProviders.sort((a, b) => {
            if (sortingFilter === true) {
              return (b.rating || 0) - (a.rating || 0);
            }

            return (b.price || 0) - (a.price || 0);
          })[0];
          filteredProviders.push(bestProvider);
        }
      }

      // Sorting by rating/price
      if (sortingFilter === true) {
        filteredProviders.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else {
        filteredProviders.sort((a, b) => (a.price || 0) - (b.price || 0));
      }
    }

    // If random
    return shuffleProviders(filteredProviders, count);
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
      setError("Storage time expired. Please start over.");
      return;
    }

    setProviders((prev) => prev.filter((p) => p.provider.pubkey !== pubkey));
    setWarn(null);
  };

  const updateMinPrice = () => {
    const providersPrice = providers.reduceRight((prev, curr) => {
      var v = curr.offer?.price_per_proof || 0
      if (v !== 0) {
        v += feeMin
      }
      return prev + v;
    }, 0);

    const minBalance = Math.max(providersPrice, defaultInitBalance)
    setInitialBalance(Math.max(minBalance, initialBalance));
    setMinInitialBalance(minBalance)
  }

  const addProvider = async (pubkey: string) => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setWarn(null);

    if (widgetData!.bagInfo!.created_at + widgetData!.freeStorage! < Math.floor(Date.now() / 1000)) {
      console.log("Bag storage time expired");
      setError("Storage time expired. Please start over.");
      return;
    }

    if (providers.find(p => p.provider.pubkey === pubkey)) {
      setWarn("Provider already added.");
      setIsLoading(false);
      return;
    }

    var newProviders: Provider[] = [];

    const resp = await getProviders([pubkey]);
    const prs = resp.data as Providers;
    if (prs) {
      newProviders = prs.providers;
      if (newProviders.length === 0) {
        setWarn("No providers found with the given pubkey.");
        setIsLoading(false);
        return;
      }

      setProviders((prev) => [...prev, { provider: newProviders[0], offer: null, decline: null }]);
    } else if (resp && resp.error) {
      console.error("Failed to load providers:", resp.error);
      setError(resp.error);
    }

    setIsLoading(false);
  }

  const loadOffers = async () => {
    if (isLoading || offersLoading) {
      return;
    }

    setError(null);
    setWarn(null);

    if (widgetData!.bagInfo!.created_at + widgetData!.freeStorage! < Math.floor(Date.now() / 1000)) {
      console.log("Bag storage time expired");
      setError("Storage time expired. Please start over.");
      return;
    }

    if (providers.length === 0) {
      return;
    }

    setOffersLoading(true);

    const resp = await getOffers(providers.map(p => p.provider.pubkey), widgetData!.bagInfo!.bag_id, 0);
    if (resp.status === 401) {
      setError('Unauthorized. Logging out.');
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
          setWarn("Some providers declined or has errors. You can remove them from list, try again or reload providers list.");
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
      setError("Storage time expired. Please start over.");
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
      } as InitStorageContract;
      const resp = await getDeployTransaction(req);
      if (resp.status === 401) {
        setError('Unauthorized. Logging out.');
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
      setError("Failed to get deploy transaction. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoading) {
      loadProviders();
    }
  }, [locationFilter, sortingFilter, randomFilter, selectedProvidersCount]);

  const loadProviders = async () => {
    if (isLoading) {
      return;
    }

    if (widgetData!.bagInfo!.created_at + widgetData!.freeStorage! < Math.floor(Date.now() / 1000)) {
      console.log("Bag storage time expired");
      setError("Storage time expired. Please start over.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setWarn(null);

    const resp = await getProviders();
    const prv = resp.data as Providers;
    if (prv) {
      console.info("Loaded providers:", prv);
      setAllProviders(prv.providers);
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
            <h2 className="text-lg pl-2 font-semibold text-gray-900">Configure contract</h2>
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
            label="Choose providers count"
            initialValue={selectedProvidersCount}
            min={1}
            max={256}
            onChange={setSelectedProvidersCount}
          />
          <button
            className={`btn flex items-center border rounded px-4 py-2 hover:bg-gray-100 ${
              isMobile ? 'mt-2 justify-center' : 'mb-4'
              }`}
            onClick={loadProviders}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Reload providers
          </button>
        </div>

        {/* Filters */}
        <div className={isMobile ? 'mt-6' : ''}>
          <p className="text-center text-gray-700 justify-self-start mt-4">
            Filters:
          </p>
          <div className={`flex ${isMobile ? 'gap-4' : ' gap-16'} flex-wrap items-center justify-center items-end`}>
            <ThreeStateField
              states={["From different Countries", "From different Cities", "Any Location"]}
              colors={["bg-blue-300", "bg-blue-300", "bg-gray-200"]}
              value={locationFilter}
              disabled={randomFilter}
              onChange={handleLocationFilterChange}
            />
            <ThreeStateField
              states={["Sort by Rating", "Sort by Price", "No Sorting"]}
              colors={["bg-blue-300", "bg-blue-300", "bg-gray-200"]}
              value={sortingFilter}
              disabled={randomFilter}
              onChange={handleSortingFilterChange}
            />
            <TwoStateField
              states={["Random", "Deterministic"]}
              colors={["bg-yellow-300", "bg-gray-200"]}
              value={randomFilter}
              onChange={setRandomFilter}
            />
          </div>
        </div>

        <div className="mt-6">
          {!isLoading && providers.length > 0 && (
            <>
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
                  setCopiedKey={setCopiedKey}
                  removeProvider={removeProvider}
                />
              )}

              {/* Selected providers count */}
              <div className={`${isMobile ? 'px-1' : 'm-4'}`}>
                <p className={`text-sm text-gray-600 ${isMobile ? 'text-center mt-4' : 'text-right'}`}>
                  Providers count: {providers.length}
                </p>
              </div>
            </>
          )}

          <div className={`flex ${isMobile ? 'flex-col' : 'justify-center items-end'} gap-4 mt-8`}>
            <TextField
              label="Add custom provider"
              onChange={(value) => setNewProviderPubkey(value)}
              placeholder="Pubkey"
            />
            {
              newProviderPubkey && newProviderPubkey.length === 64 &&
              <button
                className={`btn text-md flex items-center border rounded px-4 py-2 hover:bg-gray-100 ${
                  isMobile ? 'mt-2 justify-center' : 'mb-4'
                  }`}
                onClick={() => addProvider(newProviderPubkey)}
                disabled={isLoading || !newProviderPubkey}
              >
                <PackageOpen className="h-4 w-4 mr-2" />
                Load info
              </button>
            }
          </div>
        </div>

        {/* Storage period */}
        {/* <div className="m-10">
          <div className="flex justify-center items-end gap-4 mt-4">
            <NumberField
              label="Set storage period in days"
              initialValue={storageDays}
              min={secondsToDays(minRange || oneDayInSeconds)}
              max={3650}
              onChange={handleDaysChange}
            />
            <DateField
              label="or pick a date"
              onChange={handleDateChange}
              minDate={computeMinDate()}
              value={computeDateFromDays(storageDays)}
            />
          </div>
        </div> */}

        {/* Price info */}
        <div className={`${isMobile ? 'm-4' : 'm-10'}`}>
          <div className={`flex justify-center items-end gap-4 mt-4`}>
            <NumberField
              label="Init balance"
              initialValue={initialBalance / 1_000_000_000}
              min={minInitialBalance / 1_000_000_000}
              max={100}
              offValidator={true}
              onChange={(val) => {
                setInitialBalance(Math.ceil(val * 1_000_000_000));
              }}
            />
          </div>
          <div className={`flex justify-center text-sm text-gray-500 ${isMobile ? 'mt-2' : ''}`}>
            <span>The minimum for 7 days is {minInitialBalance / 1_000_000_000} TON</span>
          </div>
        </div>

        {/* Go next step */}
        <div className="flex flex-col gap-4">
          <div className={`flex ${isMobile ? 'justify-center' : 'justify-end'} mt-8`}>
            {!canContinue && (
              <button
                className="btn flex items-center border rounded px-4 py-2 hover:bg-gray-100"
                onClick={loadOffers}
                disabled={offersLoading || hasDeclines || isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${offersLoading ? 'animate-spin' : ''}`} />
                Load offers
              </button>
            )}

            {canContinue && (
              <button
                className="btn px-4 py-2 rounded bg-blue-500 text-white"
                onClick={getDeployTx}
                disabled={hasDeclines || isLoading}
              >
                Confirm and continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
