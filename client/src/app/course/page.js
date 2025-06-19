'use client';

import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

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
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Main Cardinal Red Square Container */}
                <div className="bg-[#8B0000] rounded-lg shadow-xl p-8">
                    {/* Course Name */}
                    <h1 className="text-4xl font-bold text-[#F3B13B] text-center mb-8">
                        {courseData.name}
                    </h1>

                    {/* Description Section */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-[#F3B13B] text-center mb-4">
                            Description:
                        </h2>
                        <p className="text-[#F3B13B] text-lg leading-relaxed text-center">
                            {courseData.description}
                        </p>
                    </div>

                    {/* Units Section */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-[#F3B13B] text-center mb-6">
                            Units
                        </h2>
                        
                        {/* Unit Boxes */}
                        <div className="space-y-4">
                            {courseData.units.map((unit) => (
                                <div key={unit.id} className="bg-[#8B0000] rounded-lg shadow-md overflow-hidden border border-[#F3B13B]/20">
                                    {/* Main Unit Box */}
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedUnits[unit.id]}
                                                onChange={() => toggleUnitSelection(unit.id)}
                                                className="w-5 h-5 text-[#F3B13B] border-[#F3B13B] rounded focus:ring-[#F3B13B]"
                                            />
                                            <span className="text-lg font-medium text-[#F3B13B]">
                                                Unit {unit.id}: {unit.name}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => toggleUnitExpansion(unit.id)}
                                            className="text-[#F3B13B] hover:text-[#FFD700] transition-colors"
                                        >
                                            {expandedUnits[unit.id] ? (
                                                <FaChevronUp className="w-5 h-5" />
                                            ) : (
                                                <FaChevronDown className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Expanded Content */}
                                    {expandedUnits[unit.id] && (
                                        <div className="border-t border-[#F3B13B]/20 p-4 bg-[#600000]">
                                            <h3 className="text-lg font-semibold text-[#F3B13B] mb-3">
                                                What Is Covered?
                                            </h3>
                                            <p className="text-[#F3B13B]/90 mb-6">
                                                {unit.description}
                                            </p>
                                            
                                            <h4 className="text-lg font-semibold text-[#F3B13B] text-center mb-4">
                                                Choose your difficulty:
                                            </h4>
                                            
                                            <div className="max-w-xs mx-auto mb-4">
                                                <select
                                                    value={difficulties[unit.id] || ''}
                                                    onChange={(e) => handleDifficultyChange(unit.id, e.target.value)}
                                                    className="w-full p-3 border border-[#F3B13B] rounded-lg focus:ring-2 focus:ring-[#F3B13B] focus:border-[#F3B13B] bg-[#8B0000] text-[#F3B13B]"
                                                >
                                                    <option value="">Select difficulty...</option>
                                                    <option value="easy">Easy</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="hard">Hard</option>
                                                </select>
                                            </div>
                                            
                                            <p className="text-sm text-[#F3B13B]/80 text-center mb-4">
                                                Note: Medium models the typical rigor based on the district curriculum, and is best used for review. It is recommended to start there, scale down to Easy if you need a refresher, or up it to Hard for more practice and solidify the skills.
                                            </p>
                                            
                                            <div className="text-center">
                                                <button
                                                    onClick={() => setShowGenerateModal(true)}
                                                    className="bg-[#F3B13B] text-[#8B0000] px-6 py-3 rounded-lg hover:bg-[#FFD700] transition-colors font-medium"
                                                >
                                                    Generate Studying Tools
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Generate Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                        {!isGenerating ? (
                            <>
                                <h3 className="text-xl font-semibold text-gray-800 mb-6">
                                    What would you like to generate? (Select all that apply)
                                </h3>
                                
                                <div className="space-y-3 mb-6">
                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedTools.studyGuide}
                                            onChange={() => toggleToolSelection('studyGuide')}
                                            className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                        />
                                        <span className="text-gray-700">Study guide</span>
                                    </label>
                                    
                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedTools.practiceQuestions}
                                            onChange={() => toggleToolSelection('practiceQuestions')}
                                            className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                        />
                                        <span className="text-gray-700">Practice questions (with answers)</span>
                                    </label>
                                    
                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedTools.practiceTest}
                                            onChange={() => toggleToolSelection('practiceTest')}
                                            className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                        />
                                        <span className="text-gray-700">Practice test</span>
                                    </label>
                                    
                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedTools.studySet}
                                            onChange={() => toggleToolSelection('studySet')}
                                            className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                        />
                                        <span className="text-gray-700">Study set (flash cards)</span>
                                    </label>
                                </div>
                                
                                {!hasSelectedTools && (
                                    <p className="text-red-600 text-sm mb-4">
                                        Select at least one item to generate
                                    </p>
                                )}
                                
                                <div className="flex justify-end space-x-4">
                                    <button
                                        onClick={() => setShowGenerateModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={!hasSelectedTools}
                                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
                                <p className="text-gray-700">Generating, May take a few minutes</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoursePage; 
