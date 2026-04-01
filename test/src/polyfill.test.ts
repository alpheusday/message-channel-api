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

    test("delivers started-port messages asynchronously", async (): Promise<void> => {
        const channel: MessageChannelPolyfill = new MessageChannelPolyfill();

        const received: string[] = [];

        channel.port2.onmessage = (event: MessageEvent<unknown>): void => {
            received.push(event.data as string);
        };

        channel.port1.postMessage("later");

        expect(received).toEqual([]);

        await waitForTurn();

        expect(received).toEqual([
            "later",
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

    test("flushes queued messages in posting order after start", async (): Promise<void> => {
        const channel: MessageChannelPolyfill = new MessageChannelPolyfill();

        const received: string[] = [];

        channel.port2.addEventListener("message", (event: Event): void => {
            received.push((event as MessageEvent<string>).data);
        });

        channel.port1.postMessage("first");
        channel.port1.postMessage("second");
        channel.port1.postMessage("third");

        channel.port2.start();

        await waitForTurn();

        expect(received).toEqual([
            "first",
            "second",
            "third",
        ]);
    });

    test("removeEventListener stops message delivery", async (): Promise<void> => {
        const channel: MessageChannelPolyfill = new MessageChannelPolyfill();

        const received: string[] = [];

        const listener = (event: Event): void => {
            received.push((event as MessageEvent<string>).data);
        };

        channel.port2.addEventListener("message", listener);

        channel.port2.removeEventListener("message", listener);

        channel.port2.start();

        channel.port1.postMessage("ignored");

        await waitForTurn();

        expect(received).toEqual([]);
    });

    test("treats listeners with different capture options as distinct registrations", async (): Promise<void> => {
        const channel: MessageChannelPolyfill = new MessageChannelPolyfill();

        const received: string[] = [];

        const listener = (event: Event): void => {
            received.push((event as MessageEvent<string>).data);
        };

        channel.port2.addEventListener("message", listener, false);

        channel.port2.addEventListener("message", listener, true);

        channel.port2.removeEventListener("message", listener, false);

        channel.port2.start();

        channel.port1.postMessage("kept");

        await waitForTurn();

        expect(received).toEqual([
            "kept",
        ]);
    });

    test("ignores duplicate listener registrations with the same capture option", async (): Promise<void> => {
        const channel: MessageChannelPolyfill = new MessageChannelPolyfill();

        const received: string[] = [];

        const listener = (event: Event): void => {
            received.push((event as MessageEvent<string>).data);
        };

        channel.port2.addEventListener("message", listener);

        channel.port2.addEventListener("message", listener);

        channel.port2.start();

        channel.port1.postMessage("once");

        await waitForTurn();

        expect(received).toEqual([
            "once",
        ]);
    });

    test("supports event listener objects", async (): Promise<void> => {
        const channel: MessageChannelPolyfill = new MessageChannelPolyfill();

        const received: string[] = [];

        const observedTargets: (EventTarget | null)[] = [];

        const listener: EventListenerObject = {
            handleEvent(event: Event): void {
                const messageEvent: MessageEvent<string> =
                    event as MessageEvent<string>;

                received.push(messageEvent.data);
                observedTargets.push(messageEvent.target);
                observedTargets.push(messageEvent.currentTarget);
            },
        };

        channel.port2.addEventListener("message", listener);

        channel.port2.start();

        channel.port1.postMessage("object-listener");

        await waitForTurn();

        expect(received).toEqual([
            "object-listener",
        ]);
        expect(observedTargets).toEqual([
            channel.port2,
            channel.port2,
        ]);
    });

    test("supports once listeners for message events", async (): Promise<void> => {
        const channel: MessageChannelPolyfill = new MessageChannelPolyfill();

        const received: string[] = [];

        channel.port2.addEventListener(
            "message",
            (event: Event): void => {
                received.push((event as MessageEvent<string>).data);
            },
            {
                once: true,
            },
        );
        channel.port2.start();

        channel.port1.postMessage("first");

        channel.port1.postMessage("second");

        await waitForTurn();

        expect(received).toEqual([
            "first",
        ]);
    });

    test("stopImmediatePropagation prevents later listeners from running", async (): Promise<void> => {
        const channel: MessageChannelPolyfill = new MessageChannelPolyfill();

        const received: string[] = [];

        channel.port2.addEventListener("message", (event: Event): void => {
            received.push((event as MessageEvent<string>).data);
            event.stopImmediatePropagation();
        });

        channel.port2.addEventListener("message", (): void => {
            received.push("later-listener");
        });

        channel.port2.start();

        channel.port1.postMessage("first-listener");

        await waitForTurn();

        expect(received).toEqual([
            "first-listener",
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

    test("replacing onmessage uses only the latest handler", async (): Promise<void> => {
        const channel: MessageChannelPolyfill = new MessageChannelPolyfill();

        const firstHandlerCalls: string[] = [];
        const secondHandlerCalls: string[] = [];

        channel.port2.onmessage = (event: MessageEvent<unknown>): void => {
            firstHandlerCalls.push(event.data as string);
        };
        channel.port2.onmessage = (event: MessageEvent<unknown>): void => {
            secondHandlerCalls.push(event.data as string);
        };

        channel.port1.postMessage("latest-only");

        await waitForTurn();

        expect(firstHandlerCalls).toEqual([]);
        expect(secondHandlerCalls).toEqual([
            "latest-only",
        ]);
    });

    test("setting onmessage to null removes the property listener before dispatch", async (): Promise<void> => {
        const channel: MessageChannelPolyfill = new MessageChannelPolyfill();

        const received: string[] = [];

        channel.port2.onmessage = (event: MessageEvent<unknown>): void => {
            received.push(event.data as string);
        };

        channel.port1.postMessage("queued");

        channel.port2.onmessage = null;

        await waitForTurn();

        expect(received).toEqual([]);
    });

    test("message events expose the receiving port as target metadata", async (): Promise<void> => {
        const channel: MessageChannelPolyfill = new MessageChannelPolyfill();

        const capturedEventPromise: Promise<MessageEvent<string>> = new Promise<
            MessageEvent<string>
        >((resolve: (value: MessageEvent<string>) => void): void => {
            channel.port2.onmessage = (event: MessageEvent<unknown>): void => {
                resolve(event as MessageEvent<string>);
            };
        });

        channel.port1.postMessage("metadata");

        const capturedEvent: MessageEvent<string> = await capturedEventPromise;

        expect(capturedEvent.data).toBe("metadata");
        expect(capturedEvent.type).toBe("message");
        expect(capturedEvent.target).toBe(channel.port2);
        expect(capturedEvent.srcElement).toBe(channel.port2);
        expect(capturedEvent.currentTarget).toBeNull();
        expect(capturedEvent.eventPhase).toBe(capturedEvent.AT_TARGET);
        expect(capturedEvent.composedPath()).toEqual([
            channel.port2,
        ]);
        expect(capturedEvent.bubbles).toBe(false);
        expect(capturedEvent.cancelable).toBe(false);
        expect(capturedEvent.composed).toBe(false);
        expect(capturedEvent.isTrusted).toBe(false);
        expect(capturedEvent.origin).toBe("");
        expect(capturedEvent.lastEventId).toBe("");
        expect(capturedEvent.source).toBeNull();
        expect(capturedEvent.ports).toEqual([]);
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

    test("close during a flush stops later queued messages", async (): Promise<void> => {
        const channel: MessageChannelPolyfill = new MessageChannelPolyfill();

        const received: string[] = [];

        channel.port2.onmessage = (event: MessageEvent<unknown>): void => {
            received.push(event.data as string);
            channel.port2.close();
        };

        channel.port1.postMessage("first");

        channel.port1.postMessage("second");

        await waitForTurn();

        expect(received).toEqual([
            "first",
        ]);
    });

    test("closing one port detangles both sides", async (): Promise<void> => {
        const channel: MessageChannelPolyfill = new MessageChannelPolyfill();

        const received: string[] = [];

        channel.port1.onmessage = (event: MessageEvent<unknown>): void => {
            received.push(`port1:${event.data as string}`);
        };

        channel.port2.onmessage = (event: MessageEvent<unknown>): void => {
            received.push(`port2:${event.data as string}`);
        };

        channel.port1.close();

        channel.port1.postMessage("from-port1");

        channel.port2.postMessage("from-port2");

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

    test("supports transfer options objects", async (): Promise<void> => {
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

        view[0] = 11;

        channel.port1.postMessage(buffer, {
            transfer: [
                buffer,
            ],
        });

        const receivedBuffer: ArrayBuffer = await receivedBufferPromise;

        expect(buffer.byteLength).toBe(0);
        expect(receivedBuffer).toBeInstanceOf(ArrayBuffer);
        expect(new Uint8Array(receivedBuffer)[0]).toBe(11);
    });

    test("clone failures throw without dispatching messageerror", (): void => {
        const channel: MessageChannelPolyfill = new MessageChannelPolyfill();

        let messageErrorCalls: number = 0;

        channel.port2.onmessageerror = (): void => {
            messageErrorCalls += 1;
        };

        expect((): void => {
            channel.port1.postMessage({
                value: Symbol("not-cloneable"),
            });
        }).toThrow();

        expect(messageErrorCalls).toBe(0);
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
