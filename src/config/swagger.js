// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Online Retail API',
            version: '1.0.0',
            description: 'API documentation for the Online Retail project',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
    },
    apis: ['./src/routes/*.js', './src/controllers/*.js'], // Files containing annotations as above
};

const specs = swaggerJsdoc(options);

module.exports = specs;
