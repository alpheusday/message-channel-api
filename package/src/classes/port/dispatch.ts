import type { MessagePortState } from "#/@types/port";
import type { MessagePortPolyfill } from "#/classes/port";

import { createMessageEvent, createPortEvent } from "#/classes/port/clone";
import { getMessagePortState } from "#/classes/port/state";

const enqueueTask = (callback: () => void): void => {
    const globalScope: {
        setImmediate?: (handler: () => void) => void;
    } = globalThis as {
        setImmediate?: (handler: () => void) => void;
    };

    if (typeof globalScope.setImmediate === "function") {
        globalScope.setImmediate(callback);
        return void 0;
    }

    if (typeof setTimeout === "function") {
        setTimeout(callback, 0);
        return void 0;
    }

    Promise.resolve().then(callback);
};

const resetMessageQueue = (state: MessagePortState): void => {
    state.messageQueue = [];
    state.messageQueueIndex = 0;
};

const flushMessageQueue = (port: MessagePortPolyfill): void => {
    const state: MessagePortState = getMessagePortState(port);

    if (
        !state.closed &&
        state.started &&
        state.messageQueueIndex < state.messageQueue.length
    ) {
        const queuedMessage: unknown =
            state.messageQueue[state.messageQueueIndex];

        state.messageQueueIndex += 1;

        port.dispatchEvent(createMessageEvent("message", queuedMessage));
    } else if (!state.closed && state.closePending) {
        state.closePending = false;
        port.dispatchEvent(createPortEvent("close"));
    }

    if (state.messageQueueIndex >= state.messageQueue.length) {
        resetMessageQueue(state);
    }

    scheduleMessageDispatch(port);
};

const scheduleMessageDispatch = (port: MessagePortPolyfill): void => {
    const state: MessagePortState = getMessagePortState(port);

    if (
        state.dispatchScheduled ||
        ((state.messageQueueIndex >= state.messageQueue.length ||
            !state.started) &&
            !state.closePending)
    ) {
        return void 0;
    }

    state.dispatchScheduled = true;

    enqueueTask((): void => {
        const currentState: MessagePortState = getMessagePortState(port);

        currentState.dispatchScheduled = false;

        flushMessageQueue(port);
    });
};

const enqueueMessage = (port: MessagePortPolyfill, message: unknown): void => {
    const state: MessagePortState = getMessagePortState(port);

    if (state.closed) return void 0;

    state.messageQueue.push(message);

    scheduleMessageDispatch(port);
};

const enqueuePortCloseEvent = (port: MessagePortPolyfill): void => {
    const state: MessagePortState = getMessagePortState(port);

    if (state.closed || state.closePending) return void 0;

    state.closePending = true;

    scheduleMessageDispatch(port);
};

export {
    enqueueMessage,
    enqueuePortCloseEvent,
    resetMessageQueue,
    scheduleMessageDispatch,
};
