import axios, { AxiosError } from "axios"
import { BagInfo, AddedBag, FileMetadata, Offers, UserBag } from "@/types/files";
import { ApiResponse, BagInfoShort, InitStorageContract, Transaction } from "./types";
import { handleError } from "./utils";

// API base URL from env with safe fallback
const host = (typeof process !== 'undefined' && process.env.PUBLIC_API_BASE) || "https://mytonstorage.org";

export async function setBagStorageContract(bagId: string, addr: string): Promise<ApiResponse> {
  var error: string | null = null;
  var data: boolean | null = null;

  try {
    const response = await axios.post(`${host}/api/v1/files/paid`, { bag_id: bagId, storage_contract: addr }, {
      withCredentials: true
    });
    data = response.status === 200;
  } catch (err: AxiosError | any) {
    error = handleError(err);
  }

  return {
    error: error,
    data: data
  }
}

export async function getDescriptions(addresses: string[]): Promise<ApiResponse> {
  var error: string | null = null;
  var data: BagInfoShort[] | null = null;

  try {
    const response = await axios.post(`${host}/api/v1/files/details`, { contracts: addresses }, {
      withCredentials: true
    });
    data = response.data as BagInfoShort[];
  } catch (err: AxiosError | any) {
    error = handleError(err);
  }

  return {
    error: error,
    data: data
  }
}

export async function getDeployTransaction(initStorageContract: InitStorageContract): Promise<ApiResponse> {
  var error: string | null = null;
  var data: Transaction | null = null;

  try {
    const response = await axios.post(`${host}/api/v1/providers/init-contract`, initStorageContract, {
      withCredentials: true
    });
    data = response.data as Transaction;
  } catch (err: AxiosError | any) {
    error = handleError(err);
  }

  return {
    error: error,
    data: data
  }
}

export async function getOffers(bagID: string, providers: string[]): Promise<ApiResponse> {
  var error: string | null = null;
  var data: Offers | null = null;

  try {
    const response = await axios.post(`${host}/api/v1/providers/offers`, {
      bag_id: bagID,
      providers
    }, {
      withCredentials: true,
    });
    data = response.data as Offers;
  } catch (err: AxiosError | any) {
    error = handleError(err);
  }

  return {
    error: error,
    data: data
  }
}

export async function removeFile(bagId: string): Promise<ApiResponse> {
  var error: string | null = null;
  var data: boolean | null = null;

  try {
    const response = await axios.delete(`${host}/api/v1/files/${bagId}`, {
      withCredentials: true
    });
    data = response.status === 200;
  } catch (err: AxiosError | any) {
    error = handleError(err);
  }

  return {
    error: error,
    data: data
  }
}

export async function addFile(file: File, metadata: FileMetadata, setProgress: (progress: number) => void): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('description', metadata.description);
  
  var error: string | null = null;
  var data: AddedBag | null = null;

  try {
    const response = await axios.post(`${host}/api/v1/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
      timeout: 1200000, // 20 minutes for large files
      maxContentLength: 4 * 1024 * 1024 * 1024, // 4 GB max file size
      maxBodyLength: 4 * 1024 * 1024 * 1024, // 4 GB max body size
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(progress);
        }
      }
    });

    data = response.data as AddedBag
  } catch (err: AxiosError | any) {
    error = handleError(err);
  }

  return {
    error: error,
    data: data
  }
}

export async function getUnpaid(): Promise<ApiResponse> {
  var error: string | null = null;
  var data: UserBag[] | null = null;

  try {
    const response = await axios.post(`${host}/api/v1/files/unpaid`, {}, {
      withCredentials: true
    });
    data = response.data.bags as UserBag[];
  } catch (err: AxiosError | any) {
    error = handleError(err);
  }

  return {
    error: error,
    data: data
  }
}

export async function addFolder(files: File[], metadata: FileMetadata, setProgress: (progress: number) => void): Promise<ApiResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    const filename = file.webkitRelativePath || file.name;
    formData.append('file', file, filename);
  });

  formData.append('description', metadata.description);

  var error: string | null = null;
  var data: AddedBag | null = null;

  try {
    const response = await axios.post(`${host}/api/v1/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
      timeout: 600000, // 10 minutes for large files
      maxContentLength: 10 * 1024 * 1024 * 1024, // 10 GB max file size
      maxBodyLength: 10 * 1024 * 1024 * 1024, // 10 GB max body size
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(progress);
        }
      }
    });
    data = response.data as AddedBag;
  } catch (err: AxiosError | any) {
    error = handleError(err);
  }

  return {
    error: error,
    data: data
  }
}

export async function getFile(bagId: string): Promise<ApiResponse> {
  var error: string | null = null;
  var data: BagInfo | null = null;

  try {
    const response = await axios.get(`${host}/api/v1/files/${bagId}`, {
      withCredentials: true
    });
    data = response.data as BagInfo;
  } catch (err: AxiosError | any) {
    error = handleError(err);
  }

  return {
    error: error,
    data: data
  }
}

export async function proofPayload(): Promise<ApiResponse> {
  var error: string | null = null;
  var data: string | null = null;

  try {
    const response = await axios.get(`${host}/api/v1/ton-proof`);
    data = response.data?.data as string;
  } catch (err: AxiosError | any) {
    error = handleError(err);
  }

  return {
    error: error,
    data: data
  }
}

export async function login(address: string, proof: string, walletStateInit: any): Promise<ApiResponse> {
  var error: string | null = null;
  var data: boolean | null = null;

  try {
    const response = await axios.post(`${host}/api/v1/login`, {
      address,
      proof,
      state_init: walletStateInit
    }, {
      withCredentials: true
    });
    data = response.status === 200;
  } catch (err: AxiosError | any) {
    error = handleError(err);
  }

  return {
    error: error,
    data: data
  }
}
