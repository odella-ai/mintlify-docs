---
sidebar_label: 02 - Interpolation & More Block Types
---

# Interpolation & More Block Types

In the sidebar you should see the flows tab with a list of numbered folders with flows. These are the flows that are included in the tutorial project.

Inside the `2. Interpolation` folder you should see an `Interpolation` flow. Click on the flow to open it.

You should see the following flow:

![Interpolation Flow](./assets/02-interpolation-overview.png)

Try running this flow by clicking the `Run` button. You will see the two [Chat Blocks](../block-reference/chat.mdx) run in parallel. Then, you will get a user input prompt that looks something like this:

![User Input Prompt](./assets/02-interpolation-user-input.png)

Try entering the name of one of the contracts in the list and submitting. You should then see the final [Chat Block](../block-reference/chat.mdx) start to run. Once it is complete, it should give you a template for that contract type you have chosen!

Let's go over this flow piece by piece:

## Setup

First, we have one [Text Block](../block-reference/text.mdx) as a system prompt, and two [Prompt Blocks](../block-reference/prompt.mdx) to prompt GPT to generate text:

![Interpolation Flow](./assets/02-interpolation-setup.png)

The system prompt text is:

> You are an AI contract template generator. Given a type of contract from the user, you will output a template that the user can then use to draft a contract using your template.

The first prompt is:

> Please give the user an introduction to yourself and ask what contract they would like a draft for.

The second prompt is:

> Provide a list of contract types you can generate templates for. A maximum of 10. Reply with only a list of contract types.

The system prompt is connected to the `System Prompt` port of all the [Chat Blocks](../block-reference/chat.mdx) in the flow. The first prompt is connected to the `Prompt` port of the first chat block, and the second prompt is connected to the `Prompt` port of the second chat block.

![System Prompt Connection](./assets/02-interpolation-system-prompt.png)

## Initial Prompts and Combining Outputs

After each of the chats has (in parallel) generated its output (the first being an introduction, and asking the user what contract to generate, and the 2nd being a list of contracts it can generate), the two outputs are fed into a [Text Block](../block-reference/text.mdx) that combines the two outputs into one string:

> {{introduction}}
>
> Here are some contract types I can generate templates for:
>
> {{templates}}

The text inside {{curly_braces}} is marked as a replacement for one of the input ports of the text block. The inputs to the text block are dynamic based on the text prompt inside the text block. In this case, we get two inputs, `introduction` and `templates`, corresponding to the two {{curly_braces}} in the text prompt and the two previous chat blocks.

## User Input

Using the toggle at the bottom of the settings of the [User Input Block](../block-reference/user-input.mdx), we can set the user input's question to be dynamic! So, we pass the merged text into user input block's question port to ask the combined question for the user

![Toggle](./assets/02-interpolation-user-input-toggle.png)

## Additional System Prompt

The next thing we do is combine all these messages together using an [Assemble Prompt Block](../block-reference/assemble-prompt.mdx), and additionally append one more system prompt instructing the AI what to do next:

![Assemble Prompt](./assets/02-interpolation-assemble-prompt.png)

The prompt is a [Prompt Block](../block-reference/prompt.mdx) set to type System with the following text:

> The user has indicated that they want to generate this contract type: {{type}}. You must now output a template for this contract type. Only reply with a template.

We pass the text the user entered for the user input block into the `type` port of the system prompt.

## Final Response

Finally, we pass this list of messages into a final [Chat Block](../block-reference/chat.mdx) to generate the final response, which should be a contract template!

![Final Response](./assets/02-interpolation-final-response.png)
