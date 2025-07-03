import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
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

async function generateEmbedding(text: string, accessToken: string, serviceAccountKey: ServiceAccountKey): Promise<number[]> {
  try {
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
              task_type: "RETRIEVAL_QUERY",
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
    
    // Extract embedding from response
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
    
    return embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

async function searchSimilarContent(
  supabase: any,
  queryEmbedding: number[],
  projectId: string,
  threshold = 0.4,
  limit = 5
): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc('similarity_search', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      filter_project_id: projectId
    })

    if (error) {
      console.error('Error searching embeddings:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error performing similarity search:', error)
    throw error
  }
}

async function generateResponse(
  query: string,
  context: string,
  chatHistory: ChatMessage[],
  accessToken: string,
  serviceAccountKey: ServiceAccountKey,
  projectInfo: any
): Promise<string> {
  try {
    const projectId = serviceAccountKey.project_id
    const location = 'us-central1'
    const model = 'gemini-2.0-flash-001' // Using Gemini 2.0 Flash

    // Format chat history for the API
    const formattedHistory: { role: string, parts: { text: string }[] }[] = chatHistory.map((msg: ChatMessage) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))

    // Create system prompt with context and project info
    const systemPrompt = `You are a helpful AI assistant for the project "${projectInfo.name}". 
Your purpose is to answer questions based on the provided context and project information.

PROJECT INFORMATION:
Name: ${projectInfo.name}
Description: ${projectInfo.description}
${projectInfo.plan ? `Plan: ${projectInfo.plan}` : ''}

CONTEXT FROM KNOWLEDGE BASE:
${context || "No specific context available for this query."}

USER QUERY:
${query}

Please provide a helpful, accurate, and concise response based on the context. If the context doesn't contain relevant information to answer the question, acknowledge that you don't have enough information but try to be helpful based on general knowledge related to the project's domain. Do not make up specific information about the project that isn't provided.`

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
    
    const responseText = vertexData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!responseText) {
      throw new Error('No response text from Vertex AI')
    }

    return responseText
  } catch (error) {
    console.error('Error generating response:', error)
    throw error
  }
}

async function getProjectInfo(supabase: any, projectSlug: string): Promise<any> {
  try {
    // Try to find project by custom_slug first
    let { data, error } = await supabase
      .from('projects')
     .select('id, name, description, plan, user_id')
      .eq('custom_slug', projectSlug)
      .single()

    // If not found by custom_slug, try by regular slug
    if (error && error.code === 'PGRST116') {
      const { data: slugData, error: slugError } = await supabase
        .from('projects')
       .select('id, name, description, plan, user_id')
        .eq('slug', projectSlug)
        .single()

      if (slugError) {
        throw slugError
      }

      data = slugData
    } else if (error) {
      throw error
    }

   console.log('Project info retrieved:', { 
     id: data.id, 
     name: data.name, 
     user_id: data.user_id 
   });
   
    return data
  } catch (error) {
    console.error('Error fetching project info:', error)
    throw error
  }
}

/**
 * Analyzes a question to determine if it's describing an issue/problem or just a general inquiry
 * @param query The user's question or message
 * @param accessToken Google Cloud access token
 * @param serviceAccountKey Service account key for Google Cloud
 * @returns Boolean indicating if the question is describing an issue
 */
async function isQuestionAnIssue(
  query: string,
  accessToken: string,
  serviceAccountKey: ServiceAccountKey
): Promise<boolean> {
  try {
    const projectId = serviceAccountKey.project_id
    const location = 'us-central1'
    const model = 'gemini-2.0-flash-001'
    
    const prompt = `Analyze the following user message and determine if it's describing a problem/issue that needs fixing or if it's just asking for information (inquiry).

USER MESSAGE:
"""
${query}
"""

CLASSIFICATION CRITERIA:
- ISSUE: The message describes a problem, bug, error, malfunction, complaint, or something that needs fixing. The user is reporting something that's not working as expected or expressing frustration about functionality.
- INQUIRY: The message is asking for information, clarification, general knowledge, or how to do something. The user is seeking to learn or understand, not reporting a problem.

Examples of ISSUES:
- "The login button doesn't work"
- "I'm getting an error when trying to upload files"
- "The app crashes when I click on settings"

Examples of INQUIRIES:
- "How do I reset my password?"
- "What payment methods do you accept?"
- "Can you explain how feature X works?"

Respond with ONLY "ISSUE" or "INQUIRY" based on your analysis. Be precise in your classification.`

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
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 10
          }
        })
      }
    )

    if (!vertexResponse.ok) {
      console.error('Error classifying question type:', await vertexResponse.text())
      return false // Default to inquiry if classification fails
    }

    const vertexData = await vertexResponse.json()
    const responseText = vertexData.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // Check if the response contains the word "ISSUE"
    return responseText.trim().toUpperCase().includes('ISSUE')
  } catch (error) {
    console.error('Error determining if question is an issue:', error)
    return false // Default to inquiry if there's an error
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query, chatHistory, projectSlug } = await req.json()
    
    if (!query) {
      throw new Error('Query is required')
    }

    if (!projectSlug) {
      throw new Error('Project slug is required')
    }

    // Get service account key from environment
    const serviceAccountKeyJson = Deno.env.get('GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY')
    if (!serviceAccountKeyJson) {
      throw new Error('GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY not found in environment')
    }

    // Parse service account key
    const serviceAccountKey: ServiceAccountKey = JSON.parse(serviceAccountKeyJson)
    
    // Get access token
    const accessToken = await getAccessToken(serviceAccountKey)

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not found in environment')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get project information
    const projectInfo = await getProjectInfo(supabase, projectSlug)
    
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query, accessToken, serviceAccountKey)
    
    // Search for similar content in the embeddings table
    const similarContent = await searchSimilarContent(supabase, queryEmbedding, projectInfo.id, 0.4)
    
    // Prepare context from similar content
    const context = similarContent.map(item => {
      const sourceInfo = item.source_type ? `[${item.source_type.toUpperCase()}] ` : ''
      return `${sourceInfo}${item.content}`
    }).join('\n\n')
    
    // Check if we have relevant content or need to create an inquiry
    const hasRelevantContent = similarContent.length > 0 && similarContent.some(item => item.similarity > 0.5)
    
    // IMPROVED FILTERING: Check if the query is substantial enough to be logged
    const commonGreetings = [
      'hi', 'hey', 'hello', 'test', 'hola', 'yo', 'sup', 'howdy', 'greetings',
      'good morning', 'good afternoon', 'good evening', 'thanks', 'thank you',
      'help', 'help me', 'can you help', 'please help', 'i need help',
      'what can you do', 'what do you do'
    ]
    
    // More sophisticated check for substantial queries
    const isSubstantialQuery = (
      query.trim().length > 15 && // Longer minimum length
      !commonGreetings.some(greeting => query.trim().toLowerCase() === greeting) &&
      query.trim().split(/\s+/).length > 3 && // Must be more than 3 words
      !/^(can you|could you|would you|will you|please)\s+(help|assist)/i.test(query.trim()) // Filter generic help requests
    )
    
    // Additional check to filter out messages that look like responses to the AI
    const looksLikeResponse = /^(none of this|this (didn't|did not) help|not helpful|can('t| not) help|forward the issue|contact support|talk to someone)/i.test(query.trim())
    
    // Special check for "I have an issue" or "I have a question" phrases
    // These should only be filtered if they're the entire message or very short
    const isJustIssueStatement = /^i have (an issue|a problem|a question)(\s+with|\s+about)?(\s+this)?\.?$/i.test(query.trim()) ||
                               /^i('m| am) having (an issue|a problem|a question)(\s+with|\s+about)?(\s+this)?\.?$/i.test(query.trim())
    
    let knowledgeGapType = null;
    let knowledgeGapCreated = false;
    
    // Generate response using Gemini
    const response = await generateResponse(
      query, 
      context, 
      chatHistory || [], 
      accessToken, 
      serviceAccountKey,
      projectInfo
    )

    // If no relevant content was found, create an inquiry in the database
    if (!hasRelevantContent && isSubstantialQuery && !looksLikeResponse && !isJustIssueStatement) {
      // Determine if this is an issue or an inquiry based on content analysis
      knowledgeGapType = await isQuestionAnIssue(query, accessToken, serviceAccountKey) ? 'issue' : 'inquiry';
      console.log(`Knowledge gap detected. Classified as: ${knowledgeGapType}`);
      
      try {
        if (knowledgeGapType === 'issue') {
          // Create a new issue
          const { data: issueData, error: issueError } = await supabase
            .from('issues')
            .insert({ 
              // Create a more descriptive title (shorter)
              title: `Knowledge Gap: ${query.length > 27 ? `${query.substring(0, 24)}...` : query}`,
              // Move the full query to the description field
              description: query,
              severity: 'medium',
              status: 'open',
              tags: ['ai-gap', 'needs-review', 'auto-detected'],
              user_id: projectInfo.user_id,
              project_id: projectInfo.id
            })
            .select()

          if (issueError) {
            console.error('Error creating issue:', issueError)
          } else {
            console.log('Created issue for knowledge gap:', issueData);
            knowledgeGapCreated = true;
          }
        } else {
          // Create a new inquiry
          const { data: inquiryData, error: inquiryError } = await supabase
            .from('inquiries')
            .insert({
              // Create a more descriptive title (shorter)
              title: `Knowledge Gap: ${query.length > 27 ? `${query.substring(0, 24)}...` : query}`,
              // Move the full query to the description field
              description: query,
              content: query,
              tags: ['ai-gap', 'needs-review', 'auto-detected'],
              user_id: projectInfo.user_id,
              project_id: projectInfo.id
            })
            .select()

          if (inquiryError) {
            console.error('Error creating inquiry:', inquiryError)
          } else {
            console.log('Created inquiry for knowledge gap:', inquiryData);
            knowledgeGapCreated = true;
          }
        }
      } catch (error) {
        console.error('Failed to create knowledge gap entry:', error)
      }
    }

    return new Response(
      JSON.stringify({ 
        response,
        context: similarContent.length > 0 ? similarContent : null,
        knowledgeGap: !hasRelevantContent && knowledgeGapCreated && isSubstantialQuery, 
        knowledgeGapType: knowledgeGapCreated ? knowledgeGapType : null,
        projectInfo: {
          name: projectInfo.name,
          description: projectInfo.description,
          plan: projectInfo.plan
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error processing chat query:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})