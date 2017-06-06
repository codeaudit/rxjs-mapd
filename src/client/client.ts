import { Observable } from 'rxjs';
import { RefCounted } from '../open';
import { Client as MapD } from '../mapd';
import $$observable from 'symbol-observable';
import { ArrowReader } from '../apache/arrow';
import { bindObservableMethods } from './bind';

export type ClientStatics = {
    mapd?: MapD;
    session?: string;
    connection?: RefCounted;
    toArrow?: (buf: any) => ArrowReader;
};

export class Client<T> extends Observable<T> {

    static mapd: MapD;
    static session: string;
    static connection: RefCounted;

    static usingConnection<T>(create: <T>(...args: any[]) => Observable<T>, ...args: any[]) {
        return this.using<T>(this.connection.refCount, () => create(...args)) as Client<T>;
    }
    static throwOnConnectionErrors() {
        return this.usingConnection(() =>
               this.fromEvent(this.connection, 'error', (e) => { throw e; }));
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