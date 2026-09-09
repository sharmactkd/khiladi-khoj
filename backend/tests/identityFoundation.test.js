import assert from "node:assert/strict";
import test from "node:test";

import IdentitySession from "../src/models/IdentitySession.js";
import IdentityUser from "../src/models/IdentityUser.js";
import ProductMembership from "../src/models/ProductMembership.js";
import SsoAuthorizationCode from "../src/models/SsoAuthorizationCode.js";
import {
  createOpaqueToken,
  hashOpaqueToken,
  normalizeEmail,
  safeTokenEqual,
} from "../src/utils/identityCrypto.js";

test("opaque identity tokens are random and only deterministic after hashing", () => {
  const first = createOpaqueToken();
  const second = createOpaqueToken();
  const pepper = "test-pepper-that-is-long-enough-for-tests";

  assert.notEqual(first, second);
  assert.ok(first.length >= 64);
  assert.equal(hashOpaqueToken(first, pepper), hashOpaqueToken(first, pepper));
  assert.notEqual(hashOpaqueToken(first, pepper), hashOpaqueToken(second, pepper));
  assert.equal(safeTokenEqual("same", "same"), true);
  assert.equal(safeTokenEqual("same", "different"), false);
});

test("normalizeEmail canonicalizes email identity keys", () => {
  assert.equal(normalizeEmail("  USER@Example.COM "), "user@example.com");
});

test("identity models enforce product boundaries and safe defaults", () => {
  const user = new IdentityUser({ name: "Test User", primaryEmail: "USER@example.com" });
  const membership = new ProductMembership({
    userId: user._id,
    product: "academy",
    legacyUserId: "legacy-academy-user",
    roles: ["academy_owner"],
  });
  const session = new IdentitySession({
    userId: user._id,
    tokenHash: "a".repeat(64),
    expiresAt: new Date(Date.now() + 60_000),
  });
  const code = new SsoAuthorizationCode({
    userId: user._id,
    codeHash: "b".repeat(64),
    product: "tournament",
    redirectUri: "https://tournaments.khiladi-khoj.com/sso/callback",
    codeChallenge: "challenge",
    expiresAt: new Date(Date.now() + 60_000),
  });

  assert.equal(user.primaryEmail, "user@example.com");
  assert.equal(user.status, "active");
  assert.equal(membership.product, "academy");
  assert.equal(membership.status, "active");
  assert.equal(session.revokedAt, null);
  assert.equal(code.product, "tournament");
  assert.equal(code.usedAt, null);
});
