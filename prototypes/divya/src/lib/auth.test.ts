import {
  hashPassword,
  validateCredentials,
  verifyPassword,
} from "./auth";

describe("auth helpers", () => {
  test("hashPassword and verifyPassword round-trip", () => {
    const stored = hashPassword("my-secret-password");
    expect(verifyPassword("my-secret-password", stored)).toBe(true);
    expect(verifyPassword("wrong-password", stored)).toBe(false);
  });

  test("validateCredentials rejects weak input", () => {
    expect(validateCredentials("bad", "123")).toMatch(/email/i);
    expect(validateCredentials("user@example.com", "123")).toMatch(/6 characters/i);
    expect(validateCredentials("user@example.com", "abcdef")).toBeNull();
  });
});
