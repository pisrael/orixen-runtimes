# Block

A block has a "run" function that is triggered when the block is called. Each block has inputs and outputs in
the folders ./inputs and ./outputs.

The block can have multiple inputs or outputs. Each file in this folder represents a input or an output type.

Inputs are received as parameter of the "run" function.
Outputs can be sent data in the run function using the send function.

If there are multiple outputs, the output name must be used (check OutputNames to refer to it). In this case, send
function signature should be `(payload, to)`. If there's a single output, no need to use the "to" parameter.

## Context

The _lib SHOULD NEVER BE MODIFIED, it contains generated code that is constantly modified (THIS IS VERY IMPORTANT). It
contains helper functions that can be used, but treat the _lib folder as "read_only".

If an error is caught, throw a FunctionError with a descriptive message and STATUS_CODE.

Blocks should be self-contained. Don't WASTE TOKENS reading files of other blocks, unless specifically requested.

Follow the instructions to code the block carefully. If there is a working implementation, focus on the difference of the spec 
given and the current implementation. If you need, you can change the inputs and outputs types to fit the
instruction needs.

Run `npm install` and `npm run build` to build the block. ONLY add packages needed through `npm install`. Do not add
them direclty to `package.json`. REMOVE unused packages with `npm uninstall`.

Even if inputs are declared as mandatory types, always validate them and handle errors gracefully.

Use the principle of single responsability when coding functions. Each function should do one thing only. Be mindful and break functions into smaller ones.

Organize functions hierarchically, placing helper functions below the main function.


Consider that the following process.env variables are available:
- MY_ENV1
- MY_ENV2


IF NEEDED, use samples from previous executions to understand the input data in the following path:
- default in
  - `../function_a-bmk7p2se9/.orixen/outputs/omk7p3q4u`
