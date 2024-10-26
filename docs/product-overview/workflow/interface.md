---
title: 'The Interface'
---

## Sidebar

### Project Info Tab

In the project info tab you can set the name and description of your project. This data is saved with your project file and used for documenting your project.

On the project info tab you can also configure what plugins are enabled for your project. See the [Plugins](./plugins.md) documentation for more information.

![Project Info](../assets/project-info.png)

### Flows Tab

The flows tab is where you can navigate between all flows in your project, add new flows, and delete/duplicate existing flows.

![Flows](../assets/flows.png)

Clicking on a flow in the list will open it in the main flow area. To add a new flow, right click in the blank space in the flow list and select "New Flow".

To delete a flow, right click on it and select "Delete Flow". This will delete the flow from your project.

:::caution

There is no undo at this time! Deleting a flow is permanent! We recommend you store your rivet project files in source control.

:::

To duplicate a flow, right click on it and select "Duplicate Flow". This will create a new flow with the same blocks and connections as the original flow.

### Flow Info Tab

In the flow info tab you can set the name and description of your flow. This data is saved with your project file and used for documenting your flow and organizing your flows in the flow list.

![Flow Info](../assets/flow-info.png)

## Flow

You will mainly be working in the Flow area of the interface. It contains all of your blocks in the current flow and the connections between them.

![Flow area](../assets/flow-area.png)

### Blocks

For information on how to manipulate blocks, see [Working with Blocks](./adding-connecting-blocks.md).

### Canvas

The canvas is the main area of the flow. You can click and drag on the canvas to move the flow around. You can also use the scroll wheel to zoom in and out.

Right click to open the context menu to add new blocks.

Hold shift and drag to create a selection box. Any blocks inside the selection box will be selected. You can then move all of the selected blocks as a group, or create a subflow from the selected blocks. You can also hold shift and click the title bar of a block to add it to the selection.

## Block Editor

The block editor is visible when you click the edit block icon on a block. It is used to edit the data on the block.

You can close the block editor by clicking the close button in the top right, by pressing the escape key, or by clicking on any blank space in the flow.

### Block Title & Description

You can edit the title of the block in the block editor (changes the title shown on the flow). You can also edit the description of the block in the block editor, for documentation purposes.

### Batched Block

Toggles whether the block is a batched block. For more information on batched blocks, see the [Batching](./batching) documentation.

When batching is enabled, the number input next to the batch toggle is the **maximum batch amount**. This is a safeguard for excessive batching. If the data exceeds the maximum batch amount, only the first N items will be executed, where N is the maximum batch amount.

### Variants

Variants are used to create multiple versions of the same block. The button on the right allows you to save the current block configuration as a new variant. The dropdown on the left allows you to apply existing variants to the current data on the block.

Variants allow you to save slight differences to a block, and test them without losing the data. For example, you may have a [Text Block](../../block-reference/text) with a message to an LLM. You may want to test different variations of the message to see which one performs better and gives better AI results.

### Block Data Editor

This area contains the editors for the currently selected block. The editor will change depending on the type of block you are editing. For example, the shown [Text Block](../../block-reference/text) has a text editor, and the [Chat Block](../../block-reference/chat) has a chat configuration editor.

## Overlays

At the top of the screen are a set of overlay panels you may enable. The available overlays are listed below.


### Workflow Viewer

The chat viewer overlay gives you a full screen view of every Chat block that has been performed, or is in-progress, in your project.

This view can give you a quick overview of how your AI is performing, and what it is doing at any given time. It can also be used to debug issues with your AI.

## Action Bar

The action bar is in the top-right of the screen. It contains buttons for running, pausing, and aborting the current flow, and the main Lawme menu button.

![Action bar](../assets/action-bar.png)

### Run

Clicking the run button will run the current flow.

### Abort

Visible while a flow is running. Clicking the abort button will abort the current flow.

### Pause/Resume

Visible while a flow is running. Clicking the pause button will pause the current flow, and clicking the resume button will resume the current flow from where it was paused.

### Menu

Access the main Lawme menu by clicking the menu '...' button.
