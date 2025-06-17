import { Ollama } from 'ollama';

const ollama = new Ollama();

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    console.log('📥 Received prompt:', prompt);

    const result = await ollama.generate({
      model: 'IM1',
      prompt,
      stream: false,
    });

    console.log('✅ Response from model:', result.response);
    return Response.json({ response: result.response });
  } catch (err) {
    console.error('❌ Error talking to Ollama:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
