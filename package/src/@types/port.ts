import type { MessagePortPolyfill } from "#/classes/port";

type MessagePortEventType = "close" | "message" | "messageerror";

type MessagePortEventDataMap = {
    message: unknown;
    messageerror: unknown;
};

type MessagePortEventMap = {
    close: Event;
    message: MessageEvent<MessagePortEventDataMap["message"]>;
    messageerror: MessageEvent<MessagePortEventDataMap["messageerror"]>;
};

type MessagePortEventHandler<TType extends MessagePortEventType> =
    | ((this: MessagePortPolyfill, event: MessagePortEventMap[TType]) => void)
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

type MessagePortState = {
    closed: boolean;
    closeHandlerRegistered: boolean;
    closePending: boolean;
    dispatchScheduled: boolean;
    entangledPort: MessagePortPolyfill | null;
    messageErrorHandlerRegistered: boolean;
    messageHandlerRegistered: boolean;
    messageQueue: unknown[];
    messageQueueIndex: number;
    onclose: MessagePortEventHandler<"close">;
    onmessage: MessagePortEventHandler<"message">;
    onmessageerror: MessagePortEventHandler<"messageerror">;
    started: boolean;
};

type FallbackCloneContext = {
    seen: WeakMap<object, object>;
};

export type {
    FallbackCloneContext,
    MessagePortEventDataMap,
    MessagePortEventHandler,
    MessagePortEventMap,
    MessagePortEventType,
    MessagePortState,
    TypedArray,
    TypedArrayConstructor,
};
