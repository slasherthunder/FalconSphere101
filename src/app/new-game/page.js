"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db } from "../../components/firebase"; // Import Firestore instance
import { collection, getDocs, doc, setDoc } from "firebase/firestore"; // Import Firestore functions

export default function NewGame() {
  const [sessionCode, setSessionCode] = useState("");
  const [players, setPlayers] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [availableSets, setAvailableSets] = useState([]);

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
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    setSessionCode(code);
    localStorage.setItem("Session Code", code);

    // Save the session code to Firestore
    const sessionRef = doc(db, "sessions", code);
    setDoc(sessionRef, { code, players: [], selectedSet: null }, { merge: true })
      .then(() => console.log("Session created in Firestore"))
      .catch((error) => console.error("Error creating session: ", error));
  };

  useEffect(() => {
    generateRandomCode();
  }, []);

  // Copy session code to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(sessionCode);
    alert("Session code copied to clipboard!");
  };

  // Handle set selection and save it to Firestore
  const handleSetSelection = async (setId) => {
    const selected = availableSets.find((set) => set.id === setId);
    if (selected) {
      setSelectedSet(selected);

      // Save the selected set to Firestore under the session code
      const sessionRef = doc(db, "sessions", sessionCode);
      await setDoc(sessionRef, { selectedSet: selected }, { merge: true });

      alert(`Set "${selected.title}" selected successfully!`);
    } else {
      alert("Set not found. Please select a valid set.");
    }
  };

  // Add a player to the session and save it to Firestore
  const addPlayer = async () => {
    const newPlayer = prompt("Enter the new player's name:");
    if (newPlayer) {
      const updatedPlayers = [...players, { id: Date.now(), name: newPlayer }];
      setPlayers(updatedPlayers);

      // Save the updated player list to Firestore
      const sessionRef = doc(db, "sessions", sessionCode);
      await setDoc(sessionRef, { players: updatedPlayers }, { merge: true });
    }
  };

  // Remove a player from the session and update Firestore
  const removePlayer = async (id) => {
    if (window.confirm("Are you sure you want to remove this player?")) {
      const updatedPlayers = players.filter((player) => player.id !== id);
      setPlayers(updatedPlayers);

      // Save the updated player list to Firestore
      const sessionRef = doc(db, "sessions", sessionCode);
      await setDoc(sessionRef, { players: updatedPlayers }, { merge: true });
    }
  };

  // Edit a player's name and update Firestore
  const editPlayerName = async (id) => {
    const newName = prompt("Enter the new name:");
    if (newName) {
      const updatedPlayers = players.map((player) =>
        player.id === id ? { ...player, name: newName } : player
      );
      setPlayers(updatedPlayers);

      // Save the updated player list to Firestore
      const sessionRef = doc(db, "sessions", sessionCode);
      await setDoc(sessionRef, { players: updatedPlayers }, { merge: true });
    }
  };

  // Reset the session and update Firestore
  const resetSession = async () => {
    if (window.confirm("Are you sure you want to reset the session?")) {
      setPlayers([]);
      setSelectedSet(null);
      generateRandomCode();

      // Reset the session in Firestore
      const sessionRef = doc(db, "sessions", sessionCode);
      await setDoc(sessionRef, { players: [], selectedSet: null }, { merge: true });
    }
  };

  // Start the game
  const startGame = () => {
    if (players.length < 2) {
      alert("You need at least 2 players to start the game.");
      return;
    }
    if (!selectedSet) {
      alert("Please select a set to start the game.");
      return;
    }
    alert(`Game started with set: ${selectedSet.title}`);
  };

  return (
    <div className="min-h-screen w-full bg-[#8B0000] py-12 flex items-center justify-center">
      <div className="bg-[#700000] backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-4xl mx-4 text-center">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h2 className="text-4xl text-[#FFD700] font-bold">
            SESSION CODE: <span className="text-white">{sessionCode}</span>
          </h2>
          <button
            onClick={copyToClipboard}
            className="bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold hover:bg-[#FFC300]"
          >
            Copy Code
          </button>
        </div>

        <div className="mb-8">
          <label className="block text-[#FFD700] font-medium mb-2">Select a Set:</label>
          <select
            onChange={(e) => handleSetSelection(e.target.value)}
            className="w-full p-3 border rounded bg-[#500000] text-[#FFD700]"
          >
            <option value="">Choose a set</option>
            {availableSets.map((set) => (
              <option key={set.id} value={set.id}>
                {set.title}
              </option>
            ))}
          </select>
          {selectedSet && (
            <div className="mt-4 text-[#FFD700] flex items-center justify-center space-x-2">
              <p>Selected Set: {selectedSet.title}</p>
            </div>
          )}
        </div>

        <div className="space-y-4 mb-8">
          {players.map((player) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="bg-[#600000] p-4 rounded-lg shadow-md flex justify-between items-center"
            >
              <p
                className="text-2xl text-[#FFD700] font-semibold cursor-pointer hover:underline"
                onClick={() => editPlayerName(player.id)}
              >
                {player.name}
              </p>
              <button
                onClick={() => removePlayer(player.id)}
                className="bg-[#8B0000] text-[#FFD700] px-4 py-2 rounded-lg font-bold"
              >
                Remove
              </button>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <button onClick={addPlayer} className="bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold">
            Add Player
          </button>
          <button onClick={resetSession} className="bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold">
            Reset Session
          </button>
          <button onClick={startGame} className="bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold">
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}
