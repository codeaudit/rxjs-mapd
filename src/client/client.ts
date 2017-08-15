import { Observable } from 'rxjs';
import { RefCounted } from './open';
import { Client as MapD } from '../mapd';
import $$observable from 'symbol-observable';
import { bindObservableMethods } from './bind';

export type ClientStatics = {
    mapd?: MapD;
    gpus?: number;
    nonce?: number;
    sessionId?: string;
    connection?: RefCounted;
};

export class Client<T> extends Observable<T> {

    static gpus = 0;
    static nonce = 0;
    static mapd: MapD;
    static sessionId: string;
    static connection: RefCounted;

    static let<T>(func: (ctor: typeof Client) => T) {
        return func(this);
    }

    static usingConnection<T>(create: <T>(...args: any[]) => Observable<T>, ...args: any[]) {
        return this.using<T>(this.connection.refCount, () => create(...args)) as Client<T>;
    }

    constructor(source?: any) {
        if (!source || typeof source === 'function' || typeof source !== 'object') {
            super(source);
        } else if (typeof source[$$observable] === 'function') {
            super();
            this.source = source[$$observable]();
        }
    }
    lift<R = T>(operator): Client<R> {
        const observable = new Client<R>(this);
        observable.operator = operator;
        return observable;
    }
}

export default bindObservableMethods(Observable, Client);
