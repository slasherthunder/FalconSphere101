"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function CourseBrowser() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const courses = [
    { title: "AP Physics 1", tags: ["Science", "AP"], code: "R1937" },
    { title: "AP Chemistry", tags: ["Science", "AP"], code: "C2041" },
    { title: "World History", tags: ["History"], code: "W1123" },
    { title: "AP Biology", tags: ["Science", "AP"], code: "B3817" },
    { title: "Calculus AB", tags: ["Math", "AP"], code: "M2911" },
    { title: "US Government", tags: ["Civics"], code: "G5832" },
    // Add more here
  ];

  const normalize = (str) =>
    str.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/gi, "");

  const filteredCourses = courses.filter((course) => {
    const query = searchQuery.toLowerCase();
    return (
      course.title.toLowerCase().includes(query) ||
      course.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      course.code.toLowerCase().includes(query)
    );
  });

  const handleExplore = (title) => {
    const urlSlug = title.replace(/\s+/g, "-");
    router.push(`/course/${urlSlug}`);
  };

  return (
    <div className="min-h-screen w-full bg-white py-12 px-6">
      {/* Search Bar */}
      <div className="max-w-4xl mx-auto mb-12">
        <input
          type="text"
          placeholder="Advanced Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-4 rounded-xl border-2 border-[#8B0000] shadow focus:ring-2 focus:ring-[#FFD700] focus:outline-none text-xl"
        />
      </div>

      {/* Grid of Course Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCourses.map((course, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            className="border-2 border-[#8B0000] rounded-xl p-6 bg-[#8B0000] shadow-xl hover:shadow-2xl transition-all text-white flex flex-col justify-between"
          >
            <div>
              <h3 className="text-2xl font-bold text-[#FFD700] mb-2">{course.title}</h3>
              <p className="text-[#FFD700]">{course.tags.join(", ")}</p>
              <p className="text-[#FFD700] mb-4">{course.code}</p>
            </div>
            <button
              onClick={() => handleExplore(course.title)}
              className="mt-4 self-start px-4 py-2 bg-[#FFD700] text-[#8B0000] rounded-lg font-semibold shadow hover:bg-[#FFC300] transition-all"
            >
              Explore
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
