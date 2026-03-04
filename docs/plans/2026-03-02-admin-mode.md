# Admin Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let the admin wallet (company Seeker phone) see all conversations, reply, upload photos, and mark donations as completed.

**Architecture:** Auto-detect admin by comparing connected wallet to `ADMIN_WALLET`. Add `isAdmin` to WalletProvider context. Join `status` into Conversation type. Add "MARK COMPLETED" button in ChatView. New RLS policy allows admin-only UPDATE on donations.

**Tech Stack:** React Native, Supabase (RLS + PostgREST), TypeScript

---

### Task 1: Add `isAdmin` to WalletProvider

**Files:**
- Modify: `components/providers/WalletProvider.tsx:93-127` (interface + default context)
- Modify: `components/providers/WalletProvider.tsx:657-679` (useMemo value)

**Step 1: Add isAdmin to WalletContextType interface**

At line 93, add `isAdmin: boolean` after `sgtLoading`:

```typescript
interface WalletContextType {
  connected: boolean;
  publicKey: PublicKey | null;
  connecting: boolean;
  hasSeekerToken: boolean;
  sgtLoading: boolean;
  recheckSgt: () => void;
  isAdmin: boolean;          // <-- ADD
  connect: () => Promise<PublicKey>;
  // ... rest unchanged
}
```

Default context value (line 113):
```typescript
isAdmin: false,
```

**Step 2: Import ADMIN_WALLET and derive isAdmin**

Add `ADMIN_WALLET` to the existing env import (line 28):
```typescript
import {ADMIN_WALLET, APP_IDENTITY, SOLANA_CLUSTER, ...} from '../../config/env';
```

After `const connected = publicKey !== null;` (line 163), add:
```typescript
const isAdmin = publicKey?.toBase58() === ADMIN_WALLET;
```

**Step 3: Add isAdmin to useMemo value and deps**

In the `value` useMemo (line 657), add `isAdmin` to both the object and the dependency array.

**Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors)

**Step 5: Commit**

```bash
git add components/providers/WalletProvider.tsx
git commit -m "feat: add isAdmin to WalletProvider context"
```

---

### Task 2: Join donation status into Conversation type

**Files:**
- Modify: `services/chat.ts:20-31` (Conversation interface)
- Modify: `services/chat.ts:52-67` (fetchConversations select + mapping)

**Step 1: Add `donation_status` to Conversation interface**

```typescript
export interface Conversation {
  id: string;
  donation_id: string;
  donor_wallet: string;
  admin_wallet: string;
  created_at: string;
  // Joined from donations table
  amount_usdc?: number;
  recipient_id?: string;
  tx_signature?: string;
  unread_count?: number;
  donation_status?: DonationStatus;  // <-- ADD
}
```

**Step 2: Add `status` to the select join and mapping**

In `fetchConversations()`, update the select string:
```typescript
.select('*, donations(amount_usdc, recipient_id, tx_signature, status)')
```

In the mapping (line 62-67), add:
```typescript
donation_status: (c.donations?.status || 'confirmed') as DonationStatus,
```

**Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 4: Commit**

```bash
git add services/chat.ts
git commit -m "feat: join donation status into Conversation type"
```

---

### Task 3: Add `updateDonationStatus()` function

**Files:**
- Modify: `services/chat.ts` (add new exported function)

**Step 1: Add the function after `fetchAllDonations`**

```typescript
export async function updateDonationStatus(
  donationId: string,
  status: DonationStatus,
): Promise<void> {
  const supabase = getSupabase();
  const {error} = await supabase
    .from('donations')
    .update({status})
    .eq('id', donationId);

  if (error) {
    throw error;
  }
}
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 3: Commit**

```bash
git add services/chat.ts
git commit -m "feat: add updateDonationStatus function"
```

---

### Task 4: Migration 017 — Admin UPDATE policy

**Files:**
- Create: `supabase/migrations/017_admin_update_donations.sql`

**Step 1: Write migration**

```sql
-- Allow admin wallet to mark donations as completed.
-- WITH CHECK ensures status can only be set to 'completed'.
CREATE POLICY "Admin can complete donations"
  ON public.donations FOR UPDATE
  USING (public.current_wallet() = 'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk')
  WITH CHECK (status = 'completed');
```

**Step 2: Deploy migration**

Run: `npx supabase db push`
Expected: Migration 017 applied successfully

**Step 3: Commit**

```bash
git add supabase/migrations/017_admin_update_donations.sql
git commit -m "feat: RLS policy for admin to complete donations"
```

---

### Task 5: Add "MARK COMPLETED" button to ChatView

**Files:**
- Modify: `screens/MessagesScreen.tsx:503-519` (ChatView props)
- Modify: `screens/MessagesScreen.tsx:691-692` (rename local isAdmin function)
- Modify: `screens/MessagesScreen.tsx:710-758` (chat header card)

**Step 1: Rename local `isAdmin` function to avoid shadowing**

Line 691, change:
```typescript
const isAdmin = (senderWallet: string) =>
```
to:
```typescript
const isSenderAdmin = (senderWallet: string) =>
```

Find all usages of `isAdmin(` in ChatView's message rendering and update to `isSenderAdmin(`. Search for `isAdmin(msg` or `isAdmin(item` patterns.

**Step 2: Import `useWallet` and `updateDonationStatus`**

At top of file, add to existing imports:
```typescript
import {useWallet} from '../components/providers/WalletProvider';
```

Add `updateDonationStatus` to the chat.ts import:
```typescript
import {
  fetchConversations,
  // ... existing imports ...
  updateDonationStatus,
} from '../services/chat';
```

**Step 3: Add admin state to ChatView**

Inside ChatView function body, after existing hooks:
```typescript
const {isAdmin} = useWallet();
const [donationStatus, setDonationStatus] = useState(
  conversation.donation_status ?? 'confirmed',
);
const [markingComplete, setMarkingComplete] = useState(false);

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
```

**Step 4: Add button to chat header**

After the "View on Explorer" TouchableOpacity (line 756), add:

```tsx
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
```

**Step 5: Add styles**

```typescript
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
```

**Step 6: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 7: Build and install on device**

Run: `npx react-native run-android`
Expected: Installs on Seeker, no crashes

**Step 8: Commit**

```bash
git add screens/MessagesScreen.tsx
git commit -m "feat: admin can mark donations completed from chat"
```

---

### Task 6: Final verification and push

**Step 1: Run full quality gates**

```bash
npx tsc --noEmit
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/test.bundle
```

**Step 2: Push all commits**

```bash
git push
```

---

## Testing Checklist

- [ ] Connect with donor wallet → Messages shows only your conversations
- [ ] Connect with admin wallet → Messages shows ALL conversations
- [ ] Admin sees "MARK COMPLETED" button in chat header when status is confirmed
- [ ] Tapping "MARK COMPLETED" updates to "COMPLETED" badge
- [ ] Donor sees updated status on next visit (My Glimpses + chat)
- [ ] Admin can send text messages in any thread
- [ ] Admin can upload photos in any thread
- [ ] Non-admin user does NOT see "MARK COMPLETED" button
- [ ] Donation flow still works end-to-end (no regressions)
