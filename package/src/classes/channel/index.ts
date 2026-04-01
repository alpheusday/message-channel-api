import { connectMessagePorts, MessagePortPolyfill } from "#/classes/port";

class MessageChannelPolyfill {
    public readonly port1: MessagePortPolyfill;
    public readonly port2: MessagePortPolyfill;

    public constructor() {
        const port1: MessagePortPolyfill = new MessagePortPolyfill();
        const port2: MessagePortPolyfill = new MessagePortPolyfill();

        connectMessagePorts(port1, port2);

        this.port1 = port1;
        this.port2 = port2;
    }
}

export { MessageChannelPolyfill };
