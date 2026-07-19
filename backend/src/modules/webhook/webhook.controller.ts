import { FastifyReply, FastifyRequest } from 'fastify';

export async function githubWebhook( request: FastifyRequest, reply: FastifyReply,) {
  const event = request.headers['x-github-event'];
  const payload = request.body as any;

  console.log('==============================');
  console.log('GitHub Event:', event);
  console.log('Action:', payload?.action);
  console.log('Repository:', payload?.repository?.full_name);

  if (event === 'pull_request') {
    console.log('PR EVENT RECEIVED');
    console.log({
      action: payload.action,
      repo: payload.repository?.full_name,
      prNumber: payload.pull_request?.number,
      title: payload.pull_request?.title,
      author: payload.pull_request?.user?.login,
      baseBranch: payload.pull_request?.base?.ref,
      headBranch: payload.pull_request?.head?.ref,
    });
  }

  console.log('==============================');

  return reply.send({ received: true });
}