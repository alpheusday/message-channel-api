import type { MessagePortPolyfill } from "#/classes/port";

type MessagePortEventType = "message" | "messageerror";

interface MessagePortEventDataMap {
    message: unknown;
    messageerror: unknown;
}

type MessagePortEventHandler<TType extends MessagePortEventType> =
    | ((
          this: MessagePortPolyfill,
          event: MessageEvent<MessagePortEventDataMap[TType]>,
      ) => void)
    | null;

type TypedArray =
    | BigInt64Array
    | BigUint64Array
    | Float32Array
    | Float64Array
    | Int8Array
    | Int16Array
    | Int32Array
    | Uint8Array
    | Uint8ClampedArray
    | Uint16Array
    | Uint32Array;

type TypedArrayConstructor = new (
    buffer: ArrayBufferLike,
    byteOffset: number,
    length?: number,
) => TypedArray;

interface MessagePortState {
    closed: boolean;
    dispatchScheduled: boolean;
    entangledPort: MessagePortPolyfill | null;
    messageErrorHandlerRegistered: boolean;
    messageHandlerRegistered: boolean;
    messageQueue: unknown[];
    messageQueueIndex: number;
    onmessage: MessagePortEventHandler<"message">;
    onmessageerror: MessagePortEventHandler<"messageerror">;
    started: boolean;
}

interface FallbackCloneContext {
    seen: WeakMap<object, object>;
}

export type {
    FallbackCloneContext,
    MessagePortEventDataMap,
    MessagePortEventHandler,
    MessagePortEventType,
    MessagePortState,
    TypedArray,
    TypedArrayConstructor,
};
