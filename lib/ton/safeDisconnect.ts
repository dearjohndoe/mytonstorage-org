import { TonConnectUI } from '@tonconnect/ui-react';
import { useAppStore } from '@/store/useAppStore';

/**
 * Centralized helper to disconnect a TON wallet and reset the entire app store state.
 * Always prefer this over direct tonConnectUI.disconnect() calls.
 */
export async function safeDisconnect(tonConnectUI: TonConnectUI | any) {
  try {
    await tonConnectUI.disconnect();
  } catch (e) {
    console.error('safeDisconnect: disconnect failed', e);
  } finally {
    try {
      useAppStore.getState().resetAll();
    } catch (e) {
      console.error('safeDisconnect: resetAll failed', e);
    }
  }
}
