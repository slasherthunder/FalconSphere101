const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Allow React frontend
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {


    socket.on("GetID", () => {
        socket.emit("SendID", socket.id)
    });



    console.log("A user connected:", socket.id);
    //Recieve text message and send response as broadcast
    socket.on("sendMessage", (data) => {
        console.log(data)
        socket.broadcast.emit("recieveMessage", data);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

server.listen(5000, () => {
    console.log("Server running on port 5000");
});