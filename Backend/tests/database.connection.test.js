jest.mock("pg", () => {
  const mockPoolInstance = {
    connect: jest.fn(async () => ({
      release: jest.fn(),
    })),
    query: jest.fn(async (text) => {
      if (text === "SELECT NOW() AS connected_at") {
        return {
          rows: [{ connected_at: "2026-04-18T10:00:00.000Z" }],
        };
      }

      return { rows: [], rowCount: 0 };
    }),
    end: jest.fn(async () => {}),
    on: jest.fn(),
    totalCount: 1,
    idleCount: 1,
    waitingCount: 0,
  };

  return {
    Pool: jest.fn(() => mockPoolInstance),
    __mockPoolInstance: mockPoolInstance,
  };
});

const { Pool, __mockPoolInstance } = require("pg");
const {
  buildPoolConfig,
  createDatabaseConnection,
} = require("../src/database/connection");

describe("Database connection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("buildPoolConfig uses connection string when provided", () => {
    const config = buildPoolConfig({
      connectionString: "postgresql://postgres:postgres@localhost:5432/db",
      min: 2,
      max: 10,
    });

    expect(config.connectionString).toContain("postgresql://");
    expect(config.min).toBe(2);
    expect(config.max).toBe(10);
  });

  test("creates pool and tests ping successfully", async () => {
    const connection = createDatabaseConnection({
      host: "localhost",
      port: 5432,
      user: "postgres",
      password: "postgres",
      database: "programas_sociais_db",
      min: 2,
      max: 10,
    });

    await connection.connect();
    const status = await connection.ping();
    await connection.close();

    expect(Pool).toHaveBeenCalledTimes(1);
    expect(__mockPoolInstance.connect).toHaveBeenCalledTimes(1);
    expect(__mockPoolInstance.query).toHaveBeenCalledWith(
      "SELECT NOW() AS connected_at",
    );
    expect(status.status).toBe("ok");
  });
});
