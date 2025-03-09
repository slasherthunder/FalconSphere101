"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";




export default function gameWait() {
    const [players, setPlayers] = useState(localStorage.getItem("Players"))
    const test = players.split(",");
    const test2 = players.split(",");
    const router = useRouter();
    test.splice(0, 1);

    useEffect(() => {
        const intervalId = setInterval(() => {
          setPlayers(localStorage.getItem("Players"))
        }, 1000);
    
        return () => clearInterval(intervalId);
      }, []);
      
      
      
      const handleLeave = () => {
     const positon = test.indexOf(sessionStorage.getItem("Name"))
     console.log(positon);
     console.log(test2);
     test2.splice(positon+1, 1);
     console.log(test2);
     localStorage.setItem("Players", test2);
     sessionStorage.setItem("Name", null);
     router.push(`/join-game`);


      }

    return (
        <main className="min-h-screen bg-[#FFFFFF] flex flex-col items-center">
          {/* Navigation Bar */}
          <nav className="bg-[#8B0000] shadow-sm w-full px-10 py-6 flex justify-center">
            <div className="max-w-screen-xl w-full px-1 text-center">
              <h1 className="text-5xl font-bold text-[#F3B13B] mb-4">
                Wait here until the game starts
              </h1>
              <p className="text-[#F3B13B] text-lg">
                code:
              </p>
            </div>
          </nav>
          <p style={{color: "black"}}>Players</p>
    


          {test.map((name, index) => (
                  <div
                    className="centered-element"
                    style={{ backgroundColor: 'lightblue',
                             width: 200 }}
                    key={index}
                  >
<p style={{ color: 'black' }}>{name}</p>
                    <span className="ml-3 text-[#FFD700] text-lg">
                    </span>
                  </div>
                ))}

                <button onClick = {handleLeave}>Leave Game</button>



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

            


    
           

        </main>
      );
    }
    
