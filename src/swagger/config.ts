export const swaggerConfig = {
    info: {
        title: 'OptiMeal API',
        version: '1.0.0',
        description: 'API para el sistema de gestión de comidas OptiMeal',
    },
    servers: [
        {
            url: 'http://localhost:3000/api',
            description: 'Servidor de desarrollo'
        }
    ],
    securitySchemes: {
        bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Token JWT obtenido del endpoint de login'
        }
    }
};
