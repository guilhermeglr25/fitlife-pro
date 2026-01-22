export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Filtra mensagens "system" e extrai o conteúdo como parâmetro system
    const systemMessages = messages.filter(m => m.role === 'system');
    const systemPrompt = systemMessages.length > 0 ? systemMessages[0].content : undefined;
    
    // Remove mensagens "system" do array
    const userMessages = messages.filter(m => m.role !== 'system');

    const requestBody = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: userMessages
    };

    // Adiciona system prompt se existir
    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API Error:', error);
      return res.status(response.status).json({ 
        error: 'Failed to get response from AI',
        details: error 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}