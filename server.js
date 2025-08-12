// server.js
import express from "express";
import { WebSocketServer } from "ws";
import http from "http";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let senderSocket = null;   // Celular
let viewerSocket = null;   // Chromebook

wss.on("connection", (ws) => {
    console.log("Novo cliente conectado");

    ws.on("message", (msg) => {
        try {
            const data = JSON.parse(msg);

            // Identificar tipo de cliente
            if (data.type === "role") {
                if (data.role === "sender") {
                    senderSocket = ws;
                    console.log("Celular conectado como sender");
                } else if (data.role === "viewer") {
                    viewerSocket = ws;
                    console.log("Chromebook conectado como viewer");
                }
                return;
            }

            // Encaminhar vídeo do celular pro viewer
            if (data.type === "frame" && viewerSocket) {
                viewerSocket.send(JSON.stringify({ type: "frame", payload: data.payload }));
            }

            // Encaminhar comandos do viewer pro celular
            if (data.type === "command" && senderSocket) {
                senderSocket.send(JSON.stringify({ type: "command", payload: data.payload }));
            }
        } catch (err) {
            console.error("Erro ao processar mensagem:", err);
        }
    });

    ws.on("close", () => {
        if (ws === senderSocket) senderSocket = null;
        if (ws === viewerSocket) viewerSocket = null;
        console.log("Cliente desconectado");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
