import { useCallback, useMemo, useRef, useState } from 'react';
import { UploadFile, useAppStore } from '@/store/useAppStore';
import { fetchContractsPage } from '@/lib/ton/transactions';
import { getDescriptions } from '@/lib/api';
import { getProvidersStorageChecks } from '@/lib/thirdparty';
import { BagInfoShort } from '@/lib/types';
import { ContractStatus, ContractStatuses } from '@/types/mytonstorage';

export type UseStorageContractsOptions = {
  address?: string | null;
  pageSize: number;
  maxAutoPages: number;
};

export function useStorageContracts({
  address,
  pageSize,
  maxAutoPages,
}: UseStorageContractsOptions) {
  const { files, setFiles, setBlockchain } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [isCheckingNewer, setIsCheckingNewer] = useState(false);
  const cursorRef = useRef<string | undefined>(files.blockchain.lt);
  const seen = useRef<Set<string>>(new Set(files.list.map(f => f.contractAddress)));
  const reqId = useRef(0);
  const newerReqId = useRef(0);

  // simple caches to avoid re-fetching enrichments across pages
  const descCache = useRef<Map<string, BagInfoShort>>(new Map());
  const checksCache = useRef<Map<string, ContractStatus[]>>(new Map());

  const items = files.list;
  const cursor = cursorRef.current;

  const enrich = useCallback(async (addresses: string[], current: UploadFile[]): Promise<UploadFile[]> => {
    const missingDesc = addresses.filter(a => !descCache.current.has(a));
    if (missingDesc.length > 0) {
      const desc = await getDescriptions(missingDesc);
      if (desc.data) {
        (desc.data as BagInfoShort[]).forEach(d => descCache.current.set(d.contract_address, d));
      }
    }
    const missingChecks = addresses.filter(a => !checksCache.current.has(a));
    if (missingChecks.length > 0) {
      const resp = await getProvidersStorageChecks(missingChecks);
      const checks = resp.data as ContractStatuses | undefined;
      if (checks?.contracts) {
        checks.contracts.forEach(c => {
          const list = (checksCache.current.get(c.address) || []).concat([c]);
          checksCache.current.set(c.address, list);
        });
      }
    }

    return current.map(f => ({
      ...f,
      info: descCache.current.get(f.contractAddress) || null,
      contractChecks: checksCache.current.get(f.contractAddress) || [],
    }));
  }, []);

  const fetchAndMaybeAdvance = useCallback(async () => {
    if (isLoading || !address || reachedEnd) return;
    setIsLoading(true);
    setError(null);
    reqId.current += 1;
    const myReq = reqId.current;

    let pageCursor = cursorRef.current;
    let aggregated: UploadFile[] = [];
    let pagesTried = 0;
    let localReachedEnd = false;

    while (true) {
      const page = await fetchContractsPage(address, pageCursor, pageSize);
      if (reqId.current !== myReq) return; // cancelled by a later call

      if (page instanceof Error) {
        setError(page.message);
        break;
      }

      const { items: contracts, nextLt, reachedEnd: end } = page;
      pageCursor = nextLt;
      localReachedEnd = end;

      // normalize & dedup
      const fresh = contracts
        .map(c => ({
          contractAddress: c.address,
          createdAt: c.createdAt,
          expiresAt: null,
          info: null,
          contractChecks: [],
          contractInfo: null,
          lastContractUpdate: null,
          status: 'uploaded' as const,
        }))
        .filter(f => !seen.current.has(f.contractAddress));

      fresh.forEach(f => seen.current.add(f.contractAddress));

      // if we found something — enrich and stop auto-advance
      if (fresh.length > 0) {
        const addresses = fresh.map(f => f.contractAddress);
        const enriched = await enrich(addresses, fresh);
        aggregated = aggregated.concat(enriched);
        break;
      }

      pagesTried += 1;
      if (localReachedEnd || pagesTried >= maxAutoPages) {
        break;
      }

      await new Promise(r => setTimeout(r, 1100));
    }

    if (reqId.current === myReq) {
      cursorRef.current = pageCursor;
      setBlockchain(pageCursor || '0', Date.now());
      if (aggregated.length > 0) {
        setFiles(items.concat(aggregated));
      }
      setReachedEnd(localReachedEnd || (pageCursor === '0'));
      setIsLoading(false);
    }
  }, [address, enrich, isLoading, items, maxAutoPages, pageSize, reachedEnd, setBlockchain, setFiles]);

  const loadNewer = useCallback(async () => {
    if (isCheckingNewer || !address) return;
    setIsCheckingNewer(true);
    reqId.current += 1;
    newerReqId.current = reqId.current;
    const myReq = newerReqId.current;

    const headLt = useAppStore.getState().files.blockchain.headLt;
    let pageCursor: string | undefined = undefined;
    let pagesTried = 0;
    let aggregated: UploadFile[] = [];
    let newHeadLt = headLt;

    while (true) {
      const page = await fetchContractsPage(address, pageCursor, pageSize);
      if (newerReqId.current !== myReq) return;
      if (page instanceof Error) {
        setError(page.message);
        break;
      }

      const { items: contracts, nextLt, pageMaxLt, pageMinLt, reachedEnd: end } = page;
      pageCursor = nextLt;

      // Update head candidate
      if (!newHeadLt || BigInt(pageMaxLt) > BigInt(newHeadLt)) newHeadLt = pageMaxLt;

      // Stop if we reached or passed the known head
      if (headLt && BigInt(pageMinLt) <= BigInt(headLt)) {
        const freshContracts = contracts.filter(c => BigInt(c.txLt) > BigInt(headLt));
        const fresh = freshContracts
          .map(c => ({
            contractAddress: c.address,
            createdAt: c.createdAt,
            expiresAt: null,
            info: null,
            contractChecks: [],
            contractInfo: null,
            lastContractUpdate: null,
            status: 'uploaded' as const,
          }))
          .filter(f => !seen.current.has(f.contractAddress));
        fresh.forEach(f => seen.current.add(f.contractAddress));
        if (fresh.length > 0) {
          const addresses = fresh.map(f => f.contractAddress);
          const enriched = await enrich(addresses, fresh);
          aggregated = enriched.concat(aggregated);
        }
        break;
      }

      const fresh = contracts
        .map(c => ({
          contractAddress: c.address,
          createdAt: c.createdAt,
          expiresAt: null,
          info: null,
          contractChecks: [],
          contractInfo: null,
          lastContractUpdate: null,
          status: 'uploaded' as const,
        }))
        .filter(f => !seen.current.has(f.contractAddress));
      fresh.forEach(f => seen.current.add(f.contractAddress));
      if (fresh.length > 0) {
        const addresses = fresh.map(f => f.contractAddress);
        const enriched = await enrich(addresses, fresh);
        aggregated = enriched.concat(aggregated);
      }

      pagesTried += 1;
      if (end || pagesTried >= 3) break;
      await new Promise(r => setTimeout(r, 1100));
    }

    // commit
    if (newerReqId.current === myReq) {
      if (aggregated.length > 0) {
        setFiles(aggregated.concat(items));
      }
      if (newHeadLt) {
        useAppStore.getState().setHeadLt(newHeadLt);
      }
      setIsCheckingNewer(false);
    }
  }, [address, enrich, isCheckingNewer, items, pageSize, setFiles]);

  return useMemo(() => ({
    items,
    loadMore: fetchAndMaybeAdvance,
    loadNewer,
    isLoading,
    isCheckingNewer,
    error,
    cursor,
    reachedEnd,
  }), [cursor, error, fetchAndMaybeAdvance, isLoading, items, reachedEnd, loadNewer, isCheckingNewer]);
}
