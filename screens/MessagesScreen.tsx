// v2 Messages Screen — conversation list + chat view

import React, {useCallback, useEffect, useState} from 'react';
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
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {
  launchImageLibrary,
  launchCamera,
  type Asset,
} from 'react-native-image-picker';
import {useTheme} from '../theme/Theme';
import {useWallet} from '../components/providers/WalletProvider';
import {
  Conversation,
  fetchConversations,
  sendMessage,
  uploadChatMedia,
  useChatMessages,
} from '../services/chat';
import {getRecipientLabel} from '../data/donationConfig';
import {ADMIN_WALLET} from '../config/env';
import AppHeader from '../ui/AppHeader';
import SurfaceCard from '../ui/SurfaceCard';

function initials(label: string) {
  const words = label
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(' ')
    .filter(Boolean);

  if (words.length === 0) {
    return 'GL';
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function shortThreadId(id: string) {
  return `#${id.slice(0, 6).toUpperCase()}`;
}

export default function MessagesScreen() {
  const {theme} = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {connected, publicKey} = useWallet();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);

  const walletAddress = publicKey?.toBase58() || '';

  const loadConversations = useCallback(async () => {
    if (!connected || !walletAddress) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const convos = await fetchConversations(walletAddress);
      setConversations(convos);
    } finally {
      setLoading(false);
    }
  }, [connected, walletAddress]);

  useFocusEffect(
    useCallback(() => {
      loadConversations().catch(() => setLoading(false));
    }, [loadConversations]),
  );

  useEffect(() => {
    const targetConversationId =
      typeof route.params?.conversationId === 'string'
        ? route.params.conversationId
        : null;

    if (!targetConversationId || conversations.length === 0 || activeConvo) {
      return;
    }

    const target = conversations.find(c => c.id === targetConversationId);
    if (!target) {
      return;
    }

    setActiveConvo(target);
    navigation.setParams({conversationId: undefined});
  }, [route.params, conversations, activeConvo, navigation]);

  if (activeConvo) {
    return (
      <ChatView
        conversation={activeConvo}
        walletAddress={walletAddress}
        onBack={() => setActiveConvo(null)}
      />
    );
  }

  if (!connected) {
    return (
      <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
        <AppHeader title="Messages" />

        <View style={styles.contentWrap}>
          <SurfaceCard style={styles.stateCard}>
            <Text
              style={[
                styles.stateTitle,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.brand,
                },
              ]}>
              WALLET REQUIRED
            </Text>
            <Text
              style={[styles.stateBody, {color: theme.colors.textSecondary}]}>
              Connect your wallet to view donation threads and impact replies.
            </Text>
          </SurfaceCard>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <AppHeader title="Messages" />

      <View style={styles.contentWrap}>
        <SurfaceCard style={styles.panel} padded={false}>
          <View style={styles.panelHeader}>
            <Text
              style={[
                styles.panelLabel,
                {
                  color: theme.colors.textTertiary,
                  fontFamily: theme.typography.brand,
                },
              ]}>
              RECENT THREADS
            </Text>
          </View>

          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={theme.colors.accent} />
            </View>
          ) : conversations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text
                style={[
                  styles.emptyStateText,
                  {
                    color: theme.colors.textSecondary,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                No threads yet. Start from the Donate flow to open your first
                message thread.
              </Text>
            </View>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.threadListContent}
              renderItem={({item, index}) => {
                const recipientName = getRecipientLabel(item.recipient_id);
                const displayAmount = item.amount_usdc ?? item.amount_sol ?? 0;
                const displayToken = 'USDC';
                const amount = Number(displayAmount).toFixed(2);
                const isLast = index === conversations.length - 1;

                return (
                  <TouchableOpacity
                    style={[
                      styles.threadRow,
                      {
                        borderBottomColor: 'rgba(26,17,37,0.1)',
                        borderBottomWidth: isLast ? 0 : 1,
                      },
                    ]}
                    onPress={() => setActiveConvo(item)}
                    activeOpacity={0.8}>
                    <View
                      style={[
                        styles.threadAvatar,
                        {
                          borderColor: 'rgba(101,84,209,0.38)',
                          backgroundColor: 'rgba(101,84,209,0.22)',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.threadAvatarText,
                          {
                            color: theme.colors.textPrimary,
                            fontFamily: theme.typography.brand,
                          },
                        ]}>
                        {initials(recipientName)}
                      </Text>
                    </View>

                    <View style={styles.threadBody}>
                      <Text
                        style={[
                          styles.threadTitle,
                          {color: theme.colors.textPrimary},
                        ]}>
                        {recipientName}
                      </Text>

                      <View style={styles.threadMetaRow}>
                        <Text
                          style={[
                            styles.threadMeta,
                            {
                              color: theme.colors.textSecondary,
                              fontFamily: theme.typography.brand,
                            },
                          ]}>
                          {formatShortDate(item.created_at)}
                        </Text>
                        <Text
                          style={[
                            styles.threadDot,
                            {color: theme.colors.textTertiary},
                          ]}>
                          •
                        </Text>
                        <Text
                          style={[
                            styles.threadId,
                            {
                              color: theme.colors.accent,
                              fontFamily: theme.typography.brand,
                            },
                          ]}>
                          {shortThreadId(item.id)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.threadRight}>
                      <Text
                        style={[
                          styles.threadAmount,
                          {color: theme.colors.accent},
                        ]}>
                        {amount} {displayToken}
                      </Text>
                      <Text
                        style={[
                          styles.threadChevron,
                          {color: theme.colors.textTertiary},
                        ]}>
                        ›
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </SurfaceCard>
      </View>
    </View>
  );
}

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
  const [pickedImage, setPickedImage] = useState<Asset | null>(null);
  const flatListRef = React.useRef<FlatList>(null);

  const recipientName = getRecipientLabel(conversation.recipient_id);
  const displayAmount =
    conversation.amount_usdc ?? conversation.amount_sol ?? 0;
  const displayToken = 'USDC';
  const amount = Number(displayAmount).toFixed(2);

  const invertedMessages = React.useMemo(
    () => [...messages].reverse(),
    [messages],
  );

  const pickPhoto = useCallback(() => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: true,
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
      },
      response => {
        if (response.didCancel || response.errorCode) {
          return;
        }
        const asset = response.assets?.[0];
        if (asset) {
          setPickedImage(asset);
        }
      },
    );
  }, []);

  const takePhoto = useCallback(() => {
    launchCamera(
      {
        mediaType: 'photo',
        includeBase64: true,
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
      },
      response => {
        if (response.didCancel || response.errorCode) {
          return;
        }
        const asset = response.assets?.[0];
        if (asset) {
          setPickedImage(asset);
        }
      },
    );
  }, []);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() && !pickedImage) {
      return;
    }

    setSending(true);
    setSendError(null);

    try {
      let mediaUrl: string | undefined;
      let mediaType: 'image' | undefined;

      if (pickedImage?.base64) {
        const fileName = pickedImage.fileName || `photo-${Date.now()}.jpg`;
        const contentType = pickedImage.type || 'image/jpeg';
        mediaUrl = await uploadChatMedia(
          conversation.id,
          fileName,
          pickedImage.base64,
          contentType,
        );
        mediaType = 'image';
      }

      await sendMessage(
        conversation.id,
        walletAddress,
        inputText.trim() || undefined,
        mediaUrl,
        mediaType,
      );
      setInputText('');
      setPickedImage(null);
    } catch (sendErrorReason) {
      const message =
        sendErrorReason instanceof Error
          ? sendErrorReason.message
          : 'Message failed to send. Try again.';
      setSendError(message);
    }

    setSending(false);
  }, [inputText, pickedImage, conversation.id, walletAddress]);

  const isAdmin = (senderWallet: string) =>
    senderWallet === ADMIN_WALLET || senderWallet === conversation.admin_wallet;

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <AppHeader title="Messages" />

      <KeyboardAvoidingView
        style={styles.chatBody}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}>
        <View
          style={[
            styles.chatTopCard,
            {
              backgroundColor: 'rgba(26,17,37,0.04)',
              borderColor: 'rgba(26,17,37,0.12)',
            },
          ]}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text
              style={[
                styles.backText,
                {
                  color: theme.colors.accent,
                  fontFamily: theme.typography.brand,
                },
              ]}>
              ← Back
            </Text>
          </TouchableOpacity>

          <View style={styles.chatMetaWrap}>
            <Text
              style={[styles.chatRecipient, {color: theme.colors.textPrimary}]}>
              {recipientName}
            </Text>
            <Text
              style={[
                styles.chatMeta,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.brand,
                },
              ]}>
              {amount} {displayToken} • {shortThreadId(conversation.id)}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
          </View>
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
                          {
                            backgroundColor: 'rgba(26,17,37,0.06)',
                            borderColor: 'rgba(26,17,37,0.14)',
                          },
                        ]
                      : [
                          styles.bubbleDonor,
                          {
                            backgroundColor: theme.colors.accent,
                            borderColor: theme.colors.accentPressed,
                          },
                        ],
                  ]}>
                  {item.media_url && (
                    <Image
                      source={{uri: `${item.media_url}?width=300&height=300`}}
                      style={styles.mediaImage}
                      resizeMode="cover"
                    />
                  )}

                  {item.body ? (
                    <Text
                      style={[
                        styles.bubbleText,
                        {
                          color: fromAdmin
                            ? theme.colors.textPrimary
                            : 'rgba(248,244,255,0.98)',
                        },
                      ]}>
                      {item.body}
                    </Text>
                  ) : null}

                  <Text
                    style={[
                      styles.bubbleTime,
                      {
                        color: fromAdmin
                          ? theme.colors.textTertiary
                          : 'rgba(244,240,255,0.74)',
                      },
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

        {pickedImage?.uri && (
          <View style={styles.previewRow}>
            <Image
              source={{uri: pickedImage.uri}}
              style={styles.previewThumb}
            />
            <TouchableOpacity onPress={() => setPickedImage(null)}>
              <Text
                style={[styles.previewRemove, {color: theme.colors.danger}]}>
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View
          style={[
            styles.inputBar,
            {
              borderTopColor: 'rgba(26,17,37,0.12)',
              backgroundColor: theme.colors.background,
            },
          ]}>
          <TouchableOpacity
            style={styles.mediaButton}
            onPress={pickPhoto}
            activeOpacity={0.7}>
            <Text
              style={[styles.mediaButtonIcon, {color: theme.colors.accent}]}>
              IMG
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mediaButton}
            onPress={takePhoto}
            activeOpacity={0.7}>
            <Text
              style={[styles.mediaButtonIcon, {color: theme.colors.accent}]}>
              CAM
            </Text>
          </TouchableOpacity>

          <TextInput
            style={[
              styles.chatInput,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.textPrimary,
                borderColor: 'rgba(26,17,37,0.16)',
              },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Write a reply..."
            placeholderTextColor={theme.colors.textTertiary}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[
              styles.sendChatButton,
              {backgroundColor: theme.colors.accent},
              ((!inputText.trim() && !pickedImage) || sending) && {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: 'rgba(26,17,37,0.16)',
              },
            ]}
            onPress={handleSend}
            activeOpacity={0.85}
            disabled={(!inputText.trim() && !pickedImage) || sending}>
            <Text
              style={[
                styles.sendChatButtonText,
                {fontFamily: theme.typography.brand},
              ]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  panel: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    overflow: 'hidden',
  },
  panelHeader: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26,17,37,0.12)',
  },
  panelLabel: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1,
    fontWeight: '700',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  stateCard: {
    borderRadius: 14,
    borderWidth: 2,
  },
  stateTitle: {
    fontSize: 16,
    lineHeight: 18,
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 10,
  },
  stateBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  emptyStateText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  threadListContent: {
    paddingBottom: 8,
  },
  threadRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  threadAvatar: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  threadAvatarText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
  threadBody: {
    flex: 1,
    marginRight: 8,
  },
  threadTitle: {
    fontSize: 19,
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  threadMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  threadMeta: {
    fontSize: 10,
    lineHeight: 12,
  },
  threadDot: {
    marginHorizontal: 5,
    fontSize: 10,
    lineHeight: 12,
  },
  threadId: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
  threadRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  threadAmount: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    minWidth: 64,
    textAlign: 'right',
  },
  threadChevron: {
    fontSize: 14,
    lineHeight: 15,
    fontWeight: '700',
  },
  chatBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  chatTopCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  backText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  chatMetaWrap: {
    width: '100%',
  },
  chatRecipient: {
    fontSize: 18,
    lineHeight: 21,
    fontWeight: '700',
    marginBottom: 4,
  },
  chatMeta: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.6,
  },
  messagesList: {
    paddingHorizontal: 2,
    paddingBottom: 10,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 11,
    marginBottom: 8,
  },
  bubbleAdmin: {
    alignSelf: 'flex-start',
  },
  bubbleDonor: {
    alignSelf: 'flex-end',
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  mediaImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 8,
    gap: 10,
  },
  previewThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  previewRemove: {
    fontSize: 12,
    fontWeight: '700',
  },
  mediaButton: {
    paddingHorizontal: 6,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaButtonIcon: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendChatButton: {
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sendChatButtonText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.4,
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
