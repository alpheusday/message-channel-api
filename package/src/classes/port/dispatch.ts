import type { MessagePortState } from "#/@types/port";
import type { MessagePortPolyfill } from "#/classes/port";

import { createMessageEvent } from "#/classes/port/clone";
import { getMessagePortState } from "#/classes/port/state";

const enqueueTask = (callback: () => void): void => {
    if (typeof queueMicrotask === "function") {
        queueMicrotask(callback);
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

    if (state.closed || !state.started) return void 0;

    while (
        !state.closed &&
        state.started &&
        state.messageQueueIndex < state.messageQueue.length
    ) {
        const queuedMessage: unknown =
            state.messageQueue[state.messageQueueIndex];

        state.messageQueueIndex += 1;

        port.dispatchEvent(createMessageEvent("message", queuedMessage));
    }

    if (state.messageQueueIndex >= state.messageQueue.length) {
        resetMessageQueue(state);
    }
};

const scheduleMessageDispatch = (port: MessagePortPolyfill): void => {
    const state: MessagePortState = getMessagePortState(port);

    if (
        state.closed ||
        state.dispatchScheduled ||
        state.messageQueueIndex >= state.messageQueue.length ||
        !state.started
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

export { enqueueMessage, resetMessageQueue, scheduleMessageDispatch };
