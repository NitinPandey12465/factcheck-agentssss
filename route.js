import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Parse multipart form data manually
async function parseForm(request) {
  const formData = await request.formData();
  const file = formData.get('pdf');
  if (!file) throw new Error('No PDF file uploaded');
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Extract text from PDF buffer
async function extractPDFText(buffer) {
  const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
  const data = await pdfParse(buffer);
  return data.text;
}

// Extract claims using Claude
async function extractClaims(text) {
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `You are a professional fact-checker. Analyze this document and extract ALL specific, verifiable factual claims.

Focus on:
- Statistics and percentages (e.g., "X% of users...", "grew by X%")
- Financial figures (revenue, market cap, funding amounts)
- Dates and timelines
- Technical specifications or benchmarks
- Named studies or reports with specific findings
- Claims about market size, rankings, or comparisons
- Scientific or health claims

Return ONLY a JSON object with this structure:
{
  "claims": [
    {
      "claim": "The exact claim as stated in the document",
      "context": "Brief surrounding context to understand the claim",
      "claim_type": "statistic|date|financial|technical|ranking|other"
    }
  ]
}

Extract 5-15 of the most specific, verifiable claims. Skip vague statements.

DOCUMENT TEXT:
${text.slice(0, 8000)}`
    }]
  });

  const content = response.content[0].text;
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

// Search web using Tavily
async function searchWeb(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return { results: [], error: 'No Tavily API key' };
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        search_depth: 'basic',
        max_results: 5,
        include_answer: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Tavily error:', err);
      return { results: [], error: err };
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Tavily fetch error:', err);
    return { results: [], error: err.message };
  }
}

// Verify a single claim using Claude + web results
async function verifyClaim(claim, searchResults) {
  const sourcesText = searchResults.results?.map(r =>
    `Source: ${r.url}\nTitle: ${r.title}\nContent: ${r.content}`
  ).join('\n\n---\n\n') || 'No web sources found';

  const tavilyAnswer = searchResults.answer || '';

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `You are a fact-checker. Verify this claim against the web sources provided.

CLAIM: "${claim.claim}"
CONTEXT: "${claim.context}"

TAVILY AI ANSWER: ${tavilyAnswer}

WEB SOURCES:
${sourcesText}

Analyze carefully and return ONLY a JSON object:
{
  "verdict": "VERIFIED" | "INACCURATE" | "FALSE" | "UNVERIFIED",
  "confidence": "high" | "medium" | "low",
  "explanation": "2-3 sentence explanation of your verdict, citing specific evidence",
  "corrected_fact": "If INACCURATE or FALSE, provide the correct information here. Otherwise null.",
  "sources": [
    {"url": "source url", "title": "source title"}
  ]
}

Verdict rules:
- VERIFIED: Claim matches current web data accurately
- INACCURATE: Claim has correct topic but wrong numbers/dates (e.g., outdated stats)
- FALSE: Claim is factually wrong or directly contradicted by evidence
- UNVERIFIED: Cannot find reliable evidence to confirm or deny

Be critical. Marketing documents often contain outdated statistics.`
    }]
  });

  const content = response.content[0].text;
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

// Generate overall summary
async function generateSummary(claims, verifiedClaims) {
  const claimsSummary = verifiedClaims.map((v, i) =>
    `Claim: "${claims[i].claim}" → ${v.verdict}`
  ).join('\n');

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Write a 2-3 sentence summary of this fact-check report. Be direct about the document's credibility.

Results:
${claimsSummary}

Return ONLY the summary text, no JSON.`
    }]
  });

  return response.content[0].text.trim();
}

export async function POST(request) {
  try {
    // Parse PDF
    const buffer = await parseForm(request);

    // Extract text
    let text;
    try {
      text = await extractPDFText(buffer);
    } catch (err) {
      return NextResponse.json({ error: 'Failed to read PDF. Make sure it contains text (not just images).' }, { status: 400 });
    }

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: 'PDF appears to be empty or image-only. Please upload a text-based PDF.' }, { status: 400 });
    }

    // Extract claims
    let claimsData;
    try {
      claimsData = await extractClaims(text);
    } catch (err) {
      return NextResponse.json({ error: 'Failed to extract claims from document.' }, { status: 500 });
    }

    const claims = claimsData.claims || [];

    if (claims.length === 0) {
      return NextResponse.json({
        claims: [],
        summary: 'No specific verifiable claims were found in this document.',
      });
    }

    // Verify each claim
    const verifiedClaims = [];
    for (const claim of claims) {
      try {
        // Search web for this claim
        const searchQuery = `${claim.claim} ${claim.claim_type === 'financial' ? 'revenue statistics' : ''}`.trim();
        const searchResults = await searchWeb(searchQuery);

        // Verify with Claude
        const verification = await verifyClaim(claim, searchResults);

        verifiedClaims.push({
          claim: claim.claim,
          context: claim.context,
          claim_type: claim.claim_type,
          ...verification,
        });
      } catch (err) {
        verifiedClaims.push({
          claim: claim.claim,
          context: claim.context,
          claim_type: claim.claim_type,
          verdict: 'UNVERIFIED',
          confidence: 'low',
          explanation: 'Could not verify this claim due to a processing error.',
          corrected_fact: null,
          sources: [],
        });
      }
    }

    // Generate summary
    const summary = await generateSummary(claims, verifiedClaims);

    return NextResponse.json({
      claims: verifiedClaims,
      summary,
      total: verifiedClaims.length,
    });

  } catch (err) {
    console.error('Verify API error:', err);
    return NextResponse.json({
      error: err.message || 'An unexpected error occurred.',
    }, { status: 500 });
  }
}
