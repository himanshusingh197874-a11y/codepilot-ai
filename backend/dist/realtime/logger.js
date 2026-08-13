"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const event_bus_1 = require("./event-bus");
event_bus_1.eventBus.on("repository.updated", (payload) => {
    console.log("📦 Repository Updated:", payload);
});
event_bus_1.eventBus.on("review.completed", (payload) => {
    console.log("✅ Review Completed:", payload);
});
