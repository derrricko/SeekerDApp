// v2 Messages Screen — conversation list + chat view

import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import {useWallet} from '../components/providers/WalletProvider';
import {
  Conversation,
  Message,
  fetchConversations,
  sendMessage,
  useChatMessages,
} from '../services/chat';
import {RECIPIENTS} from '../data/recipients';
import {ADMIN_WALLET} from '../config/env';

export default function MessagesScreen() {
  const {connected, publicKey} = useWallet();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);

  const walletAddress = publicKey?.toBase58() || '';

  useEffect(() => {
    if (!connected || !walletAddress) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchConversations(walletAddress)
      .then(convos => {
        setConversations(convos);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [connected, walletAddress]);

  if (!connected) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Messages</Text>
        <Text style={styles.emptyText}>
          Connect your wallet to see your donation threads.
        </Text>
      </View>
    );
  }

  if (activeConvo) {
    return (
      <ChatView
        conversation={activeConvo}
        walletAddress={walletAddress}
        onBack={() => setActiveConvo(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      <Text style={styles.subtitle}>
        Each donation opens a thread. We share updates, photos, and receipts here.
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{marginTop: 40}} />
      ) : conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No messages yet. Make a donation from the Give tab to start a thread.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          renderItem={({item}) => {
            const recipient = RECIPIENTS.find(
              r => r.id === item.recipient_id,
            );
            return (
              <TouchableOpacity
                style={styles.convoCard}
                onPress={() => setActiveConvo(item)}
                activeOpacity={0.7}>
                <View style={styles.convoHeader}>
                  <Text style={styles.convoName}>
                    {recipient?.name || 'Donation'}
                  </Text>
                  <Text style={styles.convoAmount}>
                    {item.amount_sol} SOL
                  </Text>
                </View>
                <Text style={styles.convoDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{paddingBottom: 100}}
        />
      )}
    </View>
  );
}

// ---------- Chat View ----------

function ChatView({
  conversation,
  walletAddress,
  onBack,
}: {
  conversation: Conversation;
  walletAddress: string;
  onBack: () => void;
}) {
  const {messages, loading, error} = useChatMessages(conversation.id);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = React.useRef<FlatList>(null);

  const recipient = RECIPIENTS.find(r => r.id === conversation.recipient_id);

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;
    setSending(true);
    try {
      await sendMessage(conversation.id, walletAddress, inputText.trim());
      setInputText('');
    } catch {
      // Message will retry via realtime
    }
    setSending(false);
  }, [inputText, conversation.id, walletAddress]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({animated: true}), 100);
    }
  }, [messages.length]);

  const isAdmin = (senderWallet: string) =>
    senderWallet === ADMIN_WALLET || senderWallet === conversation.admin_wallet;

  return (
    <KeyboardAvoidingView
      style={styles.chatContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      {/* Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.chatTitle}>
          {recipient?.name || 'Thread'} · {conversation.amount_sol} SOL
        </Text>
      </View>

      {/* Messages */}
      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{flex: 1}} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({item}) => {
            const fromAdmin = isAdmin(item.sender_wallet);
            return (
              <View
                style={[
                  styles.bubble,
                  fromAdmin ? styles.bubbleAdmin : styles.bubbleDonor,
                ]}>
                {item.media_url && (
                  <Image
                    source={{uri: `${item.media_url}?width=300&height=300`}}
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                )}
                {item.body && (
                  <Text
                    style={[
                      styles.bubbleText,
                      fromAdmin
                        ? styles.bubbleTextAdmin
                        : styles.bubbleTextDonor,
                    ]}>
                    {item.body}
                  </Text>
                )}
                <Text style={styles.bubbleTime}>
                  {new Date(item.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            );
          }}
        />
      )}

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.chatInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Say something..."
          placeholderTextColor="#666"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendChatButton,
            (!inputText.trim() || sending) && styles.sendChatButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}>
          <Text style={styles.sendChatButtonText}>
            {sending ? '...' : 'Send'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FAFAFA',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    lineHeight: 22,
    marginBottom: 24,
  },

  // Empty states
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FAFAFA',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
    lineHeight: 22,
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Conversation list
  convoCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  convoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  convoName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  convoAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#818CF8',
  },
  convoDate: {
    fontSize: 13,
    color: '#666',
  },

  // Chat view
  chatContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backButton: {
    marginRight: 12,
  },
  backText: {
    fontSize: 16,
    color: '#818CF8',
  },
  chatTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },

  // Bubbles
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  bubbleAdmin: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A1A1A',
    borderBottomLeftRadius: 4,
  },
  bubbleDonor: {
    alignSelf: 'flex-end',
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextAdmin: {
    color: '#EAEAEA',
  },
  bubbleTextDonor: {
    color: '#fff',
  },
  bubbleTime: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 8,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    backgroundColor: '#0A0A0A',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#FAFAFA',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  sendChatButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginLeft: 8,
  },
  sendChatButtonDisabled: {
    backgroundColor: '#2A2A2A',
  },
  sendChatButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
