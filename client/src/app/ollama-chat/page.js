'use client';

import { useState , useEffect} from 'react';
import { addToAIData } from '../../../AI-Functions';
import { update } from 'firebase/database';



export default function OllamaChatPage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionsList, setQuestionsList] = useState([])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');

    const updated = [...questionsList];


    for (let i = 1; i < 4; i++){
      let res = await fetch('/api/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'question: Module ' + i }),
      });
  
      let data = await res.json();
      setResponse(data.response || 'No response.');

      const tempResponse = data.response

      updated.push(tempResponse)



       res = await fetch('/api/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'answer: ' + tempResponse }),
      });
  
      data = await res.json();
      setResponse(data.response || 'No response.');

      res = await fetch('/api/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'explain: ' + tempResponse }),
      });
  
      data = await res.json();
      setResponse(data.response || 'No response.');




    };

    setQuestionsList(updated)


    setLoading(false);

    // updateFireBase()
  };

  useEffect(() => {
    console.log('Updated items:', questionsList);
    updateFireBase()
  }, [questionsList]); // dependency array: triggers when 'items' changes



  const updateFireBase = async () => {

      const id = await addToAIData({item: questionsList});
      alert(`Document added with ID: ${id}`);

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
          // onClick={updateFireBase}
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
