import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ZipReader, BlobReader, TextWriter } from "https://deno.land/x/zipjs@v2.7.34/index.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Extract text from DOCX (which is a ZIP of XML files)
async function extractDocxText(file: File): Promise<string> {
  const blob = new Blob([await file.arrayBuffer()]);
  const reader = new ZipReader(new BlobReader(blob));
  const entries = await reader.getEntries();

  let documentXml = "";
  for (const entry of entries) {
    if (entry.filename === "word/document.xml" && entry.getData) {
      const writer = new TextWriter();
      documentXml = await entry.getData(writer);
      break;
    }
  }
  await reader.close();

  if (!documentXml) {
    throw new Error("Could not find document.xml in DOCX file");
  }

  // Strip XML tags and clean up whitespace
  const text = documentXml
    .replace(/<\/w:p[^>]*>/g, "\n") // paragraph breaks
    .replace(/<w:tab\/>/g, "\t") // tabs
    .replace(/<w:br[^>]*\/>/g, "\n") // line breaks
    .replace(/<[^>]+>/g, "") // strip all XML tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, "\n\n") // collapse multiple newlines
    .trim();

  return text;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (file.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "File too large (max 5MB)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = file.name.toLowerCase();

    // Plain text files
    if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".text")) {
      const text = await file.text();
      return new Response(JSON.stringify({ text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DOCX files - extract text from ZIP/XML structure
    if (name.endsWith(".docx")) {
      try {
        const text = await extractDocxText(file);
        if (!text) throw new Error("No text content found");
        return new Response(JSON.stringify({ text }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        console.error("DOCX parse error:", e);
        return new Response(JSON.stringify({ error: "Failed to parse DOCX. Try saving as .txt or .pdf and re-uploading." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // PDF files - send to Gemini for extraction
    if (name.endsWith(".pdf")) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ error: "AI not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const bytes = new Uint8Array(await file.arrayBuffer());
      const base64 = btoa(String.fromCharCode(...bytes));

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract ALL text content from this resume/CV document. Return ONLY the raw text content, preserving the structure (headings, bullet points, sections). Do not add any commentary.",
                },
                {
                  type: "image_url",
                  image_url: { url: `data:application/pdf;base64,${base64}` },
                },
              ],
            },
          ],
          max_tokens: 8000,
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("AI parse error:", aiResponse.status, errText);
        return new Response(JSON.stringify({ error: "Failed to parse PDF. Try pasting the text manually." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResponse.json();
      const text = aiData.choices?.[0]?.message?.content || "";

      return new Response(JSON.stringify({ text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // .doc (legacy format) - not supported for direct parsing
    if (name.endsWith(".doc")) {
      return new Response(JSON.stringify({ error: "Legacy .doc format is not supported. Please save as .docx or .pdf and try again." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unsupported file type. Use .pdf, .docx, or .txt" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Parse error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
