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
import {useTheme} from '../theme/Theme';
import {useWallet} from '../components/providers/WalletProvider';
import {
  Conversation,
  fetchConversations,
  sendMessage,
  useChatMessages,
} from '../services/chat';
import {RECIPIENTS} from '../data/recipients';
import {ADMIN_WALLET} from '../config/env';

export default function MessagesScreen() {
  const {theme} = useTheme();
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
      <View
        style={[
          styles.emptyContainer,
          {backgroundColor: theme.colors.background},
        ]}>
        <Text style={[styles.emptyTitle, {color: theme.colors.textPrimary}]}>
          Messages
        </Text>
        <Text style={[styles.emptyText, {color: theme.colors.textSecondary}]}>
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
    <View
      style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <Text style={[styles.title, {color: theme.colors.textPrimary}]}>
        Messages
      </Text>
      <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
        Each donation opens a thread. We share updates, photos, and receipts
        here.
      </Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.accent}
          style={{marginTop: 40}}
        />
      ) : conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text
            style={[styles.emptyStateText, {color: theme.colors.textTertiary}]}>
            No messages yet. Make a donation from the Give tab to start a
            thread.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          renderItem={({item}) => {
            const recipient = RECIPIENTS.find(r => r.id === item.recipient_id);
            return (
              <TouchableOpacity
                style={[
                  styles.convoCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => setActiveConvo(item)}
                activeOpacity={0.7}>
                <View style={styles.convoHeader}>
                  <Text
                    style={[
                      styles.convoName,
                      {color: theme.colors.textPrimary},
                    ]}>
                    {recipient?.name || 'Donation'}
                  </Text>
                  <Text
                    style={[styles.convoAmount, {color: theme.colors.accent}]}>
                    {item.amount_sol} SOL
                  </Text>
                </View>
                <Text
                  style={[
                    styles.convoDate,
                    {color: theme.colors.textTertiary},
                  ]}>
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
  const {theme} = useTheme();
  const {messages, loading, error} = useChatMessages(conversation.id);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const flatListRef = React.useRef<FlatList>(null);

  const recipient = RECIPIENTS.find(r => r.id === conversation.recipient_id);

  // Reverse messages for inverted FlatList (newest at bottom, rendered from bottom up)
  const invertedMessages = React.useMemo(
    () => [...messages].reverse(),
    [messages],
  );

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) {
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      await sendMessage(conversation.id, walletAddress, inputText.trim());
      setInputText('');
    } catch (sendErrorReason) {
      const message =
        sendErrorReason instanceof Error
          ? sendErrorReason.message
          : 'Message failed to send. Try again.';
      setSendError(message);
    }
    setSending(false);
  }, [inputText, conversation.id, walletAddress]);

  const isAdmin = (senderWallet: string) =>
    senderWallet === ADMIN_WALLET || senderWallet === conversation.admin_wallet;

  return (
    <KeyboardAvoidingView
      style={[styles.chatContainer, {backgroundColor: theme.colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      {/* Header */}
      <View
        style={[styles.chatHeader, {borderBottomColor: theme.colors.border}]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backText, {color: theme.colors.accent}]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.chatTitle, {color: theme.colors.textPrimary}]}>
          {recipient?.name || 'Thread'} · {conversation.amount_sol} SOL
        </Text>
      </View>

      {/* Messages */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.accent}
          style={{flex: 1}}
        />
      ) : error ? (
        <View style={styles.chatErrorWrap}>
          <Text style={[styles.chatErrorText, {color: theme.colors.danger}]}>
            {error}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={invertedMessages}
          inverted
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          initialNumToRender={20}
          maxToRenderPerBatch={15}
          windowSize={11}
          renderItem={({item}) => {
            const fromAdmin = isAdmin(item.sender_wallet);
            return (
              <View
                style={[
                  styles.bubble,
                  fromAdmin
                    ? [
                        styles.bubbleAdmin,
                        {backgroundColor: theme.colors.surface},
                      ]
                    : [
                        styles.bubbleDonor,
                        {backgroundColor: theme.colors.accent},
                      ],
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
                      {color: theme.colors.textPrimary},
                    ]}>
                    {item.body}
                  </Text>
                )}
                <Text
                  style={[
                    styles.bubbleTime,
                    {color: theme.colors.textTertiary},
                  ]}>
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
      <View
        style={[
          styles.inputBar,
          {
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.background,
          },
        ]}>
        <TextInput
          style={[
            styles.chatInput,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.textPrimary,
              borderColor: theme.colors.border,
            },
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Say something..."
          placeholderTextColor={theme.colors.textTertiary}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendChatButton,
            {backgroundColor: theme.colors.accent},
            (!inputText.trim() || sending) && {
              backgroundColor: theme.colors.surfaceAlt,
            },
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}>
          <Text style={styles.sendChatButtonText}>
            {sending ? '...' : 'Send'}
          </Text>
        </TouchableOpacity>
      </View>
      {sendError ? (
        <Text style={[styles.sendErrorText, {color: theme.colors.danger}]}>
          {sendError}
        </Text>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },

  // Empty states
  emptyContainer: {
    flex: 1,
    padding: 24,
  },
  emptyTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Conversation list
  convoCard: {
    borderRadius: 0,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
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
  },
  convoAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  convoDate: {
    fontSize: 13,
  },

  // Chat view
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  backText: {
    fontSize: 16,
  },
  chatTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },

  // Bubbles
  bubble: {
    maxWidth: '80%',
    borderRadius: 0,
    padding: 12,
    marginBottom: 8,
  },
  bubbleAdmin: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  bubbleDonor: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextAdmin: {},
  bubbleTextDonor: {
    color: '#fff',
  },
  bubbleTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: 0,
    marginBottom: 8,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendChatButton: {
    borderRadius: 0,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginLeft: 8,
  },
  sendChatButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  sendErrorText: {
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: 8,
  },
  chatErrorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  chatErrorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
