class BaseModel {
  constructor(db, tableName) {
    this.db = db;
    this.tableName = tableName;
  }

  async findById(id) {
    const result = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1 LIMIT 1`,
      [id],
    );

    return result.rows[0] || null;
  }

  async findAll(limit = 50, offset = 0) {
    const result = await this.db.query(
      `SELECT * FROM ${this.tableName} ORDER BY data_criacao DESC NULLS LAST LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    return result.rows;
  }

  async deleteById(id) {
    const result = await this.db.query(
      `DELETE FROM ${this.tableName} WHERE id = $1`,
      [id],
    );

    return result.rowCount > 0;
  }
}

module.exports = BaseModel;
