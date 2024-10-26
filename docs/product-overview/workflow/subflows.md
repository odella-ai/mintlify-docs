---
title: Subflows
---

Subflows are a powerful tool for composing flows together. They allow you to create a flow that can be used as a block in another flow. This allows you to create reusable components, and to create flows that are easier to understand.

If you are familiar with code, a flow is like a function, and a subflow is like a function call. You can pass inputs into a subflow, and it will return outputs. The inputs can be thought of as function arguments, and the outputs can be thought of as the return value. A flow can output multiple values, however.

### Creating a Subflow

To create a subflow, simply create a new flow in your project and add blocks to it.

You may want to add [Input Blocks](../../block-reference/input) to the flow to allow you to pass in values to the subflow. You may also want to add [Output Blocks](../../block-reference/output) to the flow to allow you to return values from the subflow.

### Create Subflow Helper

If you select multiple blocks by holding shift and clicking on them, you can right click on the selection and choose **Create Subflow**. This will create a new subflow with the selected blocks in it. The blocks will not be removed from the current flow at this time. See [working with blocks](./adding-connecting-blocks) for more information on how to use this.

### Calling a Subflow

To call a subflow, add a [Subflow Block](../../block-reference/subflow) to your flow. Connect any required data to the input ports of the subflow, and connect any output data of the subflow to the next blocks in your chain.

Subflows can call other subflows, allowing you to create a hierarchy of subflows. You can also call the current flow as a subflow, however be careful to avoid infinite loops!
