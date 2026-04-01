import type { MessageChannelPolyfillTarget } from "#/@types/target";

import { MessageChannelPolyfill } from "#/classes/channel";
import { MessagePortPolyfill } from "#/classes/port";
import { getDefaultMessageChannelPolyfillTarget } from "#/functions/target";

const installMessageChannelPolyfill = (
    target: MessageChannelPolyfillTarget = getDefaultMessageChannelPolyfillTarget(),
): MessageChannelPolyfillTarget => {
    if (typeof target.MessageChannel === "undefined") {
        target.MessageChannel = MessageChannelPolyfill;
    }

    if (typeof target.MessagePort === "undefined") {
        target.MessagePort = MessagePortPolyfill;
    }

    return target;
};

export { installMessageChannelPolyfill };
