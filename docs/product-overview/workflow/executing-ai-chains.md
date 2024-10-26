---
title: 'AI Chains'
---

## Data Flow

In general, data flows from **left to right** in a flow.

Flow execution will start from every block that does not have any inputs. You can refer to these blocks as **root blocks**.

When a block is executed, it will send its output to all of its connected blocks.

A block must wait for all of its inputs to be received before it can execute.

The following flow will _roughly_ execute in the order of these numbers. Every block with the same number will run in parallel. The arrows show the rough "flow" of the data.

![Data Flow](../assets/data-flow.png)

## Chaining AI Responses

A common flow for chaining AI responses will be something like:

- Initialize a system prompt by using a [Text Block](../../block-reference/text) or a [Prompt Block](../../block-reference/prompt), and connect the text to the System Prompt port of a [Chat Block](../../block-reference/chat).
- Construct your main prompt by using a [Text Block](../../block-reference/text) or a [Prompt Block](../../block-reference/prompt), and connect the text to the Prompt port of a [Chat Block](../../block-reference/chat). You may also use an [Assemble Prompt Block](../../block-reference/assemble-prompt) to construct a series of messages to send to the Chat block. The Prompt input of the chat block accepts a string, array of strings, a chat message (from a Prompt block), or an array of chat messages (which can be constructed using an Assemble Prompt block).
- Commonly you will want to parse the output text of the Chat block. This can be accomplished using the [Extract with Regex Block](../../block-reference/extract-with-regex). You can also use the [Extract with Regex Block](../../block-reference/extract-with-regex) to extract multiple values from the output text.
- You may want to take different actions depending on what your extracted value is. For this, you can use the [Match Block](../../block-reference/match) to match the extracted value against a series of patterns. Or, you can use an [If/Else Block](../../block-reference/if-else) to get fallback values.
- Next, you will often want to use more [Text Blocks](../../block-reference/text) or [Prompt Blocks](../../block-reference/prompt) while interpolating the value you extracted, to construct a new message to send to another [Chat Block](../../block-reference/chat).
- The above chain can then continue indefinitely, with the output of one Chat block being used as the input to another Chat block. Or, you can use a [Loop Controller Block](../../block-reference/loop-controller) to pipe the results of this chain back into itself, for OODA AI agent application.
