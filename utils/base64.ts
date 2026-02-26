import {Buffer} from 'buffer';

export function encodeBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

export function decodeBase64(input: string): Uint8Array {
  return Uint8Array.from(Buffer.from(input, 'base64'));
}
