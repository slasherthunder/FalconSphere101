"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/components/firebase";
import { collection, getDocs, doc, setDoc, addDoc , getDoc, updateDoc} from "firebase/firestore";
import { FaCopy, FaRedo, FaPlay, FaTrash, FaEdit, FaCrown } from "react-icons/fa";
import { useRouter } from 'next/navigation';
import { useParams } from "next/navigation";

import {io} from "socket.io-client";
// import { L } from "framer-motion/dist/types.d-6pKw1mTI";
const socket = io("http://localhost:5000");

export default function NewGame() {

  const { id } = useParams(); // Get unique ID from URL
  const [once, setOnce] = useState(true)
  const [setID, setSetID] = useState("")
  useEffect (() => {
    localStorage.setItem("PossibleSession", id);
    if (once){
      setOnce(false)
      // addCodeToFireBase()
    }

  },[]);




  //Saves the slide data as part of the game database in firebase
  // const updateSlideID = async (code, slide) => {
  //   try {
  //     const docRef = doc(db, "game", code);
  //     await updateDoc(docRef, {
  //       slideID: slide
  
  //     });
  //   } catch (e) {
  //     console.error("Error updating slideID: ", e);
  //   }
  // };

  const router = useRouter();
  const [sessionCode, setSessionCode] = useState("");
  const [players, setPlayers] = useState([]);
  const [testPlayers, setTestPlayers] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [availableSets, setAvailableSets] = useState([]);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);



  const [hasUpdated, setHasUpdated] = useState(false);

  // Fetch all sets from Firestore
  useEffect(() => {
    const fetchSets = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "sets"));
        const sets = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setAvailableSets(sets);
      } catch (error) {
        console.error("Error fetching sets: ", error);
      }
    };

    fetchSets();
  }, []);

  // Generate a random session code and save it to Firestore
  const generateRandomCode = () => {
    const code = id
    setSessionCode(code);
    localStorage.setItem("Session Code", code);

    const sessionRef = doc(db, "sessions", code);
    setDoc(sessionRef, { code, players: [], selectedSet: null }, { merge: true })
      .then(() => console.log("Session created in Firestore"))
      .catch((error) => console.error("Error creating session: ", error));
  };

  useEffect(() => {
    generateRandomCode();
    socket.emit("Send_message", {message: "If you see this, WWWWW"})
  }, []);

 useEffect(() => {

  setTestPlayers([...testPlayers, JSON.parse(localStorage.getItem("PlayerData"))])
  // setPlayers([localStorage.getItem("PlayerData")]);

}, []);
const [test, setTest] = useState("")
useEffect(() => {
  if (hasUpdated) {
    for (let i = 0; i < testPlayers.length; i++) {
      try{
        setTest(test + testPlayers[i].name)
      }catch (TypeError){
        console.log("oof")
      }
      
    }
  } else {
    setHasUpdated(true);
  }
}, [testPlayers]);


  // Copy session code to clipboard with visual feedback
  const copyToClipboard = () => {
    navigator.clipboard.writeText(sessionCode);
    setShowCopiedMessage(true);
    setTimeout(() => setShowCopiedMessage(false), 2000);
  };

  // Handle set selection and save it to Firestore
  const handleSetSelection = async (setId) => {
    const selected = availableSets.find((set) => set.id === setId);
    setSetID(selected.id)
    if (selected) {
      setSelectedSet(selected);
      const sessionRef = doc(db, "sessions", sessionCode);
      await setDoc(sessionRef, { selectedSet: selected }, { merge: true });
    }
  };

  // Remove a player from the session
  const removePlayer = async (id) => {
    if (window.confirm("Are you sure you want to remove this player?")) {
      const updatedPlayers = players.filter((player) => player.id !== id);
      setPlayers(updatedPlayers);
      const sessionRef = doc(db, "sessions", sessionCode);
      await setDoc(sessionRef, { players: updatedPlayers }, { merge: true });
    }
  };

  // Edit a player's name
  const editPlayerName = async (id) => {
    const newName = prompt("Enter the new name:");
    if (newName) {
      const updatedPlayers = players.map((player) =>
        player.id === id ? { ...player, name: newName } : player
      );
      setPlayers(updatedPlayers);
      const sessionRef = doc(db, "sessions", sessionCode);
      await setDoc(sessionRef, { players: updatedPlayers }, { merge: true });
    }
  };

  // Reset the session
  const resetSession = async () => {
    if (window.confirm("Are you sure you want to reset the session?")) {
      setPlayers([]);
      setSelectedSet(null);
      generateRandomCode();
      const sessionRef = doc(db, "sessions", sessionCode);
      await setDoc(sessionRef, { players: [], selectedSet: null }, { merge: true });
    }
  };

  // Start the game with validation
  const startGame = async () => {
    if (!selectedSet) {
      alert("Please select a set to start the game.");
      return;
    }

    // Update session status in Firestore
    const sessionRef = doc(db, "sessions", sessionCode);
    await setDoc(sessionRef, { 
      status: "started",
      startTime: new Date().toISOString()
    }, { merge: true });

    // Navigate to host view
    // router.push(`/host-view/${sessionCode}`);
    // socket.emit("StartGame", selectedSet.id)
    router.push(`/host-view/${id}/${setID}`)

    
  };


useEffect(() => {
  socket.on("ChangeGameScreen", (urlID) => {
    if (window.location.pathname == "/dynamic-page/new-test/" + localStorage.getItem("PossibleSession")){
      router.push("/study-set/play/" + urlID + "/" + id);
    }
  })
}, [socket])






  
  return (
    <div className="min-h-screen w-full bg-white py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        {/* Session Code Card */}
        <motion.div
          className="bg-[#8B0000] p-8 rounded-2xl shadow-2xl mb-8 border border-[#FFD700]/20"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-[#FFD700]/80 text-lg mb-2">SESSION CODE</h3>
              <h2 className="text-5xl font-bold text-[#FFD700] tracking-wider font-mono">
                {sessionCode}
              </h2>
            </div>
            <motion.button
              onClick={copyToClipboard}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] px-6 py-3 rounded-xl 
                font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300"
            >
              <FaCopy /> Copy Code
            </motion.button>
          </div>
          <AnimatePresence>
            {showCopiedMessage && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[#FFD700]/80 text-sm mt-2"
              >
                Code copied to clipboard!
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Set Selection Card */}
        <motion.div
          className="bg-[#8B0000] p-8 rounded-2xl shadow-2xl mb-8 border border-[#FFD700]/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-[#FFD700] text-2xl font-bold mb-4">Select a Study Set</h3>
          <select
            onChange={(e) => handleSetSelection(e.target.value)}
            className="w-full p-4 rounded-xl bg-[#500000] text-[#FFD700] border border-[#FFD700]/20 
              focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition-all duration-300
              hover:border-[#FFD700]/40"
          >
            <option value="">Choose a set</option>
            {availableSets.map((set) => (
              <option key={set.id} value={set.id}>
                {set.title}
              </option>
            ))}
          </select>
          {selectedSet && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-[#500000]/50 rounded-xl border border-[#FFD700]/20"
            >
              <div className="flex items-center gap-2 text-[#FFD700]">
                <FaCrown className="text-xl" />
                <p className="font-semibold">{selectedSet.title}</p>
              </div>
            </motion.div>
          )}
        </motion.div>

          {/* Players List Card */}
          <motion.div
            className="bg-[#8B0000] p-8 rounded-2xl shadow-2xl mb-8 border border-[#FFD700]/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* <h3 className="text-[#FFD700] text-2xl font-bold mb-6">Players: {test}</h3> */}
            <div className="space-y-4">
              <AnimatePresence>
                {players.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-r from-[#600000]/80 to-[#500000]/80 p-4 rounded-xl 
                      shadow-lg border border-[#FFD700]/10 hover:border-[#FFD700]/30 transition-all duration-300
                      flex justify-between items-center group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[#FFD700]/60 font-mono">{index + 1}</span>
                      <h4 className="text-xl text-[#FFD700] font-semibold">{player.name}</h4>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => editPlayerName(player.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-[#FFD700] hover:text-[#FFC300] p-2"
                      >
                        <FaEdit />
                      </motion.button>
                      <motion.button
                        onClick={() => removePlayer(player.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-[#FFD700] hover:text-red-500 p-2"
                      >
                        <FaTrash />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <motion.button
            onClick={resetSession}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] px-6 py-4 rounded-xl 
              font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <FaRedo /> Reset Session
          </motion.button>
          <motion.button
            onClick={startGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] px-8 py-4 rounded-xl 
              font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <FaPlay /> Start Game
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
