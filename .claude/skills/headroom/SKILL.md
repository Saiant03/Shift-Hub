---
name: headroom
description: Reference for Headroom — a local context-compression layer for AI agents that shrinks everything an agent reads (tool outputs, logs, RAG chunks, files, conversation history) before it reaches the LLM, keeping the important lines byte-for-byte while cutting token count. Use when a task involves reducing agent/LLM token usage or context bloat, choosing a context-compression approach, or setting up Headroom itself. It is a tool/plugin (PyPI `headroom-ai`, npm `headroom-ai`, Claude Code plugin), not a design skill. Source: github.com/headroomlabs-ai/headroom.
---

# Headroom — context compression for AI agents

Headroom compresses what an agent reads before it hits the model — same answers,
a fraction of the tokens. Compression runs locally; no prompt or file content is
sent anywhere to be compressed.

## When to reach for it

- An agent's context is bloated with large tool outputs, logs, or file dumps.
- You want to cut token cost/latency without dropping the lines that matter.
- You're comparing context-compression options for an agent pipeline.

## Install (do these on the real machine, not committed here)

- **Claude Code plugin:** `/plugin marketplace add headroomlabs-ai/headroom`, then install the `headroom` plugin.
- **Python:** `pip install headroom-ai`
- **npm:** `npm i headroom-ai`
- **Docs / model:** https://docs.headroomlabs.ai · model `kompress-v2-base` on Hugging Face.

## Note

This is a reference stub, not the tool's code. Headroom is Apache-2.0, actively
maintained (headroomlabs-ai/headroom). When you actually need it, install from
one of the channels above rather than vendoring it here.
