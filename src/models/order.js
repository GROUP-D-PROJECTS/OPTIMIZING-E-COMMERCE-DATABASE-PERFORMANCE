const db = require('../db/connection');

const Order = {

  update: async (id, orderData) => {
    const { customer_id, total_amount, status } = orderData;
    try {
      const result = await db.query(
        'UPDATE orders SET customer_id = $1, total_amount = $2, status = $3, order_date = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
        [customer_id, total_amount, status, id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  
  getAll: async () => {
    try {
      const result = await db.query('SELECT * FROM orders');
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const result = await db.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const result = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  create: async (orderData) => {
    const { customer_id, total_amount, status } = orderData;
    try {
      const result = await db.query(
        'INSERT INTO orders (customer_id, order_date, total_amount, status) VALUES ($1, CURRENT_TIMESTAMP, $2, $3) RETURNING *',
        [customer_id, total_amount, status]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  
};

module.exports = Order;