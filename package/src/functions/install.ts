import type { MessageChannelPolyfillTarget } from "#/@types/target";

import { MessageChannelPolyfill } from "#/classes/channel";
import { MessagePortPolyfill } from "#/classes/port";
import { getDefaultMessageChannelPolyfillTarget } from "#/functions/target";

const installMessagePortPolyfill = (
    target: MessageChannelPolyfillTarget = getDefaultMessageChannelPolyfillTarget(),
): MessageChannelPolyfillTarget => {
    if (typeof target.MessagePort === "undefined") {
        target.MessagePort = MessagePortPolyfill;
    }

    return target;
};

const installMessageChannelPolyfill = (
    target: MessageChannelPolyfillTarget = getDefaultMessageChannelPolyfillTarget(),
): MessageChannelPolyfillTarget => {
    if (typeof target.MessageChannel === "undefined") {
        target.MessageChannel = MessageChannelPolyfill;
    }

    return target;
};

export { installMessageChannelPolyfill, installMessagePortPolyfill };
