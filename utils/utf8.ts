// RN 0.76 Hermes has native TextEncoder — no Buffer polyfill needed.
export function utf8Encode(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}
