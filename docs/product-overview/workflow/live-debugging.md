---
title: 'Live Debugging'
---

## Currently Executing Blocks

During the execution of a flow, the blocks that are currently executing will be highlighted in orange. For blocks that implement it, you can zoom in and examine the partial output (such as streaming data from an LLM) by hovering over the block.

## Currently Executing Flows

When a flow is executing, such as when using subflows, a spinner will be shown beside the flow in the Flows list. You can click on the flow to view it and its current data, such as the currently executing block.

## Block Output Data

For each block, after its execution, the output of the block will be shown below the block. You can see exactly what data was output from the block.

### Execution Picker

When a block is ran multiple times, such as during loop execution, or if a subflow has been called multiple times, a numeric picker will appear above the output of the block. 1 indicates the first time the block was executed, 2 indicates the second time, and so on.

It is not yet possible to pick between executions of a whole flow, to see only the values that were output from a specific execution of a flow. All executions of a flow are merged together.

## Pausing and Aborting

You may pause the current execution of the flow by clicking **Pause** in the top right. Any currently executing block will finish, but no new blocks will start executing. This is useful for examining the current state of the flow, without entirely aborting it.

To abort the current execution, click **Abort** in the top right.
