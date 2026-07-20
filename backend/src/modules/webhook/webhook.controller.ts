import { prisma } from '../../lib/prisma';
import { FastifyReply, FastifyRequest } from 'fastify';

import { fetchPullRequestFiles } from '../pr/pr.service';
import { getPullRequest } from '../pr/pr.github';
import { extractAddedLinesWithNumbers } from '../pr/diff.parser';

import { reviewPatch, analyzeLine } from '../ai/ai.service';
import { formatReviewComment } from '../ai/review.formatter';

import { createPullRequestReview } from '../../providers/github/github.review';
import { createInlineReview, InlineComment } from '../../providers/github/github.inline-review';

export async function githubWebhook(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const event = request.headers['x-github-event'];
  const payload = request.body as any;

  console.log('==============================');
  console.log('GitHub Event:', event);
  console.log('Action:', payload?.action);
  console.log('Repository:', payload?.repository?.full_name);

  if (event === 'pull_request') {
    console.log('PR EVENT RECEIVED');

    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const pullNumber = payload.pull_request.number;

    console.log({
      action: payload.action,
      repo: payload.repository.full_name,
      prNumber: pullNumber,
      title: payload.pull_request.title,
    });

    // Find repository in DB
    const repository = await prisma.repository.findFirst({
      where: {
        owner,
        name: repo,
      },
    });

    if (!repository) {
      console.log('Repository not found in database');
      return reply.send({ received: true });
    }

    // Fetch changed files
    const files = await fetchPullRequestFiles(
      repository.userId,
      owner,
      repo,
      pullNumber,
    );

    console.log(`Fetched ${files.length} changed files`);

    // Get GitHub account
    const githubAccount = await prisma.githubAccount.findUnique({
      where: { userId: repository.userId },
    });

    if (!githubAccount) {
      throw new Error('GitHub account not connected');
    }

    // Get latest commit SHA for inline comments
    const pr = await getPullRequest(
      githubAccount.accessToken,
      owner,
      repo,
      pullNumber,
    );

    const latestCommitSha = pr.head.sha;

    // Collect summary reviews
    const reviews = [];

    // Collect inline comments
    const inlineComments: InlineComment[] = [];

    for (const file of files) {
      console.log({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
      });

      // Inline comments on specific added lines
      if (file.patch) {
        console.log('PATCH FOR FILE:', file.filename);
        console.log(file.patch);

        const addedLines = extractAddedLinesWithNumbers(file.patch);

        for (const addedLine of addedLines) {
          const comment = analyzeLine(addedLine.content);

          if (comment) {
            console.log({
              file: file.filename,
              line: addedLine.lineNumber,
              content: addedLine.content,
            });

            console.log(
              `Queueing inline comment for ${file.filename}:${addedLine.lineNumber}`
            );

            inlineComments.push({
              path: file.filename,
              line: addedLine.lineNumber,
              body: comment,
            });
          }
        }

        // Summary review for the file
        const review = await reviewPatch(file.filename, file.patch);

        reviews.push(review);

        console.log('AI REVIEW RESULT');
        console.log(JSON.stringify(review, null, 2));
      } else {
        console.log('No patch available for file:', file.filename);
      }
    }

    // Post inline comments as a single review
    if (inlineComments.length > 0) {
      try {
        await createInlineReview(
          githubAccount.accessToken,
          owner,
          repo,
          pullNumber,
          latestCommitSha,
          inlineComments,
        );

        console.log(`Posted ${inlineComments.length} inline comments`);
      } catch (error) {
        console.error('Inline review failed:', error);
      }
    }

    // Format summary review comment
    const reviewBody = formatReviewComment(reviews);

    // Post summary review to GitHub PR
    await createPullRequestReview(
      githubAccount.accessToken,
      owner,
      repo,
      pullNumber,
      reviewBody,
    );

    console.log('Posted AI review to GitHub PR');
  }

  console.log('==============================');

  return reply.send({ received: true });
}