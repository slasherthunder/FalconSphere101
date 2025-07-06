'use client';

import { useState } from 'react';
import { addToAIData } from '../../../AI-Functions';



export default function OllamaChatPage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');

    const res = await fetch('/api/ollama', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();
    setResponse(data.response || 'No response.');
    setLoading(false);
  };




  const updateFireBase = async () => {
    try {
      const obj = {
        questions: [
          "Solve for x in the equation 2x + 4 = 12",
          "Simplify using distributive property: -3(2y - 7)",
          "Graph on number line the inequality y > 5",
          "Find all values of a that satisfy |a| < 9",
          "Write standard form Ax + By = C for the equation given by slope-intercept form y = (1/2)x - 3"
        ],
        answers: [
          "x = 4",
          "-6y + 21", 
          "[All values greater than 5 on a number line]", 
          "-9 < a < 9", 
          "x - 2y = -6"
        ],
        reasoning: [
          "Subtract 4 from both sides, then divide by 2 to solve for x.",
          "Distribute the negative sign inside parentheses and simplify.",
          "The inequality is already solved; graphing it shows all values greater than but not including 5 as part of its solution set on a number line (open circle at y=5).",
          "Take absolute value into account, this means finding an interval.",
          "Rearrange to standard form by moving x and y terms."
        ]
      };
      const id = await addToAIData(obj);
      alert(`Document added with ID: ${id}`);
    } catch (error) {
      alert('Failed to add document.');
    }
  };




  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h1>Chat with phi4-mini</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          rows="4"
          style={{ width: '100%', padding: '10px', fontSize: '16px' }}
          placeholder="Enter a prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
        />
        <button
          onClick={updateFireBase}
          type="submit"
          disabled={loading}
          style={{ marginTop: '10px', padding: '10px 20px', fontSize: '16px' }}
        >
          {loading ? 'Generating...' : 'Submit'}
        </button>
      </form>

      {response && (
        <div style={{ marginTop: '30px', whiteSpace: 'pre-wrap' }}>
          <h3>Response:</h3>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}
