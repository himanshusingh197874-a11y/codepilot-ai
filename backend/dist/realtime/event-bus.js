"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = void 0;
const node_events_1 = require("node:events");
class EventBus extends node_events_1.EventEmitter {
}
exports.eventBus = new EventBus();
