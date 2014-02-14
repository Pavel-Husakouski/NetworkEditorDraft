export interface IPublisher {
    publish(channel: string, ...args: any[]): IPublisher;
}

export interface ISubscriber {
    subscribe(channel: string, fn: (a: any, sender: any) => any): ISubscriber;
    subscribe(channel: string, fn: (...args: any[]) => any): ISubscriber;
}

export class Bus implements IPublisher, ISubscriber {
    private channels: subscription[][] = [];

    constructor() {
    }

    subscribe(channel: string, fn: (a: any, sender: any) => any): ISubscriber
    subscribe(channel: string, fn: (...args: any[]) => any): ISubscriber
    subscribe(channel: string, fn: (...args: any[]) => any): ISubscriber
    {
        if (!this.channels[channel]) 
            this.channels[channel] = [];
        this.channels[channel].push({ context: this, callback: fn });
        return this;
    }

    publish(channel: string, ...args: any[]) {
        if (!this.channels[channel])
            throw "Channel does not exist";
        this.channels[channel].forEach(x => {x.callback.apply(x.context, args);});
        return this;
    }

    installTo(obj: any) {
        obj.subscribe = (channel, fn) => {
            this.subscribe.call(this, channel, function () { fn.apply(obj, arguments) });
            return obj;
        }
        obj.publish = () => {
            this.publish.apply(this, arguments);
            return obj;
        }
    }

}

interface subscription {
    context: Bus;
    callback(...args: any[]);
}
