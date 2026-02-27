declare module '@solana-mobile/mobile-wallet-adapter-protocol-web3js' {
  import {
    Transaction,
    TransactionSignature,
    VersionedTransaction,
  } from '@solana/web3.js';

  type Base64EncodedAddress = string;

  export interface AuthorizationResult {
    accounts: Array<{
      address: Base64EncodedAddress;
      label?: string;
      icon?: string;
    }>;
    auth_token?: string;
    wallet_uri_base?: string;
  }

  export interface Web3MobileWallet {
    authorize(params: {
      chain: string;
      identity: {
        name: string;
        uri: string;
        icon: string;
      };
    }): Promise<AuthorizationResult>;
    signAndSendTransactions<
      T extends Transaction | VersionedTransaction,
    >(params: {
      minContextSlot?: number;
      transactions: T[];
    }): Promise<TransactionSignature[]>;
    signMessages(params: {
      addresses: Base64EncodedAddress[];
      payloads: Uint8Array[];
    }): Promise<Uint8Array[]>;
  }

  export function transact<TReturn>(
    callback: (wallet: Web3MobileWallet) => Promise<TReturn> | TReturn,
  ): Promise<TReturn>;
}
