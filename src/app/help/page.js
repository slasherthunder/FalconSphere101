"use client";
import { useState } from "react";

export default function Help() {
  const faqs = [
    { 
      category: "Account", 
      questions: [
        { question: "How do I reset my password?", answer: "Go to settings and click on 'Reset Password' to receive an email with instructions." },
        { question: "How do I update my email address?", answer: "You can update your email address in the 'Account Settings' section." }
      ]
    },
    { 
      category: "Support", 
      questions: [
        { question: "How can I contact support?", answer: "You can reach out via our support page or email us at tphs.acdc@gmail.com." },
        { question: "What are your support hours?", answer: "Our support team is available 24/7." }
      ]
    },
    { 
      category: "Legal", 
      questions: [
        { question: "Where can I find the terms of service?", answer: "The terms of service can be found at the bottom of the homepage." },
        { question: "How do I request a refund?", answer: "Refund requests can be submitted through the 'Billing' section of your account." }
      ]
    }
  ];

  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredFAQs = faqs
    .filter(category => 
      selectedCategory ? category.category === selectedCategory : true
    )
    .map(category => ({
      ...category,
      questions: category.questions.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }))
    .filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-[#8B0000] py-8 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header Section */}
        <h1 className="text-4xl font-extrabold text-[#FFD700] mb-8 text-center">Help Center</h1>
        <p className="text-[#FFD700] mb-8 text-center">
          Find answers to common questions or contact us for further assistance.
        </p>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#600000] text-[#FFD700] placeholder-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
          />
        </div>

        {/* Category Filters */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-3 rounded-lg ${
              selectedCategory === null ? "bg-[#FFD700] text-[#8B0000]" : "bg-[#600000] text-[#FFD700]"
            } hover:bg-[#FFC107] transition duration-300`}
          >
            All
          </button>
          {faqs.map((category, index) => (
            <button
              key={index}
              onClick={() => setSelectedCategory(category.category)}
              className={`px-6 py-3 rounded-lg ${
                selectedCategory === category.category ? "bg-[#FFD700] text-[#8B0000]" : "bg-[#600000] text-[#FFD700]"
              } hover:bg-[#FFC107] transition duration-300`}
            >
              {category.category}
            </button>
          ))}
        </div>
        {/* FAQ Section */}
<div className="space-y-12">
  {filteredFAQs.map((category, catIndex) => (
    <div key={catIndex}>
      <h2 className="text-2xl font-bold text-[#FFD700] mb-6">{category.category}</h2>
      <div className="space-y-6">
        {category.questions.map((faq, index) => (
          <div key={index} className="bg-[#600000] p-6 rounded-lg shadow-md transition-all duration-300">
            <button
              className="flex justify-between items-center w-full text-[#FFD700] font-medium text-lg"
              onClick={() => toggleFAQ(`${catIndex}-${index}`)}
            >
              {faq.question}
              <span className="text-xl">{openIndex === `${catIndex}-${index}` ? "▲" : "▼"}</span>
            </button>
            <div
              className={`overflow-hidden transition-max-height duration-300 ${
                openIndex === `${catIndex}-${index}` ? "max-h-40 mt-4" : "max-h-0"
              }`}
            >
              <p className="text-[#FFD700] mt-4">{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>

        {/* Contact Support Section */}
        <div className="mt-12 text-center">
          <p className="text-[#FFD700] mb-6">Still need help? Reach out to us.</p>
          
          <div className="flex justify-center space-x-5">
            {/* Email Support Button */}
            <a href="mailto:tphs.acdc@gmail.com?subject=Help Request">
              <button className="bg-[#FFD700] text-[#8B0000] font-bold px-8 py-3 rounded-lg hover:bg-[#FFC107] transition duration-300">
                Email Support
              </button>
            </a>

            {/* Live Chat Button */}
            <button
              className="bg-[#FFD700] text-[#8B0000] font-bold px-8 py-3 rounded-lg hover:bg-[#FFC107] transition duration-300"
              onClick={() => alert("Live chat feature coming soon!")}
            >
              Live Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
