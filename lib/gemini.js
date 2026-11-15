export async function geminiGenerate({ parts, maxOutputTokens = 32000, json = false }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set.");
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens,
          ...(json ? { responseMimeType: "application/json" } : {}),
        },
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      return (data.candidates?.[0]?.content?.parts || [])
        .map((p) => p.text || "")
        .join("");
    }

    // Busy or rate-limited: wait and try again
    if ([429, 500, 503].includes(res.status) && attempt < 3) {
      await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
      continue;
    }
    throw new Error(data?.error?.message || `Gemini request failed (${res.status})`);
  }
}