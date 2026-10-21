import { ZodError } from 'zod';
import fp from 'fastify-plugin';

async function errorHandler(fastify, _opts) {
  fastify.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    const requestId = request.id;

    // Handle Zod Validation Errors
    if (error instanceof ZodError) {
      const fieldErrors = {};
      for (const issue of error.issues) {
        const path = issue.path.join('.');
        fieldErrors[path] = issue.message;
      }

      return reply.status(400).send({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        fieldErrors,
        requestId,
      });
    }

    // Handle Fastify schema validation errors
    if (error.validation) {
      return reply.status(400).send({
        code: 'VALIDATION_ERROR',
        message: error.message,
        requestId,
      });
    }

    // Handle unauthorized / forbidden
    if (error.statusCode === 401 || error.name === 'UnauthorizedError') {
      return reply.status(401).send({
        code: 'UNAUTHORIZED',
        message: error.message || 'Authentication required',
        requestId,
      });
    }

    if (error.statusCode === 403) {
      return reply.status(403).send({
        code: 'FORBIDDEN',
        message: error.message || 'Access denied',
        requestId,
      });
    }

    // Fallback internal server error
    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: statusCode === 500 ? 'An unexpected error occurred' : error.message,
      requestId,
    });
  });
}

export const errorHandlerPlugin = fp(errorHandler, { name: 'error-handler' });
