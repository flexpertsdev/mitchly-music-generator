// SSE Streaming service for band generation
import { bandService } from './appwrite';
import { ID } from 'appwrite';

export const generateBandProfileSSE = async (prompt, advancedData = null, onProgress = null) => {
  return new Promise((resolve, reject) => {
    try {
      // Prepare request body
      const body = JSON.stringify({ prompt, advancedData });
      
      // Create EventSource for POST request (using fetch with ReadableStream)
      fetch('/.netlify/edge-functions/generate-band-stream-production', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body
      }).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const processStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) break;
              
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = JSON.parse(line.substring(6));
                  
                  if (onProgress) {
                    onProgress(data);
                  }
                  
                  if (data.type === 'complete' && data.needsSaving) {
                    // Save to Appwrite
                    try {
                      const bandData = data.data;
                      
                      // Create band document
                      const savedBand = await bandService.create({
                        name: bandData.bandName,
                        profileData: JSON.stringify(bandData),
                        logoUrl: bandData.logoUrl || '',
                        albumCoverUrl: bandData.albumCoverUrl || '',
                        bandPhotoUrl: bandData.bandPhotoUrl || '',
                        createdAt: new Date().toISOString()
                      });
                      
                      // Create song stubs
                      const songStubs = bandData.trackListing.map((track, index) => {
                        const theme = bandData.lyricalThemes[index % bandData.lyricalThemes.length];
                        const baseDesc = `${bandData.primaryGenre} track about ${theme}. ${bandData.vocalStyle.type} vocals.`;
                        const description = baseDesc.length > 100 ? baseDesc.substring(0, 97) + '...' : baseDesc;
                        
                        return {
                          title: track,
                          trackNumber: index + 1,
                          description: description
                        };
                      });
                      
                      // Save songs
                      if (songStubs && songStubs.length > 0) {
                        for (const stub of songStubs) {
                          try {
                            await bandService.createSong({
                              bandId: savedBand.$id,
                              title: stub.title,
                              trackNumber: stub.trackNumber,
                              description: stub.description,
                              musicalElements: '',
                              lyrics: '',
                              audioUrl: null,
                              status: 'pending'
                            });
                          } catch (songError) {
                            console.error('Error creating song:', songError);
                          }
                        }
                      }
                      
                      // Return complete band with ID
                      resolve({
                        ...savedBand,
                        profileData: bandData
                      });
                    } catch (saveError) {
                      console.error('Error saving to Appwrite:', saveError);
                      // Still resolve with the data even if save failed
                      resolve({
                        $id: ID.unique(),
                        profileData: bandData,
                        error: 'Failed to save to database'
                      });
                    }
                  } else if (data.type === 'error') {
                    reject(new Error(data.message));
                  }
                }
              }
            }
          } catch (error) {
            reject(error);
          }
        };
        
        processStream();
      }).catch(reject);
      
    } catch (error) {
      reject(error);
    }
  });
};