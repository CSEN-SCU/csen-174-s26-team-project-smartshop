import { createUser, findUserByEmail, stableUserId, usesFileAuthStore } from "./authStore";

describe("authStore serverless mode", () => {
  const prev = process.env.VERCEL;

  afterEach(() => {
    if (prev === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prev;
  });

  test("on Vercel, createUser does not use auth-data.json", () => {
    process.env.VERCEL = "1";
    expect(usesFileAuthStore()).toBe(false);
    const user = createUser("demo@school.edu", "salt:abc");
    expect(user.email).toBe("demo@school.edu");
    expect(user.id).toBe(stableUserId("demo@school.edu"));
    expect(findUserByEmail("demo@school.edu")).toBeUndefined();
  });
});
