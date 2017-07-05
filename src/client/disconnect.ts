import { Client } from './client';

export function disconnectStatic(this: typeof Client) {
    return this.mapd_disconnect().ignoreElements() as Client<void>;
}

export function disconnectProto<T>(this: Client<T>) {
    const ctor = this.constructor as typeof Client;
    return this
        .catch((e) => ctor.disconnect()
            .catch(() => ctor.throw(e))
            .concat(ctor.throw(e)))
        .concat(ctor.disconnect()) as Client<T>;
}
