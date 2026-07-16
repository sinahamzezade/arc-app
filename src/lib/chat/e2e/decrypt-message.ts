import type { ChatMessageDto } from "@/lib/api/chat";
import { isE2eEnvelope } from "./codec";
import { decryptIncomingBody } from "./session";

export async function decryptChatMessage(
  msg: ChatMessageDto,
  accessToken?: string | null,
): Promise<ChatMessageDto> {
  if (msg.type === "system") return { ...msg, e2e: false };

  let body = msg.body;
  let e2e = !!msg.e2e || isE2eEnvelope(body);
  if (e2e && body) {
    body = await decryptIncomingBody(msg.conversationId, body, accessToken);
    e2e = false; // client now holds plaintext
  }

  let replyTo = msg.replyTo ?? null;
  if (replyTo?.body && (replyTo.e2e || isE2eEnvelope(replyTo.body))) {
    const replyPlain = await decryptIncomingBody(
      msg.conversationId,
      replyTo.body,
      accessToken,
    );
    replyTo = {
      ...replyTo,
      body: replyPlain,
      e2e: false,
    };
  }

  return { ...msg, body, e2e, replyTo };
}

export async function decryptChatMessages(
  items: ChatMessageDto[],
  accessToken?: string | null,
): Promise<ChatMessageDto[]> {
  return Promise.all(items.map((m) => decryptChatMessage(m, accessToken)));
}
