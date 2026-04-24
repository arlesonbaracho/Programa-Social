const { buildDatabaseUrl, loadEnv } = require("../src/config/env");

describe("Environment configuration", () => {
  test("loads a valid environment configuration", () => {
    const env = loadEnv({
      NODE_ENV: "test",
      PORT: "4000",
      HOST: "127.0.0.1",
      APP_NAME: "Programa Social",
      DB_HOST: "localhost",
      DB_PORT: "5432",
      DB_USER: "postgres",
      DB_PASSWORD: "postgres",
      DB_NAME: "programas_sociais_db_test",
      DB_ADMIN_DATABASE: "postgres",
      DB_POOL_MIN: "1",
      DB_POOL_MAX: "5",
      JWT_SECRET: "segredo-super-seguro-123",
      JWT_REFRESH_SECRET: "refresh-seguro-super-123",
    });

    expect(env.nodeEnv).toBe("test");
    expect(env.port).toBe(4000);
    expect(env.host).toBe("127.0.0.1");
    expect(env.databaseUrl).toContain("programas_sociais_db_test");
    expect(env.databaseConfig.max).toBe(5);
  });

  test("throws on invalid environment configuration", () => {
    expect(() =>
      loadEnv({
        NODE_ENV: "test",
        PORT: "4000",
        APP_NAME: "Programa Social",
        DATABASE_URL: "invalid-url",
        JWT_SECRET: "short",
      }),
    ).toThrow("Invalid environment configuration");
  });

  test("builds connection string from database fields", () => {
    const connectionString = buildDatabaseUrl({
      DB_HOST: "localhost",
      DB_PORT: 5432,
      DB_USER: "postgres",
      DB_PASSWORD: "senha123",
      DB_NAME: "programas_sociais_db",
    });

    expect(connectionString).toBe(
      "postgresql://postgres:senha123@localhost:5432/programas_sociais_db",
    );
  });
});
