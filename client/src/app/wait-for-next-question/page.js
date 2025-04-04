"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("https://localhost:5000")


export default function Hello() {
  const router = useRouter();
  const [count, setCount] = useState(0);

  const [gameSessionID, setGameSessionID] = useState("")
  const [notTrue, setNotTrue] = useState(false)
  
  useEffect (() => {
    setGameSessionID(sessionStorage.getItem("currentGameSetID"))
  }, []);
  
  // useEffect (() => {

  //   console.log("Whats good")
  //   socket.on("ConfirmSendQuestionRequest", () => {
  //     console.log("hello")
  //     router.push("/study-set/play/" + gameSessionID)
  //   });

  //   }


  // }, [socket]);


  useEffect(() => {
    const interval = setInterval(() => {

      if (localStorage.getItem("isNext") == "true"){
        router.push("/study-set/play/" + sessionStorage.getItem("currentGameSetID"))
        localStorage.setItem("isNext", false)

      }


    }, 1000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  


    return <h1 style={{ fontSize: "100px", color: "black" }}>Loading</h1>;
  }
  