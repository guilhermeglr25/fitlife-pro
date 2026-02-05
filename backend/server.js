// ============================================
// FITLIFE PRO - BACKEND CORRIGIDO
// ============================================

// Suporte para Node.js < 18 (usar node-fetch)
let fetch;
if (typeof globalThis.fetch === 'undefined') {
  console.log('⚠️  Node < 18 detectado, usando node-fetch');
  fetch = require('node-fetch');
} else {
  fetch = globalThis.fetch;
}

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Middleware de log
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// Rota de teste
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'FitLife Pro Backend funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota de teste da API key
app.get('/api/test', async (req, res) => {
  try {
    if (!process.env.CLAUDE_API_KEY) {
      return res.status(500).json({
        error: 'API key não configurada',
        help: 'Configure CLAUDE_API_KEY no arquivo .env'
      });
    }

    console.log('🔑 Testando API key...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Teste' }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao testar API:', response.status, errorText);
      return res.status(response.status).json({
        error: 'API key inválida ou erro na API Claude',
        status: response.status,
        details: errorText
      });
    }

    console.log('✅ API key válida!');
    res.json({ 
      status: 'ok', 
      message: 'API key configurada corretamente!' 
    });

  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
    res.status(500).json({ 
      error: 'Erro ao testar API key',
      details: error.message 
    });
  }
});

// Rota principal do chat
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, userData } = req.body;

    // Validações
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ 
        error: 'Mensagens inválidas' 
      });
    }

    if (!process.env.CLAUDE_API_KEY) {
      return res.status(500).json({
        error: 'API key não configurada no servidor',
        help: 'Configure CLAUDE_API_KEY no arquivo .env'
      });
    }

    console.log('💬 Nova mensagem:', messages[messages.length - 1].content.substring(0, 50) + '...');
    console.log('👤 Usuário:', userData?.name || 'Desconhecido');

    // Montar prompt personalizado
    const userContext = userData ? `
CONTEXTO DO USUÁRIO:
- Nome: ${userData.name || 'Usuário'}
- Idade: ${userData.age || 'N/A'} anos
- Peso atual: ${userData.currentWeight || 'N/A'}kg
- Peso meta: ${userData.goalWeight || 'N/A'}kg
- Objetivo: ${userData.goal || 'N/A'}
- Nível de atividade: ${userData.activityLevel || 'N/A'}
` : '';

    const systemPrompt = `Você é um coach fitness expert e nutricionista certificado do FitLife Pro.

${userContext}

INSTRUÇÕES:
- Seja MUITO motivador, empático e inspirador
- Dê conselhos práticos e personalizados baseados no perfil do usuário
- Use emojis para deixar mais amigável e humano
- Mantenha respostas entre 150-250 palavras
- Seja específico e forneça passos acionáveis
- Celebre conquistas e progresso
- Forneça dicas de treino E nutrição quando relevante
- Use dados do contexto para personalizar ao máximo

Responda de forma natural e conversacional, como um amigo que é expert em fitness.`;

    const userMessage = messages[messages.length - 1].content;

    console.log('🚀 Enviando para Claude API...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\nPergunta do usuário: ${userMessage}`
          }
        ],
        temperature: 0.8
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro da API Claude:', response.status);
      console.error('Detalhes:', errorText);
      
      // Erros específicos
      if (response.status === 401) {
        return res.status(401).json({
          error: 'API key inválida ou expirada',
          help: 'Verifique sua API key no arquivo .env'
        });
      }
      
      if (response.status === 429) {
        return res.status(429).json({
          error: 'Muitas requisições. Aguarde alguns segundos.',
          help: 'Claude API tem limite de requisições por minuto'
        });
      }

      throw new Error(`Claude API erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Resposta recebida do Claude!');
    console.log('📊 Tokens usados:', data.usage?.input_tokens + data.usage?.output_tokens);
    
    res.json(data);

  } catch (error) {
    console.error('❌ Erro no servidor:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Erro ao processar requisição',
      details: error.message,
      help: 'Verifique os logs do servidor para mais detalhes'
    });
  }
});

// Tratamento de rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.path 
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log(`   FITLIFE PRO BACKEND`);
  console.log('========================================');
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔑 API Key: ${process.env.CLAUDE_API_KEY ? '✅ Configurada' : '❌ NÃO configurada'}`);
  console.log(`📦 Node.js: ${process.version}`);
  console.log(`🌐 Fetch: ${typeof fetch === 'function' ? '✅ Disponível' : '❌ Não disponível'}`);
  console.log('\n📚 Endpoints disponíveis:');
  console.log('   GET  / - Status do servidor');
  console.log('   GET  /api/test - Testar API key');
  console.log('   POST /api/chat - Chat com IA');
  console.log('\n✅ Servidor pronto! Aguardando requisições...');
  console.log('========================================\n');
  
  // Teste automático da API key ao iniciar
  if (process.env.CLAUDE_API_KEY && process.env.CLAUDE_API_KEY !== 'SUA_API_KEY_AQUI') {
    console.log('🔍 Testando API key automaticamente...\n');
    fetch(`http://localhost:${PORT}/api/test`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') {
          console.log('✅ API key validada com sucesso!\n');
        } else {
          console.log('⚠️  Problema com API key:', data.error, '\n');
        }
      })
      .catch(err => console.log('⚠️  Não foi possível testar API key:', err.message, '\n'));
  } else {
    console.log('⚠️  API key não configurada! Configure no arquivo .env\n');
  }
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
});