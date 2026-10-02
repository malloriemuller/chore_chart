import { createHmac, timingSafeEqual } from "node:crypto";

function hmac(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

/** Signs a value as `value.hexSignature`, suitable for storing in a cookie. */
export function sign(value: string, secret: string): string {
  return `${value}.${hmac(secret, value)}`;
}

/** Verifies a signed cookie value and returns the original value, or null if invalid. */
export function verify(signed: string, secret: string): string | null {
  const separatorIndex = signed.lastIndexOf(".");
  if (separatorIndex === -1) return null;

  const value = signed.slice(0, separatorIndex);
  const signature = signed.slice(separatorIndex + 1);
  const expected = hmac(secret, value);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  return value;
}

/** Constant-time string comparison, immune to length-dependent short-circuiting. */
export function constantTimeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    timingSafeEqual(aBuffer, aBuffer); // keep timing comparable to the equal-length path
    return false;
  }
  return timingSafeEqual(aBuffer, bBuffer);
}
