import * as net from 'net'
import * as tls from 'tls';
import { Thrift } from 'thrift';
import { Client }  from './client';
import { EventEmitter } from 'events';
import { Client as MapD } from '../mapd';
import { Observable, Subscription } from 'rxjs';
import { WSConnection } from 'thrift/lib/nodejs/lib/thrift/ws_connection';
import { XHRConnection } from 'thrift/lib/nodejs/lib/thrift/xhr_connection';
import { HttpConnection } from 'thrift/lib/nodejs/lib/thrift/http_connection';
import { Connection, StdIOConnection } from 'thrift/lib/nodejs/lib/thrift/connection';
import { createClient as TCreateClient, TBufferedTransport, TJSONProtocol, TCompactProtocol, TBinaryProtocol } from 'thrift';

export type TConnection = {
    createConnection: (options: any, connection?: any) => any;
    createSecureConnection: (options: any, connection?: any) => any;
};

export type Headers = { [k: string]: any };
export type Protocols = keyof typeof TProtocols;
export type Transports = keyof typeof TConnections;
export type RefCounted = EventTarget & Subscription & { refCount(): RefCounted; };
export type openParams = {
     host?: string,
     port?: number,
     command?: string,
     headers?: Headers,
     encrypted?: boolean,
     protocol?: Protocols,
     transport?: Transports
};

export const TProtocols = {
    json: TJSONProtocol,
    binary: TBinaryProtocol,
    compact: TCompactProtocol,
    get default() { return this.binary; }
};

export const TConnections: Record<string, TConnection> = {
    ws: { createConnection: createWSConnection, createSecureConnection: createWSConnection },
    net: { createConnection: createNetConnection, createSecureConnection: createTLSConnection },
    xhr: { createConnection: createXHRConnection, createSecureConnection: createXHRConnection },
    http: { createConnection: createHTTPConnection, createSecureConnection: createHTTPConnection },
    stdio: { createConnection: createStdIOConnection, createSecureConnection: createStdIOConnection },
    get default() { return this.net; }
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
 *     host?: string,
 *     port?: number,
 *     command?: string,
 *     encrypted?: boolean,
 *     headers?: { [k: string]: any },
 *     protocol?: 'json' | 'binary' | 'compact', (default 'binary')
 *     transport?: 'ws' | 'net' | 'xhr' | 'http' | 'stdio' (default 'net')
 * });
 * ```
 * @todo break this out into a separate rxjs-thrift module, as it's not specific to mapd
 * @param {string | openParams} host_or_params - Either an {openParams} Object, or the host to use
 * @param {number} [port] - if host_or_params is a string, use this port
 * @param {boolean} [encrypted=false] - if host_or_params is a string, this flags encryption of the underlying Thrift connection
 */
export function openStatic(opts: openParams): typeof Client;
export function openStatic(host: string, port: number, encrypted?: boolean): typeof Client;
export function openStatic(...args: any[]) {
    let [opts, port, encrypted] = args;
    switch (typeof opts) {
        case 'object': break;
        case 'string': opts = { host: opts, port, encrypted }; break;
        default: throw new Error('Please specify mapd-core connect arguments');
    }

    return Client.bindClientMethods(createThriftClient(opts));
}

/**
 * Create the MapD Thrift client and connection for the given params
 * @param {openParams}
 */
export function createThriftClient({
    encrypted = false,
    host, port, command,
    protocol = 'default',
    transport = 'default',
    ...restConnectionParams
}: openParams) {

    if (transport !== 'sdtio' &&    !host) throw new Error('Please specify the mapd-core host');
    if (transport !== 'sdtio' &&    !port) throw new Error('Please specify the mapd-core port');
    if (transport === 'sdtio' && !command) throw new Error('Please specify a command to start the mapd-core daemon');

    const TProtocol = TProtocols[protocol] || TProtocols.default;
    const TConnection = TConnections[transport] || TConnections.default;
    const createConnection = TConnection[!(encrypted = !!encrypted)
        ? 'createConnection'
        : 'createSecureConnection'
    ];
    const connection = getAutoCloseConnection(createConnection, {
        host, port, command,
        ...restConnectionParams,
        secure: encrypted, https: encrypted,
        protocol: TProtocol, transport: TBufferedTransport // <-- MapDServer doesn't use TFramedTransport, must use TBufferedTransport
    });

    return { connection, nonce: 0, mapd: TCreateClient(MapD, connection) as any };
}

function getAutoCloseConnection(createConnection, createOpts): RefCounted {
    let refs = 0, closed = false, debounceId = null;
    const connection = createConnection(createOpts);
    connection.refCount = () => (
        (++refs === 1)
            && (debounceId && clearTimeout(debounceId) || true)
            && (closed && createConnection(createOpts, connection) && (closed = false))
            && false || connection
    );
    connection.unsubscribe = () => (
        (refs > 0 && --refs === 0 && !closed)
            && (debounceId && clearTimeout(debounceId) || true)
            && (debounceId = setTimeout(closeConnection))
    );
    return connection;
    function closeConnection() {
        !closed && (closed = true) && (
            (typeof connection.end === 'function' && connection.end() || true) ||
            (typeof connection.close === 'function'&& connection.close() || true) ||
            (connection.emit('close'))
        );
    }
}

function createHTTPConnection(opts, conn) {
    return (!conn
        ? (conn = new HttpConnection(opts.host, opts.port, opts))
        : (HttpConnection.call(conn, opts.host, opts.port, opts))
    ) && conn || conn;
}

function createWSConnection(opts, conn) {
    return (!conn
        ? (conn = new WSConnection(opts.host, opts.port, opts))
        : (WSConnection.call(conn, opts.host, opts.port, opts))
    ).open() && conn || conn;
}

function createXHRConnection(opts, conn) {
    return (!conn
        ? (conn = new XHRConnection(opts.host, opts.port, opts))
        : (conn = XHRConnection.call(conn, opts.host, opts.port, opts))
    ).open() && conn || conn;
}

function createNetConnection(opts, conn) {
    return (!conn
        ? (conn = new Connection(net.createConnection(opts.port, opts.host), opts))
        : (Connection.call(conn, net.createConnection(opts.port, opts.host), opts))
    ) && conn || conn;
}

function createTLSConnection(opts, conn) {
    return (!conn
        ? (conn = new Connection(tls.connect(opts.port, opts.host, opts), opts))
        : (Connection.call(conn, tls.connect(opts.port, opts.host, opts), opts))
    ) && conn || conn;
}

function createStdIOConnection(opts, conn) {
    return (!conn
        ? (conn = new StdIOConnection(opts.command, opts))
        : (StdIOConnection.call(conn, opts.command, opts))
    ) && conn || conn;
}
