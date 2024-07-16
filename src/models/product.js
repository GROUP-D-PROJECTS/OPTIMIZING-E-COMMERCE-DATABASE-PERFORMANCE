const pool = require('../db/connection');

const getAllProducts = async () => {
    const res = await pool.query('SELECT * FROM products');
    return res.rows;
};

const getProductById = async (id) => {
    const res = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    return res.rows[0];
};

const createProduct = async (name, price) => {
    const res = await pool.query(
        'INSERT INTO products (name, price) VALUES ($1, $2) RETURNING *',
        [name, price]
    );
    return res.rows[0];
};

const updateProduct = async (id, name, price) => {
    const res = await pool.query(
        'UPDATE products SET name = $1, price = $2 WHERE id = $3 RETURNING *',
        [name, price, id]
    );
    return res.rows[0];
};

const deleteProduct = async (id) => {
    const res = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    return res.rows[0];
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
