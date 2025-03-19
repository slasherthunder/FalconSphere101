"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
const socket = io("http://localhost:5000");
import { useRouter } from 'next/navigation';

function HomePage() {

    const [ID, setID] = useState("")

    useEffect(() => {
    socket.emit("GetID");

}, []); 

useEffect(() => {
    socket.on("SendID", (data) => {
        setID(data)
  });
}, [socket]);

//   const navigate = useNavigate();
const router = useRouter();
  const createNewPage = () => {
    router.push(`/app/instance/${ID}`); // Navigate to the new instance
  };

  return (
    <div>
      <h1>Home Page</h1>
      <button onClick={createNewPage}>Create New Page Instance</button>
    </div>
  );
}

export default HomePage;
