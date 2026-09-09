import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";

import app from "../src/app.js";

test("GET /api/health returns healthy status", async () => {
  const response = await request(app)
    .get("/api/health")
    .expect(200)
    .expect("Content-Type", /json/);

  assert.equal(response.body.success, true);
  assert.equal(response.body.data.status, "ok");
  assert.equal(typeof response.body.data.timestamp, "string");
  assert.equal(response.headers["x-powered-by"], undefined);
  assert.ok(response.headers["x-content-type-options"]);
});

test("unknown API route returns structured 404", async () => {
  const response = await request(app)
    .get("/api/route-that-does-not-exist")
    .expect(404);

  assert.deepEqual(response.body, {
    success: false,
    message: "Route not found: GET /api/route-that-does-not-exist",
  });
});

test("unapproved browser origin is rejected", async () => {
  const response = await request(app)
    .get("/api/health")
    .set("Origin", "https://malicious.example")
    .expect(403);

  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Origin is not allowed by CORS");
});
