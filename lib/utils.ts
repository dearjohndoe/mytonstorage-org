import axios from "axios"
import { Provider } from "@/types/mytonstorage"


export const printSpace = (bytes: number): string => {
  if (bytes <= 0) return ``

  if (bytes <= 1024) return `${bytes} bytes`

  if (bytes <= 1024 * 1024) return `${(bytes / 1024).toFixed(2)} Kb`

  if (bytes <= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} Mb`

  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} Gb`
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

export function formatSpanTime(seconds: number | null, short: boolean): string {
    if (!seconds) return "—"

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours >= 24) {
        const days = Math.floor(hours / 24)
        if (short) {
            return `${days}d`
        }

        const remainingHours = hours % 24
        return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
    }

    if (hours > 0) {
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
    }

    return `${minutes}m`
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
    } else {
      error = `Upload error: ${err.message}`;
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
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }

  const uniqueProviders: Provider[] = []
  const seen = new Set()
  
  for (const provider of pool) {
    if (!seen.has(provider.pubkey)) {
      seen.add(provider.pubkey)
      uniqueProviders.push(provider)
    }
  }

  const result = filterWithIntersection(uniqueProviders, count)
  
  return result
}

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
