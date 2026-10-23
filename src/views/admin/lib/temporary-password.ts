import { generateRandomString } from "better-auth/crypto";

/** 16 letters and digits: easy to read out, strong enough until the member changes it. */
export const temporaryPassword = () =>
  generateRandomString(16, "a-z", "A-Z", "0-9");
