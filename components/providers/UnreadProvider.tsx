import React, {createContext, useContext, useMemo} from 'react';
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

  const value = useMemo(
    () => ({
      totalUnread: unreadState.totalUnread,
      conversationUnreads: unreadState.conversationUnreads,
      activeConversationId: unreadState.activeConversationId,
      markRead: unreadState.markRead,
      refresh: unreadState.refresh,
      setActiveConversation: unreadState.setActiveConversation,
    }),
    [
      unreadState.totalUnread,
      unreadState.conversationUnreads,
      unreadState.activeConversationId,
      unreadState.markRead,
      unreadState.refresh,
      unreadState.setActiveConversation,
    ],
  );

  return (
    <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>
  );
}

export function useUnread() {
  return useContext(UnreadContext);
}
