import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { swaggerConfig } from './config.js';
import { swaggerSchemas } from './schemas.js';
import { swaggerPaths } from './paths.js';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: swaggerConfig.info,
        servers: swaggerConfig.servers,
        components: {
            securitySchemes: swaggerConfig.securitySchemes,
            schemas: swaggerSchemas
        },
        paths: swaggerPaths
    },
    apis: [] // No necesitamos apis ya que definimos los paths manualmente
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'OptiMeal API Documentation',
        customfavIcon: '/favicon.ico'
    }));
};

export { specs };
