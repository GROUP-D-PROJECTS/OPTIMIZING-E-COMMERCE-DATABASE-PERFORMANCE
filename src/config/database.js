const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'online_retail',
    password: 'manzo911',
    port: 5432,
});

module.exports = pool;
