import { z } from "zod";

import { PullRequestReviewSchema } from "./review-pr.schema";

export type PullRequestReview = z.infer<typeof PullRequestReviewSchema>;

export type PullRequestReviewFile = {
  filename: string;
  patch: string;
};
