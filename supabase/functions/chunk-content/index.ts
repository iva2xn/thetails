import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SemanticChunk {
  content: string
  summary: string
  keywords: string[]
  chunkIndex: number
  totalChunks: number
}

interface ServiceAccountKey {
  type: string
  project_id: string
  private_key_id: string
  private_key: string
  client_email: string
  client_id: string
  auth_uri: string
  token_uri: string
  auth_provider_x509_cert_url: string
  client_x509_cert_url: string
}

async function getAccessToken(serviceAccountKey: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + 3600 // 1 hour

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  }

  const payload = {
    iss: serviceAccountKey.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: exp
  }

  // Create JWT
  const encoder = new TextEncoder()
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  
  const unsignedToken = `${headerB64}.${payloadB64}`
  
  // Import private key - handle the base64 decoding properly
  const privateKeyPem = serviceAccountKey.private_key.replace(/\\n/g, '\n')
  const pemContent = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  
  const binaryKey = Uint8Array.from(atob(pemContent), c => c.charCodeAt(0))
  
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  )

  // Sign the token
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(unsignedToken)
  )

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const jwt = `${unsignedToken}.${signatureB64}`

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  })

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text()
    throw new Error(`Failed to get access token: ${tokenResponse.status} - ${errorText}`)
  }

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const serviceAccountKeyJson = Deno.env.get('GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY')
    if (!serviceAccountKeyJson) {
      throw new Error('GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY not found in environment')
    }

    const { content, maxWordsPerChunk = 75 } = await req.json()
    if (!content) {
      throw new Error('Content is required')
    }

    // Parse service account key
    const serviceAccountKey: ServiceAccountKey = JSON.parse(serviceAccountKeyJson)
    
    // Get access token
    const accessToken = await getAccessToken(serviceAccountKey)
    
    // Call Vertex AI Gemini API for content generation
    const projectId = serviceAccountKey.project_id
    const location = 'us-central1'
    const model = 'gemini-2.0-flash-001' // Using Gemini 2.0 Flash

    const prompt = `You are an expert content analyzer. Your task is to semantically chunk the following content into meaningful segments.

REQUIREMENTS:
- Each chunk should be semantically coherent and meaningful on its own
- Maximum ${maxWordsPerChunk} words per chunk (approximately 2-5 sentences)
- Preserve important context and relationships
- Each chunk should represent a complete thought or concept
- Provide a brief summary and keywords for each chunk
- Split on semantic boundaries like sentences, paragraphs, or list items
- Do not break in the middle of a sentence if possible

CONTENT TO CHUNK:
${content}

Please return the result as a JSON array with the following structure:
[
  {
    "content": "The actual chunk content",
    "summary": "Brief summary of this chunk",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "chunkIndex": 1,
    "totalChunks": 3
  }
]

Ensure the JSON is valid and properly formatted. Return ONLY the JSON array, no additional text.`
    
    const vertexResponse = await fetch(
      `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 8192,
            responseMimeType: "application/json"
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE"
            }
          ]
        })
      }
    )

    if (!vertexResponse.ok) {
      const errorText = await vertexResponse.text()
      console.error('Vertex AI error:', errorText)
      throw new Error(`Vertex AI API error: ${vertexResponse.status} - ${errorText}`)
    }

    const vertexData = await vertexResponse.json()
    console.log('Vertex AI response:', JSON.stringify(vertexData, null, 2))
    
    const responseText = vertexData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!responseText) {
      console.warn('No response text from Vertex AI, using fallback chunking')
      throw new Error('No response text from Vertex AI')
    }

    let chunks: SemanticChunk[]
    
    try {
      // Try to parse as direct JSON first
      chunks = JSON.parse(responseText)
    } catch (parseError) {
      // Extract JSON from the response if it's wrapped in other text
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.warn('No valid JSON found in response, using fallback chunking')
        throw new Error('No valid JSON found in response')
      }
      chunks = JSON.parse(jsonMatch[0])
    }
    
    // Validate and ensure proper indexing
    const processedChunks = chunks.map((chunk, index) => ({
      ...chunk,
      chunkIndex: index + 1,
      totalChunks: chunks.length
    }))

    return new Response(
      JSON.stringify({ chunks: processedChunks }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error chunking content:', error)
    
    // Fallback: simple word-based chunking
    try {
      const { content, maxWordsPerChunk = 400 } = await req.json()
      const fallbackChunks = fallbackChunking(content, 75)
      
      return new Response(
        JSON.stringify({ chunks: fallbackChunks }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } catch (fallbackError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
  }
})

function fallbackChunking(content: string, maxWords = 75): SemanticChunk[] {
  // Split by sentences first to avoid breaking mid-sentence
  const sentences = content.split(/(?<=[.!?])\s+/)
  const chunks: SemanticChunk[] = []
  let currentChunk: string[] = []
  let wordCount = 0
  
  // Process sentence by sentence
  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/).length
    
    // If adding this sentence would exceed the limit, create a new chunk
    if (wordCount + sentenceWords > maxWords && currentChunk.length > 0) {
      const chunkContent = currentChunk.join(' ')
      chunks.push({
        content: chunkContent,
        summary: `Chunk ${chunks.length + 1} of content`,
        keywords: extractSimpleKeywords(chunkContent),
        chunkIndex: chunks.length + 1,
        totalChunks: 0 // Will be updated later
      })
      currentChunk = []
      wordCount = 0
    }
    
    // Add the sentence to the current chunk
    currentChunk.push(sentence)
    wordCount += sentenceWords
  }
  
  // Add the last chunk if there's anything left
  if (currentChunk.length > 0) {
    const chunkContent = currentChunk.join(' ')
    chunks.push({
      content: chunkContent,
      summary: `Chunk ${chunks.length + 1} of content`,
      keywords: extractSimpleKeywords(chunkContent),
      chunkIndex: chunks.length + 1,
      totalChunks: 0 // Will be updated later
    })
  }
  
  // Update totalChunks for all chunks
  for (const chunk of chunks) {
    chunk.totalChunks = chunks.length
  }
  
  return chunks
}

function extractSimpleKeywords(text: string): string[] {
  // Simple keyword extraction - get meaningful words
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['this', 'that', 'with', 'have', 'will', 'been', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'].includes(word))
  
  // Get unique words and return top 5
  const uniqueWords = [...new Set(words)]
  return uniqueWords.slice(0, 5)
}