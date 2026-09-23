/** Proveedor de respaldo (Groq) para cuando Gemini no está disponible. */

export const MODELO_GROQ = "llama-3.3-70b-versatile";
export const ID_MODELO_GROQ = `groq/${MODELO_GROQ}`;

export class GroqError extends Error {}

/** Envía las mismas instrucciones, contenido y esquema JSON usados con Gemini. */
export async function generarJsonConGroq(opts: {
  systemInstruction: string;
  contents: string;
  schema: unknown;
}): Promise<string> {
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) throw new GroqError("Falta configurar el secreto GROQ_API_KEY");

  const system = `${opts.systemInstruction}\n\nResponde exclusivamente con un objeto JSON que cumpla este esquema JSON:\n${JSON.stringify(opts.schema)}`;

  const { conReintentos } = await import("./gemini-retry.server");
  return conReintentos(async () => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODELO_GROQ,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: opts.contents },
        ],
      }),
    });
    if (!res.ok) {
      const cuerpo = await res.text().catch(() => "");
      throw new GroqError(`${res.status} ${cuerpo.slice(0, 300)}`);
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return json.choices?.[0]?.message?.content ?? "";
  });
}
