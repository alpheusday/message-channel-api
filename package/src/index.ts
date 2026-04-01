export type {
    FallbackCloneContext,
    MessagePortEventDataMap,
    MessagePortEventHandler,
    MessagePortEventType,
    MessagePortState,
    TypedArray,
    TypedArrayConstructor,
} from "#/@types/port";
export type { MessageChannelPolyfillTarget } from "#/@types/target";

export { MessageChannelPolyfill } from "#/classes/channel";
export {
    connectMessagePorts,
    MessagePortPolyfill,
} from "#/classes/port";
export { installMessageChannelPolyfill } from "#/functions/install";
