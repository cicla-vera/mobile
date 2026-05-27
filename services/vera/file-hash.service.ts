import { sha256 } from 'js-sha256';

function base64ToBytes(base64: string) {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function sha256FromBase64(base64: string) {
  return sha256(base64ToBytes(base64));
}

export function sha256FromBytes(bytes: Uint8Array) {
  return sha256(bytes);
}
