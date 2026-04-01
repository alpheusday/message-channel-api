import type { MessagePortState } from "#/@types/port";
import type { MessagePortPolyfill } from "#/classes/port";

const messagePortStates: WeakMap<MessagePortPolyfill, MessagePortState> =
    new WeakMap<MessagePortPolyfill, MessagePortState>();

const createMessagePortState = (): MessagePortState => ({
    closed: false,
    dispatchScheduled: false,
    entangledPort: null,
    messageErrorHandlerRegistered: false,
    messageHandlerRegistered: false,
    messageQueue: [],
    messageQueueIndex: 0,
    onmessage: null,
    onmessageerror: null,
    started: false,
});

const getMessagePortState = (port: MessagePortPolyfill): MessagePortState => {
    const state: MessagePortState | undefined = messagePortStates.get(port);

    if (typeof state === "undefined") {
        throw new TypeError("Illegal invocation");
    }

    return state;
};

const connectMessagePorts = (
    leftPort: MessagePortPolyfill,
    rightPort: MessagePortPolyfill,
): void => {
    const leftState: MessagePortState = getMessagePortState(leftPort);
    const rightState: MessagePortState = getMessagePortState(rightPort);

    leftState.entangledPort = rightPort;
    rightState.entangledPort = leftPort;
};

const initializeMessagePortState = (port: MessagePortPolyfill): void => {
    messagePortStates.set(port, createMessagePortState());
};

export {
    connectMessagePorts,
    createMessagePortState,
    getMessagePortState,
    initializeMessagePortState,
};
