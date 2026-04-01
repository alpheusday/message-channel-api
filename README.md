# MessageChannel API

A MessageChannel API.

## Installation

Install this package as a dependency in the project:

```sh
# npm
npm i message-channel-api

# Yarn
yarn add message-channel-api

# pnpm
pnpm add message-channel-api

# Bun
bun add message-channel-api
```

## Usage

For importing the polyfill, add the following to the entry:

```ts
import "message-channel-api/polyfill";
```

## Compatibility

### Runtime compatibility

- Build target: ES2015
- Package format: TypeScript declarations, ESModule, CommonJS
- Install target selection: `self` > `window` > `globalThis` > `global`
- Required ES2015 built-ins: `Promise`, `WeakMap`, `Map`, `Set`
- Supported missing globals: `Event`, `EventTarget`, `MessageEvent`, `queueMicrotask`, `structuredClone`

### Web API compatibility

The Web API compatibility matrix is as follows:

| Area                         | Status                | Notes                                                                                                                                                                             |
| ---------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core channel API             | Supported             | `MessageChannelPolyfill` provides entangled `port1` and `port2`.                                                                                                                  |
| Core port API                | Supported             | `MessagePortPolyfill` supports `postMessage()`, `start()`, `close()`, `onmessage`, and `onmessageerror`.                                                                          |
| Message listeners            | Supported             | `addEventListener()` and `removeEventListener()` work for message listeners.                                                                                                      |
| Queueing before `start()`    | Supported             | Messages queue until the receiving port is started.                                                                                                                               |
| `onmessage` auto-start       | Supported             | Assigning `onmessage` starts the receiving port and flushes queued messages.                                                                                                      |
| Delivery timing              | Different             | Message dispatch is scheduled with `queueMicrotask()` or `Promise.resolve().then()`, so ordering may differ from native implementations.                                          |
| Native structured clone      | Supported             | Uses native `structuredClone()` when the runtime provides it.                                                                                                                     |
| Fallback cloning             | Supported with limits | In older runtimes, common values are cloned: primitives, plain objects, arrays, `Map`, `Set`, `Date`, `RegExp`, `ArrayBuffer`, `SharedArrayBuffer`, `DataView`, and typed arrays. |
| Transfer lists               | Partial               | Transfer lists are forwarded to native `structuredClone()` when it supports them. `ArrayBuffer` transfer is covered by tests.                                                     |
| `messageerror` dispatch      | Not supported         | The `onmessageerror` property exists, but `messageerror` events are not currently dispatched. Clone failures throw `DataCloneError` from `postMessage()`.                         |
| Event model scope            | Partial               | The event behavior is implemented for `MessagePort` usage, not as a full DOM `EventTarget` replacement.                                                                           |
| Transfer emulation           | Not supported         | Transfer lists are not emulated when native `structuredClone()` is unavailable.                                                                                                   |
| Non-plain/custom clone cases | Not supported         | Functions, symbols, and most custom class instances are not cloneable without native `structuredClone()`.                                                                         |

## License

This project is licensed under the terms of the MIT license.
