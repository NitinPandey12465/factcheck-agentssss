import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

async function callGemini(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4000 },
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Gemini API error');
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function extractPDFText(buffer) {
  const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
  const data = await pdfParse(buffer);
  return data.text;
}

async function extractClaims(text) {
  const prompt = `You are a professional fact-checker. Analyze this document and extract ALL specific, verifiable factual claims.

Focus on: statistics, percentages, financial figures, dates, technical specs, market size claims, rankings.

Return ONLY valid JSON, no markdown, no backticks, no explanation:
{"claims":[{"claim":"exact claim text","context":"brief context","claim_type":"statistic|date|financial|technical|ranking|other"}]}

Extract 5-15 specific verifiable claims. Skip vague statements.

DOCUMENT:
${text.slice(0, 6000)}`;

  const result = await callGemini(prompt);
  const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function searchWeb(query) {
  if (!TAVILY_API_KEY) return { results: [], answer: '' };
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        search_depth: 'basic',
        max_results: 4,
        include_answer: true,
      }),
    });
    if (!res.ok) return { results: [], answer: '' };
    return await res.json();
  } catch {
    return { results: [], answer: '' };
  }
}

async function verifyClaim(claim, searchResults) {
  const sources = searchResults.results?.map(r =>
    `Source: ${r.url}\nTitle: ${r.title}\nContent: ${r.content}`
  ).join('\n\n---\n\n') || 'No sources found';

  const prompt = `You are a strict fact-checker. Verify this claim against web sources.

CLAIM: "${claim.claim}"
CONTEXT: "${claim.context}"
WEB ANSWER: ${searchResults.answer || 'N/A'}
SOURCES:
${sources}

Return ONLY valid JSON, no markdown, no backticks:
{"verdict":"VERIFIED|INACCURATE|FALSE|UNVERIFIED","confidence":"high|medium|low","explanation":"2-3 sentence explanation citing evidence","corrected_fact":"correct info if wrong, otherwise null","sources":[{"url":"url","title":"title"}]}

Rules:
- VERIFIED: matches current web data
- INACCURATE: right topic but wrong numbers/dates
- FALSE: directly contradicted by evidence
- UNVERIFIED: cannot find reliable evidence`;

  const result = await callGemini(prompt);
  const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function generateSummary(claims, verifiedClaims) {
  const summary = verifiedClaims.map((v, i) =>
    `"${claims[i].claim}" → ${v.verdict}`
  ).join('\n');

  const prompt = `Write a 2-3 sentence fact-check summary of this document. Be direct about credibility.
Results:
${summary}
Return ONLY the summary text, no JSON, no formatting.`;

  return await callGemini(prompt);
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf');
    if (!file) {
      return NextResponse.json({ error: 'No PDF file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text;
    try {
      text = await extractPDFText(buffer);
    } catch {
      return NextResponse.json({ error: 'Failed to read PDF. Make sure it has selectable text.' }, { status: 400 });
    }

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: 'PDF appears empty or is image-only.' }, { status: 400 });
    }

    let claimsData;
    try {
      claimsData = await extractClaims(text);
    } catch {
      return NextResponse.json({ error: 'Failed to extract claims. Try a different PDF.' }, { status: 500 });
    }

    const claims = claimsData.claims || [];
    if (claims.length === 0) {
      return NextResponse.json({ claims: [], summary: 'No specific verifiable claims found.' });
    }

    const verifiedClaims = [];
    for (const claim of claims) {
      try {
        const searchResults = await searchWeb(claim.claim);
        const verification = await verifyClaim(claim, searchResults);
        verifiedClaims.push({
          claim: claim.claim,
          context: claim.context,
          claim_type: claim.claim_type,
          ...verification,
        });
      } catch {
        verifiedClaims.push({
          claim: claim.claim,
          context: claim.context,
          claim_type: claim.claim_type,
          verdict: 'UNVERIFIED',
          confidence: 'low',
          explanation: 'Could not verify this claim.',
          corrected_fact: null,
          sources: [],
        });
      }
    }

    const summary = await generateSummary(claims, verifiedClaims);
    return NextResponse.json({ claims: verifiedClaims, summary, total: verifiedClaims.length });

  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: err.message || 'Unexpected error.' }, { status: 500 });
  }
}
