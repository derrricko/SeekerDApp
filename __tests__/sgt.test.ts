// Tests for SGT (Seeker Genesis Token) verification — pure TLV parsing logic.
// Avoids importing @solana/web3.js directly (ESM incompatible with Jest).

import {hasValidGroupMember} from '../utils/sgt-tlv';
import {
  SGT_MINT_AUTHORITY,
  SGT_METADATA_ADDRESS,
  SGT_GROUP_MINT_ADDRESS,
} from '../config/env';

// Base58 decode (minimal, for test fixtures only)
function base58Decode(str: string): Buffer {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = 0n;
  for (const char of str) {
    const idx = ALPHABET.indexOf(char);
    if (idx === -1) {
      throw new Error(`Invalid base58 char: ${char}`);
    }
    num = num * 58n + BigInt(idx);
  }
  const hex = num.toString(16).padStart(64, '0');
  return Buffer.from(hex, 'hex');
}

const GROUP_MINT_BYTES = base58Decode(SGT_GROUP_MINT_ADDRESS);
const WRONG_GROUP_BYTES = base58Decode(
  'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk',
);
const RANDOM_MINT_BYTES = base58Decode(
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
);

// Build a TLV entry: [u16 type LE][u16 length LE][data]
function buildTlvEntry(type: number, data: Buffer): Buffer {
  const header = Buffer.alloc(4);
  header.writeUInt16LE(type, 0);
  header.writeUInt16LE(data.length, 2);
  return Buffer.concat([header, data]);
}

// Type 22 = TokenGroupMember: [32 bytes mint][32 bytes group]
function buildGroupMemberTlv(mintBytes: Buffer, groupBytes: Buffer): Buffer {
  return buildTlvEntry(22, Buffer.concat([mintBytes, groupBytes]));
}

// Type 18 = MetadataPointer: [32 bytes authority][32 bytes metadataAddress]
function buildMetadataPointerTlv(
  authorityBytes: Buffer,
  metadataBytes: Buffer,
): Buffer {
  return buildTlvEntry(18, Buffer.concat([authorityBytes, metadataBytes]));
}

describe('hasValidGroupMember', () => {
  it('returns true for valid group member TLV', () => {
    const tlv = buildGroupMemberTlv(RANDOM_MINT_BYTES, GROUP_MINT_BYTES);
    expect(hasValidGroupMember(tlv)).toBe(true);
  });

  it('returns false for wrong group address', () => {
    const tlv = buildGroupMemberTlv(RANDOM_MINT_BYTES, WRONG_GROUP_BYTES);
    expect(hasValidGroupMember(tlv)).toBe(false);
  });

  it('returns false when extension is missing', () => {
    const tlv = buildMetadataPointerTlv(RANDOM_MINT_BYTES, RANDOM_MINT_BYTES);
    expect(hasValidGroupMember(tlv)).toBe(false);
  });

  it('returns false for empty buffer', () => {
    expect(hasValidGroupMember(Buffer.alloc(0))).toBe(false);
  });

  it('finds correct group member among multiple TLV entries', () => {
    const metaEntry = buildMetadataPointerTlv(
      RANDOM_MINT_BYTES,
      RANDOM_MINT_BYTES,
    );
    const groupEntry = buildGroupMemberTlv(RANDOM_MINT_BYTES, GROUP_MINT_BYTES);
    const tlv = Buffer.concat([metaEntry, groupEntry]);
    expect(hasValidGroupMember(tlv)).toBe(true);
  });

  it('handles truncated TLV data gracefully', () => {
    const header = Buffer.alloc(4);
    header.writeUInt16LE(22, 0);
    header.writeUInt16LE(64, 2);
    const truncated = Buffer.concat([header, Buffer.alloc(10)]);
    expect(hasValidGroupMember(truncated)).toBe(false);
  });
});

describe('SGT constants', () => {
  it('SGT_MINT_AUTHORITY is a valid base58 string', () => {
    expect(SGT_MINT_AUTHORITY).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);
    expect(base58Decode(SGT_MINT_AUTHORITY)).toHaveLength(32);
  });

  it('SGT_METADATA_ADDRESS is a valid base58 string', () => {
    expect(SGT_METADATA_ADDRESS).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);
    expect(base58Decode(SGT_METADATA_ADDRESS)).toHaveLength(32);
  });

  it('SGT_GROUP_MINT_ADDRESS is a valid base58 string', () => {
    expect(SGT_GROUP_MINT_ADDRESS).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);
    expect(base58Decode(SGT_GROUP_MINT_ADDRESS)).toHaveLength(32);
  });
});
