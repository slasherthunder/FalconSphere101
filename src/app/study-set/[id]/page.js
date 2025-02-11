"use client";
import { useParams } from "next/navigation";

export default function StudySet() {
  const { id } = useParams(); // Correct way for App Router

  return (
    <div className="min-h-screen bg-[#8B0000] py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-[#FFD700] mb-4">Study Set {id}</h1>
        <p className="text-[#FFD700] mb-6">This is the detail page for Study Set {id}.</p>
        <div className="bg-[#600000] p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-[#FFD700] mb-4">Flashcards in This Set</h2>
          <ul className="space-y-4">
            {[1, 2, 3].map((card) => (
              <li key={card} className="bg-[#8B0000] p-4 rounded-lg">
                <p className="text-[#FFD700]">Flashcard {card}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
