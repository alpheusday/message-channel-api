import type { MessageChannelPolyfill } from "#/classes/channel";
import type { MessagePortPolyfill } from "#/classes/port";

interface MessageChannelPolyfillTarget {
    MessageChannel?: typeof MessageChannelPolyfill;
    MessagePort?: typeof MessagePortPolyfill;
}

export type { MessageChannelPolyfillTarget };
