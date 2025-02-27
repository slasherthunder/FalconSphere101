"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [popularSets, setPopularSets] = useState([]);

  useEffect(() => {
    const savedSets = JSON.parse(localStorage.getItem("sets")) || [];
    setPopularSets(savedSets);
  }, []);

  const navigateTo = (path) => {
    router.push(path);
  };

  const filteredSets = popularSets.filter((set) =>
    set.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#FFFFFF] flex flex-col items-center">
      {/* Navigation Bar */}
      <nav className="bg-[#8B0000] shadow-sm w-full px-10 py-6 flex justify-center">
        <div className="max-w-screen-xl w-full px-1 text-center">
          <h1 className="text-5xl font-bold text-[#F3B13B] mb-4">
            Welcome to FalconSphere!
          </h1>
          <p className="text-[#F3B13B] text-lg">
            Become the academic weapon.
          </p>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-center my-12">
        <motion.div 
          className="flex flex-wrap justify-center gap-6" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.5 }}
        >
          {[
            { label: "Create Your First Set", path: "/create-set" },
            { label: "New Game", path: "/new-game" },
            { label: "Join A Game", path: "/join-game" },
            { label: "Ask A Question", path: "/feedview"}
          ].map(({ label, path }) => (
            <motion.button
              key={path}
              onClick={() => navigateTo(path)}
              className="bg-[#8B0000] text-[#F3B13B] px-10 py-6 rounded-lg font-semibold 
              hover:bg-[#F3B13B] hover:text-[#8B0000] transition-colors transform"
              whileHover={{ scale: 1.05 }}
            >
              {label}
            </motion.button>
          ))}
        </motion.div>
      </section>

      {/* Study Sets Grid */}
      <section className="container mx-auto px-6 mb-12 w-full">
        <h2 className="text-2xl font-bold text-[#8B0000] text-center mb-6">
          Popular Study Sets
        </h2>
        
        {/* Search Bar */}
        <div className="mb-6 text-center">
          <motion.input
            type="text"
            placeholder="Search Popular Sets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#8B0000] text-[#F3B13B] border-2 border-[#8B0000] rounded-lg py-2 px-4 focus:outline-none focus:border-[#F3B13B] transition-all"
            initial={{ scale: 1 }}
            whileFocus={{ scale: 1.05 }}
          />
        </div>

        {/* Display filtered sets */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {filteredSets.length ? (
            filteredSets.map((set) => (
              <motion.div
                key={set.id}
                className="bg-[#600000] rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                whileHover={{ scale: 1.03 }}
              >
                <h3 className="text-xl font-semibold text-[#F3B13B] mb-2">
                  {set.title} {/* Display the title */}
                </h3>
                <p className="text-[#F3B13B] mb-4">
                  A collection of flashcards for mastering your subject.
                </p>
                <motion.button
                  onClick={() => navigateTo(`/study-set/${set.id}`)}
                  className="bg-[#8B0000] text-[#F3B13B] px-4 py-2 rounded-lg font-semibold 
                  hover:bg-[#F3B13B] hover:text-[#8B0000] transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  View Set
                </motion.button>
              </motion.div>
            ))
          ) : (
            <p className="font-bold text-[#8B0000] text-center">No study sets found.</p>
          )}
        </motion.div>
      </section>
    </main>
  );
}
