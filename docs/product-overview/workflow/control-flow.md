# Control Flow

The flow of data in Lawme (and the control of that flow) is handled in two passes on the flow of blocks.

## First Pass: Topological Sort & Entry Points

The first pass over blocks works on a topological sort basis. Lawme will find all blocks with no blocks that depend on them. These blocks are considered the "output blocks" of the flow.

Lawme will then find all blocks that depend on the output blocks, and so on, adding the block to a "needs to be processed" list.

Should a cycle be encountered at this point, Lawme will proceed as normal.

During the first pass, all blocks that have no dependencies (no data flowing into them) will be marked as "input blocks".

## Second Pass: Execution

Starting at the input blocks marked in the first pass, rivet will execute all pending
blocks in **parallel**.

Every time one of the blocks that is currently executing finishes, it will check to see if any of the blocks that depend on it are ready to be executed. If so, it will execute them in parallel with any other currently-executing block.

A block is defined as ready to execute if all of its dependencies have been satisfied. A dependency is satisfied if the block it depends on has finished executing and has a value to pass to the dependent block.

### Control Flow Exclusions

What happens when an If block is encountered, and the output of the If block should not run? In this case, the output of the If block is the special `control-flow-excluded` value. If this value is passed into any block, then that block will not execute.

Then, every dependent block of the block that returned `control-flow-excluded` will also return `control-flow-excluded`, and so on. In this respect, control flow exclusion "spreads" to every dependent block after the value has been returned.

Many blocks can return a `control-flow-excluded` value, such as a [Match Block](../../block-reference/match.mdx) (for branches that do not match), and an [Extract Object Path Block](../../block-reference/extract-object-path.mdx) (for when the input path is invalid for a given object).

### Control Flow Excluded Consumers

Certain types of blocks are registered as able to "consume" a `control-flow-excluded` value. This means that when the block encounters this value, it will actually run with the actual `control-flow-excluded` value. This allows certain blocks to "break out" of the spreading of `control-flow-excluded` values.

Blocks that can consume `control-flow-excluded` values are:

- [If/Else](../../block-reference/if-else.mdx) - If the `control-flow-excluded` is passed into the `If` port, then the `Else` value will be passed through instead. If the `Else` value is not connected, then the result will again be `control-flow-excluded`.
- [Coalesce](../../block-reference/coalesce.mdx) - `control-flow-excluded` will be considered "falsy" for the sake of the Coalesce block. The values will be skipped over, and subsequent truthy values connected to the Coalesce block will be passed through instead.
- [Race Inputs](../../block-reference/race-inputs.mdx) - If one of the branches passed into the Race Inputs block returns `control-flow-excluded`, then that branch will simply be not considered for the race. Other branches may still execute and return a value, which will be passed through the output of the Race Inputs.
- [Output](../../block-reference/output.mdx) - A Flow Output's `control-flow-excluded` may pass out of the flow to become one of the outputs for a [Subflow](../../block-reference/subflow.mdx) block. This way, some of the outputs of a Subflow may not run, and others may run.
- [Loop Controller](../../block-reference/loop-controller.mdx) - A loop controller needs to consume `control-flow-excluded` values in order to run multiple times. Additionally, passing a `control-flow-excluded` to the `continue` port counts as a "successful" iteration of the loop, and will cause the loop to run again.

### Loop Controller

The loop controller is special, however, in particular its `Break` port. The `Break` port will not pass a `control-flow-excluded` value to the next block
until the loop has finished executing. Otherwise, the loop controller itself could not run multiple times before finally passing a value to the next block.

If any other input port to the loop controller receives a `control-flow-excluded` value, then the loop controller will not run again, and will pass the `control-flow-excluded` value to the block connected to `Break`. Thus, it is important to use an [If/Else](../../block-reference/if-else.mdx) or [Coalesce](../../block-reference/coalesce.mdx) block inside your loop as a "null check" to make sure the loop controller never receives a `control-flow-excluded` value unless you want it to.

## See Also

- [`FlowProcessor.ts`](https://github.com/Ironclad/rivet/blob/main/packages/core/src/model/FlowProcessor.ts)
