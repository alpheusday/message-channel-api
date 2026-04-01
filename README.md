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

For using the API directly:

```ts
import { MessageChannel } from "message-channel-api";

const channel: MessageChannel = new MessageChannel();

channel.port2.onmessage = (event: MessageEvent<unknown>): void => {
    console.log(event.data);
};

channel.port1.postMessage("hello");
```

For importing the polyfill, add the following to the entry:

```ts
import "message-channel-api/polyfill";
```

## Compatibility

The following is a summary of the compatibility for this package.

### Runtime Compatibility

- Build target: ES2015
- Package format: TypeScript declarations, ESModule, CommonJS
- Install target selection: `self` > `window` > `globalThis` > `global`
- Required ES2015 built-ins: `Promise`, `WeakMap`, `Map`, `Set`
- Supported missing globals: `Event`, `EventTarget`, `MessageEvent`, `queueMicrotask`, `structuredClone`

### MessageChannel API Compatibility

The compatibility list below follows the API surface listed by MDN in [`MessageChannel`](https://developer.mozilla.org/en-US/docs/Web/API/MessageChannel).

| API surface      | Support   | Notes                                                                 |
| ---------------- | --------- | --------------------------------------------------------------------- |
| `MessageChannel` | Supported | Exported as `MessageChannelPolyfill` and aliased as `MessageChannel`. |
| `port1`          | Supported | Exposes one side of the entangled port pair.                          |
| `port2`          | Supported | Exposes the other side of the entangled port pair.                    |

### MessagePort API Compatibility

The compatibility list below follows the API surface listed by MDN in [`MessagePort`](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort).

| API surface          | Support   | Notes                                                                                                                                                                                                                                |
| -------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `MessagePort`        | Supported | Supports `postMessage()`, `start()`, `close()`, `onclose`, `onmessage`, `onmessageerror`, `addEventListener()`, and `removeEventListener()` for port events.                                                                         |
| `start()`            | Supported | Queued messages flush after `start()`. Assigning `onmessage` also starts the receiving port.                                                                                                                                         |
| `postMessage()`      | Partial   | Messages are cloned and delivered asynchronously. Transfer lists are forwarded only when native `structuredClone()` supports them, and native-style `MessagePort` transfer plus `MessageEvent.ports` population are not implemented. |
| `close()`            | Supported | Closing one port detangles both ports and dispatches `close` on the peer port.                                                                                                                                                       |
| `message` event      | Supported | Works with both `addEventListener("message", ...)` and `onmessage`.                                                                                                                                                                  |
| `messageerror` event | Partial   | `onmessageerror` exists, but `messageerror` events are not currently dispatched. Clone failures throw `DataCloneError` from `postMessage()`.                                                                                         |

Additional notes:

- Without native `structuredClone()`, cloning is limited to common built-in data types such as primitives, plain objects, arrays, `Map`, `Set`, `Date`, `RegExp`, `ArrayBuffer`, `SharedArrayBuffer`, `DataView`, and typed arrays.
- The event behavior is implemented for `MessagePort` usage, not as a full DOM `EventTarget` replacement.

## License

This project is licensed under the terms of the MIT license.
