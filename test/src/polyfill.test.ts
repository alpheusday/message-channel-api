import type { MessageChannelPolyfillTarget } from "message-channel-api";

import {
    installMessageChannelPolyfill,
    MessageChannelPolyfill,
    MessagePortPolyfill,
} from "message-channel-api";
import { describe, expect, test } from "vitest";

const waitForTurn = (): Promise<void> => {
    return new Promise<void>((resolve: () => void): void => {
        setTimeout(resolve, 0);
    });
};

describe("MessageChannelPolyfill", (): void => {
    test("delivers structured-cloned messages", async (): Promise<void> => {
        const channel: MessageChannelPolyfill = new MessageChannelPolyfill();

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
    });

    test("queues addEventListener messages until the port starts", async (): Promise<void> => {
        const channel: MessageChannelPolyfill = new MessageChannelPolyfill();

        const received: string[] = [];

        channel.port2.addEventListener("message", (event: Event): void => {
            received.push((event as MessageEvent<string>).data);
        });

        channel.port1.postMessage("queued");

        await waitForTurn();

        expect(received).toEqual([]);

        channel.port2.start();

        await waitForTurn();

        expect(received).toEqual([
            "queued",
        ]);
    });

    test("setting onmessage starts the port and flushes queued messages", async (): Promise<void> => {
        const channel: MessageChannelPolyfill = new MessageChannelPolyfill();

        const received: string[] = [];

        channel.port1.postMessage("queued");

        channel.port2.onmessage = (event: MessageEvent<unknown>): void => {
            received.push(event.data as string);
        };

        await waitForTurn();

        expect(received).toEqual([
            "queued",
        ]);
    });

    test("close drops queued messages and future posts", async (): Promise<void> => {
        const channel: MessageChannelPolyfill = new MessageChannelPolyfill();

        const received: string[] = [];

        channel.port2.onmessage = (event: MessageEvent<unknown>): void => {
            received.push(event.data as string);
        };

        channel.port1.postMessage("lost");

        channel.port2.close();

        channel.port1.postMessage("also-lost");

        await waitForTurn();

        expect(received).toEqual([]);
    });

    test("supports transfer lists", async (): Promise<void> => {
        const channel: MessageChannelPolyfill = new MessageChannelPolyfill();

        const buffer: ArrayBuffer = new ArrayBuffer(8);

        const view: Uint8Array = new Uint8Array(buffer);

        const receivedBufferPromise: Promise<ArrayBuffer> =
            new Promise<ArrayBuffer>(
                (resolve: (value: ArrayBuffer) => void): void => {
                    channel.port2.onmessage = (
                        event: MessageEvent<unknown>,
                    ): void => {
                        resolve(event.data as ArrayBuffer);
                    };
                },
            );

        view[0] = 7;

        channel.port1.postMessage(buffer, [
            buffer,
        ]);

        const receivedBuffer: ArrayBuffer = await receivedBufferPromise;

        expect(buffer.byteLength).toBe(0);
        expect(receivedBuffer).toBeInstanceOf(ArrayBuffer);
        expect(new Uint8Array(receivedBuffer)[0]).toBe(7);
    });
});

describe("installMessageChannelPolyfill", (): void => {
    test("fills missing constructors without overwriting existing ones", (): void => {
        class ExistingMessageChannel {}

        class ExistingMessagePort {}

        const emptyTarget: MessageChannelPolyfillTarget = {};

        const existingTarget: MessageChannelPolyfillTarget = {
            MessageChannel:
                ExistingMessageChannel as unknown as typeof MessageChannelPolyfill,
            MessagePort:
                ExistingMessagePort as unknown as typeof MessagePortPolyfill,
        };

        installMessageChannelPolyfill(emptyTarget);

        installMessageChannelPolyfill(existingTarget);

        expect(emptyTarget.MessageChannel).toBe(MessageChannelPolyfill);
        expect(emptyTarget.MessagePort).toBe(MessagePortPolyfill);
        expect(existingTarget.MessageChannel).toBe(ExistingMessageChannel);
        expect(existingTarget.MessagePort).toBe(ExistingMessagePort);
    });

    test("polyfill entry installs constructors on globalThis", async (): Promise<void> => {
        const originalMessageChannel: unknown = globalThis.MessageChannel;

        const originalMessagePort: unknown = globalThis.MessagePort;

        Reflect.deleteProperty(globalThis, "MessageChannel");

        Reflect.deleteProperty(globalThis, "MessagePort");

        try {
            await import("message-channel-api/polyfill");

            expect(globalThis.MessageChannel).toBe(MessageChannelPolyfill);
            expect(globalThis.MessagePort).toBe(MessagePortPolyfill);
        } finally {
            if (typeof originalMessageChannel === "undefined") {
                Reflect.deleteProperty(globalThis, "MessageChannel");
            } else {
                Object.defineProperty(globalThis, "MessageChannel", {
                    configurable: true,
                    enumerable: false,
                    value: originalMessageChannel,
                    writable: true,
                });
            }

            if (typeof originalMessagePort === "undefined") {
                Reflect.deleteProperty(globalThis, "MessagePort");
            } else {
                Object.defineProperty(globalThis, "MessagePort", {
                    configurable: true,
                    enumerable: false,
                    value: originalMessagePort,
                    writable: true,
                });
            }
        }
    });
});
