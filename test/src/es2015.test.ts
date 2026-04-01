import type { MessageChannelPolyfillTarget } from "message-channel-polyfill";

import { describe, expect, test, vi } from "vitest";

type TestGlobalValues = {
    Event?: typeof Event;
    EventTarget?: typeof EventTarget;
    MessageEvent?: typeof MessageEvent;
    queueMicrotask?: typeof queueMicrotask;
    structuredClone?: typeof structuredClone;
};

const waitForTurn = (): Promise<void> => {
    return new Promise<void>((resolve: () => void): void => {
        setTimeout(resolve, 0);
    });
};

const restoreTestGlobalValue = <TValue>(
    target: Record<string, unknown>,
    key: string,
    value: TValue | undefined,
): void => {
    if (typeof value === "undefined") {
        Reflect.deleteProperty(target, key);
        return void 0;
    }

    Object.defineProperty(target, key, {
        configurable: true,
        enumerable: false,
        value,
        writable: true,
    });
};

describe("ES2015 compatibility", (): void => {
    test("works without modern event and clone globals", async (): Promise<void> => {
        vi.resetModules();

        const root: Record<string, unknown> = globalThis as Record<
            string,
            unknown
        >;

        const originalValues: TestGlobalValues = {
            Event: globalThis.Event,
            EventTarget: globalThis.EventTarget,
            MessageEvent: globalThis.MessageEvent,
            queueMicrotask: globalThis.queueMicrotask,
            structuredClone: globalThis.structuredClone,
        };

        Reflect.deleteProperty(root, "Event");
        Reflect.deleteProperty(root, "EventTarget");
        Reflect.deleteProperty(root, "MessageEvent");
        Reflect.deleteProperty(root, "queueMicrotask");
        Reflect.deleteProperty(root, "structuredClone");

        try {
            const packageModule: typeof import("message-channel-polyfill") =
                await import("message-channel-polyfill");

            const channel: InstanceType<
                typeof packageModule.MessageChannelPolyfill
            > = new packageModule.MessageChannelPolyfill();

            const received: unknown[] = [];

            const payload: {
                nested: {
                    value: number;
                };
            } = {
                nested: {
                    value: 1,
                },
            };

            channel.port2.onmessage = (event: MessageEvent<unknown>): void => {
                received.push(event.data);
            };

            channel.port1.postMessage(payload);

            payload.nested.value = 2;

            await waitForTurn();

            expect(received).toEqual([
                {
                    nested: {
                        value: 1,
                    },
                },
            ]);
        } finally {
            restoreTestGlobalValue(root, "Event", originalValues.Event);
            restoreTestGlobalValue(
                root,
                "EventTarget",
                originalValues.EventTarget,
            );
            restoreTestGlobalValue(
                root,
                "MessageEvent",
                originalValues.MessageEvent,
            );
            restoreTestGlobalValue(
                root,
                "queueMicrotask",
                originalValues.queueMicrotask,
            );
            restoreTestGlobalValue(
                root,
                "structuredClone",
                originalValues.structuredClone,
            );

            vi.resetModules();
        }
    });

    test("selects install targets without requiring globalThis", async (): Promise<void> => {
        const targetModule: typeof import("../../package/src/functions/target") =
            await import("../../package/src/functions/target");

        const selfTarget: MessageChannelPolyfillTarget = {};

        const fallbackTarget: MessageChannelPolyfillTarget = {};

        let fallbackCalls: number = 0;

        expect(
            targetModule.selectMessageChannelPolyfillTarget({
                self: selfTarget,
            }),
        ).toBe(selfTarget);

        expect(
            targetModule.selectMessageChannelPolyfillTarget(
                {},
                (): MessageChannelPolyfillTarget => {
                    fallbackCalls += 1;
                    return fallbackTarget;
                },
            ),
        ).toBe(fallbackTarget);

        expect(fallbackCalls).toBe(1);
    });
});
