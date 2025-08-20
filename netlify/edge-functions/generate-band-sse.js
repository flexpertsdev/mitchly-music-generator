export default async (request, context) => {
  // Enable CORS
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  // Get prompt from query params or body
  const url = new URL(request.url);
  const prompt = url.searchParams.get('prompt') || 'A rock band';

  // Create a TransformStream for SSE
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Helper to send SSE events
  const sendEvent = async (data) => {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    await writer.write(encoder.encode(message));
  };

  // Start the streaming process
  (async () => {
    try {
      // Send initial progress
      await sendEvent({ 
        type: 'progress', 
        step: 'start', 
        message: '🎸 Initializing the creative process...', 
        progress: 5 
      });

      // Simulate API key check (in real implementation, get from Netlify env)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await sendEvent({ 
        type: 'progress', 
        step: 'analyzing', 
        message: '🤔 Analyzing your musical vision...', 
        progress: 10 
      });

      // Simulate band profile generation steps
      await new Promise(resolve => setTimeout(resolve, 1000));
      await sendEvent({ 
        type: 'progress', 
        step: 'band_identity', 
        message: '🎤 Creating unique band identity...', 
        progress: 20 
      });

      await new Promise(resolve => setTimeout(resolve, 800));
      await sendEvent({ 
        type: 'progress', 
        step: 'backstory', 
        message: '📖 Writing the band\'s origin story...', 
        progress: 30 
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      await sendEvent({ 
        type: 'progress', 
        step: 'visual_identity', 
        message: '🎨 Designing visual aesthetic...', 
        progress: 40 
      });

      await new Promise(resolve => setTimeout(resolve, 800));
      await sendEvent({ 
        type: 'progress', 
        step: 'album_concept', 
        message: '💿 Developing album concept...', 
        progress: 50 
      });

      await new Promise(resolve => setTimeout(resolve, 1200));
      await sendEvent({ 
        type: 'progress', 
        step: 'track_listing', 
        message: '🎵 Creating track listing...', 
        progress: 60 
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      await sendEvent({ 
        type: 'progress', 
        step: 'generating_logo', 
        message: '✨ Generating band logo...', 
        progress: 70 
      });

      await new Promise(resolve => setTimeout(resolve, 1500));
      await sendEvent({ 
        type: 'progress', 
        step: 'album_cover', 
        message: '🎨 Creating album artwork...', 
        progress: 80 
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      await sendEvent({ 
        type: 'progress', 
        step: 'band_photo', 
        message: '📸 Generating band photo...', 
        progress: 90 
      });

      await new Promise(resolve => setTimeout(resolve, 800));
      await sendEvent({ 
        type: 'progress', 
        step: 'finalizing', 
        message: '🚀 Finalizing band profile...', 
        progress: 95 
      });

      // Simulate final result
      const mockResult = {
        bandName: "Echo Paradox",
        primaryGenre: "Progressive Rock",
        concept: prompt,
        timestamp: new Date().toISOString()
      };

      await sendEvent({ 
        type: 'complete', 
        message: '🎉 Band profile complete!', 
        progress: 100,
        data: mockResult
      });

    } catch (error) {
      await sendEvent({ 
        type: 'error', 
        message: error.message 
      });
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, { headers });
};

export const config = {
  path: "/generate-band-sse"
};