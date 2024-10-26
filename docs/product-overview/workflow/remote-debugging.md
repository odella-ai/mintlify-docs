---
title: 'Remote Debugging'
---

Remote debugging allows you to integrate the Lawme Core or Lawme Block libraries in another application, run your flows in that other application, but see the live flow execution in the Lawme application! This is useful for debugging flows that are running in a production environment, or for debugging flows that are running in a different environment than the Lawme application. This is very useful when using the [External Call Block](../../block-reference/external-call), as the default executor cannot call into your own application's code.

## Connecting the Remote Debugger

Select the **Remote Debugger** menu option in the Action Bar's menu dropdown, or press the **F5** key to open the remote debugger dialog. You must enter a WebSocket URI here to connect to. This URI must be a WebSocket server that uses `startLawmeDebuggerServer`. This is a function exported by the Lawme Core and Lawme Block libraries. You can use this function to start a WebSocket server that will allow the Lawme application to connect to it.

![remote debugger](../assets/remote-debugger.png)

By default, `startLawmeDebuggerServer` will listen for all WebSocket connections on port **21888**. You can change this by passing a port number to the options argument to `startLawmeDebuggerServer`.

## Running a Flow

If the debugger server has configured `dynamicFlowRun`, then when clicking the **Run** button in Lawme, the currently viewed flow will be executed on the remote server. If `allowFlowUpload` is enabled, then the flow will be uploaded to the remote server before being executed, allowing you to make changes to the current flow and run them without saving or uploading your project file to the remote server.

## Using the Remote Debugger

Whenever a flow is started on the server, its execution will immediately be visible in Lawme if it is connected as a remote debugger.

By default, you can both pause and abort the current execution in Lawme, and the execution will be paused or aborted on the remote server. This can be useful if you want to pause the execution to inspect the current state of the flow, or if you want to abort the execution because you detect some incorrect behavior.
