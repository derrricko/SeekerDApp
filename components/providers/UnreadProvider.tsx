import React, {createContext, useContext} from 'react';
import {useWallet} from './WalletProvider';
import {useUnreadCount} from '../../services/chat';

interface UnreadContextValue {
  totalUnread: number;
  conversationUnreads: Record<string, number>;
  activeConversationId: string | null;
  markRead: (conversationId: string) => Promise<void>;
  refresh: () => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
}

const UnreadContext = createContext<UnreadContextValue>({
  totalUnread: 0,
  conversationUnreads: {},
  activeConversationId: null,
  markRead: async () => {},
  refresh: async () => {},
  setActiveConversation: () => {},
});

export function UnreadProvider({children}: {children: React.ReactNode}) {
  const {publicKey} = useWallet();
  const walletAddress = publicKey?.toBase58() ?? null;
  const unreadState = useUnreadCount(walletAddress);

  return (
    <UnreadContext.Provider value={unreadState}>
      {children}
    </UnreadContext.Provider>
  );
}

export function useUnread() {
  return useContext(UnreadContext);
}
