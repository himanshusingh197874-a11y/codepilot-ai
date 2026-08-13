import { eventBus } from "./event-bus";

eventBus.on("repository.updated", (payload) => {
  console.log("📦 Repository Updated:", payload);
});

eventBus.on("review.completed", (payload) => {
  console.log("✅ Review Completed:", payload);
});