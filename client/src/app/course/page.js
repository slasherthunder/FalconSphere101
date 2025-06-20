'use client';

import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaBook, FaGraduationCap, FaLightbulb } from 'react-icons/fa';

const CoursePage = () => {
    const [expandedUnits, setExpandedUnits] = useState({});
    const [selectedUnits, setSelectedUnits] = useState({
        1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true
    });
    const [difficulties, setDifficulties] = useState({});
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [selectedTools, setSelectedTools] = useState({
        studyGuide: false,
        practiceQuestions: false,
        practiceTest: false,
        studySet: false
    });
    const [isGenerating, setIsGenerating] = useState(false);

    // Sample course data - replace with actual data
    const courseData = {
        name: "AP Physics 1",
        description: "This course provides a comprehensive introduction to physics concepts including mechanics, waves, and electricity. Students will develop critical thinking skills through hands-on laboratory work and mathematical analysis of physical phenomena.",
        units: [
            {
                id: 1,
                name: "Kinematics",
                description: "This unit covers motion in one and two dimensions, including displacement, velocity, acceleration, and the fundamental equations of motion."
            },
            {
                id: 2,
                name: "Dynamics",
                description: "This unit explores forces, Newton's laws of motion, and their applications to real-world scenarios and problem-solving."
            },
            {
                id: 3,
                name: "Circular Motion and Gravitation",
                description: "This unit examines uniform circular motion, centripetal forces, and gravitational interactions between objects."
            },
            {
                id: 4,
                name: "Energy",
                description: "This unit covers work, kinetic energy, potential energy, and the conservation of energy principle."
            },
            {
                id: 5,
                name: "Momentum",
                description: "This unit explores linear momentum, impulse, and the conservation of momentum in collisions."
            },
            {
                id: 6,
                name: "Simple Harmonic Motion",
                description: "This unit covers oscillatory motion, including springs and pendulums, and their mathematical descriptions."
            },
            {
                id: 7,
                name: "Torque and Rotational Motion",
                description: "This unit examines rotational kinematics, torque, and angular momentum in rotating systems."
            },
            {
                id: 8,
                name: "Electric Charge and Electric Force",
                description: "This unit covers electric charge, Coulomb's law, and electric fields and their applications."
            }
        ]
    };

    const toggleUnitExpansion = (unitId) => {
        setExpandedUnits(prev => ({
            ...prev,
            [unitId]: !prev[unitId]
        }));
    };

    const toggleUnitSelection = (unitId) => {
        setSelectedUnits(prev => ({
            ...prev,
            [unitId]: !prev[unitId]
        }));
    };

    const handleDifficultyChange = (unitId, difficulty) => {
        setDifficulties(prev => ({
            ...prev,
            [unitId]: difficulty
        }));
    };

    const toggleToolSelection = (tool) => {
        setSelectedTools(prev => ({
            ...prev,
            [tool]: !prev[tool]
        }));
    };

    const handleGenerate = () => {
        const hasSelectedTools = Object.values(selectedTools).some(tool => tool);
        if (!hasSelectedTools) {
            return;
        }
        setIsGenerating(true);
        // Simulate generation process
        setTimeout(() => {
            setIsGenerating(false);
            setShowGenerateModal(false);
            // Reset selections
            setSelectedTools({
                studyGuide: false,
                practiceQuestions: false,
                practiceTest: false,
                studySet: false
            });
        }, 3000);
    };

    const hasSelectedTools = Object.values(selectedTools).some(tool => tool);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10">
            <div className="container mx-auto px-5 max-w-5xl">
                {/* Main Cardinal Red Square Container */}
                <div className="bg-gradient-to-br from-[#8B0000] to-[#A52A2A] rounded-2xl shadow-2xl p-10 border border-[#F3B13B]/20">
                    {/* Course Header with Icon */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-[#F3B13B] rounded-full mb-6 shadow-lg">
                            <FaBook className="text-4xl text-[#8B0000]" />
                        </div>
                        <h1 className="text-6xl font-bold text-[#F3B13B] mb-4 drop-shadow-lg">
                            {courseData.name}
                        </h1>
                        <div className="w-28 h-1.5 bg-[#F3B13B] mx-auto rounded-full"></div>
                    </div>

                    {/* Description Section */}
                    <div className="mb-12 bg-[#600000]/50 rounded-xl p-8 border border-[#F3B13B]/20">
                        <div className="flex items-center justify-center mb-4">
                            <FaLightbulb className="text-[#F3B13B] text-3xl mr-3" />
                            <h2 className="text-4xl font-semibold text-[#F3B13B]">
                                Description
                            </h2>
                        </div>
                        <p className="text-[#F3B13B] text-xl leading-relaxed text-center max-w-4xl mx-auto">
                            {courseData.description}
                        </p>
                    </div>

                    {/* Units Section */}
                    <div className="mb-8">
                        <div className="flex items-center justify-center mb-10">
                            <FaGraduationCap className="text-[#F3B13B] text-4xl mr-4" />
                            <h2 className="text-5xl font-bold text-[#F3B13B]">
                                Course Units
                            </h2>
                        </div>
                        
                        {/* Unit Boxes */}
                        <div className="space-y-6">
                            {courseData.units.map((unit, index) => {
                                const isSelected = selectedUnits[unit.id];
                                return (
                                    <div 
                                        key={unit.id} 
                                        className={`bg-gradient-to-r from-[#8B0000] to-[#A52A2A] rounded-xl shadow-xl overflow-hidden border border-[#F3B13B]/30 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] ${isSelected ? 'ring-4 ring-[#FFD700]/40' : ''}`}
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        {/* Main Unit Box */}
                                        <div className="p-6 flex items-center justify-between bg-gradient-to-r from-[#8B0000]/80 to-[#A52A2A]/80">
                                            <label
                                                htmlFor={`unit-checkbox-${unit.id}`}
                                                className="flex items-center space-x-6 cursor-pointer select-none w-full"
                                            >
                                                <input
                                                    id={`unit-checkbox-${unit.id}`}
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleUnitSelection(unit.id)}
                                                    className="w-8 h-8 text-[#8B0000] border-2 border-[#F3B13B] rounded-md focus:ring-2 focus:ring-[#F3B13B] focus:ring-offset-2 focus:ring-offset-[#8B0000] transition-all duration-200 bg-[#F3B13B] checked:bg-[#FFD700] checked:border-[#FFD700] mr-4"
                                                />
                                                <span className="text-2xl font-bold text-[#F3B13B]">
                                                    Unit {unit.id}: {unit.name}
                                                </span>
                                                <div className="w-20 h-0.5 bg-[#F3B13B] mt-2 rounded-full"></div>
                                            </label>
                                            <button
                                                onClick={() => toggleUnitExpansion(unit.id)}
                                                className="text-[#F3B13B] hover:text-[#FFD700] transition-all duration-300 transform hover:scale-110 p-2 rounded-full hover:bg-[#F3B13B]/10 ml-4"
                                                aria-label={expandedUnits[unit.id] ? `Collapse Unit ${unit.id}` : `Expand Unit ${unit.id}`}
                                            >
                                                {expandedUnits[unit.id] ? (
                                                    <FaChevronUp className="w-6 h-6" />
                                                ) : (
                                                    <FaChevronDown className="w-6 h-6" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Expanded Content: Only What is Covered */}
                                        {expandedUnits[unit.id] && (
                                            <div className="border-t border-[#F3B13B]/20 p-8 bg-gradient-to-br from-[#600000] to-[#8B0000]">
                                                <div className="max-w-4xl mx-auto">
                                                    <div className="bg-[#8B0000]/50 rounded-xl p-6 border border-[#F3B13B]/20">
                                                        <h3 className="text-3xl font-bold text-[#F3B13B] mb-4 flex items-center">
                                                            <FaLightbulb className="mr-3 text-[#F3B13B]" />
                                                            What Is Covered?
                                                        </h3>
                                                        <p className="text-[#F3B13B]/95 text-xl leading-relaxed">
                                                            {unit.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Difficulty and Generate Section (outside units) */}
                        <div className="mt-12 text-center">
                            <h4 className="text-3xl font-bold text-[#F3B13B] mb-6">
                                Choose Your Difficulty Level
                            </h4>
                            <div className="max-w-md mx-auto mb-6">
                                <select
                                    value={difficulties['main'] || ''}
                                    onChange={e => handleDifficultyChange('main', e.target.value)}
                                    className="w-full p-4 border-2 border-[#F3B13B] rounded-xl focus:ring-4 focus:ring-[#F3B13B]/30 focus:border-[#F3B13B] bg-[#8B0000] text-[#F3B13B] text-lg font-medium shadow-lg"
                                >
                                    <option value="">Select difficulty...</option>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                            <div className="bg-[#8B0000]/50 rounded-xl p-4 border border-[#F3B13B]/20 mb-8">
                                <p className="text-[#F3B13B]/90 text-base leading-relaxed">
                                    <span className="font-semibold">Note:</span> Medium models the typical rigor based on the district curriculum, and is best used for review. It is recommended to start there, scale down to Easy if you need a refresher, or up it to Hard for more practice and solidify the skills.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowGenerateModal(true)}
                                className="bg-gradient-to-r from-[#F3B13B] to-[#FFD700] text-[#8B0000] px-10 py-4 rounded-xl hover:from-[#FFD700] hover:to-[#F3B13B] transition-all duration-300 font-bold text-xl shadow-lg transform hover:scale-105"
                            >
                                Generate Studying Tools
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Generate Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-10 max-w-xl w-full mx-5 shadow-2xl border border-gray-200">
                        {!isGenerating ? (
                            <>
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center w-20 h-20 bg-[#8B0000] rounded-full mb-4">
                                        <FaBook className="text-3xl text-[#F3B13B]" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-gray-800 mb-2">
                                        Generate Study Materials
                                    </h3>
                                    <p className="text-lg text-gray-600">Select all that apply</p>
                                </div>
                                
                                <div className="space-y-4 mb-8">
                                    {[
                                        { key: 'studyGuide', label: 'Study Guide', icon: '📚' },
                                        { key: 'practiceQuestions', label: 'Practice Questions (with answers)', icon: '❓' },
                                        { key: 'practiceTest', label: 'Practice Test', icon: '📝' },
                                        { key: 'studySet', label: 'Study Set (Flash Cards)', icon: '🃏' }
                                    ].map(({ key, label, icon }) => (
                                        <label key={key} className="flex items-center space-x-4 p-4 rounded-xl border-2 border-gray-200 hover:border-[#8B0000] transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedTools[key]}
                                                onChange={() => toggleToolSelection(key)}
                                                className="w-6 h-6 text-[#8B0000] border-2 border-gray-300 rounded-md focus:ring-[#8B0000]"
                                            />
                                            <span className="text-3xl">{icon}</span>
                                            <span className="text-lg text-gray-700 font-medium">{label}</span>
                                        </label>
                                    ))}
                                </div>
                                
                                {!hasSelectedTools && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                                        <p className="text-red-600 text-base font-medium">
                                            ⚠️ Select at least one item to generate
                                        </p>
                                    </div>
                                )}
                                
                                <div className="flex justify-end space-x-4">
                                    <button
                                        onClick={() => setShowGenerateModal(false)}
                                        className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={!hasSelectedTools}
                                        className="px-8 py-3 bg-gradient-to-r from-[#8B0000] to-[#A52A2A] text-white rounded-xl hover:from-[#A52A2A] hover:to-[#8B0000] transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <div className="inline-flex items-center justify-center w-24 h-24 bg-[#8B0000] rounded-full mb-6">
                                    <div className="animate-spin rounded-full h-14 w-14 border-4 border-[#F3B13B] border-t-transparent"></div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">Generating Your Materials</h3>
                                <p className="text-lg text-gray-600">This may take a few minutes...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoursePage; 
