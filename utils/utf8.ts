import {Buffer} from 'buffer';

export function utf8Encode(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, 'utf8'));
}
