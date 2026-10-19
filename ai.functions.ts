import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const FileSchema = z.object({
  data: z.string(), // base64 (no data: prefix)
  mime: z.string(),
  name: z.string().optional().default("resume"),
});

const ResumeInput = z
  .object({
    resume: z.string().optional().default(""),
    jobRole: z.string().optional().default(""),
    file: FileSchema.optional(),
  })
  .refine((v) => (v.resume && v.resume.length >= 30) || v.file, {
    message: "Provide resume text (30+ chars) or upload a file.",
  });

export type AnalysisResult = {
  atsScore: number;
  verdict: string;
  skills: string[];
  experience: { role: string; company?: string; duration?: string; highlights: string[] }[];
  strengths: string[];
  weaknesses: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestedRoles: string[];
  improvements: string[];
  summary: string;
};

const SYSTEM_PROMPT = `You are an ML-powered resume analyzer and ATS expert.
Return ONLY valid JSON matching this TypeScript type — no markdown, no code fences:
{
  "atsScore": number (0-100),
  "verdict": string (one line),
  "skills": string[],
  "experience": [{ "role": string, "company"?: string, "duration"?: string, "highlights": string[] }],
  "strengths": string[],
  "weaknesses": string[],
  "matchedKeywords": string[],
  "missingKeywords": string[],
  "suggestedRoles": string[],
  "improvements": string[],
  "summary": string
}
If the resume is a student/fresher with only projects & education, treat projects as experience entries.`;

async function callGatewayMultimodal(
  apiKey: string,
  userParts: unknown[],
): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userParts },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content ?? "";
}

export const analyzeResume = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ResumeInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const instruction = `Analyze this resume${
      data.jobRole ? ` for the target role: "${data.jobRole}"` : ""
    }. Return the JSON described in the system prompt.`;

    const parts: unknown[] = [{ type: "text", text: instruction }];

    if (data.file) {
      const dataUrl = `data:${data.file.mime};base64,${data.file.data}`;
      if (data.file.mime.startsWith("image/")) {
        parts.push({ type: "image_url", image_url: { url: dataUrl } });
      } else {
        parts.push({
          type: "file",
          file: {
            filename: data.file.name || "resume.pdf",
            file_data: dataUrl,
          },
        });
      }
    }
    if (data.resume) {
      parts.push({ type: "text", text: `Resume text:\n"""\n${data.resume}\n"""` });
    }

    const raw = await callGatewayMultimodal(key, parts);

    let parsed: AnalysisResult;
    try {
      // strip accidental code fences
      const cleaned = raw
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("Model did not return valid JSON. Try again.");
    }

    // clamp/defaults
    parsed.atsScore = Math.max(0, Math.min(100, Number(parsed.atsScore) || 0));
    parsed.skills ??= [];
    parsed.experience ??= [];
    parsed.strengths ??= [];
    parsed.weaknesses ??= [];
    parsed.matchedKeywords ??= [];
    parsed.missingKeywords ??= [];
    parsed.suggestedRoles ??= [];
    parsed.improvements ??= [];

    return parsed;
  });

const ChatInput = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    }),
  ),
  role: z.string().optional().default("Software Engineer"),
});

export const interviewChat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-2.5-flash");

    const system = `You are an AI Interview Copilot for a candidate interviewing for the role of "${data.role}".
Your job:
- If the candidate shares an interviewer question, provide a crisp, structured suggested answer (use STAR when relevant).
- If the candidate asks to practice, ask realistic interview questions one at a time and give feedback after their answer.
- Keep responses concise, actionable, and professional. Use Markdown for structure.`;

    const { text } = await generateText({
      model,
      messages: [{ role: "system", content: system }, ...data.messages],
    });
    return { reply: text };
  });
