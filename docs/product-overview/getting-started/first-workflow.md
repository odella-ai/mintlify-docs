---
title: Your First Workflow
---

When you first open Lawme you are presented with a blank canvas. This is where you can create your first AI agent.

Right click (or press space!) to open the **Add** menu, go into **Common**, and select a [Chat Block](../../block-reference/chat). This will create a new Chat block where you right clicked. You can also type "chat" into the search bar to find the Chat block.

Do the same thing again, but now create a [Text Block](../../block-reference/text) (in Common or Text) to the left of the Chat block.

Drag from the **Output** port of the Text block to the **Prompt** port of the Chat block. This will connect the two blocks together.

Next, click the gear on the text block to edit its text.

In the editor, change the text to "Hello, AI!". You can then close the editor by clicking the close button in the top right, clicking on any blank space in the flow, or pressing Escape.

![hello ai editor](assets/hello-ai-editor.png)

Finally, click the **Run** button in the top right of the Lawme window! The "Hello, AI" text will be sent to the Chat block, which will then send it to OpenAI to generate a response.

The response from the AI is visible under the Chat block's green bar. By hovering the mouse over the Chat block, you can expand the response.

![hello ai response](assets/hello-ai-response.png)

If you click the Expand icon in the top right of the response area, you can expand the AI's response to a full screen view. Click outside of the full screen view to close it.

Congratulations! You've just created your first AI chain in Lawme! There is a lot more work to enable a full AI Agent, but this is a good start.

Next, you can go through the [tutorial](../../tutorial) to learn more about what blocks are available and how to assemble them into a full AI Agent, or you can continue with the [user guide](../workflow/overview-of-interface) to learn more about Lawme's features in depth.
