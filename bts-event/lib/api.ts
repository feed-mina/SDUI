export async function guestChat(
  message: string,
  lang: "ko" | "en" | "ja",
  sessionId: string
): Promise<string> {
  const res = await fetch("/api/ai/guest/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, lang, sessionId }),
  });
  if (!res.ok) throw new Error("Chat request failed");
  const data = await res.json();
  return data.reply as string;
}
