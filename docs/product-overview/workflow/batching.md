---
title: Batching
---

Batching a block is a powerful tool for parallelizing execution. Change a block to a Split block by toggling on Split on any block:

![Batching a block](../assets/split-block.png)

When a block is split:

- The block will be executed N times, in parallel
- The input types for the input ports of the block can be arrays of the same type of data that would normally be accepted by the block
- The output types for the output ports of the block will be arrays of data of the same type that would normally be output by the block
- Each execution of the block will be given a single value from the array of data, and executed normally. The output of each execution will be collected into an array, and the array will be output from the block.
- If the input value is not an array, then it will be treated as an array of N copies of the value, where N is the length of the array given to another input port. For example, if one port is given a string `"value"`, and another port is given an array of 3 numbers, then the block will be executed 3 times, and each execution will be given the string `"value"`.
- If multiple values are arrays, then the values will be zipped together for each execution. For example, if one port is given a (string, string), and another port a (number, number), then each execution will be given a (string, number) as its inputs.

## Use Cases

Batching is most useful for parallelizing execution. 

## Chaining

The most powerful feature of batching is its ability to chain batches.

For the above example, the Read File could then be piped into a split [Text Block](../../block-reference/text), to interpolate the contents of each file into another string. The split Text block can then be piped into a split [Chat Block](../../block-reference/chat), to send each file's contents to a chatbot in parallel. The output of the Chat block will be an array of strings, giving you the response from the AI for each file.

## Joining

At some point you will likely wish to join split blocks back into non-split blocks. There are a few ways to accomplish this.

- When an array of strings is passed into a [Text Block](../../block-reference/text) or a [Prompt Block](../../block-reference/prompt), the block will join the array of strings into a single string, separated by newlines. This is the most common method of joining.
- The [Chat Block](../../block-reference/chat) can accept an array of strings or chat messages to its Prompt input.
- The [Extract Object Path](../../block-reference/extract-object-path) block can be used to extract a single value from an array of objects.
- The [Pop Block](../../block-reference/pop) block can be used to extract a single value from an array of any type.
- The [Code Block](../../block-reference/code) block can be used to write custom code to join arrays of data, such as using the [Array.prototype.reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce) function.

## Nested Batching and Arrays of Arrays

Nested batching and arrays of arrays are **not supported**. However, this can be partially worked around by using a split [Subflow Block](../../block-reference/subflow). Since the subflow is split, the flow itself will be executed multiple times in parallel. The subflow can then contain more blocks with batching turned on, effectively allowing for nested batching to any degree. However do be careful with excessive batching, or recursive batching that may cause infinite loops.
