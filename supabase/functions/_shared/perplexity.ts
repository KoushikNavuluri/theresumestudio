
export async function askPerplexity(query: string, stream = false) {
    const url = "https://www.perplexity.ai/rest/sse/perplexity_ask";
    const cookie = Deno.env.get("PERPLEXITY_COOKIE") || "";

    if (!cookie) {
        console.warn("PERPLEXITY_COOKIE is not set in environment variables.");
    }

    const payload = {
        params: {
            attachments: [],
            language: "en-US",
            timezone: "Asia/Kolkata",
            search_focus: "internet",
            sources: ["web"],
            frontend_uuid: crypto.randomUUID(),
            mode: "copilot",
            model_preference: "gemini2flash",
            query_source: "home",
            dsl_query: query,
            version: "2.18"
        },
        query_str: query
    };

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0',
        'Content-Type': 'application/json',
        'Referer': 'https://www.perplexity.ai/',
        'Origin': 'https://www.perplexity.ai',
        'Cookie': cookie
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Perplexity API error (${response.status}):`, errorText);
        throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    if (stream) {
        // If we want to stream back to the client in a compatible format, 
        // we need to transform the Perplexity stream.
        return transformPerplexityStream(response.body!);
    }

    // Non-streaming: Parse the entire response to find the final answer
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body reader");

    const decoder = new TextDecoder();
    let buffer = "";
    let finalAnswer = "";

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine.startsWith("data:")) continue;
                try {
                    const data = JSON.parse(trimmedLine.slice(5).trim());
                    if (data.final || data.status === "COMPLETED") {
                        const blocks = data.blocks || [];
                        for (const block of blocks) {
                            if (block.markdown_block && block.markdown_block.answer) {
                                finalAnswer = block.markdown_block.answer;
                            }
                        }
                    }
                } catch (_) {
                    // Ignore parse errors from partial or malformed lines
                }
            }
        }
    } catch (e) {
        console.error("Error reading Perplexity stream:", e);
    }

    return finalAnswer || "Warning: No answer found.";
}

function transformPerplexityStream(readable: ReadableStream<Uint8Array>) {
    const reader = readable.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = "";
    let lastAnswer = "";

    return new ReadableStream({
        async start(controller) {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                        controller.close();
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (!trimmedLine.startsWith("data:")) continue;

                        try {
                            const data = JSON.parse(trimmedLine.slice(5).trim());
                            const blocks = data.blocks || [];
                            let currentAnswer = "";

                            for (const block of blocks) {
                                if (block.markdown_block && block.markdown_block.answer) {
                                    currentAnswer = block.markdown_block.answer;
                                }
                            }

                            if (currentAnswer && currentAnswer !== lastAnswer) {
                                // Determine the delta
                                const delta = currentAnswer.startsWith(lastAnswer)
                                    ? currentAnswer.slice(lastAnswer.length)
                                    : currentAnswer;

                                if (delta) {
                                    const openaiDelta = {
                                        choices: [{
                                            delta: { content: delta }
                                        }]
                                    };
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(openaiDelta)}\n\n`));
                                    lastAnswer = currentAnswer;
                                }
                            }
                        } catch (_) {
                            // Ignore parse errors
                        }
                    }
                }
            } catch (e) {
                controller.error(e);
            }
        }
    });
}
