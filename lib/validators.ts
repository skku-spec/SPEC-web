const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function requireUUID(value: string, paramName = "id"): string {
  if (!isValidUUID(value)) {
    throw new Error(`유효하지 않은 ${paramName} 형식입니다.`);
  }
  return value;
}
