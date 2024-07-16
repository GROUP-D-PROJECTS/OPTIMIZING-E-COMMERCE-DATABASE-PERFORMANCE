const express = require('express');
const app = express();
const productsRoutes = require('./routes/products');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const ordersRoutes = require('./routes/orders');
const customerRoutes = require('./routes/customers');

require('dotenv').config();


// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Online Retail API',
      version: '1.0.0',
      description: 'API for online retail application',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3009}`,
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);

app.use(express.json());
app.use('/products', productsRoutes);
app.use('/orders', ordersRoutes);
app.use('/customers', customerRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));


const PORT = process.env.PORT || 3009;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

