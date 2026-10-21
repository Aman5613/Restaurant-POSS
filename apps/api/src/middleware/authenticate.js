export async function authenticate(request, reply) {
  try {
    await request.jwtVerify();
  } catch (_err) {
    return reply.status(401).send({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired access token',
      requestId: request.id,
    });
  }
}
