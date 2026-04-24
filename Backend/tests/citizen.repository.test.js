const { createCitizenRepository } = require("../src/repositories/citizen.repository");

describe("Citizen repository", () => {
  test("normalizes optional fields before persisting", async () => {
    const db = {
      query: jest.fn(async () => ({
        rows: [
          {
            id: "44f0f844-5472-434f-bf4c-e66d9a3c7374",
            fullName: "Maria da Silva",
            cpf: "12345678901",
            nis: null,
            email: null,
            phone: null,
            familyIncome: "900.00",
            householdSize: 4,
            areaType: "RURAL",
            street: "Rua das Flores",
            number: null,
            neighborhood: "Centro",
            city: "Fortaleza",
            state: "CE",
            postalCode: null,
            notes: null,
            createdByUserId: null,
            createdAt: "2026-04-18T00:00:00.000Z",
            updatedAt: "2026-04-18T00:00:00.000Z",
          },
        ],
      })),
    };

    const repository = createCitizenRepository({ db });

    await repository.create({
      fullName: "Maria da Silva",
      cpf: "12345678901",
      nis: "",
      email: "",
      phone: "",
      familyIncome: 900,
      householdSize: 4,
      areaType: "RURAL",
      street: "Rua das Flores",
      number: "",
      neighborhood: "Centro",
      city: "Fortaleza",
      state: "CE",
      postalCode: "",
      notes: "",
      createdByUserId: null,
    });

    expect(db.query).toHaveBeenCalledTimes(1);

    const [, params] = db.query.mock.calls[0];

    expect(params[3]).toBeNull();
    expect(params[4]).toBeNull();
    expect(params[5]).toBeNull();
    expect(params[10]).toBeNull();
    expect(params[14]).toBeNull();
    expect(params[15]).toBeNull();
  });
});
