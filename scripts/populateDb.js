const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'one',
    password: 'your_password',
    port: 5432  
});

async function deployDatabase() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await createSchema(client);
        await populateData(client);
        await runTests(client);

        await client.query('COMMIT');
        console.log('Database deployed successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deploying database:', err);
    } finally {
        client.release();
    }
}

deployDatabase().catch(console.error);

//step2

async function createSchema(client) {
    try {
        console.log('Creating tables...');
        await createTables(client);

        console.log('Creating stored procedure...');
        await createStoredProcedure(client);

        console.log('Creating trigger function and trigger...');
        await createTrigger(client);

        console.log('Schema created successfully.');
    } catch (err) {
        throw new Error(`Error creating schema: ${err.message}`);
    }
}

async function createTables(client) {
    const tablesSQL = `
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

        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            price NUMERIC(10,2) NOT NULL,
            stock_quantity INTEGER,
            category VARCHAR(50)
        );

       CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER,
    price NUMERIC(10,2)
);
    `;
    await client.query(tablesSQL);
}

async function createStoredProcedure(client) {
    const procedureSQL = `
        CREATE OR REPLACE FUNCTION calculate_total_orders(input_customer_id INT)
        RETURNS NUMERIC AS $$
        DECLARE
            total_order_amount NUMERIC(10, 2);
        BEGIN
            SELECT SUM(orders.total_amount) INTO total_order_amount
            FROM orders
            WHERE orders.customer_id = input_customer_id;

            RETURN COALESCE(total_order_amount, 0);
        END;
        $$ LANGUAGE plpgsql;
    `;
    await client.query(procedureSQL);
}

async function createTrigger(client) {
    const triggerSQL = `
        CREATE OR REPLACE FUNCTION decrease_stock_quantity()
        RETURNS TRIGGER AS $$
        BEGIN
            UPDATE products
            SET stock_quantity = stock_quantity - NEW.quantity
            WHERE id = NEW.product_id;

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS after_order_item_insert ON order_items;
        CREATE TRIGGER after_order_item_insert
        AFTER INSERT ON order_items
        FOR EACH ROW
        EXECUTE FUNCTION decrease_stock_quantity();
    `;
    await client.query(triggerSQL);
}


//step 3 populate data

async function populateData(client) {
    try {
        console.log('Populating customers...');
        await populateCustomers(client);

        console.log('Populating products...');
        await populateProducts(client);

        console.log('Populating orders...');
        await populateOrders(client);

        console.log('Populating order items...');
        await populateOrderItems(client);

        console.log('Data populated successfully.');
    } catch (err) {
        throw new Error(`Error populating data: ${err.message}`);
    }
}

async function populateCustomers(client) {
    const customersSQL = `
        INSERT INTO customers (first_name, last_name, email, address, city, country, postal_code, phone)
        SELECT 
            'Customer' || i,
            'Lastname' || i,
            'customer' || i || '@example.com',
            'Address' || i,
            'City' || i,
            'Country' || i,
            'Postal' || i,
            '123-456-789' || LPAD(i::TEXT, 4, '0')
        FROM generate_series(1, 10000) i;
    `;
    await client.query(customersSQL);
}

async function populateProducts(client) {
    const productsSQL = `
        INSERT INTO products (name, description, price, stock_quantity, category)
        SELECT 
            'Product' || i,
            'Description for Product' || i,
            (i * 10)::numeric(10, 2),
            1000,
            'Category' || (i % 10 + 1)
        FROM generate_series(1, 10000) i;
    `;
    await client.query(productsSQL);
}

async function populateOrders(client) {
    const ordersSQL = `
        INSERT INTO orders (customer_id, order_date, total_amount, status)
        SELECT 
            (i % 1000 + 1),
            CURRENT_TIMESTAMP - (i * INTERVAL '1 day'),
            (i * 50)::numeric(10, 2),
            CASE
                WHEN i % 5 = 0 THEN 'Cancelled'
                WHEN i % 3 = 0 THEN 'Pending'
                ELSE 'Completed'
            END
        FROM generate_series(1, 10000) i;
    `;
    await client.query(ordersSQL);
}

async function populateOrderItems(client) {
    const orderItemsSQL = `
        INSERT INTO order_items (order_id, product_id, quantity, price)
        SELECT 
            (i % 10000 + 1),
            (i % 1000 + 1),
            (i % 10 + 1),
            ((i % 50 + 1) * 10)::numeric(10, 2)
        FROM generate_series(1, 10000) i;
    `;
    await client.query(orderItemsSQL);
}

//deletion

async function deleteOrder(orderId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Delete associated order items first
        await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
        
        // Then delete the order
        await client.query('DELETE FROM orders WHERE id = $1', [orderId]);
        
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

//tests

async function runTests(client) {
    try {
        console.log('Running tests...');

        // Test table counts
        const tables = ['customers', 'products', 'orders', 'order_items'];
        for (let table of tables) {
            const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
            console.log(`${table} count:`, result.rows[0].count);
        }

        // Test trigger
        const initialStock = await client.query('SELECT stock_quantity FROM products WHERE id = 1');
        console.log('Initial stock for product 1:', initialStock.rows[0].stock_quantity);

        await client.query(`
            INSERT INTO order_items (order_id, product_id, quantity, price) 
            VALUES (1, 1, 1, 100)
        `);

        const updatedStock = await client.query('SELECT stock_quantity FROM products WHERE id = 1');
        console.log('Trigger test - Updated stock for product 1:', updatedStock.rows[0].stock_quantity);

        // Test stored procedure
        await client.query(`
            INSERT INTO orders (customer_id, total_amount, status) 
            VALUES (1, 150.00, 'Completed'), (1, 200.00, 'Completed')
        `);

        const procedureTest = await client.query('SELECT calculate_total_orders(1) as total');
        console.log('Procedure test - Total orders for customer 1:', procedureTest.rows[0].total);

        console.log('Tests completed successfully.');
    } catch (err) {
        throw new Error(`Error running tests: ${err.message}`);
    }

    
}