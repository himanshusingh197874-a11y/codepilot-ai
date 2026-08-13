import { EventEmitter } from "node:events";

export type RepositoryUpdatedEvent = {
  repositoryId: string;
};

export type ReviewCompletedEvent = {
  repositoryId: string;
  reviewId: string;
};

class EventBus extends EventEmitter {}

export const eventBus = new EventBus();