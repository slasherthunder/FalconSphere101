"use client";
import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../../components/firebase";
import { FaCrown, FaPlay, FaStop, FaUserSlash, FaCopy, FaCheck } from "react-icons/fa";
import { useParams, useRouter } from 'next/navigation';
import { collection, getDocs, doc, setDoc, addDoc , getDoc, onSnapshot, updateDoc} from "firebase/firestore";

import { io } from "socket.io-client";
import { useRef } from "react";

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

  const [copySuccess, setCopySuccess] = useState(false);
  const [kickedPlayer, setKickedPlayer] = useState(null);
  const copyBtnRef = useRef(null);

  const [announcement, setAnnouncement] = useState("");
  const [clientAnnouncements, setClientAnnouncements] = useState([]);
  const [announcementInput, setAnnouncementInput] = useState("");
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

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
          setAnnouncement(doc.data().announcement || "");
          setClientAnnouncements(doc.data().clientAnnouncements || []);
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

  // Kick player function
  const kickPlayer = async (playerName) => {
    if (!window.confirm(`Are you sure you want to remove ${playerName} from the session?`)) return;
    setKickedPlayer(playerName);
    setTimeout(async () => {
      try {
        const docRef = doc(db, "game", code);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return;
        const players = docSnap.data().players || [];
        const updatedPlayers = players.filter(p => p.name !== playerName);
        await updateDoc(docRef, { players: updatedPlayers });
        setPlayerData(updatedPlayers);
        setKickedPlayer(null);
      } catch (e) {
        alert("Failed to remove player. Try again.");
        setKickedPlayer(null);
      }
    }, 350); // match animation duration
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 1200);
  };

  // Host sends announcement
  const sendAnnouncement = async () => {
    if (!announcementInput.trim()) return;
    setSendingAnnouncement(true);
    try {
      const sessionRef = doc(db, "sessions", code);
      await setDoc(sessionRef, { announcement: announcementInput.trim() }, { merge: true });
      setAnnouncementInput("");
    } catch (e) {
      alert("Failed to send announcement.");
    }
    setSendingAnnouncement(false);
  };

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
              <span className="relative ml-2">
                <button
                  ref={copyBtnRef}
                  onClick={handleCopyCode}
                  className={`inline-flex items-center px-2 py-1 bg-[#FFD700]/10 hover:bg-[#FFD700]/30 rounded-lg text-[#FFD700] text-lg transition-all duration-200 border border-[#FFD700]/30 hover:border-[#FFD700]/60 focus:outline-none focus:ring-2 focus:ring-[#FFD700]`}
                  aria-label="Copy code"
                  onMouseLeave={() => setCopySuccess(false)}
                >
                  <motion.span animate={{ scale: copySuccess ? 1.2 : 1 }} transition={{ type: "spring", stiffness: 300 }}>
                    {copySuccess ? <FaCheck className="text-green-400" /> : <FaCopy />}
                  </motion.span>
                </button>
                <AnimatePresence>
                  {(copySuccess) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: -24 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="absolute left-1/2 -translate-x-1/2 bg-[#FFD700] text-[#8B0000] text-xs font-semibold px-3 py-1 rounded-lg shadow-lg z-10 mt-1"
                    >
                      Copied!
                    </motion.div>
                  )}
                </AnimatePresence>
                <span className="absolute left-1/2 -translate-x-1/2 bottom-[-2.2rem] text-xs text-[#FFD700]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none select-none">Copy code</span>
              </span>
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
            {/* Announcement Banner & Input (now inside Players section) */}
            {announcement && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 rounded-xl bg-gradient-to-r from-[#FFD700]/80 to-[#F3B13B]/80 text-[#8B0000] text-lg font-semibold text-center shadow-lg border border-[#FFD700]/40"
              >
                📢 {announcement}
              </motion.div>
            )}
            {isHost && (
              <div className="flex flex-col gap-2 w-full mb-4">
                {/* Predetermined Announcements */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {['Let\'s do this!', 'Get ready!', 'Great job!', 'Next question coming up!'].map((msg) => (
                    <button
                      key={msg}
                      type="button"
                      onClick={async () => {
                        setSendingAnnouncement(true);
                        try {
                          const sessionRef = doc(db, 'sessions', code);
                          await setDoc(sessionRef, { announcement: msg }, { merge: true });
                        } catch (e) {
                          alert('Failed to send announcement.');
                        }
                        setSendingAnnouncement(false);
                      }}
                      className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#FFD700] to-[#F3B13B] text-[#8B0000] font-semibold shadow hover:from-[#F3B13B] hover:to-[#FFD700] transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={sendingAnnouncement}
                    >
                      {msg}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                  <input
                    type="text"
                    value={announcementInput}
                    onChange={e => setAnnouncementInput(e.target.value)}
                    placeholder="Type announcement..."
                    className="flex-1 px-4 py-2 rounded-lg border border-[#FFD700]/40 focus:border-[#FFD700] focus:ring-2 focus:ring-[#FFD700]/30 outline-none text-[#8B0000] bg-white shadow"
                    maxLength={120}
                    disabled={sendingAnnouncement}
                  />
                  <button
                    onClick={sendAnnouncement}
                    disabled={sendingAnnouncement || !announcementInput.trim()}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#FFD700] to-[#F3B13B] text-[#8B0000] font-bold shadow hover:from-[#F3B13B] hover:to-[#FFD700] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sendingAnnouncement ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            )}
            {!isHost && (
              <div className="flex flex-wrap gap-2 w-full mb-4 justify-center">
                {['Ready!', 'Can you repeat?', 'I need help', 'All good!'].map((msg) => (
                  <button
                    key={msg}
                    type="button"
                    onClick={async () => {
                      setSendingAnnouncement(true);
                      try {
                        const sessionRef = doc(db, 'sessions', code);
                        // Get current clientAnnouncements
                        const docSnap = await getDoc(sessionRef);
                        let arr = (docSnap.exists() && docSnap.data().clientAnnouncements) ? docSnap.data().clientAnnouncements : [];
                        // Add new announcement with name
                        const name = sessionStorage.getItem("name") || "Anonymous";
                        arr = [{ name, message: msg }, ...arr].slice(0, 5);
                        await setDoc(sessionRef, { clientAnnouncements: arr }, { merge: true });
                      } catch (e) {
                        alert('Failed to send announcement.');
                      }
                      setSendingAnnouncement(false);
                    }}
                    className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#FFD700] to-[#F3B13B] text-[#8B0000] font-semibold shadow hover:from-[#F3B13B] hover:to-[#FFD700] transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={sendingAnnouncement}
                  >
                    {msg}
                  </button>
                ))}
              </div>
            )}
            {isHost && clientAnnouncements.length > 0 && (
              <div className="flex flex-col gap-2 w-full max-w-lg mx-auto mb-4">
                <AnimatePresence>
                  {clientAnnouncements.map((a, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ duration: 0.25 }}
                      className="bg-gradient-to-r from-[#FFD700] to-[#F3B13B] text-[#8B0000] rounded-xl px-4 py-3 text-base font-bold flex items-center gap-3 shadow-lg border-2 border-[#FFD700]/70 mb-1"
                    >
                      <span className="text-2xl" role="img" aria-label="Player">💬</span>
                      <span className="font-extrabold text-[#8B0000]">{a.name}:</span>
                      <span className="font-semibold text-[#8B0000]">{a.message}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
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
                    className={`bg-[#700000]/50 backdrop-blur-sm p-5 rounded-xl 
                      shadow-lg border border-[#FFD700]/10 hover:border-[#FFD700]/30 transition-all duration-300
                      flex justify-between items-center group hover:bg-[#700000]/70
                      ${kickedPlayer === player.name ? 'opacity-40 scale-95 blur-[1px] transition-all duration-300' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[#FFD700] text-xl md:text-2xl font-bold w-10 text-center bg-[#600000] px-3 py-1 rounded-lg">{index + 1}</span>
                      <div>
                        <h4 className="text-xl text-[#FFD700] font-semibold tracking-wide">{player.name}</h4>
                        <div className="flex gap-4 mt-1">
                          <span className="text-[#FFD700]/80 text-sm">Slide: {player.slideNumber}</span>
                          <span className="text-[#FFD700]/80 text-sm">Correct: {player.correctAnswers}</span>
                        </div>
                      </div>
                    </div>
                    {isHost && (
                      <span className="relative group ml-2">
                        <button
                          onClick={() => kickPlayer(player.name)}
                          className="p-2 rounded-full bg-[#FFD700]/10 hover:bg-red-600 hover:text-white text-[#FFD700] transition-all duration-200 border border-[#FFD700]/20 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400"
                          aria-label={`Kick ${player.name}`}
                        >
                          <FaUserSlash className="text-lg" />
                        </button>
                        <span className="absolute left-1/2 -translate-x-1/2 bottom-[-2.2rem] text-xs bg-[#FFD700] text-[#8B0000] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none select-none shadow-lg z-10">Remove player</span>
                      </span>
                    )}
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
