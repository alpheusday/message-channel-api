import type { MessageChannelPolyfillTarget } from "message-channel-api";

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

const withMissingModernGlobals = async (
    callback: (
        packageModule: typeof import("message-channel-api"),
    ) => Promise<void>,
): Promise<void> => {
    vi.resetModules();

    const root: Record<string, unknown> = globalThis as Record<string, unknown>;

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
        const packageModule: typeof import("message-channel-api") =
            await import("message-channel-api");

        await callback(packageModule);
    } finally {
        restoreTestGlobalValue(root, "Event", originalValues.Event);

        restoreTestGlobalValue(root, "EventTarget", originalValues.EventTarget);

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
};

describe("ES2015 compatibility", (): void => {
    test("works without modern event and clone globals", async (): Promise<void> => {
        await withMissingModernGlobals(
            async (
                packageModule: typeof import("message-channel-api"),
            ): Promise<void> => {
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

                channel.port2.onmessage = (
                    event: MessageEvent<unknown>,
                ): void => {
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
            },
        );
    });

    test("clones fallback-supported built-ins without structuredClone", async (): Promise<void> => {
        await withMissingModernGlobals(
            async (
                packageModule: typeof import("message-channel-api"),
            ): Promise<void> => {
                const channel: InstanceType<
                    typeof packageModule.MessageChannelPolyfill
                > = new packageModule.MessageChannelPolyfill();

                const received: unknown[] = [];

                const typedArray: Uint8Array = new Uint8Array([
                    1,
                    2,
                    3,
                ]);

                const payload: {
                    createdAt: Date;
                    expression: RegExp;
                    map: Map<
                        string,
                        {
                            value: number;
                        }
                    >;
                    set: Set<number>;
                    typedArray: Uint8Array;
                } = {
                    createdAt: new Date(123),
                    expression: /test/gi,
                    map: new Map<
                        string,
                        {
                            value: number;
                        }
                    >([
                        [
                            "entry",
                            {
                                value: 1,
                            },
                        ],
                    ]),
                    set: new Set<number>([
                        1,
                        2,
                    ]),
                    typedArray,
                };

                channel.port2.onmessage = (
                    event: MessageEvent<unknown>,
                ): void => {
                    received.push(event.data);
                };

                channel.port1.postMessage(payload);

                const entry:
                    | {
                          value: number;
                      }
                    | undefined = payload.map.get("entry");

                if (typeof entry !== "undefined") {
                    entry.value = 2;
                }

                typedArray[0] = 9;

                await waitForTurn();

                expect(received).toEqual([
                    {
                        createdAt: new Date(123),
                        expression: /test/gi,
                        map: new Map<
                            string,
                            {
                                value: number;
                            }
                        >([
                            [
                                "entry",
                                {
                                    value: 1,
                                },
                            ],
                        ]),
                        set: new Set<number>([
                            1,
                            2,
                        ]),
                        typedArray: new Uint8Array([
                            1,
                            2,
                            3,
                        ]),
                    },
                ]);
            },
        );
    });

    test("throws for transfer lists without structuredClone", async (): Promise<void> => {
        await withMissingModernGlobals(
            async (
                packageModule: typeof import("message-channel-api"),
            ): Promise<void> => {
                const channel: InstanceType<
                    typeof packageModule.MessageChannelPolyfill
                > = new packageModule.MessageChannelPolyfill();

                const buffer: ArrayBuffer = new ArrayBuffer(8);

                expect((): void => {
                    channel.port1.postMessage(buffer, [
                        buffer,
                    ]);
                }).toThrow("Transfer lists require structuredClone support.");
            },
        );
    });

    test("throws for non-cloneable values without structuredClone", async (): Promise<void> => {
        await withMissingModernGlobals(
            async (
                packageModule: typeof import("message-channel-api"),
            ): Promise<void> => {
                const channel: InstanceType<
                    typeof packageModule.MessageChannelPolyfill
                > = new packageModule.MessageChannelPolyfill();

                expect((): void => {
                    channel.port1.postMessage({
                        value: (): void => {},
                    });
                }).toThrow("The provided value cannot be cloned.");
            },
        );
    });

    test("preserves cyclic references without structuredClone", async (): Promise<void> => {
        await withMissingModernGlobals(
            async (
                packageModule: typeof import("message-channel-api"),
            ): Promise<void> => {
                const channel: InstanceType<
                    typeof packageModule.MessageChannelPolyfill
                > = new packageModule.MessageChannelPolyfill();

                const received: unknown[] = [];

                const payload: unknown[] = [];

                payload.push(payload);

                channel.port2.onmessage = (
                    event: MessageEvent<unknown>,
                ): void => {
                    received.push(event.data);
                };

                channel.port1.postMessage(payload);

                await waitForTurn();

                expect(received).toHaveLength(1);

                const clonedPayload: unknown[] = received[0] as unknown[];

                expect(clonedPayload).not.toBe(payload);
                expect(clonedPayload[0]).toBe(clonedPayload);
            },
        );
    });

    test("preserves repeated shared references without structuredClone", async (): Promise<void> => {
        await withMissingModernGlobals(
            async (
                packageModule: typeof import("message-channel-api"),
            ): Promise<void> => {
                const channel: InstanceType<
                    typeof packageModule.MessageChannelPolyfill
                > = new packageModule.MessageChannelPolyfill();
                const received: unknown[] = [];
                const shared: {
                    value: number;
                } = {
                    value: 1,
                };
                const payload: {
                    left: {
                        value: number;
                    };
                    right: {
                        value: number;
                    };
                } = {
                    left: shared,
                    right: shared,
                };

                channel.port2.onmessage = (
                    event: MessageEvent<unknown>,
                ): void => {
                    received.push(event.data);
                };

                channel.port1.postMessage(payload);

                await waitForTurn();

                expect(received).toHaveLength(1);

                const clonedPayload: {
                    left: {
                        value: number;
                    };
                    right: {
                        value: number;
                    };
                } = received[0] as {
                    left: {
                        value: number;
                    };
                    right: {
                        value: number;
                    };
                };

                expect(clonedPayload.left).not.toBe(shared);
                expect(clonedPayload.left).toBe(clonedPayload.right);
                expect(clonedPayload.left.value).toBe(1);
            },
        );
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
