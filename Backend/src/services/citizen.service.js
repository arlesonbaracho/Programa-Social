function createCitizenService({ citizenRepository }) {
  return {
    async createCitizen(payload) {
      return citizenRepository.create(payload);
    },
  };
}

module.exports = { createCitizenService };
