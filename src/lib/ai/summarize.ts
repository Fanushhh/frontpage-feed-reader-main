import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function summarizeArticle(
  title: string,
  content: string
): Promise<{ summary: string; tokenCount: number }> {
  // Truncate content to ~6000 chars
  const truncated = content.length > 6000 ? content.slice(0, 6000) + "…" : content;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Summarize this article in 2-3 sentences. Be concise and informative. Focus on the key takeaways.

Title: ${title}

Content:
${truncated}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const tokenCount = message.usage.input_tokens + message.usage.output_tokens;

  return { summary: text.trim(), tokenCount };
}
