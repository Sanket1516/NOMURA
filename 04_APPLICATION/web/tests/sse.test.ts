import { describe, expect, it } from "vitest";
import { readSse } from "../lib/client/sse";

function streamOf(chunks: string[]) {
  const enc = new TextEncoder();
  return new Response(new ReadableStream({ start(c) { chunks.forEach((x) => c.enqueue(enc.encode(x))); c.close(); } }));
}

describe("readSse", () => {
  it("parses events split across chunks", async () => {
    const out = [];
    for await (const e of readSse(streamOf(["event: agent\ndata: {\"agent\":\"edu", "cator\"}\n\nevent: token\ndata: hi\n\n", "data: plain\n\n"]))) out.push(e);
    expect(out).toEqual([{ event: "agent", data: "{\"agent\":\"educator\"}" }, { event: "token", data: "hi" }, { event: "message", data: "plain" }]);
  });
});
