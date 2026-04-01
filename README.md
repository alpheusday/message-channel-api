# MessageChannel Polyfill

A polyfill for the `MessageChannel` API.

## Installation

Install this package as a dependency in the project:

```sh
# npm
npm i message-channel-polyfill

# Yarn
yarn add message-channel-polyfill

# pnpm
pnpm add message-channel-polyfill

# Bun
bun add message-channel-polyfill
```

## Usage

Import the polyfill:

```ts
import "message-channel-polyfill/polyfill";
```

## Compatibility

The compatibility matrix is as follows:

| Area                                                      | Status                | Notes                                                                                                                                                                                       |
| --------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core channel API                                          | Supported             | `MessageChannelPolyfill` provides entangled `port1` and `port2`.                                                                                                                            |
| Core port API                                             | Supported             | `MessagePortPolyfill` supports `postMessage()`, `start()`, `close()`, and `onmessage`.                                                                                                      |
| Message listeners                                         | Supported             | `addEventListener()` and `removeEventListener()` work for message listeners.                                                                                                                |
| Queueing before `start()`                                 | Supported             | Messages queue until the receiving port is started.                                                                                                                                         |
| `onmessage` auto-start                                    | Supported             | Assigning `onmessage` starts the receiving port and flushes queued messages.                                                                                                                |
| Native structured clone                                   | Supported             | Uses native `structuredClone()` when the runtime provides it.                                                                                                                               |
| Fallback cloning                                          | Supported with limits | In older runtimes, common values are cloned: primitives, plain objects, arrays, `Map`, `Set`, `Date`, `RegExp`, `ArrayBuffer`, `SharedArrayBuffer`, `DataView`, and typed arrays.           |
| Transfer lists                                            | Partial               | `ArrayBuffer` transfer lists work when native `structuredClone()` transfer support is available.                                                                                            |
| Older runtimes                                            | Supported             | Works without native `Event`, `EventTarget`, `MessageEvent`, `queueMicrotask`, or `structuredClone` globals.                                                                                |
| Global installation                                       | Supported             | `installMessageChannelPolyfill()` and the `message-channel-polyfill/polyfill` entry only fill missing globals and do not overwrite existing `MessageChannel` or `MessagePort` constructors. |
| Full Web API parity                                       | Not guaranteed        | This package does not currently claim 100% Web API compatibility.                                                                                                                           |
| `messageerror`                                            | Not supported         | `messageerror` events are not currently dispatched; clone failures throw `DataCloneError` from `postMessage()`.                                                                             |
| Transfer emulation without native clone support           | Not supported         | Transfer lists are not emulated when native `structuredClone()` is unavailable.                                                                                                             |
| Non-plain/custom clone cases without native clone support | Not supported         | Functions, symbols, and most custom class instances are not cloneable without native `structuredClone()`.                                                                                   |
| Delivery timing                                           | Different             | Message dispatch is scheduled with `queueMicrotask()` or `Promise.resolve().then()`, so ordering may differ from native implementations.                                                    |
| Event model scope                                         | Partial               | The event behavior is implemented for `MessagePort` usage, not as a full DOM `EventTarget` replacement.                                                                                     |

## License

This project is licensed under the terms of the MIT license.
