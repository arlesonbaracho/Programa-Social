const { ForbiddenError, NotFoundError } = require("../utils/errors");

function createDocumentService({ documentRepository }) {
  return {
    async uploadDocument(payload, currentUser) {
      return documentRepository.create({
        ...payload,
        usuarioId: currentUser.id,
      });
    },

    async getDocumentById(id, currentUser) {
      const document = await documentRepository.findById(id);
      if (!document) {
        throw new NotFoundError("Documento nao encontrado.");
      }

      if (document.usuarioId !== currentUser.id && currentUser.tipo === "participante") {
        throw new ForbiddenError("Voce nao pode acessar este documento.");
      }

      return document;
    },

    async deleteDocument(id, currentUser) {
      const document = await documentRepository.findById(id);
      if (!document) {
        throw new NotFoundError("Documento nao encontrado.");
      }

      if (document.usuarioId !== currentUser.id && currentUser.tipo === "participante") {
        throw new ForbiddenError("Voce nao pode remover este documento.");
      }

      await documentRepository.delete(id);
      return { success: true };
    },
  };
}

module.exports = { createDocumentService };
