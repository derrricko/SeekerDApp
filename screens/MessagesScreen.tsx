// v2 Messages Screen — direct chat view (no thread list)
// Navigated to via conversationId param from the donation flow.

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
import {useRoute} from '@react-navigation/native';
import {
  launchImageLibrary,
  launchCamera,
  type Asset,
} from 'react-native-image-picker';
import {useTheme} from '../theme/Theme';
import {useWallet} from '../components/providers/WalletProvider';
import {
  Conversation,
  Message,
  fetchConversations,
  sendMessage,
  uploadChatMedia,
  useChatMessages,
} from '../services/chat';
import {getRecipientLabel} from '../data/donationConfig';
import {ADMIN_WALLET} from '../config/env';
import AppHeader from '../ui/AppHeader';
import SurfaceCard from '../ui/SurfaceCard';

// ---------- DEV MOCK DATA ----------
// Fake conversation + messages so you can design the UI without a real donation.
// Only used when __DEV__ is true. Delete this block before release.

const MOCK_WALLET = 'DEVmock1111111111111111111111111111111111111';

const MOCK_CONVERSATION: Conversation = {
  id: 'aaaa1111-2222-3333-4444-555566667777',
  donation_id: 'don-001',
  donor_wallet: MOCK_WALLET,
  admin_wallet: ADMIN_WALLET,
  created_at: new Date(Date.now() - 3600_000).toISOString(),
  amount_usdc: 25.0,
  recipient_id: 'single-moms-crisis',
};

const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg-a1',
    conversation_id: 'aaaa1111-2222-3333-4444-555566667777',
    sender_wallet: ADMIN_WALLET,
    body: "Thank you for your $25 donation to support single moms in crisis. We're reviewing needs now and will update you here within 48 hours.",
    media_url: null,
    media_type: null,
    created_at: new Date(Date.now() - 3500_000).toISOString(),
  },
  {
    id: 'msg-a2',
    conversation_id: 'aaaa1111-2222-3333-4444-555566667777',
    sender_wallet: MOCK_WALLET,
    body: 'Thank you, excited to help!',
    media_url: null,
    media_type: null,
    created_at: new Date(Date.now() - 3000_000).toISOString(),
  },
  {
    id: 'msg-a3',
    conversation_id: 'aaaa1111-2222-3333-4444-555566667777',
    sender_wallet: ADMIN_WALLET,
    body: "Your donation went to Maria — a single mom in Muscatine who needed help covering groceries and gas this week. Here's her thank-you note.",
    media_url: null,
    media_type: null,
    created_at: new Date(Date.now() - 1800_000).toISOString(),
  },
];

// ---------- Helpers ----------

function shortThreadId(id: string) {
  return `#${id.slice(0, 6).toUpperCase()}`;
}

// ---------- Main Screen ----------

export default function MessagesScreen() {
  const {theme} = useTheme();
  const route = useRoute<any>();
  const {connected, publicKey} = useWallet();

  const walletAddress = publicKey?.toBase58() || (__DEV__ ? MOCK_WALLET : '');
  const useMocks = __DEV__;

  const conversationId: string | undefined = route.params?.conversationId;

  // In dev mode, use mock conversation. In prod, look up by conversationId.
  const [conversation, setConversation] = useState<Conversation | null>(
    useMocks ? MOCK_CONVERSATION : null,
  );
  const [loading, setLoading] = useState(!useMocks);

  // Fetch the conversation from Supabase when we have an ID (prod only)
  useEffect(() => {
    if (useMocks || !conversationId || !connected || !walletAddress) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchConversations(walletAddress)
      .then(convos => {
        if (cancelled) {
          return;
        }
        const target = convos.find(c => c.id === conversationId);
        setConversation(target || null);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId, connected, walletAddress, useMocks]);

  if (loading) {
    return (
      <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
        <AppHeader title="Messages" />
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      </View>
    );
  }

  if (!conversation) {
    return (
      <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
        <AppHeader title="Messages" />
        <View style={styles.emptyWrap}>
          <SurfaceCard style={styles.stateCard}>
            <Text
              style={[
                styles.stateTitle,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.brand,
                },
              ]}>
              NO CONVERSATION
            </Text>
            <Text
              style={[styles.stateBody, {color: theme.colors.textSecondary}]}>
              Complete a donation to start a message thread.
            </Text>
          </SurfaceCard>
        </View>
      </View>
    );
  }

  return (
    <ChatView
      conversation={conversation}
      walletAddress={walletAddress}
      useMocks={useMocks}
    />
  );
}

// ---------- Chat View ----------

function ChatView({
  conversation,
  walletAddress,
  useMocks,
}: {
  conversation: Conversation;
  walletAddress: string;
  useMocks: boolean;
}) {
  const {theme} = useTheme();
  const realChat = useChatMessages(useMocks ? null : conversation.id);
  const messages = useMocks ? MOCK_MESSAGES : realChat.messages;
  const chatLoading = useMocks ? false : realChat.loading;
  const chatError = useMocks ? null : realChat.error;
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pickedImage, setPickedImage] = useState<Asset | null>(null);
  const flatListRef = React.useRef<FlatList>(null);

  const recipientName = getRecipientLabel(conversation.recipient_id);
  const displayAmount = conversation.amount_usdc ?? 0;
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
              {amount} USDC • {shortThreadId(conversation.id)}
            </Text>
          </View>
        </View>

        {chatLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
          </View>
        ) : chatError ? (
          <View style={styles.chatErrorWrap}>
            <Text style={[styles.chatErrorText, {color: theme.colors.danger}]}>
              {chatError}
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
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
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
