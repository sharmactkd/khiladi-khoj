import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";
import app from "../src/app.js";
import { env } from "../src/config/env.js";
import { identityCookieOptions } from "../src/utils/identityCookie.js";

test("identity cookie is host-only and protected", () => {
  const options = identityCookieOptions({ expires: new Date(Date.now() + 1000) });
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.path, "/");
  assert.equal("domain" in options, false);
  assert.equal(options.secure, env.IS_PRODUCTION);
});

test("Google sign-in rejects requests without trusted mutation header", async () => {
  const response = await request(app).post("/api/auth/google").send({ credential: "x".repeat(200) }).expect(403);
  assert.equal(response.body.message, "Trusted request header is required");
});

test("Google sign-in validates body before contacting Google", async () => {
  const response = await request(app).post("/api/auth/google")
    .set("X-Khiladi-Request", "identity-v1").send({ credential: "short", unexpected: true }).expect(400);
  assert.equal(response.body.message, "A valid Google credential is required");
});

test("anonymous current-user request does not disclose identity", async () => {
  const response = await request(app).get("/api/auth/me").expect(401);
  assert.equal(response.body.message, "Authentication required");
  assert.equal(response.headers["cache-control"], "no-store");
});
