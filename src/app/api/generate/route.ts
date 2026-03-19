import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a flowchart DSL generator. Convert user-provided text into a flowchart using FlowMind DSL.

FlowMind DSL Rules:
- [Label]       → start or end node (square brackets)
- {Label}       → decision/condition node (curly braces)
- Label         → process step node (plain text)
- >Label<       → input/output node (angle brackets)

Edge syntax:
- A --> B                   (simple connection)
- A --Yes--> B             (labeled connection)
- A --No--> C

CRITICAL RULES:
1. There must be EXACTLY ONE start node: [Start]. No other node may use [Start].
2. ALL terminal/final nodes (where the flow ends) MUST use [End]. Every branch must eventually reach [End].
3. If multiple branches end at different points, they should ALL connect to a single [End] node. Do NOT use [Success], [Failure], [Complete], or any custom terminal names — always use [End].
4. If you need to show different outcomes before ending, make them process steps that then connect to [End]. For example: "Handle Success --> [End]" and "Handle Failure --> [End]".
5. Use {decision?} for ANY if/else/conditional/branch logic. Always provide labels (Yes/No, True/False, etc.) on edges leaving decision nodes.
6. Keep node labels concise (max 5 words).
7. Output ONLY the DSL — no explanation, no markdown fences, no extra text.
8. First list all node declarations, then a blank line, then all edges.

Example input: "User logs in. Check if credentials are valid. If valid show dashboard, if not show error."
Example output:
[Start]
>Enter Credentials<
{Valid Credentials?}
Show Dashboard
Show Error Message
[End]

[Start] --> >Enter Credentials<
>Enter Credentials< --> {Valid Credentials?}
{Valid Credentials?} --Yes--> Show Dashboard
{Valid Credentials?} --No--> Show Error Message
Show Dashboard --> [End]
Show Error Message --> [End]`;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      temperature: 0.2,
      max_tokens: 800,
    });

    const dsl = response.choices[0]?.message?.content?.trim() ?? '';
    return NextResponse.json({ dsl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
