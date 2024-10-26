---
title: 'Flows'
---

A Lawme project contains a set of named flows. Each of these flows contains a set of blocks connected together, forming the flow.

If you are used to code, a flow is analogous to a function. A function is a set of code that can be called from other code. A flow is a set of blocks that can be called from other flows.

## Creating a Flow

To create a new flow, right click in the blank space in the flow list in the sidebar, and select "New Flow". This will create a new blank flow. The new flow is unsaved by default.

Go into the **Flow Info** tab and give your flow a new name, then save the new flow by pressing **Ctrl+S** or **Cmd+S**. Your new flow will now appear in the flow list.

## Navigating Between Flows

To navigate between flows, click on the flow in the flow list in the sidebar. This will open the flow in the main flow area.

## Deleting a Flow

To delete a flow, right click on it in the flow list in the sidebar and select "Delete Flow". This will delete the flow from your project. (**Warning** there is no undo at this time!)

## Running a Flow

To run the currently selected flow, press the **Run** button in the top right of Lawme. You can then watch the flow execute live.

When connected to a remote debugger, whenever the flow executes remotely, it will automatically show the result of the run in the current flow. If you have implemented `dynamicFlowRun` in your debugger server, you can also click the **Run** button to execute the flow remotely. If it is not implemented, the run button will not do anything.

## Flow Inputs

A flow has a set of inputs that can be thought of as the "arguments" to the flow. When calling the flow as a subflow, or when calling the flow from your integrated code, you can pass in these inputs, which will be available to the blocks in the flow.

To add an input to the flow, add a new [Input Block](../../block-reference/input). The ID of the Flow Input block will be the name of the input on the flow. You may give default values for inputs in the block editor for the input.

The output port of the Flow Input will contain the value of the input (from the parent flow or code) when the flow is called.

A useful pattern is to toggle on the input port for the default value input, and pass in some testing data to the default value port. Then, when this flow is executed in isolation.

## Flow Outputs

Similar to flow inputs, a flow can have outputs that can be thought of as the "return value" of the flow. When calling the flow as a subflow, or when calling the flow from your integrated code, you can read the values of these outputs.

To add an output to the flow, add a new [Output Block](../../block-reference/output). The ID of the Flow Output block will be the name of the output on the flow.

Connect a block to the input port of the Flow Output block. The value of the output port of the block will be the value of the output of the flow.

Once the flow has finished executing, the code or parent flow will be able to proceed with the outputs of the flow.

## Exporting Flows

To export a single flow from your project, open the flow by clicking on it, and choose **Export Flow** from the File menu. This will open a file dialog where you can choose a location to save the flow. The flow will be saved as a `.rivet-flow` file.

## Importing Flows

To import a flow into the current project (merging it into the current project), choose **Import Flow** from the File menu. This will open a file dialog where you can choose a flow to import. The flow will be imported into the current project.
