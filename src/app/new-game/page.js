"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../components/firebase'; // Import Firestore instance
import { collection, getDocs } from 'firebase/firestore'; // Import Firestore functions

export default function NewGame() {
  const [sessionCode, setSessionCode] = useState('');
  const [players, setPlayers] = useState([
    { name: 'John Doe' },
    { name: 'Jane Smith' },
  ]);
  const [selectedSet, setSelectedSet] = useState(null); // Store the selected set
  const [availableSets, setAvailableSets] = useState([]); // Store all available sets

  // Fetch available sets from Firestore
  useEffect(() => {
    const fetchSets = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'sets'));
        const sets = [];
        querySnapshot.forEach((doc) => {
          sets.push({ id: doc.id, ...doc.data() });
        });
        setAvailableSets(sets);
      } catch (error) {
        console.error('Error fetching sets: ', error);
      }
    };

    fetchSets();
  }, []);

  const generateRandomCode = () => {
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    setSessionCode(code);
  };

  useEffect(() => {
    generateRandomCode();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sessionCode);
    alert('Session code copied to clipboard!');
  };

  const handleSetSelection = (setId) => {
    const selected = availableSets.find((set) => set.id === setId);
    setSelectedSet(selected);
    alert(`Set "${selected.title}" selected successfully!`);
  };

  const addPlayer = () => {
    const newPlayer = prompt('Enter the new player\'s name:');
    if (newPlayer) {
      setPlayers([...players, { name: newPlayer }]);
    }
  };

  const removePlayer = (index) => {
    if (window.confirm('Are you sure you want to remove this player?')) {
      const updatedPlayers = players.filter((_, i) => i !== index);
      setPlayers(updatedPlayers);
    }
  };

  const editPlayerName = (index) => {
    const newName = prompt('Enter the new name:');
    if (newName) {
      const updatedPlayers = [...players];
      updatedPlayers[index].name = newName;
      setPlayers(updatedPlayers);
    }
  };

  const resetSession = () => {
    if (window.confirm('Are you sure you want to reset the session?')) {
      setPlayers([]);
      generateRandomCode();
      setSelectedSet(null);
    }
  };

  const startGame = () => {
    if (players.length < 2) {
      alert('You need at least 2 players to start the game.');
      return;
    }
    if (!selectedSet) {
      alert('Please select a set to start the game.');
      return;
    }
    alert(`Game started with set: ${selectedSet.title}`);
    // You can now use the selectedSet data to display questions, etc.
  };

  return (
    <div className="min-h-screen w-full bg-[#8B0000] py-12 flex items-center justify-center">
      <div className="bg-[#700000] backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-4xl mx-4 text-center transform transition-all hover:scale-105 duration-300 border border-[#ffffff20]">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h2 className="text-4xl text-[#FFD700] font-bold">
            SESSION CODE: <span className="text-white">{sessionCode}</span>
          </h2>
          <button
            onClick={copyToClipboard}
            className="bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold hover:bg-[#FFC300] transition duration-300 transform hover:scale-110 mt-4 sm:mt-0"
          >
            Copy Code
          </button>
        </div>

        <div className="mb-8">
          <label className="block text-[#FFD700] font-medium mb-2">Select a Set:</label>
          <select
            onChange={(e) => handleSetSelection(e.target.value)}
            className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p>Selected Set: {selectedSet.title}</p>
            </div>
          )}
        </div>

        <div className="space-y-4 mb-8">
          {players.map((player, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="bg-[#600000] p-4 rounded-lg shadow-md flex justify-between items-center transform transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border border-[#ffffff20]"
            >
              <div className="flex items-center space-x-4">
                <p
                  className="text-2xl text-[#FFD700] font-semibold cursor-pointer hover:underline"
                  onClick={() => editPlayerName(index)}
                >
                  {player.name}
                </p>
              </div>
              <button
                onClick={() => removePlayer(index)}
                className="bg-[#8B0000] text-[#FFD700] px-4 py-2 rounded-lg font-bold hover:bg-[#700000] transition duration-300 transform hover:scale-110"
              >
                Remove
              </button>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            onClick={addPlayer}
            className="bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold hover:bg-[#FFC300] transition duration-300 transform hover:scale-110"
          >
            Add Player
          </button>
          <button
            onClick={resetSession}
            className="bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold hover:bg-[#FFC300] transition duration-300 transform hover:scale-110"
          >
            Reset Session
          </button>
          <button
            onClick={startGame}
            className="bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold hover:bg-[#FFC300] transition duration-300 transform hover:scale-110"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}
