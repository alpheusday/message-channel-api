import type {
    FallbackCloneContext,
    TypedArray,
    TypedArrayConstructor,
} from "#/@types/port";

import { createMessageEvent } from "#/classes/port/event";

const createDataCloneError = (message: string): Error => {
    if (typeof DOMException === "function") {
        return new DOMException(message, "DataCloneError");
    }

    const error: Error = new Error(message);

    error.name = "DataCloneError";

    return error;
};

const normalizeStructuredSerializeOptions = (
    transferOrOptions?: StructuredSerializeOptions | Transferable[],
): StructuredSerializeOptions | undefined => {
    if (typeof transferOrOptions === "undefined") return void 0;

    if (Array.isArray(transferOrOptions)) {
        return {
            transfer: transferOrOptions,
        };
    }

    return transferOrOptions;
};

const isSharedArrayBuffer = (value: object): value is SharedArrayBuffer => {
    return (
        typeof SharedArrayBuffer !== "undefined" &&
        value instanceof SharedArrayBuffer
    );
};

const isTypedArray = (value: ArrayBufferView): value is TypedArray =>
    !(value instanceof DataView);

const cloneFallbackValue = (
    value: unknown,
    context: FallbackCloneContext,
): unknown => {
    if (
        value === null ||
        typeof value === "boolean" ||
        typeof value === "bigint" ||
        typeof value === "number" ||
        typeof value === "string" ||
        typeof value === "undefined"
    ) {
        return value;
    }

    if (typeof value === "function" || typeof value === "symbol") {
        throw createDataCloneError("The provided value cannot be cloned.");
    }

    const existingClone: object | undefined = context.seen.get(value);

    if (typeof existingClone !== "undefined") {
        return existingClone;
    }

    if (value instanceof Date) {
        return new Date(value.getTime());
    }

    if (value instanceof RegExp) {
        return new RegExp(value.source, value.flags);
    }

    if (value instanceof ArrayBuffer) {
        const clone: ArrayBuffer = value.slice(0);

        context.seen.set(value, clone);

        return clone;
    }

    if (isSharedArrayBuffer(value)) {
        return value;
    }

    if (ArrayBuffer.isView(value)) {
        const clonedBuffer: ArrayBufferLike = cloneFallbackValue(
            value.buffer,
            context,
        ) as ArrayBufferLike;

        if (value instanceof DataView) {
            const clone: DataView = new DataView(
                clonedBuffer,
                value.byteOffset,
                value.byteLength,
            );

            context.seen.set(value, clone);

            return clone;
        }

        if (isTypedArray(value)) {
            const TypedArrayClass: TypedArrayConstructor =
                value.constructor as TypedArrayConstructor;
            const clone: TypedArray = new TypedArrayClass(
                clonedBuffer,
                value.byteOffset,
                value.length,
            );

            context.seen.set(value, clone);

            return clone;
        }
    }

    if (Array.isArray(value)) {
        const clone: unknown[] = new Array<unknown>(value.length);

        context.seen.set(value, clone);

        for (let index: number = 0; index < value.length; index += 1) {
            clone[index] = cloneFallbackValue(value[index], context);
        }

        return clone;
    }

    if (value instanceof Map) {
        const clone: Map<unknown, unknown> = new Map<unknown, unknown>();

        context.seen.set(value, clone);

        for (const [entryKey, entryValue] of value.entries()) {
            clone.set(
                cloneFallbackValue(entryKey, context),
                cloneFallbackValue(entryValue, context),
            );
        }

        return clone;
    }

    if (value instanceof Set) {
        const clone: Set<unknown> = new Set<unknown>();

        context.seen.set(value, clone);

        for (const entryValue of value.values()) {
            clone.add(cloneFallbackValue(entryValue, context));
        }

        return clone;
    }

    const prototype: object | null = Object.getPrototypeOf(value);

    if (prototype !== Object.prototype && prototype !== null) {
        throw createDataCloneError("The provided value cannot be cloned.");
    }

    const clone: Record<PropertyKey, unknown> = Object.create(
        prototype,
    ) as Record<PropertyKey, unknown>;

    context.seen.set(value, clone);

    for (const key of Reflect.ownKeys(value)) {
        const descriptor: PropertyDescriptor | undefined =
            Object.getOwnPropertyDescriptor(value, key);

        if (
            typeof descriptor === "undefined" ||
            descriptor.enumerable !== true ||
            !("value" in descriptor)
        ) {
            continue;
        }

        clone[key] = cloneFallbackValue(descriptor.value, context);
    }

    return clone;
};

const cloneMessageValue = (
    value: unknown,
    transferOrOptions?: StructuredSerializeOptions | Transferable[],
): unknown => {
    const options: StructuredSerializeOptions | undefined =
        normalizeStructuredSerializeOptions(transferOrOptions);

    if (typeof structuredClone === "function") {
        if (typeof options === "undefined") {
            return structuredClone(value);
        }

        return structuredClone(value, options);
    }

    if (
        typeof options?.transfer !== "undefined" &&
        options.transfer.length > 0
    ) {
        throw createDataCloneError(
            "Transfer lists require structuredClone support.",
        );
    }

    return cloneFallbackValue(value, {
        seen: new WeakMap<object, object>(),
    });
};

export { cloneMessageValue, createMessageEvent };
