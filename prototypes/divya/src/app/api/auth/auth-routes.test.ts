import { NextRequest } from "next/server";

const mockCreateUser = jest.fn();
const mockFindUserByEmail = jest.fn();
const mockStartSession = jest.fn((userId: number, res: Response) => res);
const mockEndSession = jest.fn((res: Response) => res);
const mockGetSessionUser = jest.fn();

jest.mock("@/lib/authStore", () => ({
  createUser: (...args: unknown[]) => mockCreateUser(...args),
  findUserByEmail: (...args: unknown[]) => mockFindUserByEmail(...args),
}));

jest.mock("@/lib/session", () => ({
  startSession: (userId: number, res: Response) => mockStartSession(userId, res),
  endSession: (res: Response) => mockEndSession(res),
  getSessionUserFromCookies: () => mockGetSessionUser(),
}));

import { hashPassword } from "@/lib/auth";
import { POST as signupPost } from "./signup/route";
import { POST as loginPost } from "./login/route";
import { POST as logoutPost } from "./logout/route";
import { GET as sessionGet } from "./session/route";

describe("auth API routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("signup creates user and starts session", async () => {
    mockFindUserByEmail.mockReturnValue(undefined);
    mockCreateUser.mockReturnValue({ id: 1, email: "maya@school.edu", password_hash: "x" });

    const req = new NextRequest("http://localhost/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email: "maya@school.edu", password: "secret12" }),
    });
    const res = await signupPost(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user).toEqual({ id: 1, email: "maya@school.edu" });
    expect(mockCreateUser).toHaveBeenCalled();
    expect(mockStartSession).toHaveBeenCalledWith(1, expect.anything());
  });

  test("signup returns 409 when email exists", async () => {
    mockFindUserByEmail.mockReturnValue({ id: 1, email: "taken@school.edu", password_hash: "x" });

    const req = new NextRequest("http://localhost/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email: "taken@school.edu", password: "secret12" }),
    });
    const res = await signupPost(req);
    expect(res.status).toBe(409);
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  test("login returns 401 for bad password", async () => {
    const hash = hashPassword("correct");
    mockFindUserByEmail.mockReturnValue({
      id: 2,
      email: "maya@school.edu",
      password_hash: hash,
    });

    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@school.edu", password: "wrong12" }),
    });
    const res = await loginPost(req);
    expect(res.status).toBe(401);
    expect(mockStartSession).not.toHaveBeenCalled();
  });

  test("session GET returns user from cookie session", async () => {
    mockGetSessionUser.mockReturnValue({ id: 3, email: "maya@school.edu" });
    const res = await sessionGet();
    const data = await res.json();
    expect(data.user).toEqual({ id: 3, email: "maya@school.edu" });
  });

  test("logout ends session", async () => {
    const res = await logoutPost();
    expect(res.status).toBe(200);
    expect(mockEndSession).toHaveBeenCalled();
  });
});
