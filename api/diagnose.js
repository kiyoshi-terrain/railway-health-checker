export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONSリクエストへの対応（プリフライト）
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { text, apiKey } = req.body;
  
  if (!text || !apiKey) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: `あなたは鉄道土構造物の維持管理の専門家です。JRの維持管理標準に基づいて健全度を評価してください。

健全度の判定基準：
- S（健全）：変状がないか、あっても軽微で進行性なし
- C（軽微な変状）：軽微な変状があるが、線路への影響は小さい
- B（要注意）：変状があり、今後の進行を注視する必要がある
- A（要対策）：変状が進行しており、対策の検討が必要
- AA（緊急対策必要）：緊急に対策が必要な状態

以下の観点で評価してください：
1. 変状の種類と程度
2. 進行性の有無
3. 線路への影響度
4. 安全性への影響

簡潔に健全度とその理由を回答してください。`
        }, {
          role: 'user',
          content: text
        }],
        temperature: 0.7,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData.error || 'OpenAI API error' });
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('AI診断エラー:', error);
    res.status(500).json({ error: error.message });
  }
}
