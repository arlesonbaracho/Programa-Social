const { randomUUID } = require("crypto");

function normalizeOptionalValue(value) {
  return value === "" ? null : value;
}

function createCitizenRepository({ db }) {
  return {
    async create(payload) {
      const citizenId = randomUUID();

      const query = `
        INSERT INTO citizens (
          id,
          full_name,
          cpf,
          nis,
          email,
          phone,
          family_income,
          household_size,
          area_type,
          street,
          number,
          neighborhood,
          city,
          state,
          postal_code,
          notes,
          created_by_user_id
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $17
        )
        RETURNING
          id,
          full_name AS "fullName",
          cpf,
          nis,
          email,
          phone,
          family_income AS "familyIncome",
          household_size AS "householdSize",
          area_type AS "areaType",
          street,
          number,
          neighborhood,
          city,
          state,
          postal_code AS "postalCode",
          notes,
          created_by_user_id AS "createdByUserId",
          created_at AS "createdAt",
          updated_at AS "updatedAt";
      `;

      const params = [
        citizenId,
        payload.fullName,
        payload.cpf,
        normalizeOptionalValue(payload.nis),
        normalizeOptionalValue(payload.email),
        normalizeOptionalValue(payload.phone),
        payload.familyIncome,
        payload.householdSize,
        payload.areaType,
        payload.street,
        normalizeOptionalValue(payload.number),
        payload.neighborhood,
        payload.city,
        payload.state,
        normalizeOptionalValue(payload.postalCode),
        normalizeOptionalValue(payload.notes),
        payload.createdByUserId || null,
      ];

      const result = await db.query(query, params);

      return result.rows[0];
    },
  };
}

module.exports = { createCitizenRepository };
