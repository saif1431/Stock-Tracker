import { describe, expect, it } from "vitest";

import {
  validateEmail,
  validatePassword,
  validateUsername,
  validateStockSymbol,
} from "./validation";

describe("validation utilities", () => {
  it("validates email addresses", () => {
    expect(validateEmail("valid@example.com")).toBeNull();
    expect(validateEmail("invalid-email")?.field).toBe("email");
  });

  it("enforces password complexity", () => {
    expect(validatePassword("StrongPass1")).toBeNull();
    expect(validatePassword("weak")?.field).toBe("password");
  });

  it("validates usernames", () => {
    expect(validateUsername("user_name-1")).toBeNull();
    expect(validateUsername("bad space")?.field).toBe("username");
  });

  it("validates stock symbols", () => {
    expect(validateStockSymbol("aapl")).toBeNull();
    expect(validateStockSymbol("TOOLONG")?.field).toBe("symbol");
  });
});
