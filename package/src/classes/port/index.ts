import type {
    MessagePortEventHandler,
    MessagePortEventType,
    MessagePortState,
} from "#/@types/port";

import { cloneMessageValue } from "#/classes/port/clone";
import {
    enqueueMessage,
    enqueuePortCloseEvent,
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

function handleClosePropertyListener(
    this: MessagePortPolyfill,
    event: Event,
): void {
    const state: MessagePortState = getMessagePortState(this);

    state.onclose?.call(this, event);
}

type MessagePortHandlerKey = "onclose" | "onmessage" | "onmessageerror";

type MessagePortHandlerRegisteredKey =
    | "closeHandlerRegistered"
    | "messageErrorHandlerRegistered"
    | "messageHandlerRegistered";

type MessagePortPropertyListener = (
    this: MessagePortPolyfill,
    event: Event,
) => void;

class MessagePortPolyfill extends MessagePortEventTarget {
    public constructor() {
        super();

        initializeMessagePortState(this);
    }

    private setPropertyListener<THandlerKey extends MessagePortHandlerKey>(
        type: MessagePortEventType,
        handler: MessagePortState[THandlerKey],
        handlerKey: THandlerKey,
        registeredKey: MessagePortHandlerRegisteredKey,
        listener: MessagePortPropertyListener,
        shouldStart: boolean = false,
    ): void {
        const state: MessagePortState = getMessagePortState(this);

        state[handlerKey] = handler;

        if (handler === null) {
            if (state[registeredKey]) {
                super.removeEventListener(type, listener);
                state[registeredKey] = false;
            }

            return void 0;
        }

        if (!state[registeredKey]) {
            super.addEventListener(type, listener);
            state[registeredKey] = true;
        }

        if (shouldStart) {
            this.start();
        }
    }

    public get onmessage(): MessagePortEventHandler<"message"> {
        return getMessagePortState(this).onmessage;
    }

    public set onmessage(handler: MessagePortEventHandler<"message">) {
        this.setPropertyListener(
            "message",
            handler,
            "onmessage",
            "messageHandlerRegistered",
            handleMessagePropertyListener,
            true,
        );
    }

    public get onmessageerror(): MessagePortEventHandler<"messageerror"> {
        return getMessagePortState(this).onmessageerror;
    }

    public set onmessageerror(handler: MessagePortEventHandler<"messageerror">) {
        this.setPropertyListener(
            "messageerror",
            handler,
            "onmessageerror",
            "messageErrorHandlerRegistered",
            handleMessageErrorPropertyListener,
        );
    }

    public get onclose(): MessagePortEventHandler<"close"> {
        return getMessagePortState(this).onclose;
    }

    public set onclose(handler: MessagePortEventHandler<"close">) {
        this.setPropertyListener(
            "close",
            handler,
            "onclose",
            "closeHandlerRegistered",
            handleClosePropertyListener,
        );
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
            const entangledPortState: MessagePortState =
                getMessagePortState(entangledPort);

            entangledPortState.entangledPort = null;

            enqueuePortCloseEvent(entangledPort);
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
