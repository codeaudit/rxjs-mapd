import { Client } from './client';
import { TimeoutError } from 'rxjs';
import { Client as MapD, TMemorySummary, TMapDException } from '../mapd';

export type connectParams = {
    dbName: string;
    username: string;
    password: string;
    timeout?: number;
};

export function connectProto(this: Client<typeof Client>, opts: connectParams): Client<typeof Client>;
export function connectProto(this: Client<typeof Client>, username: string, password: string, dbName: string, timeout?: number): Client<typeof Client>;
export function connectProto(this: Client<typeof Client>, ...args: any[]): Client<typeof Client> {
    return this.flatMap((ctor) => (<any> ctor).connect(...args)) as Client<typeof Client>;
}

export function connectStatic(this: typeof Client, opts: connectParams): Client<typeof Client>;
export function connectStatic(this: typeof Client, username: string, password: string, dbName: string, timeout?: number): Client<typeof Client>;
export function connectStatic(this: typeof Client, ...args: any[]): Client<typeof Client> {

    let [username, password, dbName, timeout = 0] = args;

    switch (typeof username) {
        case 'string': break;
        case 'object':
            dbName = username.dbName;
            timeout = +username.timeout;
            password = username.password;
            username = username.username;
            break;
    }

    if (typeof dbName !== 'string')  throw new Error('Please specify the database you want to access');
    if (typeof username !== 'string') throw new Error('Please specify a username to access this database');
    if (typeof password !== 'string') throw new Error('Please specify a password to access this database');

    return this
        .mapd_connect(username, password, dbName)
        .let((source) => (+timeout || 0) <= 0 ? source : source
            .timeout(timeout).catch((err) => this.throw(!(err instanceof TimeoutError)
                ? err : new Error('Timeout connecting to mapd-core database')))).take(1)
        .flatMap(clientForExecutionMode.bind(this)) as Client<typeof Client>;
}

export { connectProto as _proto, connectStatic as _static };

function clientForExecutionMode(this: typeof Client, session: string) {
    return this
        .mapd_getMemorySummary(session)
        .map(memorySummaryHasGPUEntries)
        .catch(this.of.bind(this, false)) // if err, not GPU enabled
        .map((GPUEnabled) => GPUEnabled
            ? this.bindGPUMethods({ session })
            : this.bindCPUMethods({ session })
        )
        .take(1);
}

function memorySummaryHasGPUEntries({ gpu_summary }: TMemorySummary) {
    return gpu_summary && gpu_summary.length > 0;
}
