const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
};

export function validateMagicBytes(
  buffer: ArrayBuffer,
  declaredMime: string,
): boolean {
  if (buffer.byteLength < 12) return false;

  const bytes = new Uint8Array(buffer.slice(0, 12));
  const signatures = MAGIC_BYTES[declaredMime];

  if (!signatures || signatures.length === 0) return false;

  return signatures.some((sig) =>
    sig.every((byte, i) => bytes[i] === byte),
  );
}
