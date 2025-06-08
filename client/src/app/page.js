"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../components/firebase";
import { collection, getDocs } from "firebase/firestore";
import { FaEdit, FaGamepad, FaUsers, FaLightbulb, FaQuoteLeft } from "react-icons/fa";
import { onAuthStateChanged } from "firebase/auth";

import { GetUserID } from "./getID";

export default function Home() {
  const ID = Math.floor(10000000 + Math.random() * 90000000).toString();
  
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [popularSets, setPopularSets] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [userSets, setUserSets] = useState([]);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [user, setUser] = useState(null);

  const learningQuotes = [
    {
      text: "Education is the most powerful weapon which you can use to change the world.",
      author: "Nelson Mandela"
    },
    {
      text: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
      author: "Mahatma Gandhi"
    },
    {
      text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
      author: "Dr. Seuss"
    },
    {
      text: "Education is not the learning of facts, but the training of the mind to think.",
      author: "Albert Einstein"
    },
    {
      text: "Learning is not attained by chance, it must be sought for with ardor and attended to with diligence.",
      author: "Abigail Adams"
    },
    {
      text: "The beautiful thing about learning is that nobody can take it away from you.",
      author: "B.B. King"
    },
    {
      text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
      author: "Malcolm X"
    },
    {
      text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
      author: "Brian Herbert"
    }
  ];

  useEffect(() => {
    // Set up quote rotation interval
    const quoteInterval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => 
        prevIndex === learningQuotes.length - 1 ? 0 : prevIndex + 1
      );
    }, 8000);

    const fetchSets = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "sets"));
        const sets = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        // Only show public sets in popular sets
        const publicSets = sets.filter(set => set.isPublic);
        setPopularSets(publicSets);

        if (typeof window !== "undefined") {
          const storedUserSets = JSON.parse(localStorage.getItem("userSets")) || [];
          setUserSets(storedUserSets);
        }
      } catch (error) {
        console.error("Error fetching sets: ", error);
      }
    };

    fetchSets();

    if (typeof window !== "undefined") {
      const storedSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];
      setRecentSearches(storedSearches);
    }

    return () => clearInterval(quoteInterval);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedUserSets = JSON.parse(localStorage.getItem("userSets")) || [];
      setUserSets(storedUserSets);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const addToRecentSearches = (set) => {
    setRecentSearches((prevSearches) => {
      const updatedSearches = prevSearches.filter((s) => s.id !== set.id);
      const newSearches = [set, ...updatedSearches].slice(0, 5);
      localStorage.setItem("recentSearches", JSON.stringify(newSearches));
      return newSearches;
    });
  };

  const navigateTo = (path, set) => {
    if (set) addToRecentSearches(set);
    router.push(path);
  };

  const handleEditSet = (set) => {
    if (!user) {
      // If user is not logged in, redirect to sign in
      router.push('/signup');
      return;
    }
    
    if (set.userId !== user.uid) {
      // If user is not the creator, show error
      alert("You can only edit sets that you created.");
      return;
    }
    
    router.push(`/edit-set/${set.id}`);
  };

  const filteredSets = popularSets.filter((set) =>
    set.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FFFFFF] to-[#FFF5E6] flex flex-col items-center">
      {/* Navigation Bar */}
      <nav className="bg-gradient-to-r from-[#8B0000] to-[#600000] shadow-lg w-full px-10 py-8 flex justify-center">
        <div className="max-w-screen-xl w-full px-1 text-center">
          <h1 className="text-6xl font-bold text-[#F3B13B] mb-4">
            Welcome to FalconSphere!
          </h1>
          <div className="text-[#F3B13B] text-xl min-h-[80px] flex flex-col items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="flex items-center">
                <FaQuoteLeft className="mr-2 opacity-50" />
                <p className="italic">{learningQuotes[currentQuoteIndex].text}</p>
              </div>
              <p className="text-sm mt-2 opacity-80">
                - {learningQuotes[currentQuoteIndex].author}
              </p>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-center my-16">
        <div className="flex flex-wrap justify-center gap-8">
          {[
            { label: "Create Your First Set", path: "/create-set", icon: FaEdit },
            { label: "New Game", path: `/dynamic-page/new-test/${ID}`, icon: FaGamepad },
            { label: "Join A Game", path: "/join-game", icon: FaUsers },
            { label: "Peer Help", path: "/feedview", icon: FaLightbulb }
          ].map(({ label, path, icon: Icon }) => (
            <button
              key={`nav-button-${path}`}
              onClick={() => navigateTo(path)}
              className="bg-gradient-to-br from-[#8B0000] to-[#600000] text-[#F3B13B] px-12 py-8 rounded-xl font-semibold 
              hover:from-[#F3B13B] hover:to-[#FFD700] hover:text-[#8B0000] transition-all duration-300 shadow-lg
              flex flex-col items-center gap-2"
            >
              <Icon className="text-4xl" />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Study Sets Grid */}
      <section className="container mx-auto px-6 mb-16 w-full">
        <h2 className="text-3xl font-bold text-[#8B0000] text-center mb-8">
          Tutor Made Study Sets
        </h2>
        
        <div className="mb-8 text-center">
          <div className="max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search Popular Sets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white text-[#8B0000] border-2 border-[#8B0000] rounded-xl py-3 px-6 
              focus:outline-none focus:border-[#F3B13B] focus:ring-2 focus:ring-[#F3B13B] transition-all
              placeholder-[#8B0000]/50 text-lg"
            />
          </div>
        </div>

        <div className="mb-12 text-center">
          <h3 className="text-2xl font-bold text-[#8B0000] mb-6">
            Recent Searches
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {recentSearches.map((set) => (
              <button
                key={`recent-${set.id}`}
                onClick={() => navigateTo(`/study-set/${set.id}`, set)}
                className="bg-gradient-to-r from-[#8B0000] to-[#600000] text-[#F3B13B] px-6 py-3 rounded-xl font-semibold 
                hover:from-[#F3B13B] hover:to-[#FFD700] hover:text-[#8B0000] transition-all duration-300 shadow-md"
              >
                {set.title}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
          {filteredSets.length ? (
            filteredSets.map((set) => (
              <div
                key={`popular-${set.id}`}
                className="bg-gradient-to-br from-[#600000] to-[#500000] rounded-xl shadow-xl p-8 
                hover:shadow-2xl transition-all duration-300 border border-[#F3B13B]/10"
              >
                <h3 className="text-2xl font-semibold text-[#F3B13B] mb-4">
                  {set.title}
                </h3>
                <p className="text-[#F3B13B]/90 mb-6 text-lg">
                  A collection of flashcards for mastering your subject.
                </p>
                <button
                  onClick={() => navigateTo(`/study-set/${set.id}`, set)}
                  className="w-full bg-gradient-to-r from-[#8B0000] to-[#600000] text-[#F3B13B] px-6 py-3 
                  rounded-xl font-semibold hover:from-[#F3B13B] hover:to-[#FFD700] hover:text-[#8B0000] 
                  transition-all duration-300 shadow-md"
                >
                  View Set
                </button>
              </div>
            ))
          ) : (
            <p className="font-bold text-[#8B0000] text-center text-xl">
              No study sets found.
            </p>
          )}
        </div>
      </section>

      {/* User's Recent Sets Section */}
      <section className="container mx-auto px-6 mb-16 w-full">
        <h2 className="text-3xl font-bold text-[#8B0000] text-center mb-8">
          Sets You've Created
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
          {userSets.length ? (
            userSets.map((set) => (
              <div
                key={`user-${set.id}`}
                className="bg-gradient-to-br from-[#600000] to-[#500000] rounded-xl shadow-xl p-8 
                hover:shadow-2xl transition-all duration-300 border border-[#F3B13B]/10"
              >
                <h3 className="text-2xl font-semibold text-[#F3B13B] mb-4">
                  {set.title}
                </h3>
                <p className="text-[#F3B13B]/90 mb-6 text-lg">
                  A collection of flashcards for mastering your subject.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => navigateTo(`/study-set/${set.id}`, set)}
                    className="flex-1 bg-gradient-to-r from-[#8B0000] to-[#600000] text-[#F3B13B] px-6 py-3 
                    rounded-xl font-semibold hover:from-[#F3B13B] hover:to-[#FFD700] hover:text-[#8B0000] 
                    transition-all duration-300 shadow-md"
                  >
                    View Set
                  </button>
                  {user && set.userId === user.uid && (
                    <button
                      onClick={() => handleEditSet(set)}
                      className="flex-1 bg-gradient-to-r from-[#8B0000] to-[#600000] text-[#F3B13B] px-6 py-3 
                      rounded-xl font-semibold hover:from-[#F3B13B] hover:to-[#FFD700] hover:text-[#8B0000] 
                      transition-all duration-300 shadow-md"
                    >
                      Edit Set
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="font-bold text-[#8B0000] text-center text-xl">
              None of your sets were found.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}