// v2 Messages Screen — direct chat view (no thread list)
// Navigated to via conversationId param from the donation flow.

import React, {useCallback, useEffect, useState} from 'react';
import {
  Animated,
  Alert,
  BackHandler,
  Linking,
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
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
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
  Message,
  fetchConversations,
  getMediaSignedUrl,
  sendMessage,
  updateDonationStatus,
  uploadChatMedia,
  useChatMessages,
} from '../services/chat';
import {getRecipientLabel} from '../data/donationConfig';
import {ADMIN_WALLET} from '../config/env';
import {getExplorerUrl} from '../utils/explorer';
import AppHeader from '../ui/AppHeader';
import SurfaceCard from '../ui/SurfaceCard';
import type {RootTabParamList} from '../navigation/AppNavigator';
import {useUnread} from '../components/providers/UnreadProvider';

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

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
  const {theme} = useTheme();
  const enterMotion = React.useRef(new Animated.Value(0)).current;
  const translateXStart = fromAdmin ? -8 : 8;

  useEffect(() => {
    Animated.timing(enterMotion, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enterMotion]);

  const [resolvedMediaUri, setResolvedMediaUri] = useState<string | null>(null);

  useEffect(() => {
    if (!item.media_url) {
      setResolvedMediaUri(null);
      return;
    }

    // Never render absolute URLs from DB rows directly.
    // Only internal storage paths are allowed and then resolved to signed URLs.
    if (item.media_url.startsWith('http')) {
      setResolvedMediaUri(null);
      return;
    }

    // Storage path — resolve a fresh signed URL
    let cancelled = false;
    getMediaSignedUrl(item.media_url)
      .then(url => {
        if (!cancelled) {
          setResolvedMediaUri(url);
        }
      })
      .catch(() => {
        // Silently fail — image won't render
      });
    return () => {
      cancelled = true;
    };
  }, [item.media_url]);

  const mediaSource = React.useMemo(() => {
    if (!resolvedMediaUri) {
      return null;
    }
    return {uri: resolvedMediaUri};
  }, [resolvedMediaUri]);

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
          <Text style={[styles.mediaTagText, {color: theme.colors.accent}]}>
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

type MessagesRouteProp = RouteProp<RootTabParamList, 'Messages'>;

export default function MessagesScreen() {
  const {theme} = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<MessagesRouteProp>();
  const {connected, publicKey} = useWallet();
  const {conversationUnreads, markRead, setActiveConversation} = useUnread();

  const conversationId: string | undefined = route.params?.conversationId;
  const walletAddress = publicKey?.toBase58() || '';

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [activeGlimpseTag, setActiveGlimpseTag] = useState('#001');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch conversations from Supabase
  useEffect(() => {
    if (!connected || !walletAddress) {
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
        setConversations(convos);
        if (conversationId) {
          const targetIndex = convos.findIndex(c => c.id === conversationId);
          if (targetIndex >= 0) {
            setConversation(convos[targetIndex]);
            setActiveGlimpseTag(
              `#${String(convos.length - targetIndex).padStart(3, '0')}`,
            );
          } else {
            setConversation(null);
          }
        }
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
  }, [conversationId, connected, walletAddress]);

  useEffect(() => {
    if (!conversation) {
      setActiveConversation(null);
    }
  }, [conversation, setActiveConversation]);

  // Intercept back gesture/button: go to inbox instead of previous tab
  const goBackToInbox = useCallback(() => {
    setConversation(null);
    setActiveConversation(null);
    if (conversationId) {
      navigation.setParams({conversationId: undefined});
    }
  }, [conversationId, navigation, setActiveConversation]);

  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        if (conversation) {
          goBackToInbox();
          return true; // handled
        }
        return false; // let default behavior happen
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [conversation, goBackToInbox]),
  );

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

  // No conversationId param — show conversation list
  if (!conversationId && !conversation) {
    if (conversations.length === 0) {
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
                NO CONVERSATIONS
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
      <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
        <AppHeader title="Messages" />
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.conversationList}
          renderItem={({item, index}) => {
            const amount = Number(item.amount_usdc ?? 0).toFixed(2);
            const glimpseNumber = String(
              conversations.length - index,
            ).padStart(3, '0');
            const glimpseTag = `#${glimpseNumber}`;
            const unreadCount =
              conversationUnreads[item.id] ?? item.unread_count ?? 0;
            return (
              <TouchableOpacity
                style={[
                  styles.conversationRow,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  setActiveConversation(item.id);
                  markRead(item.id).catch(() => {});
                  setConversation(item);
                  setActiveGlimpseTag(glimpseTag);
                }}>
                <View style={styles.conversationTopRow}>
                  <Text
                    style={[
                      styles.conversationTitle,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.brand,
                      },
                    ]}>
                    GLIMPSE {glimpseTag}
                  </Text>
                  <View style={styles.conversationRightGroup}>
                    <Text
                      style={[
                        styles.conversationAmount,
                        {
                          color: theme.colors.textSecondary,
                          fontFamily: theme.typography.brand,
                        },
                      ]}>
                      ${amount}
                    </Text>
                    {unreadCount > 0 ? (
                      <View
                        style={[
                          styles.conversationUnreadBadge,
                          {backgroundColor: theme.colors.accent},
                        ]}>
                        <Text style={styles.conversationUnreadText}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  }

  if (!conversation) {
    const showBackToList = !!conversationId;
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
              THREAD NOT FOUND
            </Text>
            <Text
              style={[styles.stateBody, {color: theme.colors.textSecondary}]}>
              This conversation could not be loaded.
            </Text>
            {showBackToList ? (
              <TouchableOpacity
                style={styles.backToThreadsButton}
                activeOpacity={0.8}
                onPress={() => {
                  navigation.setParams({conversationId: undefined});
                }}>
                <Text
                  style={[
                    styles.backToThreadsText,
                    {
                      color: theme.colors.accent,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  Back to threads
                </Text>
              </TouchableOpacity>
            ) : null}
          </SurfaceCard>
        </View>
      </View>
    );
  }

  return (
    <ChatView
      conversation={conversation}
      glimpseTag={activeGlimpseTag}
      hasRouteConversationId={!!conversationId}
      walletAddress={walletAddress}
      onMarkRead={markRead}
      onSetActiveConversation={setActiveConversation}
      onBackToThreads={() => {
        setConversation(null);
        setActiveConversation(null);
        if (conversationId) {
          navigation.setParams({conversationId: undefined});
        }
      }}
    />
  );
}

// ---------- Chat View ----------

function ChatView({
  conversation,
  glimpseTag,
  hasRouteConversationId,
  walletAddress,
  onMarkRead,
  onSetActiveConversation,
  onBackToThreads,
}: {
  conversation: Conversation;
  glimpseTag: string;
  hasRouteConversationId: boolean;
  walletAddress: string;
  onMarkRead: (conversationId: string) => Promise<void>;
  onSetActiveConversation: (conversationId: string | null) => void;
  onBackToThreads: () => void;
}) {
  const {theme} = useTheme();
  const {isAdmin} = useWallet();
  const chat = useChatMessages(conversation.id);
  const messages = chat.messages;
  const chatLoading = chat.loading;
  const chatError = chat.error;
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pickedImage, setPickedImage] = useState<Asset | null>(null);
  const [donationStatus, setDonationStatus] = useState(
    conversation.donation_status ?? 'confirmed',
  );
  const [markingComplete, setMarkingComplete] = useState(false);
  const flatListRef = React.useRef<FlatList>(null);
  const sendPulse = React.useRef(new Animated.Value(1)).current;

  const handleMarkCompleted = useCallback(async () => {
    setMarkingComplete(true);
    try {
      await updateDonationStatus(conversation.donation_id, 'completed');
      setDonationStatus('completed');
    } catch (e) {
      console.error('Failed to mark completed:', e);
    }
    setMarkingComplete(false);
  }, [conversation.donation_id]);

  const recipientName = getRecipientLabel(conversation.recipient_id);
  const displayAmount = conversation.amount_usdc ?? 0;
  const amount = Number(displayAmount).toFixed(2);

  const invertedMessages = React.useMemo(
    () => [...messages].reverse(),
    [messages],
  );

  useEffect(() => {
    onSetActiveConversation(conversation.id);
    onMarkRead(conversation.id).catch(() => {});
    return () => {
      onSetActiveConversation(null);
    };
  }, [conversation.id, onMarkRead, onSetActiveConversation]);

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
          duration: 100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sendPulse, {
          toValue: 1,
          duration: 100,
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

  const isSenderAdmin = (senderWallet: string) =>
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
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.borderMuted,
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
            <TouchableOpacity
              onPress={onBackToThreads}
              style={styles.backToThreadsButton}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.backToThreadsText,
                  {
                    color: theme.colors.accent,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                {hasRouteConversationId ? 'Go to inbox' : 'Back to threads'}
              </Text>
            </TouchableOpacity>
            {conversation.tx_signature ? (
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(getExplorerUrl(conversation.tx_signature!))
                }
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.explorerLink,
                    {
                      color: theme.colors.accent,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  View on Explorer
                </Text>
              </TouchableOpacity>
            ) : null}
            {isAdmin && donationStatus === 'confirmed' ? (
              <TouchableOpacity
                onPress={handleMarkCompleted}
                disabled={markingComplete}
                style={[
                  styles.markCompletedButton,
                  {borderColor: theme.colors.success},
                ]}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.markCompletedText,
                    {
                      color: theme.colors.success,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  {markingComplete ? 'UPDATING...' : 'MARK COMPLETED'}
                </Text>
              </TouchableOpacity>
            ) : isAdmin && donationStatus === 'completed' ? (
              <Text
                style={[
                  styles.completedBadge,
                  {
                    color: theme.colors.success,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                COMPLETED
              </Text>
            ) : null}
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
              const fromAdmin = isSenderAdmin(item.sender_wallet);
              return (
                <MessageBubble
                  item={item}
                  fromAdmin={fromAdmin}
                  adminBubbleBackground={theme.colors.surfaceMuted}
                  adminBubbleBorder={theme.colors.borderMuted}
                  donorBubbleBackground={theme.colors.accent}
                  donorBubbleBorder={theme.colors.accentPressed}
                  adminTextColor={theme.colors.textPrimary}
                  donorTextColor={
                    theme.mode === 'light'
                      ? 'rgba(248,244,255,0.98)'
                      : '#F7FAFC'
                  }
                  adminTimeColor={theme.colors.textTertiary}
                  donorTimeColor={
                    theme.mode === 'light'
                      ? 'rgba(244,240,255,0.74)'
                      : 'rgba(247,250,252,0.6)'
                  }
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
              borderTopColor: theme.colors.borderMuted,
              backgroundColor: theme.colors.surfaceMuted,
            },
          ]}>
          <TouchableOpacity
            style={[
              styles.mediaButton,
              {
                borderColor: theme.colors.borderMuted,
                backgroundColor: theme.colors.surface,
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
                borderColor: theme.colors.borderMuted,
                backgroundColor: theme.colors.surface,
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
                backgroundColor:
                  theme.mode === 'light' ? '#FFFFFF' : theme.colors.surface,
                color: theme.colors.textPrimary,
                borderColor: theme.colors.borderMuted,
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
                backgroundColor: theme.colors.accent,
                transform: [{scale: sendPulse}],
              },
              ((!inputText.trim() && !pickedImage) || sending) && {
                backgroundColor: theme.colors.textTertiary,
                borderColor: theme.colors.borderMuted,
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
  explorerLink: {
    fontSize: 11,
    letterSpacing: 0.5,
    marginTop: 6,
  },
  markCompletedButton: {
    borderWidth: 2,
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  markCompletedText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  completedBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 8,
  },
  conversationList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  conversationRow: {
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  conversationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conversationTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  conversationRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conversationAmount: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  conversationUnreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationUnreadText: {
    color: '#fff',
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
  },
  backToThreadsButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 2,
  },
  backToThreadsText: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
