import { createHash } from "crypto";
import { prisma } from "../../lib/prisma";

function mapSeverity(
  severity: string,
): "HIGH" | "MEDIUM" | "LOW" {
  switch (severity.toLowerCase()) {
    case "error":
    case "critical":
    case "high":
      return "HIGH";

    case "warning":
    case "medium":
      return "MEDIUM";

    case "info":
    case "suggestion":
    case "low":
      return "LOW";

    default:
      return "LOW";
  }
}

export async function saveReviewComments(params: {
  reviewId: string;
  repositoryId: string;
  githubPrId: bigint;
  comments: {
    path: string;
    line: number;
    body: string;
    severity: string;
  }[];
}) {
  let saved = 0;

  for (const comment of params.comments) {
    if (
      !comment.path ||
      !comment.body ||
      !Number.isInteger(comment.line) ||
      comment.line <= 0
    ) {
      continue;
    }

    const normalizedBody = comment.body.trim();

    const fingerprint = createHash("sha256")
      .update(
        [
          params.repositoryId,
          params.githubPrId.toString(),
          comment.path,
          comment.line.toString(),
          comment.severity.toLowerCase(),
          normalizedBody,
        ].join(":"),
      )
      .digest("hex");

    const existing = await prisma.reviewComment.findUnique({
      where: {
        fingerprint,
      },
    });

    if (existing) {
      continue;
    }

    await prisma.reviewComment.create({
      data: {
        reviewId: params.reviewId,
        path: comment.path,
        line: comment.line,
        body: normalizedBody,
        severity: mapSeverity(comment.severity),
        fingerprint,
      },
    });

    saved++;
  }

  return saved;
}