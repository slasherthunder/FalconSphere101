"use client"; // Mark this as a Client Component

import { useRouter } from "next/navigation"; // Use next/navigation for App Router

export default function Home() {
  const router = useRouter();

  const navigateTo = (path) => {
    router.push(path);
  };

  return (
    <main className="min-h-screen bg-[#FFFFFF] flex flex-col items-center">
      {/* Navigation Bar */}
      <nav className="bg-[#8B0000] shadow-sm w-full px-100000000000 py-6 flex justify-center">
        <div className="max-w-screen-xl w-full px-1 text-center">
          <h1 className="text-5xl font-bold text-[#FFD700] mb-9">
            Welcome to FalconSphere!
          </h1>
          <p className="text-[#FFD700] text-lg">
            Become the academic weapon.
          </p>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-center my-12">
        <div className="flex flex-wrap justify-center gap-9">
          <button
            onClick={() => navigateTo("/create-set")}
            className="bg-[#FFD700] text-[#8B0000] px-10 py-6 rounded-lg font-semibold hover:bg-[#FFC700] transition-colors"
          >
            Create Your First Set
          </button>
          <button
            onClick={() => navigateTo("/new-game")}
            className="bg-[#FFD700] text-[#8B0000] px-10 py-6 rounded-lg font-semibold hover:bg-[#FFC700] transition-colors"
          >
            New Game
          </button>
          <button
            onClick={() => navigateTo("/join-game")}
            className="bg-[#FFD700] text-[#8B0000] px-10 py-6 rounded-lg font-semibold hover:bg-[#FFC700] transition-colors"
          >
            Join A Game
          </button>
        </div>
      </section>

      {/* Study Sets Grid */}
      <section className="container mx-auto px-6 mb-12 w-full">
        <h2 className="text-2xl font-bold text-[#FFD700] text-center mb-6">
          Popular Study Sets
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
          {[1, 2, 3, 4, 5, 6].map((set) => (
            <div
              key={set}
              className="bg-[#600000] rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold text-[#FFD700] mb-2">
                Study Set {set}
              </h3>
              <p className="text-gray-300 mb-4">
                A collection of flashcards for mastering your subject.
              </p>
              <button
                onClick={() => navigateTo(`/study-set/${set}`)}
                className="bg-[#FFD700] text-[#8B0000] px-4 py-2 rounded-md font-semibold hover:bg-[#FFC700] transition-colors"
              >
                View Set
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}