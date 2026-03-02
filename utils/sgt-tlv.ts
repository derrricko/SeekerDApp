// Pure TLV parsing for Token-2022 TokenGroupMember extension.
// No Solana SDK dependencies — safe for Jest.

import {SGT_GROUP_MINT_ADDRESS} from '../config/env';

// Token-2022 extension type for TokenGroupMember (not in spl-token v0.3.11)
const TOKEN_GROUP_MEMBER_TYPE = 22;

// Pre-compute group mint bytes from base58 for comparison
const GROUP_MINT_BYTES = base58ToBytes(SGT_GROUP_MINT_ADDRESS);

/**
 * Parse TLV data for TokenGroupMember extension (type 22).
 * Layout: [u16 type LE][u16 length LE][32 bytes mint][32 bytes group]
 * Returns true if the group address matches SGT_GROUP_MINT_ADDRESS.
 */
export function hasValidGroupMember(tlvData: Buffer): boolean {
  let offset = 0;
  while (offset + 4 <= tlvData.length) {
    const type = tlvData.readUInt16LE(offset);
    const length = tlvData.readUInt16LE(offset + 2);
    if (offset + 4 + length > tlvData.length) {
      break;
    }
    if (type === TOKEN_GROUP_MEMBER_TYPE && length >= 64) {
      const groupBytes = tlvData.slice(offset + 4 + 32, offset + 4 + 64);
      if (
        groupBytes.length === 32 &&
        bytesEqual(groupBytes, GROUP_MINT_BYTES)
      ) {
        return true;
      }
    }
    offset += 4 + length;
  }
  return false;
}

function bytesEqual(a: Buffer | Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function base58ToBytes(str: string): Uint8Array {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = 0n;
  for (const char of str) {
    num = num * 58n + BigInt(ALPHABET.indexOf(char));
  }
  const hex = num.toString(16).padStart(64, '0');
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
