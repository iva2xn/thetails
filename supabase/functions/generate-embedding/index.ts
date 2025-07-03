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

    const { text } = await req.json()
    if (!text) {
      throw new Error('Text is required')
    }

    // Parse service account key
    const serviceAccountKey: ServiceAccountKey = JSON.parse(serviceAccountKeyJson)
    
    // Get access token
    const accessToken = await getAccessToken(serviceAccountKey)
    
    // Call Vertex AI Text Embeddings API with correct model
    const projectId = serviceAccountKey.project_id
    const location = 'us-central1'
    const model = 'text-embedding-004'
    
    const vertexResponse = await fetch(
      `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instances: [
            {
              task_type: "RETRIEVAL_DOCUMENT",
              content: text
            }
          ]
        })
      }
    )

    if (!vertexResponse.ok) {
      const errorText = await vertexResponse.text()
      console.error('Vertex AI error response:', errorText)
      throw new Error(`Vertex AI API error: ${vertexResponse.status} - ${errorText}`)
    }

    const vertexData = await vertexResponse.json()
    console.log('Vertex AI response:', JSON.stringify(vertexData, null, 2))
    
    // Extract embedding from response - check different possible response structures
    let embedding = null
    
    if (vertexData.predictions?.[0]?.embeddings?.values) {
      embedding = vertexData.predictions[0].embeddings.values
    } else if (vertexData.predictions?.[0]?.values) {
      embedding = vertexData.predictions[0].values
    } else if (vertexData.predictions?.[0]) {
      // Sometimes the embedding is directly in the prediction
      const prediction = vertexData.predictions[0]
      if (Array.isArray(prediction)) {
        embedding = prediction
      } else if (prediction.embedding) {
        embedding = prediction.embedding
      }
    }
    
    if (!embedding || !Array.isArray(embedding)) {
      console.error('Unexpected response structure:', vertexData)
      throw new Error('No valid embedding found in Vertex AI response')
    }
    
    return new Response(
      JSON.stringify({ embedding }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error generating embedding:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})