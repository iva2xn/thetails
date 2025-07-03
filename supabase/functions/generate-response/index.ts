import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
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

    const { query, context, chatHistory = [] } = await req.json()
    if (!query) {
      throw new Error('Query is required')
    }

    // Parse service account key
    const serviceAccountKey: ServiceAccountKey = JSON.parse(serviceAccountKeyJson)
    
    // Get access token
    const accessToken = await getAccessToken(serviceAccountKey)
    
    // Call Vertex AI Gemini API for content generation
    const projectId = serviceAccountKey.project_id
    const location = 'us-central1'
    const model = 'gemini-2.0-flash-001' // Using Gemini 2.0 Flash

    // Format chat history for the API
    const formattedHistory: { role: string, parts: { text: string }[] }[] = chatHistory.map((msg: ChatMessage) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))

    // Create system prompt with context
    const systemPrompt = `You are a helpful AI assistant that answers questions based on the provided context. 
If the context doesn't contain relevant information to answer the question, acknowledge that you don't have enough information.
Be concise, helpful, and accurate. Do not make up information that isn't in the context.

CONTEXT:
${context || "No context available."}

USER QUERY:
${query}

Please provide a helpful response based on the context.`

    // Add system prompt to the beginning of the conversation
    const contents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      },
      ...formattedHistory
    ]

    // Add the current query if it's not already the last message
    if (formattedHistory.length === 0 || formattedHistory[formattedHistory.length - 1].role !== 'user') {
      contents.push({
        role: 'user',
        parts: [{ text: query }]
      })
    }
    
    const vertexResponse = await fetch(
      `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 1024
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
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
      throw new Error('No response text from Vertex AI')
    }

    return new Response(
      JSON.stringify({ response: responseText }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error generating response:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})