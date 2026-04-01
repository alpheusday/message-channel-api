export type {
    FallbackCloneContext,
    MessagePortEventDataMap,
    MessagePortEventHandler,
    MessagePortEventMap,
    MessagePortEventType,
    MessagePortState,
    TypedArray,
    TypedArrayConstructor,
} from "#/@types/port";
export type { MessageChannelPolyfillTarget } from "#/@types/target";

export {
    MessageChannelPolyfill,
    MessageChannelPolyfill as MessageChannel,
} from "#/classes/channel";
export {
    connectMessagePorts,
    MessagePortPolyfill,
    MessagePortPolyfill as MessagePort,
} from "#/classes/port";
export { installMessageChannelPolyfill } from "#/functions/install";
