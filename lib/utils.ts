import axios from "axios"
import { Provider } from "@/types/mytonstorage"
import { locationStates, sortingStates } from "@/components/filters";
import { DAY_SECONDS } from "./storage-constants";


export const printSpace = (bytes: number | bigint, addSource?: boolean): string => {
  const n = typeof bytes === "bigint" ? Number(bytes) : bytes;
  if (n <= 0) return ``

  if (n <= 1024) return `${n} bytes`

  var res = ``
  if (n <= 1024 * 1024) {
    res = `${(n / 1024).toFixed(2)} Kb`
  } else if (n <= 1024 * 1024 * 1024) {
    res = `${(n / 1024 / 1024).toFixed(2)} Mb`
  } else {
    res = `${(n / 1024 / 1024 / 1024).toFixed(2)} Gb`
  }

  if (addSource) {
    res += ` (${n} bytes)`
  }

  return res

}

export async function readAllFiles(initialEntries: any[]): Promise<File[]> {
  const allFiles: File[] = []
  const stack = [...initialEntries]

  while (stack.length > 0) {
    const entry = stack.pop()

    if (entry.isFile) {
      const file = await new Promise<File>((resolve) => {
        entry.file((file: File) => {
          Object.defineProperty(file, 'webkitRelativePath', {
            value: entry.fullPath.substring(1), // Remove leading slash
            writable: false
          })
          resolve(file)
        })
      })
      allFiles.push(file)
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader()

      const dirEntries = await new Promise<any[]>((resolve) => {
        const allEntries: any[] = []

        const readBatch = () => {
          dirReader.readEntries((entries: any[]) => {
            if (entries.length === 0) {
              resolve(allEntries)
            } else {
              allEntries.push(...entries)
              readBatch()
            }
          })
        }
        readBatch()
      })

      stack.push(...dirEntries)
    }
  }

  return allFiles
}

export function secondsToDays(seconds: number): number {
  return Math.floor(seconds / 86400)
}


export const handleError = (err: any): string | null => {
  let error: string | null = null;

  if (axios.isAxiosError(err)) {
    console.error("Request error:", {
      code: err.code,
      message: err.message,
      status: err.response?.status,
    });

    if (err.response?.data?.error) {
      error = err.response.data.error;
    } else if (err.code === 'NETWORK_ERROR' || err.code === 'ERR_NETWORK') {
      error = 'Network error. Check your internet connection and try again.';
    } else if (err.response?.status === 401) {
      error = 'Unauthorized. Please log in again.';
    } else {
      error = `Got error: ${err.message}`;
    }
  }

  return error;
}

export const shuffleProviders = (providers: Provider[], count: number): Provider[] => {
  if (providers.length <= 1) return [...providers]

  const hasIntersection = (providers: Provider[]): boolean => {
    if (providers.length <= 1) return true

    let maxMinSpan = Math.max(...providers.map(p => p.min_span))
    let minMaxSpan = Math.min(...providers.map(p => p.max_span))

    return maxMinSpan <= minMaxSpan
  }

  const filterWithIntersection = (candidateProviders: Provider[], maxCount: number): Provider[] => {
    const result: Provider[] = []

    for (const provider of candidateProviders) {
      const testGroup = [...result, provider]
      if (hasIntersection(testGroup) && result.length < maxCount) {
        result.push(provider)
      }
    }

    return result
  }

  const ratings = providers.map(p => p.rating || 0)
  const minRating = Math.min(...ratings)
  const maxRating = Math.max(...ratings)
  const ratingRange = maxRating - minRating || 1

  const weighted: { provider: Provider; weight: number }[] = providers.map(provider => {
    const normalizedRating = ((provider.rating || 0) - minRating) / ratingRange
    const weight = Math.max(1, Math.floor(normalizedRating * 9) + 1)
    return { provider, weight }
  })

  const pool: Provider[] = []
  weighted.forEach(({ provider, weight }) => {
    for (let i = 0; i < weight; i++) {
      pool.push(provider)
    }
  })

  // shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }

  const uniqueProviders: Provider[] = []
  const seen = new Set()

  for (const provider of pool) {
    if (!seen.has(provider.pubkey)) {
      seen.add(provider.pubkey)
      uniqueProviders.push(provider)
    }
  }

  return filterWithIntersection(uniqueProviders, count)
}

export const filterAndSortProviders = (
  providersToFilter: Provider[],
  count: number,
  proofPeriodDays: number | null,
  locationFilter: keyof typeof locationStates,
  sortingFilter: keyof typeof sortingStates,
): Provider[] => {
  let filteredProviders = [...providersToFilter];

  // Remove out of span range
  if (proofPeriodDays !== null) {
    const proofPeriodSeconds = proofPeriodDays * DAY_SECONDS;
    filteredProviders = filteredProviders.filter(provider => {
      return provider.min_span <= proofPeriodSeconds && provider.max_span >= proofPeriodSeconds;
    });
  }

  // Filtering by location/city
  if (locationFilter === "differentCountries") {
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
        if (sortingFilter === "sortByRating") {
          return (b.rating || 0) - (a.rating || 0);
        }

        // sortByPrice
        return (a.price || 0) - (b.price || 0);
      })[0];
      filteredProviders.push(bestProvider);
    }
  } else if (locationFilter === "differentCities") {
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
        if (sortingFilter === "sortByRating") {
          return (b.rating || 0) - (a.rating || 0);
        }
        // sortByPrice
        return (a.price || 0) - (b.price || 0);
      })[0];
      filteredProviders.push(bestProvider);
    }
  }
  // if locationFilter === "all", no location filtering is applied

  // Sorting by rating/price
  if (sortingFilter === "sortByRating") {
    return filteredProviders.sort((a, b) => b.rating - a.rating).slice(0, count);
  } else if (sortingFilter === "sortByPrice") {
    return filteredProviders.sort((a, b) => a.price - b.price).slice(0, count);
  }

  return shuffleProviders(filteredProviders, count);
};

export const shortenString = (key: string, maxLen: number = 10) => {
  if (!key) return null

  if (key.length <= maxLen) return key
  return `${key.substring(0, maxLen / 2)}...${key.substring(key.length - maxLen / 2)}`
}

export const copyToClipboard = (
  text: string,
  setCopiedKey?: (key: string | null) => void
) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      if (setCopiedKey) {
        setCopiedKey(text)
        setTimeout(() => setCopiedKey(null), 150)
      }
    })
    .catch((err) => {
      console.error("Failed to copy: ", err)
    })
}

export function splitTextSmart(text: string, maxLen: number): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    if ((current + (current ? " " : "") + word).length > maxLen) {
      if (current) lines.push(current)
      current = word
    } else {
      current += (current ? " " : "") + word
    }
  }
  if (current) lines.push(current)
  return lines
}
