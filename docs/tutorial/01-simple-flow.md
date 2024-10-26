---
sidebar_label: 01 - Simple Flow
---

# Simple Flow

In the sidebar you should see the flows tab with a list of numbered folders with flows. These are the flows that are included in the tutorial project.

Inside the `1. Simple Flow` folder you should see a `Simple Flow` flow. Click on the flow to open it.

You should see the following flow:

![Simple Flow](./assets/simple-flow-start.png)

This flow has 2 blocks. A [text](../block-reference/text) block and a [chat](../block-reference/chat) block.

Click the green run button in the top right corner of the flow to run this flow.

![Simple Flow](./assets/run-button.png)

You should see something similar to the following:

![Simple Flow](./assets/simple-flow-after-run.png)

When you ran the flow, the text block sent its output to the prompt of the chat block. The chat block then sent a post request to OpenAI's [create](https://platform.openai.com/docs/api-reference/chat/create) endpoint and received a response. The response was then sent to the output of the flow.

Let's experiment with the blocks in this flow. To change the parameters of a block, click on the edit gear in the top right on the block.

## Experiments

- Change the text block to ask a new question like "What's the difference between a NDA and a MNDA". Run the flow again and observe the chat block respond with new text.

- Change the chat blocks max tokens to 256. Run the flow again and observe the chat block respond with less text.

- Change the chat blocks temperature to 1. Run the flow again and observe the chat block respond with more variable text.
