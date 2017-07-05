import { Thrift } from 'thrift';
import { Client } from './client';
import { TimeoutError } from 'rxjs';
import { Client as MapD, TMemorySummary } from '../mapd';

export type connectParams = {
    dbName: string;
    username: string;
    password: string;
    timeout?: number;
};

export function connectProto(this: Client<typeof Client>, opts: connectParams): Client<typeof Client>;
export function connectProto(this: Client<typeof Client>, username: string, password: string, dbName: string, timeout?: number): Client<typeof Client>;
export function connectProto(this: Client<typeof Client>, ...args: any[]): Client<typeof Client> {
    return this.flatMap((ctor) => ctor.connect.apply(ctor, args)) as Client<typeof Client>;
}

export function connectStatic(this: typeof Client, opts: connectParams): Client<typeof Client>;
export function connectStatic(this: typeof Client, dbName: string, username: string, password: string, timeout?: number): Client<typeof Client>;
export function connectStatic(this: typeof Client, ...args: any[]): Client<typeof Client> {

    let [dbName, username, password, timeout = 0] = args;

    switch (typeof dbName) {
        case 'string': break;
        case 'object':
            username = dbName.username;
            password = dbName.password;
            timeout = +dbName.timeout;
            dbName = dbName.dbName;
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

function clientForExecutionMode(this: typeof Client, sessionId: string) {
    return this
        .mapd_getMemorySummary(sessionId)
        .map(availableGPUsCount).catch(() => this.of(0)) // if err, not GPU enabled
        .map((gpus) => this.bindStatics({ gpus, sessionId }))
        .take(1);
}

function availableGPUsCount({ gpu_summary }: TMemorySummary) {
    return gpu_summary && gpu_summary.length || 0;
}
