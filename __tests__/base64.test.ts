import {decodeBase64, encodeBase64} from '../utils/base64';
import {utf8Encode} from '../utils/utf8';

describe('base64 utils', () => {
  it('encodes and decodes ascii strings', () => {
    const input = utf8Encode('glimpse-auth:1700000000000');
    const encoded = encodeBase64(input);
    const decoded = decodeBase64(encoded);

    expect(Array.from(decoded)).toEqual(Array.from(input));
  });

  it('supports binary payloads', () => {
    const input = new Uint8Array([0, 255, 17, 33, 44, 55, 66, 77, 88, 99]);
    const encoded = encodeBase64(input);
    const decoded = decodeBase64(encoded);

    expect(Array.from(decoded)).toEqual(Array.from(input));
  });
});
