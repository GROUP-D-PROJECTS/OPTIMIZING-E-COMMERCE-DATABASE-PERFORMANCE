const { Pool } = require('pg');

// Configure your database connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'retail_db',
    password: 'your_database_password',
    port: 5432,
});

async function analyzeQuery(query) {
    const client = await pool.connect();
    try {
        const explainQuery = `EXPLAIN ANALYZE ${query}`;
        const res = await client.query(explainQuery);
        console.log(res.rows);
    } finally {
        client.release();
    }
}

// Example queries to analyze
const queries = [
    'SELECT * FROM customers WHERE id = 1;',
    'SELECT * FROM products WHERE id = 1;',
    'SELECT * FROM orders WHERE customer_id = 1;',
    'SELECT * FROM order_items WHERE order_id = 1;',
    'INSERT INTO customers (first_name, last_name, email, address, city, country, postal_code, phone) VALUES (\'John\', \'Doe\', \'john.doe@example.com\', \'123 Main St\', \'City\', \'Country\', \'12345\', \'555-555-5555\');',
];

(async () => {
    for (const query of queries) {
        console.log(`Analyzing query: ${query}`);
        await analyzeQuery(query);
    }
    pool.end();
})();
