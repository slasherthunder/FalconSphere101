'use client';

import { useState , useEffect} from 'react';
import { addToAIData } from '../../../AI-Functions';
import { update } from 'firebase/database';



export default function OllamaChatPage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionsList, setQuestionsList] = useState([])
  const [answersList, setAnswersList] = useState([])
  const [explainationList, setExplanationList] = useState([])
  const [problemData, setProblemData] = useState({})


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');

    const updatedQuestions = [...questionsList];
    const updatedAnswers = [...answersList];
    const updatedExplanations = [...explainationList];


    for (let i = 1; i < 4; i++){
      let res = await fetch('/api/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'question: Module ' + i }),
      });
  
      let data = await res.json();
      setResponse(data.response || 'No response.');

      const question = data.response

      updatedQuestions.push(question)



       res = await fetch('/api/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'answer: ' + question }),
      });
  
      data = await res.json();
      setResponse(data.response || 'No response.');

      const answer = data.response
      updatedAnswers.push(answer)

      res = await fetch('/api/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'explain: ' + question }),
        
      });

  
      data = await res.json();
      setResponse(data.response || 'No response.');


      const explanation = data.response
      updatedExplanations.push(explanation)

    };

    setQuestionsList(updatedQuestions)
    setAnswersList(updatedAnswers)
    setExplanationList(updatedExplanations)


    setLoading(false);
    setProblemData(
      {
        questions: updatedQuestions,
        answers: updatedAnswers,
        explanations: updatedExplanations
      }
    )

    // updateFireBase()
  };

  useEffect(() => {
    console.log('Updated items:', problemData);
    updateFireBase()
  }, [problemData]); // dependency array: triggers when 'items' changes



  const updateFireBase = async () => {

      const id = await addToAIData({item: problemData});
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
