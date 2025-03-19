"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { db } from "../components/firebase"; // Import Firestore instance
import { collection, getDocs } from "firebase/firestore"; // Import Firestore functions
import { FaEdit, FaGamepad, FaUsers, FaLightbulb } from "react-icons/fa"; // Import icons from react-icons


export default function Home() {

  
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [popularSets, setPopularSets] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [userSets, setUserSets] = useState([]); // State to store user's sets

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "sets"));
        const sets = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setPopularSets(sets);

        // Fetch user's sets from local storage (client-side only)
        if (typeof window !== "undefined") {
          const storedUserSets = JSON.parse(localStorage.getItem("userSets")) || [];
          setUserSets(storedUserSets);
        }
      } catch (error) {
        console.error("Error fetching sets: ", error);
      }
    };

    fetchSets();

    // Fetch recent searches from local storage (client-side only)
    if (typeof window !== "undefined") {
      const storedSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];
      setRecentSearches(storedSearches);
    }
  }, []);

  // Listen for changes to local storage
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUserSets = JSON.parse(localStorage.getItem("userSets")) || [];
      setUserSets(storedUserSets);
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Add a set to recent searches without removing it from user sets
  const addToRecentSearches = (set) => {
    setRecentSearches((prevSearches) => {
      const updatedSearches = prevSearches.filter((s) => s.id !== set.id);
      const newSearches = [set, ...updatedSearches].slice(0, 5); // Keep only the last 5 searches
      localStorage.setItem("recentSearches", JSON.stringify(newSearches));
      return newSearches;
    });
  };

  // Navigate to a path and optionally add the set to recent searches
  const navigateTo = (path, set) => {
    if (set) {
      addToRecentSearches(set); // Add to recent searches without removing from user sets
    }
    router.push(path);
  };

  // Handle editing a set (no removal from user sets)
  const handleEditSet = (set) => {
    router.push(`/edit-set/${set.id}`);
  };

  // Filter sets based on search term
  const filteredSets = popularSets.filter((set) =>
    set.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
















    <main className="min-h-screen bg-gradient-to-b from-[#FFFFFF] to-[#FFF5E6] flex flex-col items-center">
               
      {/* Navigation Bar */}
      <nav className="bg-gradient-to-r from-[#8B0000] to-[#600000] shadow-lg w-full px-10 py-8 flex justify-center">
        <div className="max-w-screen-xl w-full px-1 text-center">
          <motion.h1 
            className="text-6xl font-bold text-[#F3B13B] mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Welcome to FalconSphere!
          </motion.h1>
          <motion.p 
            className="text-[#F3B13B] text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Become the academic weapon.
          </motion.p>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-center my-16">
        <motion.div 
          className="flex flex-wrap justify-center gap-8" 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {[
            { label: "Create Your First Set", path: "/create-set", icon: FaEdit },
            { label: "New Game", path: "/new-game", icon: FaGamepad },
            { label: "Join A Game", path: "/join-game", icon: FaUsers },
            { label: "Peer Help", path: "/feedview", icon: FaLightbulb }
          ].map(({ label, path, icon: Icon }, index) => (
            <motion.button
              key={path}
              onClick={() => navigateTo(path)}
              className="bg-gradient-to-br from-[#8B0000] to-[#600000] text-[#F3B13B] px-12 py-8 rounded-xl font-semibold 
              hover:from-[#F3B13B] hover:to-[#FFD700] hover:text-[#8B0000] transition-all duration-300 shadow-lg
              flex flex-col items-center gap-2"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
            >
              <Icon className="text-4xl" />
              {label}
            </motion.button>
          ))}
        </motion.div>
      </section>

      {/* Study Sets Grid */}
      <section className="container mx-auto px-6 mb-16 w-full">
        <motion.h2 
          className="text-3xl font-bold text-[#8B0000] text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          Popular Study Sets
        </motion.h2>
        
        {/* Search Bar */}
        <div className="mb-8 text-center">
          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.9 }}
          >
            <input
              type="text"
              placeholder="Search Popular Sets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white text-[#8B0000] border-2 border-[#8B0000] rounded-xl py-3 px-6 
              focus:outline-none focus:border-[#F3B13B] focus:ring-2 focus:ring-[#F3B13B] transition-all
              placeholder-[#8B0000]/50 text-lg"
            />
          </motion.div>
        </div>

        {/* Recent Search Bar */}
        <div className="mb-12 text-center">
          <motion.h3 
            className="text-2xl font-bold text-[#8B0000] mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            Recent Searches
          </motion.h3>
          <motion.div 
            className="flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
          >
            {recentSearches.map((set) => (
              <motion.button
                key={set.id}
                onClick={() => navigateTo(`/study-set/${set.id}`, set)}
                className="bg-gradient-to-r from-[#8B0000] to-[#600000] text-[#F3B13B] px-6 py-3 rounded-xl font-semibold 
                hover:from-[#F3B13B] hover:to-[#FFD700] hover:text-[#8B0000] transition-all duration-300 shadow-md"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {set.title}
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Display filtered sets */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          {filteredSets.length ? (
            filteredSets.map((set, index) => (
              <motion.div
                key={set.id}
                className="bg-gradient-to-br from-[#600000] to-[#500000] rounded-xl shadow-xl p-8 
                hover:shadow-2xl transition-all duration-300 border border-[#F3B13B]/10"
                whileHover={{ scale: 1.03, y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.3 + index * 0.1 }}
              >
                <h3 className="text-2xl font-semibold text-[#F3B13B] mb-4">
                  {set.title}
                </h3>
                <p className="text-[#F3B13B]/90 mb-6 text-lg">
                  A collection of flashcards for mastering your subject.
                </p>
                <motion.button
                  onClick={() => navigateTo(`/study-set/${set.id}`, set)}
                  className="w-full bg-gradient-to-r from-[#8B0000] to-[#600000] text-[#F3B13B] px-6 py-3 
                  rounded-xl font-semibold hover:from-[#F3B13B] hover:to-[#FFD700] hover:text-[#8B0000] 
                  transition-all duration-300 shadow-md"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Set
                </motion.button>
              </motion.div>
            ))
          ) : (
            <motion.p 
              className="font-bold text-[#8B0000] text-center text-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.4 }}
            >
              No study sets found.
            </motion.p>
          )}
        </motion.div>
      </section>

      {/* User's Recent Sets Section */}
      <section className="container mx-auto px-6 mb-16 w-full">
        <motion.h2 
          className="text-3xl font-bold text-[#8B0000] text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5 }}
        >
          Your Recent Sets
        </motion.h2>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.6 }}
        >
          {userSets.length ? (
            userSets.map((set, index) => (
              <motion.div
                key={set.id}
                className="bg-gradient-to-br from-[#600000] to-[#500000] rounded-xl shadow-xl p-8 
                hover:shadow-2xl transition-all duration-300 border border-[#F3B13B]/10"
                whileHover={{ scale: 1.03, y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.7 + index * 0.1 }}
              >
                <h3 className="text-2xl font-semibold text-[#F3B13B] mb-4">
                  {set.title}
                </h3>
                <p className="text-[#F3B13B]/90 mb-6 text-lg">
                  A collection of flashcards for mastering your subject.
                </p>
                <motion.button
                  onClick={() => handleEditSet(set)}
                  className="w-full bg-gradient-to-r from-[#8B0000] to-[#600000] text-[#F3B13B] px-6 py-3 
                  rounded-xl font-semibold hover:from-[#F3B13B] hover:to-[#FFD700] hover:text-[#8B0000] 
                  transition-all duration-300 shadow-md"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Edit Set
                </motion.button>
              </motion.div>
            ))
          ) : (
            <motion.p 
              className="font-bold text-[#8B0000] text-center text-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.8 }}
            >
              No recent sets found.
            </motion.p>
          )}
        </motion.div>
      </section>
    </main>
  );
}
