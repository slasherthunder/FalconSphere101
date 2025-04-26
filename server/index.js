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

    socket.on("Add Player", (data) => {
       socket.emit("SendPlayerData", data);
    });


    socket.on("StartGame", (urlID) =>{
        socket.broadcast.emit("ChangeGameScreen", urlID)
    });

    //handles changing host view information for current slide number
    socket.on("Next Slide", (slideData) =>{
        console.log("Hello")
        socket.broadcast.emit("ChangeSlideNumber", slideData)
    });


    //Handles next question when host allows
    socket.on("SendPlayersToNextQuestion", () => {
socket.emit("ConfirmSendQuestionRequest")

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

server.listen(5001, () => {
    console.log("Server running on port 5000");
});