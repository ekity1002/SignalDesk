import { timingSafeEqual } from "node:crypto";

export function validatePassword(inputPassword: string): boolean {
  const authPassword = process.env.AUTH_PASSWORD;

  if (!authPassword) {
    throw new Error("AUTH_PASSWORD environment variable is not set");
  }

  if (!inputPassword) {
    return false;
  }

  const inputBuffer = Buffer.from(inputPassword);
  const authBuffer = Buffer.from(authPassword);

  if (inputBuffer.length !== authBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, authBuffer);
}
