const { Pool } = require('pg');

// Configure the PostgreSQL connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'retail_best',  // Replace with your database name
    password: 'your_password',
    port: 5432  // Default PostgreSQL port
});

async function createDatabase() {
    const client = await pool.connect();
    try {
        // Run SQL commands to create tables and populate data
        await client.query(`
            -- Create Customers Table
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                email VARCHAR(100) NOT NULL,
                address TEXT,
                city VARCHAR(50),
                country VARCHAR(50),
                postal_code VARCHAR(20),
                phone VARCHAR(20)
            );

            -- Create Products Table
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price NUMERIC(10,2) NOT NULL,
                stock_quantity INTEGER,
                category VARCHAR(50)
            );

            -- Create Orders Table
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER REFERENCES customers(id),
                order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                total_amount NUMERIC(10,2) NOT NULL,
                status VARCHAR(20)
            );

            -- Create Order Items Table
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id),
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER,
                price NUMERIC(10,2)
            );
        `);

        console.log('Database schema created successfully.');

        // Populate Customers Table
        await client.query(`
            DO $$
            DECLARE
                i INTEGER := 1;
            BEGIN
                WHILE i <= 10000 LOOP
                    INSERT INTO customers (first_name, last_name, email, address, city, country, postal_code, phone)
                    VALUES (
                        'Customer' || i,
                        'Lastname' || i,
                        'customer' || i || '@example.com',
                        'Address' || i,
                        'City' || i,
                        'Country' || i,
                        'Postal' || i,
                        '123-456-789' || LPAD(i::TEXT, 4, '0')
                    );
                    i := i + 1;
                END LOOP;
            END $$;
        `);

        console.log('Customers table populated.');

        // Populate Products Table
        await client.query(`
            DO $$
            DECLARE
                i INTEGER := 1;
            BEGIN
                WHILE i <= 10000 LOOP
                    INSERT INTO products (name, description, price, stock_quantity, category)
                    VALUES (
                        'Product' || i,
                        'Description for Product' || i,
                        (i * 10)::numeric(10, 2),
                        1000,
                        'Category' || (i % 10 + 1)
                    );
                    i := i + 1;
                END LOOP;
            END $$;
        `);

        console.log('Products table populated.');

        // Populate Orders Table
        await client.query(`
            DO $$
            DECLARE
                i INTEGER := 1;
            BEGIN
                WHILE i <= 10000 LOOP
                    INSERT INTO orders (customer_id, order_date, total_amount, status)
                    VALUES (
                        (i % 1000 + 1),  -- Random customer_id between 1 and 1000
                        CURRENT_TIMESTAMP - (i * INTERVAL '1 day'),
                        (i * 50)::numeric(10, 2),
                        CASE
                            WHEN i % 5 = 0 THEN 'Cancelled'
                            WHEN i % 3 = 0 THEN 'Pending'
                            ELSE 'Completed'
                        END
                    );
                    i := i + 1;
                END LOOP;
            END $$;
        `);

        console.log('Orders table populated.');

        // Populate Order Items Table
        await client.query(`
            DO $$
            DECLARE
                i INTEGER := 1;
            BEGIN
                WHILE i <= 10000 LOOP
                    INSERT INTO order_items (order_id, product_id, quantity, price)
                    VALUES (
                        (i % 10000 + 1),  -- Random order_id between 1 and 10,000
                        (i % 1000 + 1),   -- Random product_id between 1 and 1,000
                        (i % 10 + 1),
                        ((i % 50 + 1) * 10)::numeric(10, 2)
                    );
                    i := i + 1;
                END LOOP;
            END $$;
        `);

        console.log('Order items table populated.');
    } catch (err) {
        console.error('Error executing SQL query:', err.message);
    } finally {
        client.release();
        console.log('Database connection closed.');
    }
}

// Run the function to create and populate the database
createDatabase();