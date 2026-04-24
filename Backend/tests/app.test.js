const request = require("supertest");

const { createApp } = require("../src/app");

function createTestApp() {
  const healthService = {
    getStatus: jest.fn(async () => ({
      name: "Programa Social",
      environment: "test",
      status: "ok",
      timestamp: "2026-04-18T00:00:00.000Z",
    })),
    getDatabaseStatus: jest.fn(async () => ({
      status: "ok",
      checkedAt: "2026-04-18T00:00:00.000Z",
    })),
  };

  const citizenService = {
    createCitizen: jest.fn(async (payload) => ({
      id: "0f6a5876-9c96-4220-83aa-67cae0d56aef",
      ...payload,
    })),
  };

  const app = createApp({ healthService, citizenService });

  return { app, healthService, citizenService };
}

describe("API bootstrap", () => {
  test("GET /api/v1/health returns backend status", async () => {
    const { app, healthService } = createTestApp();

    const response = await request(app).get("/api/v1/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(healthService.getStatus).toHaveBeenCalledTimes(1);
  });

  test("GET /api/v1/health/database returns database status", async () => {
    const { app, healthService } = createTestApp();

    const response = await request(app).get("/api/v1/health/database");

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(healthService.getDatabaseStatus).toHaveBeenCalledTimes(1);
  });

  test("returns 404 for unknown routes", async () => {
    const { app } = createTestApp();

    const response = await request(app).get("/api/v1/unknown-route");

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Route not found.");
  });
});
