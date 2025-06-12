export default async function handler(request, response) {
  // Node.js形式に変更
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { text, apiKey } = request.body;
    
    if (!text || !apiKey) {
      return response.status(400).json({ error: 'Missing required parameters' });
    }
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: '鉄道土構造物の専門家として、変状・不安定性の情報から技術的な診断と対策を提案してください。'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });
    
    const data = await openaiResponse.json();
    return response.status(200).json(data);
    
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
