import Anthropic from '@anthropic-ai/sdk';
import { getStaticFile, throwIfMissing } from './utils.js';

export default async ({ req, res, log, error }) => {
  throwIfMissing(process.env, ['ANTHROPIC_API_KEY']);

  if (req.method === 'GET') {
    return res.text(getStaticFile('index.html'), 200, {
      'Content-Type': 'text/html; charset=utf-8',
    });
  }

  try {
    throwIfMissing(req.body, ['prompt']);
  } catch (err) {
    return res.json({ ok: false, error: err.message }, 400);
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    log(`Sending prompt to Claude: ${req.bodyJson.prompt}`);
    
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',  // Can override via env var
      max_tokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS ?? '1024'),
      system: req.bodyJson.system || 'You are Claude, a helpful AI assistant.',
      messages: [
        { 
          role: 'user', 
          content: req.bodyJson.prompt 
        }
      ],
    });
    
    const completion = response.content[0].text;
    log(`Claude responded with ${completion.length} characters`);
    
    return res.json({ ok: true, completion }, 200);
  } catch (err) {
    error('Failed to query Claude:', err.message);
    return res.json({ ok: false, error: 'Failed to query Claude.' }, 500);
  }
};
