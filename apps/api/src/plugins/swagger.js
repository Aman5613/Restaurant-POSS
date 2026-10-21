import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export async function swaggerPlugin(fastify, _opts) {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Restaurant POS API',
        description: 'Multi-role offline-first restaurant management API',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:4000',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });
}
