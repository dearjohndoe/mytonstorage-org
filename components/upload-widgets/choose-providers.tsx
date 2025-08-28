"use client"

import { Copy, ListChecks, PackageOpen, RefreshCw, Star, X } from "lucide-react";
import React, { useEffect } from "react"
import { NumberField } from "../input-number-field";
import { getProviders } from "@/lib/thirdparty";
import { Provider, Providers } from "@/types/mytonstorage";
import { copyToClipboard, secondsToDays, shortenString, shuffleProviders } from "@/lib/utils";
import { TextField } from "../input-text-field";
import { useAppStore } from "@/store/useAppStore";
import { getDeployTransaction, getOffers } from "@/lib/api";
import { InitStorageContract, ProviderAddress, ProviderInfo, Transaction } from "@/lib/types";
import { Offers, ProviderDecline } from "@/types/files";
import { useTonAddress } from '@tonconnect/ui-react';

const defaultInitBalance = 500000000; // 0.5 TON

export default function ChooseProviders() {
  const { upload, updateWidgetData } = useAppStore();
  const widgetData = upload.widgetData;
  const userAddress = useTonAddress(true);

  const [isLoading, setIsLoading] = React.useState(false);
  const [offersLoading, setOffersLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [warn, setWarn] = React.useState<string | null>(null);
  const [providers, setProviders] = React.useState<ProviderInfo[]>([]);
  const [selectedProvidersCount, setSelectedProvidersCount] = React.useState(3);
  const [newProviderPubkey, setNewProviderPubkey] = React.useState("");
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [initialBalance, setInitialBalance] = React.useState<number>(defaultInitBalance);
  const [hasDeclines, setHasDeclines] = React.useState<boolean>(false);
  const [canContinue, setCanContinue] = React.useState<boolean>(false);

  useEffect(() => {
    if (!isLoading) {
      loadProviders();
    }
  }, []);

  useEffect(() => {
    const hasDeclinesUpdate = providers.some(p => p.decline != null && p.decline !== undefined);
    setHasDeclines(hasDeclinesUpdate);

    var notLoading = !offersLoading && !isLoading
    var dataIsValid = providers.length !== 0 && !hasDeclinesUpdate
    var hasEmptyOffers = providers.some(p => p.offer === null);

    setCanContinue(notLoading && dataIsValid && !hasEmptyOffers)
  }, [providers, offersLoading, isLoading]);

  const removeProvider = (pubkey: string) => {
    setProviders((prev) => prev.filter((p) => p.provider.pubkey !== pubkey));
    setWarn(null);
  };

  const addProvider = async (pubkey: string) => {
    setIsLoading(true);
    setError(null);
    setWarn(null);

    var newProviders: Provider[] = [];

    const resp = await getProviders([pubkey]);
    const providers = resp.data as Providers;
    if (providers) {
      newProviders = providers.providers;
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
    setError(null);
    setWarn(null);

    if (!widgetData.bagInfo || providers.length === 0) {
      return;
    }

    setOffersLoading(true);

    const resp = await getOffers(providers.map(p => p.provider.pubkey), widgetData.bagInfo.bag_id, 0);
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
    setError(null);
    setWarn(null);

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

  const loadProviders = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setWarn(null);

    const resp = await getProviders();
    const prv = resp.data as Providers;
    if (prv) {
      console.info("Loaded providers:", prv);
      const shuffledProviders = shuffleProviders(prv.providers, selectedProvidersCount)
      setProviders(shuffledProviders.map(provider => ({
        provider,
        offer: null,
        decline: null
      } as ProviderInfo)));
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
          <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
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

        <div className="flex justify-center items-end gap-4 mt-4">
          <NumberField
            label="Choose providers count"
            initialValue={selectedProvidersCount}
            min={1}
            max={256}
            onChange={setSelectedProvidersCount}
          />
          <button
            className="btn flex items-center border rounded px-4 py-2 hover:bg-gray-100 mb-4"
            onClick={loadProviders}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Reload providers
          </button>
        </div>

        <div className="mt-3">
          {!isLoading && providers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="ton-table overscroll-x-auto">
                <thead>
                  <tr>
                    <th>
                      <div className="flex items-center">
                        Public Key
                      </div>
                    </th>
                    <th>
                      <div className="flex items-center">
                        Location
                      </div>
                    </th>
                    <th>
                      <div className="flex items-center">
                        Rating
                      </div>
                    </th>
                    <th>
                      <div className="flex items-center">
                        Proof every
                      </div>
                    </th>
                    <th>
                      <div className="flex items-center">
                        Price per proof
                      </div>
                    </th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((p, index) => (
                    <React.Fragment key={p.provider.pubkey}>
                      <tr key={p.provider.pubkey} className={`group ${index % 2 ? "" : "bg-gray-50"} transition-colors duration-200`}>
                        <td>
                          <div className="flex items-center">
                            <span className="font-mono text-sm">{shortenString(p.provider.pubkey, 15)}</span>
                            <button
                              onClick={() => copyToClipboard(p.provider.pubkey, setCopiedKey)}
                              className={`ml-2 transition-colors duration-200
                                ${copiedKey === p.provider.pubkey
                                  ? "text-gray-100 font-extrabold drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]"
                                  : "text-gray-700 hover:text-gray-400"
                                }`}
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td>
                          {p.provider.location ? (
                            <div className="flex items-center">
                              <span className="text-sm">{p.provider.location.country}{p.provider.location.city ? `, ${p.provider.location.city}` : ""}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Unknown</span>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-transparent group-hover:fill-yellow-400 transition-all duration-200" />
                            <span className="ml-2">{p.provider.rating.toFixed(2)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center">
                            {p.decline ? (
                              <span className="text-sm text-red-500">{p.decline}</span>
                            ) : (p.offer ? (
                              <span className="">{secondsToDays(p.offer.offer_span)} days</span>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center">
                            {p.offer ? (
                              <span className="">{(p.offer.price_per_proof / 1_000_000_000).toFixed(4)} TON</span>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => removeProvider(p.provider.pubkey)}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <X className="h-5 w-5 text-red-500" />
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-center items-end gap-4 mt-8">
            <TextField
              label="Add custom provider"
              onChange={(value) => setNewProviderPubkey(value)}
              placeholder="Pubkey"
            />
            <button
              className="btn text-md flex items-center border rounded px-4 py-2 hover:bg-gray-100 mb-4"
              onClick={() => addProvider(newProviderPubkey)}
              disabled={isLoading || !newProviderPubkey}
            >
              <PackageOpen className="h-4 w-4 mr-2" />
              Load info
            </button>
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
        <div className="m-10">
          <div className="flex justify-center items-end gap-4 mt-4">
            <NumberField
              label="Init balance"
              initialValue={initialBalance / 1_000_000_000}
              min={0.5}
              max={100}
              offValidator={true}
              onChange={(val) => {
                setInitialBalance(Math.ceil(val * 1_000_000_000));
              }}
            />
          </div>
          <div className="flex justify-center text-sm text-gray-500">
            <span>The minimum value is 0.5 TON</span>
          </div>
        </div>

        {/* Go next step */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-end mt-8">
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
