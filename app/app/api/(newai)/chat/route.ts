import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";
import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await handleAuthorization(req);
    const { messages, fileContent, fileName } = await req.json();

    const result = await streamText({
      model: openai(process.env.MODEL_NAME || "gpt-4o-mini"),
      system: `You are a helpful assistant. Here's some context about the current file:
${fileContent} called ${fileName}
Please use this context to inform your responses, but do not directly repeat this context in your answers unless specifically asked about the file content.`,
      messages: convertToCoreMessages(messages),
      onFinish: async ({ usage }) => {
        console.log("Token usage:", usage);
        await incrementAndLogTokenUsage(userId, usage.totalTokens);
      },
    });

    const response = result.toAIStreamResponse();

    return response;
  } catch (error) {
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
  }
}
