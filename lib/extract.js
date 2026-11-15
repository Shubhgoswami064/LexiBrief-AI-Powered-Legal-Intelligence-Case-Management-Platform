export async function extractPdfText(fileUrl) {
  const endpoint =
    process.env.EXTRACT_URL ||
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/api/extract`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-extract-secret": process.env.EXTRACT_SECRET || "",
    },
    body: JSON.stringify({ url: fileUrl }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Text extraction failed.");
  return data; // { text, pageCount }
}