import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";
import app from "../src/app.js";
import { buildSsoRedirectUrl } from "../src/services/ssoProtocolService.js";
import { createPkceChallenge, isValidPkceChallenge, isValidPkceVerifier, verifyPkce } from "../src/utils/pkce.js";

const verifier = "a".repeat(64);
const challenge = createPkceChallenge(verifier);

test("PKCE S256 accepts the matching verifier only", () => {
  assert.equal(isValidPkceVerifier(verifier), true);
  assert.equal(isValidPkceChallenge(challenge), true);
  assert.equal(verifyPkce(verifier, challenge), true);
  assert.equal(verifyPkce("b".repeat(64), challenge), false);
  assert.equal(isValidPkceVerifier("short"), false);
});

test("SSO redirect preserves state and exposes no assertion", () => {
  const result = new URL(buildSsoRedirectUrl({
    redirectUri: "https://academy.example/auth/sso/callback?source=khiladi",
    code: "opaque-code",
    state: "unpredictable-state",
  }));
  assert.equal(result.searchParams.get("source"), "khiladi");
  assert.equal(result.searchParams.get("code"), "opaque-code");
  assert.equal(result.searchParams.get("state"), "unpredictable-state");
  assert.equal(result.searchParams.has("assertion"), false);
});

test("SSO authorize rejects requests without trusted mutation header", async () => {
  const response = await request(app).post("/api/sso/authorize").send({}).expect(403);
  assert.equal(response.body.message, "Trusted request header is required");
});

test("SSO exchange rejects malformed codes before database access", async () => {
  const response = await request(app)
    .post("/api/sso/exchange")
    .set("X-Khiladi-Request", "identity-v1")
    .send({ code: "short" })
    .expect(400);
  assert.equal(response.body.message, "A valid SSO code exchange request is required");
});
