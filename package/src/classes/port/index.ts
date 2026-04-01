import type { MessagePortEventHandler, MessagePortState } from "#/@types/port";

import { cloneMessageValue } from "#/classes/port/clone";
import {
    enqueueMessage,
    resetMessageQueue,
    scheduleMessageDispatch,
} from "#/classes/port/dispatch";
import { MessagePortEventTarget } from "#/classes/port/event";
import {
    connectMessagePorts,
    getMessagePortState,
    initializeMessagePortState,
} from "#/classes/port/state";

function handleMessagePropertyListener(
    this: MessagePortPolyfill,
    event: Event,
): void {
    const state: MessagePortState = getMessagePortState(this);

    state.onmessage?.call(this, event as MessageEvent<unknown>);
}

function handleMessageErrorPropertyListener(
    this: MessagePortPolyfill,
    event: Event,
): void {
    const state: MessagePortState = getMessagePortState(this);

    state.onmessageerror?.call(this, event as MessageEvent<unknown>);
}

class MessagePortPolyfill extends MessagePortEventTarget {
    public constructor() {
        super();

        initializeMessagePortState(this);
    }

    public get onmessage(): MessagePortEventHandler<"message"> {
        return getMessagePortState(this).onmessage;
    }

    public set onmessage(handler: MessagePortEventHandler<"message">) {
        const state: MessagePortState = getMessagePortState(this);

        state.onmessage = handler;

        if (handler === null) {
            if (state.messageHandlerRegistered) {
                super.removeEventListener(
                    "message",
                    handleMessagePropertyListener,
                );
                state.messageHandlerRegistered = false;
            }

            return;
        }

        if (!state.messageHandlerRegistered) {
            super.addEventListener("message", handleMessagePropertyListener);
            state.messageHandlerRegistered = true;
        }

        this.start();
    }

    public get onmessageerror(): MessagePortEventHandler<"messageerror"> {
        return getMessagePortState(this).onmessageerror;
    }

    public set onmessageerror(handler: MessagePortEventHandler<"messageerror">) {
        const state: MessagePortState = getMessagePortState(this);

        state.onmessageerror = handler;

        if (handler === null) {
            if (state.messageErrorHandlerRegistered) {
                super.removeEventListener(
                    "messageerror",
                    handleMessageErrorPropertyListener,
                );
                state.messageErrorHandlerRegistered = false;
            }

            return;
        }

        if (!state.messageErrorHandlerRegistered) {
            super.addEventListener(
                "messageerror",
                handleMessageErrorPropertyListener,
            );
            state.messageErrorHandlerRegistered = true;
        }
    }

    public close(): void {
        const state: MessagePortState = getMessagePortState(this);

        if (state.closed) return void 0;

        state.closed = true;
        state.started = false;
        resetMessageQueue(state);

        const entangledPort: MessagePortPolyfill | null = state.entangledPort;

        state.entangledPort = null;

        if (entangledPort !== null) {
            getMessagePortState(entangledPort).entangledPort = null;
        }
    }

    public postMessage(
        message: unknown,
        transferOrOptions?: StructuredSerializeOptions | Transferable[],
    ): void {
        const state: MessagePortState = getMessagePortState(this);

        if (state.closed || state.entangledPort === null) return void 0;

        const entangledPortState: MessagePortState = getMessagePortState(
            state.entangledPort,
        );

        if (entangledPortState.closed) return void 0;

        const clonedMessage: unknown = cloneMessageValue(
            message,
            transferOrOptions,
        );

        enqueueMessage(state.entangledPort, clonedMessage);
    }

    public start(): void {
        const state: MessagePortState = getMessagePortState(this);

        if (state.closed || state.started) return void 0;

        state.started = true;

        scheduleMessageDispatch(this);
    }
}

export { connectMessagePorts, MessagePortPolyfill };
