import { connectMessagePorts, MessagePortPolyfill } from "#/classes/port";

class MessageChannelPolyfill {
    public readonly port1: MessagePortPolyfill;
    public readonly port2: MessagePortPolyfill;

    public constructor() {
        this.port1 = new MessagePortPolyfill();
        this.port2 = new MessagePortPolyfill();

        connectMessagePorts(this.port1, this.port2);
    }
}

export { MessageChannelPolyfill };
