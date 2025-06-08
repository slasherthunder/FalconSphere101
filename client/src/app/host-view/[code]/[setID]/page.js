"use client";
import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../../../components/firebase";
import { FaCrown, FaPlay, FaStop } from "react-icons/fa";
import { useParams, useRouter } from 'next/navigation';
import { collection, getDocs, doc, setDoc, addDoc , getDoc, onSnapshot, updateDoc} from "firebase/firestore";

import { io } from "socket.io-client";

const socket = io("http://localhost:5001");

export default function HostView({ params }) {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const code = use(params).code;
  const setID = useParams().setID;
  const [isHost, setIsHost] = useState(true)

  const [gameStarted, setGameStarted] = useState(false)

  const [PlayerData, setPlayerData] = useState([]);

  //Retrieves Player Data from local storage
  useEffect( () =>{
    addCodeToFireBase()
    ensureHost()
  }, []);

  ///I HATE BROWN PEOPLE
  const addBooleanField = async () => {
    try {
      const docRef = doc(db, "game", code);
  
      await updateDoc(docRef, {
        isStarted: true
      });
  
      console.log("Boolean field added successfully!");
    } catch (error) {
      console.error("Error adding boolean field:", error);
    }
  };

  const ensureHost = async () => {
    const docRef = doc(db, "game", code)
    const docSnap = await getDoc(docRef)
    const players = docSnap.data().players
    setIsHost(!(players.some(player => player.name === sessionStorage.getItem("name"))))
  }

  const checkIfGameStarted = async () => {
    const docRef = doc(db, "game", code)
    const docSnap = await getDoc(docRef)
    const isStarted = docSnap.data().isStarted
    // console.log(isHost)
    const players = docSnap.data().players
    if(isStarted && !(!(players.some(player => player.name === sessionStorage.getItem("name"))))){
      router.push("/study-set/play/" + setID + "/" + code)
    }
  }

useEffect(() => {
  const interval = setInterval(() => {
    console.log("This runs every second");
    const myFunc = async () => {
      const docRef = doc(db, "game", code)
      const newDoc = await getDoc(docRef);
      const players = newDoc.data().players
      setPlayerData(players)
    }
myFunc()
checkIfGameStarted()
  }, 1000); // 1000ms = 1 second

  return () => clearInterval(interval); // Cleanup on unmount
}, []);

  useEffect(() =>{
    socket.on("ChangeSlideNumber", (slideData) =>{
      console.log("Gottem")
      setPlayerData((PlayerData) =>
          PlayerData.map((player) =>
            player.name === slideData.name ? { ...player, slideNumber: slideData.slide, score: slideData.score } : player
          )
        );
      })
      socket.on("ChangeGameScreen", (data) => {
      router.push("/study-set/play/" + data.id + "/" + data.code)
      })
  }, [socket]);

  const updateSlideID = async () => {
    try {
      const docRef = doc(db, "game", code);
      await updateDoc(docRef, {
        slideID: setID
  
      });
    } catch (e) {
      console.error("Error updating slideID: ", e);
    }
  };


  const addCodeToFireBase = async () => {
    const gameDoc = doc(db, "game", code)
    const newDoc = await getDoc(gameDoc)
    if (newDoc.exists()){
      console.log("Hello")
      return
    }else{
      try {
        await setDoc(doc(db, "game", code), {
          code: code,
          players: []
        });
        updateSlideID()
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    }

  };
  
  // useEffect(() => {
  //   // Run function every 10 milliseconds
  //   const interval = setInterval(() => {
  //     setPlayerData(JSON.parse(localStorage.getItem("PlayerData")));
  //   }, 10);

  //   return () => clearInterval(interval); // Cleanup to prevent memory leaks
  // }, []); // Empty dependency array ensures it runs only once

  
const [hasUpdated, setHasUpdated]= useState(false);
  useEffect(() =>{
    
    if (!hasUpdated){
      setHasUpdated(true)
      return;
    }else{
      localStorage.setItem("PlayerData", JSON.stringify(PlayerData))

    }
  }, [PlayerData]);

  useEffect(() => {
    if (!code) {
      setError("No session code provided");
      setLoading(false);
      return;
    }

    // Subscribe to session updates
    const unsubscribe = onSnapshot(doc(db, "sessions", code), 
      (doc) => {
        if (doc.exists()) {
          setSession(doc.data());
        } else {
          setError("Session not found");
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching session:", error);
        setError("Error loading session");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [code]);

const startGame = () => {
  addBooleanField()
  // socket.emit("StartGame", {code: code, id: setID})
}


  const endGame = async () => {
    if (window.confirm("Are you sure you want to end the game?")) {
      try {
        const sessionRef = doc(db, "sessions", code);
        await setDoc(sessionRef, { 
          status: "ended",
          endTime: new Date().toISOString()
        }, { merge: true });
        router.push('/');
      } catch (error) {
        console.error("Error ending game:", error);
        alert("Failed to end game. Please try again.");
      }
    }
  };


  const handleNextQuestion = () =>{
    // router.push("/wait-for-next-question")
    router.push("/./leaderboard/" + code)
  }

  useEffect (() => {
    console.log("Whats good")
    socket.on("ConfirmSendQuestionRequest", () => {
      localStorage.setItem("isNext", true)
    });

  }, [socket]);


  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-white via-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-gradient-to-br from-[#8B0000] to-[#700000] p-8 rounded-3xl shadow-2xl border border-[#FFD700]/20">
          <div className="animate-spin h-12 w-12 border-4 border-[#FFD700] rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-white via-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-gradient-to-br from-[#8B0000] to-[#700000] p-8 rounded-3xl shadow-2xl border border-[#FFD700]/20 text-center">
          <h2 className="text-2xl font-bold text-[#FFD700] mb-4">Error</h2>
          <p className="text-[#FFD700]/80 mb-6">{error}</p>
          <motion.button
            onClick={() => router.push('/')}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-[#FFD700] to-[#F3B13B] text-[#8B0000] px-6 py-3 rounded-xl 
              font-bold shadow-lg hover:shadow-xl transition-all duration-300
              hover:from-[#F3B13B] hover:to-[#FFD700]"
          >
            Return Home
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white via-gray-50 to-gray-100 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <motion.div
          className="bg-gradient-to-br from-[#8B0000] to-[#700000] p-8 sm:p-10 rounded-3xl shadow-2xl mb-8 border border-[#FFD700]/20 relative overflow-hidden"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/5 to-transparent opacity-50"></div>
          <div className="relative text-center">
            <h3 className="text-[#FFD700]/80 text-lg mb-3 tracking-wider uppercase font-medium">Host View</h3>
            <h2 className="text-5xl sm:text-6xl font-bold text-[#FFD700] tracking-wider font-mono mb-6 bg-[#700000]/30 px-6 py-3 rounded-xl inline-block">
              {code}
            </h2>
            {session?.selectedSet && (
              <div className="flex items-center justify-center gap-3 text-[#FFD700]">
                <FaCrown className="text-2xl text-[#F3B13B]" />
                <p className="font-semibold text-lg">{session.selectedSet.title}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Players List */}
        <motion.div
          className="bg-gradient-to-br from-[#8B0000] to-[#700000] p-8 sm:p-10 rounded-3xl shadow-2xl mb-8 border border-[#FFD700]/20 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/5 to-transparent opacity-50"></div>
          <div className="relative">
            <h3 className="text-[#FFD700] text-2xl font-bold mb-6 tracking-wide">Players</h3>
            <div className="space-y-4">
              <AnimatePresence>
                {PlayerData.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#700000]/50 backdrop-blur-sm p-5 rounded-xl 
                      shadow-lg border border-[#FFD700]/10 hover:border-[#FFD700]/30 transition-all duration-300
                      flex justify-between items-center group hover:bg-[#700000]/70"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[#FFD700] text-xl md:text-2xl font-bold w-10 text-center bg-[#600000] px-3 py-1 rounded-lg">#{index + 1}</span>
                      <div>
                        <h4 className="text-xl text-[#FFD700] font-semibold tracking-wide">{player.name}</h4>
                        <div className="flex gap-4 mt-1">
                          <span className="text-[#FFD700]/80 text-sm">Slide: {player.slideNumber}</span>
                          <span className="text-[#FFD700]/80 text-sm">Correct: {player.correctAnswers}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {(!session?.players || session.players.length === 0) && (
                <p className="text-[#FFD700]/60 text-center py-6">Waiting for players to join...</p>
              )}
              <motion.button
                onClick={handleNextQuestion}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-gradient-to-r from-[#FFD700] to-[#F3B13B] text-[#8B0000] px-6 py-4 rounded-xl 
                  font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all duration-300
                  hover:from-[#F3B13B] hover:to-[#FFD700] mt-4"
              >
                Go To Leaderboard
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row justify-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {gameStarted && isHost && (
            <motion.button
              onClick={endGame}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-[#FFD700] to-[#F3B13B] text-[#8B0000] px-8 py-4 rounded-xl 
                font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-3 transition-all duration-300
                hover:from-[#F3B13B] hover:to-[#FFD700] text-lg"
            >
              <FaStop className="text-xl" /> End Game
            </motion.button>
          )}
          {!gameStarted && isHost && (
            <motion.button
              onClick={startGame}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-[#FFD700] to-[#F3B13B] text-[#8B0000] px-8 py-4 rounded-xl 
                font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-3 transition-all duration-300
                hover:from-[#F3B13B] hover:to-[#FFD700] text-lg"
            >
              <FaPlay className="text-xl" /> Start Game
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};