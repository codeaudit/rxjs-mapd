import { Thrift } from 'thrift';
import { Client }  from './client';
import { Client as MapD } from './mapd';
import { Observable, Subscription } from 'rxjs';
import {
    Connection, TBufferedTransport, TJSONProtocol, TCompactProtocol, TBinaryProtocol,
    createClient, createWSClient, createXHRClient, createHttpClient, createStdIOClient,
    createConnection, createSSLConnection, createWSConnection, createXHRConnection, createHttpConnection, createStdIOConnection
} from 'thrift';

type TConnection = {
    0: (Client: any, connection: any) => any;
    1: (host: any, port: any, options: any) => any;
    2: (host: any, port: any, options: any) => any;
    [Symbol.iterator](): Iterator<Pick<TConnection, number & keyof TConnection>>;
};

export type Headers = { [k: string]: any };
export type Protocols = keyof typeof TProtocols;
export type Transports = keyof typeof TConnections;
export type RefCounted = EventTarget & Subscription & { refCount(): RefCounted; };
export type openParams = {
     host: string,
     port: number,
     headers?: Headers,
     encrypted?: boolean,
     protocol?: Protocols,
     transport?: Transports
};

const TProtocols = {
    json: TJSONProtocol,
    binary: TBinaryProtocol,
    compact: TCompactProtocol,
    get default() { return this.binary; }
};

const TConnections: Record<string, TConnection> = {
    ws: [createWSClient, createWSConnection, createWSConnection],
    sock: [createClient, createConnection,   createSSLConnection],
    xhr: [createXHRClient, createXHRConnection, createXHRConnection],
    http: [createHttpClient, createHttpConnection, createHttpConnection],
    stdio: [createStdIOClient, createStdIOConnection, createStdIOConnection],
    get default() { return this.sock; }
};

/**
 * Open a ref-counted connection to a mapd-core instance on `host:port`.
 * The underlying Thrift connection will be closed when all operations
 * using the connection terminate or are disposed.
 *
 * Use args list for default node config:
 * ```
 * connect(host: string, port: number, encrypted?: boolean)
 * ```
 * Use named args to customize the underlying Thrift connection:
 * ```
 * open({
 *     host: string,
 *     port: number,
 *     encrypted?: boolean,
 *     headers?: { [k: string]: any },
 *     protocol?: 'json' | 'binary' | 'compact', (default 'binary')
 *     transport?: 'ws' | 'xhr' | 'http' | 'sock' | 'stdio' (default 'sock')
 * });
 * ```
 * @todo break this out into a separate rxjs-thrift module, as it's not specific to mapd
 * @param {string | openParams} host_or_params - Either an {openParams} Object, or the host to use
 * @param {number} [port] - if host_or_params is a string, use this port
 * @param {boolean} [encrypted=false] - if host_or_params is a string, this flags encryption of the underlying Thrift connection
 */
export function open(opts: openParams): Client<typeof Client>;
export function open(host: string, port: number, encrypted?: boolean): Client<typeof Client>;
export function open(...args: any[]) {
    let [opts, port, encrypted] = args;
    switch (typeof opts) {
        case 'object': break;
        case 'string': opts = { host: opts, port, encrypted }; break;
        default: throw new Error('Please specify mapd-core connect arguments');
    }
    let clientCtor, clientCtorObs, recreate = false;
    return _createClient() && clientCtor.if(
        () => !recreate,
        clientCtor.defer(_returnClient),
        clientCtor.defer(_createClient)
    );
    function _returnClient() {
        return (recreate = true) && clientCtorObs;
    }
    function _createClient() {
        return clientCtorObs = (clientCtor = Client
            .bindClientMethods(createThriftClient(opts)))
            .let(tConnectionErrors).startWith(clientCtor)
            .takeUntil(clientCtor.let(tConnectionClosed));
    }
}

/**
 * Create the MapD Thrift client and connection for the given params
 * @param {openParams}
 */
export function createThriftClient({
    protocol = 'default',
    transport = 'default',
    host, port, encrypted = false,
    ...restConnectParams
}: openParams) {

    if (!host) throw new Error('Please specify the mapd-core host');
    if (!port) throw new Error('Please specify the mapd-core port');

    const TProtocol = TProtocols[protocol] || TProtocols.default;
    const TConnection = TConnections[transport] || TConnections.default;
    const [createMapDThrift, createConnection, createSecureConnection] = TConnection;
    const connectionCreate = !(encrypted = !!encrypted) ? createConnection : createSecureConnection;
    const connection = augmentConnection(connectionCreate(host, port, {
        ...restConnectParams,
        secure: encrypted, https: encrypted,
        protocol: TProtocol, transport: TBufferedTransport // <-- todo: investigate why TFramedTransport doesn't work?
    }));

    return { connection, mapd: createMapDThrift(MapD, connection) };
}

function augmentConnection(connection: any): RefCounted {
    let refs = 0, closed = false, debounceId = null;
    typeof connection.open === 'function' && connection.open();
    connection.refCount = () => ++refs && (debounceId && clearTimeout(debounceId)) || connection;
    connection.unsubscribe = () => {
        if (refs > 0 && --refs === 0 && !closed) {
            debounceId && clearTimeout(debounceId) || (
            debounceId = setTimeout(closeConnection));
        }
    };
    return connection;
    function closeConnection() {
        if (closed || !(closed = true)) {
            return;
        } else if (typeof connection.end === 'function') {
            connection.end();
        } else if (typeof connection.close === 'function') {
            connection.close();
        } else {
            connection.emit('close');
        }
    }
}

function tConnectionClosed(ctor: typeof Client) {
    return ctor.fromEvent(ctor.connection, 'close');
}

function tConnectionErrors(ctor: typeof Client) {
    return ctor.fromEvent(ctor.connection, 'error')
        // omit Thrift's TException and TProtocolException errors from the
        // ConnectionError typeclass, since they can be caused by any RPC
        // and shouldn't necessarily bring down the entire Client connection
        .filter((e) => !(e instanceof Thrift.TException))
        .filter((e) => !(e instanceof Thrift.TProtocolException))
        .flatMap((e) => ctor.throw(e));
}

export default open;
