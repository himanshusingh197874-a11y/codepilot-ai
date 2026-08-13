import { Server as SocketIOServer } from "socket.io";
import { FastifyInstance } from "fastify";

import { eventBus } from "./event-bus";

let io: SocketIOServer;

export function registerSocket(app: FastifyInstance) {
  io = new SocketIOServer(app.server, {
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

  eventBus.on("repository.updated", (payload) => {
    io.emit("repository.updated", payload);
  });

  eventBus.on("review.completed", (payload) => {
    io.emit("review.completed", payload);
  });
}