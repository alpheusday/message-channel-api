import type { MessageChannelPolyfillTarget } from "#/@types/target";

type MessageChannelPolyfillTargetCandidates = {
    global?: MessageChannelPolyfillTarget;
    globalThis?: MessageChannelPolyfillTarget;
    self?: MessageChannelPolyfillTarget;
    window?: MessageChannelPolyfillTarget;
};

type MessageChannelPolyfillTargetFallback = () => MessageChannelPolyfillTarget;

declare const global: MessageChannelPolyfillTarget | undefined;

const createMessageChannelPolyfillTargetFallback =
    (): MessageChannelPolyfillTarget => {
        return Function("return this")() as MessageChannelPolyfillTarget;
    };

const selectMessageChannelPolyfillTarget = (
    candidates: MessageChannelPolyfillTargetCandidates,
    fallback: MessageChannelPolyfillTargetFallback = createMessageChannelPolyfillTargetFallback,
): MessageChannelPolyfillTarget => {
    for (const candidate of [
        candidates.self,
        candidates.window,
        candidates.globalThis,
        candidates.global,
    ]) {
        if (typeof candidate !== "undefined") {
            return candidate;
        }
    }

    return fallback();
};

const getDefaultMessageChannelPolyfillTarget =
    (): MessageChannelPolyfillTarget => {
        return selectMessageChannelPolyfillTarget({
            self:
                typeof self === "undefined"
                    ? void 0
                    : (self as unknown as MessageChannelPolyfillTarget),
            window:
                typeof window === "undefined"
                    ? void 0
                    : (window as unknown as MessageChannelPolyfillTarget),
            globalThis:
                typeof globalThis === "undefined"
                    ? void 0
                    : (globalThis as unknown as MessageChannelPolyfillTarget),
            global: typeof global === "undefined" ? void 0 : global,
        });
    };

export {
    getDefaultMessageChannelPolyfillTarget,
    selectMessageChannelPolyfillTarget,
};
