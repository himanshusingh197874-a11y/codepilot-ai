"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSocket = registerSocket;
const socket_io_1 = require("socket.io");
const event_bus_1 = require("./event-bus");
let io;
function registerSocket(app) {
    io = new socket_io_1.Server(app.server, {
        cors: {
            origin: "http://localhost:3001",
            credentials: true,
        },
    });
    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);
        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });
    //
    // Listen to domain events
    //
    event_bus_1.eventBus.on("repository.updated", (payload) => {
        io.emit("repository.updated", payload);
    });
    event_bus_1.eventBus.on("review.completed", (payload) => {
        io.emit("review.completed", payload);
    });
}
