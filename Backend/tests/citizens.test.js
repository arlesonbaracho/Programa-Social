const request = require("supertest");

const { createApp } = require("../src/app");

function buildDependencies() {
  return {
    healthService: {
      getStatus: jest.fn(async () => ({
        name: "Programa Social",
        environment: "test",
        status: "ok",
        timestamp: new Date().toISOString(),
      })),
      getDatabaseStatus: jest.fn(async () => ({
        status: "ok",
        checkedAt: new Date().toISOString(),
      })),
    },
    citizenService: {
      createCitizen: jest.fn(async (payload) => ({
        id: "44f0f844-5472-434f-bf4c-e66d9a3c7374",
        ...payload,
      })),
    },
  };
}

describe("Citizen routes", () => {
  test("POST /api/v1/citizens creates a citizen with valid payload", async () => {
    const dependencies = buildDependencies();
    const app = createApp(dependencies);

    const payload = {
      fullName: "Maria da Silva",
      cpf: "12345678901",
      nis: "12345678901",
      email: "maria@example.com",
      phone: "88999999999",
      familyIncome: 900,
      householdSize: 4,
      areaType: "RURAL",
      street: "Rua das Flores",
      number: "25",
      neighborhood: "Centro",
      city: "Fortaleza",
      state: "CE",
      postalCode: "60000000",
      notes: "Cadastro presencial",
    };

    const response = await request(app).post("/api/v1/citizens").send(payload);

    expect(response.statusCode).toBe(201);
    expect(response.body.fullName).toBe(payload.fullName);
    expect(dependencies.citizenService.createCitizen).toHaveBeenCalledWith(payload);
  });

  test("POST /api/v1/citizens rejects invalid payload", async () => {
    const dependencies = buildDependencies();
    const app = createApp(dependencies);

    const response = await request(app).post("/api/v1/citizens").send({
      fullName: "Jo",
      cpf: "123",
      familyIncome: -1,
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Validation failed.");
    expect(dependencies.citizenService.createCitizen).not.toHaveBeenCalled();
  });
});
