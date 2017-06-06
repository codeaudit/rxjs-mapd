import { Client } from './client';

export function _static(this: typeof Client) {
    return this.mapd_disconnect().ignoreElements() as Client<void>;
}

export function _proto<T>(this: Client<T>) {
    const ctor = this.constructor as typeof Client;
    return this
        .catch((e) => ctor.disconnect().concat(ctor.throw(e)))
        .concat(ctor.disconnect()) as Client<T>;
}
