// v2 Messages Screen — direct chat view (no thread list)
// Navigated to via conversationId param from the donation flow.

import React, {useCallback, useEffect, useState} from 'react';
import {
  Animated,
  Alert,
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
  Easing,
  PermissionsAndroid,
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
import {
  getRecipientGlimpseTag,
  getRecipientLabel,
} from '../data/donationConfig';
import {ADMIN_WALLET} from '../config/env';
import AppHeader from '../ui/AppHeader';
import SurfaceCard from '../ui/SurfaceCard';

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

// ---------- DEV MOCK DATA ----------
// Fake conversation + messages so you can design the UI without a real donation.
// Only used when __DEV__ is true. Delete this block before release.

const MOCK_WALLET = 'DEVmock1111111111111111111111111111111111111';

const MOCK_CONVERSATION: Conversation = {
  id: 'mock-0001',
  donation_id: 'don-001',
  donor_wallet: MOCK_WALLET,
  admin_wallet: ADMIN_WALLET,
  created_at: new Date(Date.now() - 3600_000).toISOString(),
  amount_usdc: 150.0,
  recipient_id: 'teacher-supplies',
};

function buildMockConversationFromParams(params: any): Conversation {
  const parsedAmount = Number(params?.demoAmountUSDC);
  const safeAmount =
    Number.isFinite(parsedAmount) && parsedAmount > 0
      ? parsedAmount
      : MOCK_CONVERSATION.amount_usdc;
  const safeRecipientId =
    typeof params?.demoRecipientId === 'string' && params.demoRecipientId
      ? params.demoRecipientId
      : MOCK_CONVERSATION.recipient_id;

  return {
    ...MOCK_CONVERSATION,
    id:
      typeof params?.conversationId === 'string' && params.conversationId
        ? params.conversationId
        : `mock-${safeRecipientId || 'thread'}`,
    amount_usdc: safeAmount,
    recipient_id: safeRecipientId,
  };
}

function buildMockMessages(conversation: Conversation): Message[] {
  const amount = Number(conversation.amount_usdc ?? 25).toFixed(2);
  const recipientName = getRecipientLabel(conversation.recipient_id);
  const glimpseTag = getRecipientGlimpseTag(conversation.recipient_id);
  const now = Date.now();
  const beneficiaryNote =
    conversation.recipient_id === 'teacher-supplies'
      ? 'Rebecca (2nd grade teacher): Thank you for this support. I purchased 12 phonics workbooks, dry-erase marker sets, and two classroom reading games. We are using them for daily small-group reading and writing stations this month.'
      : conversation.recipient_id === 'single-moms-crisis'
      ? 'Maria: Thank you for helping my family this week. We were able to cover groceries and gas, and I can get to work tomorrow.'
      : 'Jasmine (foster program coordinator): Thank you. We bought diapers, formula, and two after-school activity kits for kids entering care this week.';

  return [
    {
      id: `mock-a1-${conversation.id}`,
      conversation_id: conversation.id,
      sender_wallet: ADMIN_WALLET,
      body: `Thank you for your ${amount} USDC donation to ${recipientName} (${glimpseTag}). We will send your first update within 24-48 hours.`,
      media_url: null,
      media_type: null,
      created_at: new Date(now - 42 * 60 * 1000).toISOString(),
    },
    {
      id: `mock-a2-${conversation.id}`,
      conversation_id: conversation.id,
      sender_wallet: MOCK_WALLET,
      body: 'Thank you. I appreciate the clear updates.',
      media_url: null,
      media_type: null,
      created_at: new Date(now - 36 * 60 * 1000).toISOString(),
    },
    {
      id: `mock-a3-${conversation.id}`,
      conversation_id: conversation.id,
      sender_wallet: ADMIN_WALLET,
      body: `Allocation update: your ${amount} USDC is now assigned inside ${recipientName} (${glimpseTag}).`,
      media_url: null,
      media_type: null,
      created_at: new Date(now - 28 * 60 * 1000).toISOString(),
    },
    {
      id: `mock-a4-${conversation.id}`,
      conversation_id: conversation.id,
      sender_wallet: ADMIN_WALLET,
      body: beneficiaryNote,
      media_url: null,
      media_type: null,
      created_at: new Date(now - 20 * 60 * 1000).toISOString(),
    },
  ];
}

// ---------- Helpers ----------

function shortThreadId(id: string) {
  return `#${id.slice(0, 6).toUpperCase()}`;
}

function MessageBubble({
  item,
  fromAdmin,
  adminBubbleBackground,
  adminBubbleBorder,
  donorBubbleBackground,
  donorBubbleBorder,
  adminTextColor,
  donorTextColor,
  adminTimeColor,
  donorTimeColor,
}: {
  item: Message;
  fromAdmin: boolean;
  adminBubbleBackground: string;
  adminBubbleBorder: string;
  donorBubbleBackground: string;
  donorBubbleBorder: string;
  adminTextColor: string;
  donorTextColor: string;
  adminTimeColor: string;
  donorTimeColor: string;
}) {
  const enterMotion = React.useRef(new Animated.Value(0)).current;
  const translateXStart = fromAdmin ? -8 : 8;

  useEffect(() => {
    Animated.timing(enterMotion, {
      toValue: 1,
      duration: 210,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enterMotion]);

  const mediaSource = React.useMemo(() => {
    if (!item.media_url) {
      return null;
    }

    // Supabase storage supports transform query params. External URLs are passed through.
    if (item.media_url.includes('supabase')) {
      return {
        uri: item.media_url.includes('?')
          ? `${item.media_url}&width=900&height=900`
          : `${item.media_url}?width=900&height=900`,
      };
    }

    return {uri: item.media_url};
  }, [item.media_url]);

  return (
    <Animated.View
      style={[
        styles.bubble,
        fromAdmin
          ? [
              styles.bubbleAdmin,
              {
                backgroundColor: adminBubbleBackground,
                borderColor: adminBubbleBorder,
              },
            ]
          : [
              styles.bubbleDonor,
              {
                backgroundColor: donorBubbleBackground,
                borderColor: donorBubbleBorder,
              },
            ],
        {
          opacity: enterMotion,
          transform: [
            {
              translateY: enterMotion.interpolate({
                inputRange: [0, 1],
                outputRange: [6, 0],
              }),
            },
            {
              translateX: enterMotion.interpolate({
                inputRange: [0, 1],
                outputRange: [translateXStart, 0],
              }),
            },
          ],
        },
      ]}>
      {mediaSource && (
        <Image
          source={mediaSource}
          style={styles.mediaImage}
          resizeMode="cover"
        />
      )}

      {item.media_type ? (
        <View style={styles.mediaTagWrap}>
          <Text style={styles.mediaTagText}>
            {item.media_type === 'receipt' ? 'RECEIPT' : 'PHOTO'}
          </Text>
        </View>
      ) : null}

      {item.body ? (
        <Text
          style={[
            styles.bubbleText,
            {
              color: fromAdmin ? adminTextColor : donorTextColor,
            },
          ]}>
          {item.body}
        </Text>
      ) : null}

      <Text
        style={[
          styles.bubbleTime,
          {
            color: fromAdmin ? adminTimeColor : donorTimeColor,
          },
        ]}>
        {new Date(item.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </Animated.View>
  );
}

function GalleryGlyph({color}: {color: string}) {
  return (
    <View style={[styles.glyphFrame, {borderColor: color}]}>
      <View style={[styles.glyphSun, {borderColor: color}]} />
      <View style={[styles.glyphHill, {borderColor: color}]} />
    </View>
  );
}

function CameraGlyph({color}: {color: string}) {
  return (
    <View style={[styles.glyphCameraBody, {borderColor: color}]}>
      <View style={[styles.glyphCameraTop, {borderColor: color}]} />
      <View style={[styles.glyphCameraLens, {borderColor: color}]} />
    </View>
  );
}

// ---------- Main Screen ----------

export default function MessagesScreen() {
  const {theme} = useTheme();
  const route = useRoute<any>();
  const {connected, publicKey} = useWallet();

  const walletAddress = publicKey?.toBase58() || (__DEV__ ? MOCK_WALLET : '');
  const useMocks = __DEV__;

  const conversationId: string | undefined = route.params?.conversationId;
  const mockConversation = React.useMemo(
    () => buildMockConversationFromParams(route.params),
    [route.params],
  );

  // In dev mode, use mock conversation. In prod, look up by conversationId.
  const [conversation, setConversation] = useState<Conversation | null>(
    useMocks ? mockConversation : null,
  );
  const [loading, setLoading] = useState(!useMocks);

  useEffect(() => {
    if (!useMocks) {
      return;
    }
    setConversation(mockConversation);
    setLoading(false);
  }, [mockConversation, useMocks]);

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
  const mockMessages = React.useMemo(
    () => buildMockMessages(conversation),
    [conversation],
  );
  const messages = useMocks ? mockMessages : realChat.messages;
  const chatLoading = useMocks ? false : realChat.loading;
  const chatError = useMocks ? null : realChat.error;
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pickedImage, setPickedImage] = useState<Asset | null>(null);
  const flatListRef = React.useRef<FlatList>(null);
  const sendPulse = React.useRef(new Animated.Value(1)).current;

  const recipientName = getRecipientLabel(conversation.recipient_id);
  const glimpseTag = getRecipientGlimpseTag(conversation.recipient_id);
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

  const ensureCameraPermission = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return true;
    }
    const current = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.CAMERA,
    );
    if (current) {
      return true;
    }
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission',
        message: 'Glimpse needs camera access to take and send photos.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      },
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  const takePhoto = useCallback(() => {
    (async () => {
      const allowed = await ensureCameraPermission();
      if (!allowed) {
        Alert.alert(
          'Camera access needed',
          'Please allow camera permission to capture photos.',
        );
        return;
      }

      launchCamera(
        {
          mediaType: 'photo',
          includeBase64: true,
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8,
        },
        response => {
          if (response.didCancel) {
            return;
          }
          if (response.errorCode) {
            Alert.alert(
              'Camera unavailable',
              'Could not open camera on this device. Try gallery instead.',
            );
            return;
          }
          const asset = response.assets?.[0];
          if (asset) {
            setPickedImage(asset);
          }
        },
      );
    })().catch(() => {
      Alert.alert('Camera error', 'Please try again.');
    });
  }, [ensureCameraPermission]);

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
      Animated.sequence([
        Animated.timing(sendPulse, {
          toValue: 1.06,
          duration: 90,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sendPulse, {
          toValue: 1,
          duration: 130,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } catch (sendErrorReason) {
      const message =
        sendErrorReason instanceof Error
          ? sendErrorReason.message
          : 'Message failed to send. Try again.';
      setSendError(message);
    }

    setSending(false);
  }, [conversation.id, inputText, pickedImage, sendPulse, walletAddress]);

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
              GLIMPSE {glimpseTag}
            </Text>
            <Text
              style={[
                styles.chatMeta,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.brand,
                },
              ]}>
              {amount} USDC • {shortThreadId(conversation.id)} • {recipientName}
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
                <MessageBubble
                  item={item}
                  fromAdmin={fromAdmin}
                  adminBubbleBackground="rgba(26,17,37,0.06)"
                  adminBubbleBorder="rgba(26,17,37,0.14)"
                  donorBubbleBackground={theme.colors.accent}
                  donorBubbleBorder={theme.colors.accentPressed}
                  adminTextColor={theme.colors.textPrimary}
                  donorTextColor="rgba(248,244,255,0.98)"
                  adminTimeColor={theme.colors.textTertiary}
                  donorTimeColor="rgba(244,240,255,0.74)"
                />
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
              borderTopColor: 'rgba(101,84,209,0.2)',
              backgroundColor: 'rgba(101,84,209,0.1)',
            },
          ]}>
          <TouchableOpacity
            style={[
              styles.mediaButton,
              {
                borderColor: 'rgba(101,84,209,0.32)',
                backgroundColor: '#F4F1FF',
              },
            ]}
            onPress={pickPhoto}
            activeOpacity={0.7}>
            <GalleryGlyph color={theme.colors.accent} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.mediaButton,
              {
                borderColor: 'rgba(101,84,209,0.32)',
                backgroundColor: '#F4F1FF',
              },
            ]}
            onPress={takePhoto}
            activeOpacity={0.7}>
            <CameraGlyph color={theme.colors.accent} />
          </TouchableOpacity>

          <TextInput
            style={[
              styles.chatInput,
              {
                backgroundColor: '#FFFFFF',
                color: '#1A1125',
                borderColor: 'rgba(141,125,199,0.45)',
              },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Write a reply..."
            placeholderTextColor={theme.colors.textTertiary}
            multiline
            maxLength={500}
          />

          <AnimatedTouchableOpacity
            style={[
              styles.sendIconButton,
              {
                backgroundColor: '#6554D1',
                transform: [{scale: sendPulse}],
              },
              ((!inputText.trim() && !pickedImage) || sending) && {
                backgroundColor: '#BFB5ED',
                borderColor: 'rgba(101,84,209,0.35)',
              },
            ]}
            onPress={handleSend}
            activeOpacity={0.85}
            disabled={(!inputText.trim() && !pickedImage) || sending}>
            <Text
              style={[
                styles.sendIconText,
                {fontFamily: theme.typography.brand},
              ]}>
              {sending ? '…' : '→'}
            </Text>
          </AnimatedTouchableOpacity>
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
    height: 210,
    borderRadius: 8,
    marginBottom: 8,
  },
  mediaTagWrap: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(101,84,209,0.35)',
    backgroundColor: 'rgba(101,84,209,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  mediaTagText: {
    fontSize: 9,
    letterSpacing: 0.7,
    fontWeight: '700',
    color: '#4D41A8',
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
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glyphFrame: {
    width: 15,
    height: 12,
    borderWidth: 1.2,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glyphSun: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 3,
    height: 3,
    borderRadius: 2,
    borderWidth: 1,
  },
  glyphHill: {
    position: 'absolute',
    bottom: 1.5,
    width: 8,
    height: 4,
    borderTopWidth: 1.2,
    borderLeftWidth: 1.2,
    transform: [{rotate: '-12deg'}],
  },
  glyphCameraBody: {
    width: 15,
    height: 11,
    borderWidth: 1.2,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphCameraTop: {
    position: 'absolute',
    top: -3,
    left: 3,
    width: 5,
    height: 2.5,
    borderWidth: 1.2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  glyphCameraLens: {
    width: 4.5,
    height: 4.5,
    borderRadius: 3,
    borderWidth: 1.2,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -14,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendIconButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sendIconText: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.6,
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
