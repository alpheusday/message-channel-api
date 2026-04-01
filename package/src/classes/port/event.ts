import type { MessagePortEventType } from "#/@types/port";

interface MessagePortEventListenerEntry {
    callback: EventListenerOrEventListenerObject;
    capture: boolean;
    once: boolean;
}

interface MessagePortEventListenerOptions {
    capture: boolean;
    once: boolean;
}

const getMessagePortEventListenerOptions = (
    options?: boolean | AddEventListenerOptions,
): MessagePortEventListenerOptions => {
    if (typeof options === "boolean") {
        return {
            capture: options,
            once: false,
        };
    }

    return {
        capture: options?.capture === true,
        once: options?.once === true,
    };
};

const invokeMessagePortEventListener = (
    currentTarget: EventTarget,
    callback: EventListenerOrEventListenerObject,
    event: Event,
): void => {
    if (typeof callback === "function") {
        callback.call(currentTarget, event);
        return;
    }

    callback.handleEvent(event);
};

class MessagePortEventTarget implements EventTarget {
    private readonly listeners: Map<string, MessagePortEventListenerEntry[]> =
        new Map<string, MessagePortEventListenerEntry[]>();

    public addEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions,
    ): void {
        if (callback === null) {
            return void 0;
        }

        const normalizedOptions: MessagePortEventListenerOptions =
            getMessagePortEventListenerOptions(options);
        const listeners: MessagePortEventListenerEntry[] | undefined =
            this.listeners.get(type);

        if (typeof listeners === "undefined") {
            this.listeners.set(type, [
                {
                    callback,
                    capture: normalizedOptions.capture,
                    once: normalizedOptions.once,
                },
            ]);
            return void 0;
        }

        for (const listener of listeners) {
            if (
                listener.callback === callback &&
                listener.capture === normalizedOptions.capture
            ) {
                return void 0;
            }
        }

        listeners.push({
            callback,
            capture: normalizedOptions.capture,
            once: normalizedOptions.once,
        });
    }

    public dispatchEvent(event: Event): boolean {
        const listeners: MessagePortEventListenerEntry[] | undefined =
            this.listeners.get(event.type);

        if (event instanceof MessagePortMessageEvent) {
            event.setCurrentTarget(this);
        }

        if (typeof listeners !== "undefined") {
            const currentListeners: MessagePortEventListenerEntry[] =
                listeners.slice(0);

            for (const listener of currentListeners) {
                if (listener.once) {
                    this.removeEventListener(
                        event.type,
                        listener.callback,
                        listener.capture,
                    );
                }

                invokeMessagePortEventListener(this, listener.callback, event);

                if (
                    event instanceof MessagePortMessageEvent &&
                    event.immediatePropagationStopped
                ) {
                    break;
                }
            }
        }

        if (event instanceof MessagePortMessageEvent) {
            event.clearCurrentTarget();
        }

        return !event.defaultPrevented;
    }

    public removeEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: boolean | EventListenerOptions,
    ): void {
        if (callback === null) {
            return void 0;
        }

        const capture: boolean =
            typeof options === "boolean" ? options : options?.capture === true;
        const listeners: MessagePortEventListenerEntry[] | undefined =
            this.listeners.get(type);

        if (typeof listeners === "undefined") {
            return void 0;
        }

        for (let index: number = 0; index < listeners.length; index += 1) {
            const listener: MessagePortEventListenerEntry | undefined =
                listeners[index];

            if (typeof listener === "undefined") {
                continue;
            }

            if (
                listener.callback === callback &&
                listener.capture === capture
            ) {
                listeners.splice(index, 1);

                if (listeners.length === 0) {
                    this.listeners.delete(type);
                }

                return void 0;
            }
        }
    }
}

class MessagePortMessageEvent<TData = unknown> implements MessageEvent<TData> {
    private currentEventTarget: EventTarget | null = null;
    private defaultPreventedState: boolean = false;
    private immediatePropagationStoppedState: boolean = false;
    private targetEventTarget: EventTarget | null = null;

    public readonly AT_TARGET: 2 = 2;
    public readonly BUBBLING_PHASE: 3 = 3;
    public readonly CAPTURING_PHASE: 1 = 1;
    public readonly NONE: 0 = 0;
    public readonly bubbles: boolean = false;
    public readonly cancelable: boolean = false;
    public readonly composed: boolean = false;
    public readonly isTrusted: boolean = false;
    public readonly timeStamp: number = Date.now();
    public cancelBubble: boolean = false;
    public data: TData;
    public lastEventId: string = "";
    public origin: string = "";
    public ports: MessagePort[] = [];
    public returnValue: boolean = true;
    public source: MessageEventSource | null = null;
    public type: string;

    public constructor(type: MessagePortEventType, data: TData) {
        this.data = data;
        this.type = type;
    }

    public get currentTarget(): EventTarget | null {
        return this.currentEventTarget;
    }

    public get defaultPrevented(): boolean {
        return this.defaultPreventedState;
    }

    public get eventPhase(): number {
        return this.targetEventTarget === null ? this.NONE : this.AT_TARGET;
    }

    public get immediatePropagationStopped(): boolean {
        return this.immediatePropagationStoppedState;
    }

    public get srcElement(): EventTarget | null {
        return this.targetEventTarget;
    }

    public get target(): EventTarget | null {
        return this.targetEventTarget;
    }

    public clearCurrentTarget(): void {
        this.currentEventTarget = null;
    }

    public composedPath(): EventTarget[] {
        if (this.targetEventTarget === null) {
            return [];
        }

        return [
            this.targetEventTarget,
        ];
    }

    public initEvent(
        type: string,
        _bubbles?: boolean,
        _cancelable?: boolean,
    ): void {
        if (this.targetEventTarget !== null) {
            return void 0;
        }

        this.type = type;
    }

    public initMessageEvent(
        type: string,
        _bubbles?: boolean,
        _cancelable?: boolean,
        data?: TData,
        origin?: string,
        lastEventId?: string,
        source?: MessageEventSource | null,
        ports?: MessagePort[],
    ): void {
        if (this.targetEventTarget !== null) {
            return void 0;
        }

        this.type = type;

        if (typeof data !== "undefined") {
            this.data = data;
        }

        this.origin = typeof origin === "undefined" ? "" : origin;
        this.lastEventId =
            typeof lastEventId === "undefined" ? "" : lastEventId;
        this.source = typeof source === "undefined" ? null : source;
        this.ports = typeof ports === "undefined" ? [] : ports;
    }

    public preventDefault(): void {
        this.defaultPreventedState = true;
        this.returnValue = false;
    }

    public setCurrentTarget(currentTarget: EventTarget): void {
        this.currentEventTarget = currentTarget;

        if (this.targetEventTarget === null) {
            this.targetEventTarget = currentTarget;
        }
    }

    public stopImmediatePropagation(): void {
        this.immediatePropagationStoppedState = true;
        this.stopPropagation();
    }

    public stopPropagation(): void {
        this.cancelBubble = true;
    }
}

const createMessageEvent = (
    type: MessagePortEventType,
    data: unknown,
): MessageEvent<unknown> => {
    return new MessagePortMessageEvent(type, data);
};

export { createMessageEvent, MessagePortEventTarget };
