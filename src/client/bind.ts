import { Thrift } from 'thrift';
import { Observable } from 'rxjs';
import { Client as MapD } from '../mapd';
import { Client, ClientStatics } from './client';

export function bindStatics(this: typeof Client, statics: ClientStatics, ClientCtor?: typeof Client) {
    const BoundClient = ClientCtor || class BoundClient<T> extends this<T> {
        lift<R = T>(operator): BoundClient<R> {
            const observable = new BoundClient<R>(this);
            observable.operator = operator;
            return observable;
        }
    };
    return bindObservableMethods(Observable, Object.keys(statics).reduce((ctor, prop) => (
        (ctor[prop] = statics[prop]) && ctor || ctor
    ), BoundClient));
}

export function bindClientMethods(this: typeof Client, statics: ClientStatics) {
    function bindConnectMethod(method) {
        return function boundStaticFn<T>(this: typeof Client, ...args: any[]) {
            return this.usingConnection<T>(
                this.bindNodeCallback<T>(callThriftSafe).bind(this.mapd, method, ...args)
            ).takeUntil(thriftConnectionErrorOrClose(this));
        };
    }
    function bindSessionMethod(method) {
        return function boundStaticFn<T>(this: typeof Client, ...args: any[]) {
            return this.usingConnection<T>(
                 this.bindNodeCallback<T>(lateBindSession).bind(this, method, ...args)
            ).takeUntil(thriftConnectionErrorOrClose(this));
        };
    }
    return (
        clientConnectMethods().reduce((ctor, prop) => (
            (ctor[`mapd_${toCamelCase(prop)}`] = bindConnectMethod(ctor.mapd[prop])) && ctor || ctor
        ),
        clientSessionMethods().reduce((ctor, prop) => (
            (ctor[`mapd_${toCamelCase(prop)}`] = bindSessionMethod(ctor.mapd[prop])) && ctor || ctor
        ),
        this.bindStatics(statics)
    )));
}

export function bindObservableMethods(ObsCtor: typeof Observable, ClientCtor: typeof Client) {
    function bindStaticFn(propName) {
        return function boundStaticFn<T>(this: typeof Client, ...args: any[]): Client<T> {
            return new ClientCtor<T>(ObsCtor[propName](...args));
        };
    }
    function bindStaticFactoryFn(propName) {
        return function boundStaticFactoryFn<T>(this: typeof Client, ...args: any[]) {
            return function factory<U = T>(this: any, ...args2: any[]) {
                const boundFn = ObsCtor[propName](...args);
                // wrap in `defer` to defeat bindCallback's internal publishAsync
                return ClientCtor.defer<U>(() => boundFn.apply(this, args2)) as Client<U>;
            };
        };
    }

    Object.keys(ObsCtor)
          .filter((prop) => ObsCtor[prop] !== ObsCtor
                  && typeof ObsCtor[prop] === 'function')
          .reduce((ctor, prop) => (
              (ctor[prop] = bindStaticFn(prop)) && ctor || ctor
          ), ClientCtor);

    ClientCtor.bindCallback = bindStaticFactoryFn('bindCallback');
    ClientCtor.bindNodeCallback = bindStaticFactoryFn('bindNodeCallback');
    return ClientCtor;
}

function lateBindSession(this: typeof Client, method, ...args) {
    return args.length >= method.length
        ? callThriftSafe.apply(this.mapd, [method, ...args])
        : callThriftSafe.apply(this.mapd, [method, this.sessionId, ...args]);
}

// If a Thrift method's arguments are malformed, the Thrift transport (TBufferedTransport, etc.) will
// throw a helpful error. Unfortunately, it doesn't flush its internal buffer or dereference the node
// callback. The former means the next RPC will almost certainly fail, and the latter is a memory leak.
// This function catches any error thrown from an RPC and does the necessary cleanup work.
// 
// implementation note: This function is written to accept the Thrift client as the `this` binding, the
// client method as the first argument, and the method's arguments as rest params. This is to avoid creating
// a new instance of this function for each client method, which should make it easier for VMs to optimize.
function callThriftSafe(this: MapD, method, ...args) {
    try {
        method.apply(this, args);
    } catch (e) {
        // `this.output` is the Thrift TTransport instance (TBufferedTransport, etc.)
        this.output.outCount = 0;
        this.output.outBuffers = [];
        // reset the sequence ID
        this.output._seqid = null;
        // dereference the callback
        this._reqs[this._seqid] = null;
        throw e; // re-throw the error to Rx
    }
}

function thriftConnectionErrorOrClose(ctor: typeof Client) {
    return ctor.race(
        ctor.fromEvent(ctor.connection, 'close'),
        ctor.fromEvent(ctor.connection, 'error')
            // omit Thrift's TException and TProtocolException errors from the
            // ConnectionError typeclass, since they can be caused by any RPC
            // and shouldn't necessarily bring down the entire Client connection
            .filter((e) => !(e instanceof Thrift.TException))
            .filter((e) => !(e instanceof Thrift.TProtocolException))
            .flatMap((e) => ctor.throw(e))
    );
}

////
// I'd like to have fine-grained error handling on a per-RPC level, but Thrift dispatches errors caused
// by individual RPC's on the shared connection emitter without any info about which RPC raised the error.
// Since we don't want to bring down the entire client connection for a single RPC error, we ignore any
// TProtocolException or TApplicationExceptions, and the individual RPC will be left hanging. If this
// happens a lot in practice, we should move to sane default timeouts for all RPC calls :<
//
// function tProtocolErrors(ctor: typeof Client) {
//     return ctor.fromEvent(this.connection, 'error')
//         .filter((e) => e instanceof Thrift.TProtocolException)
//         .flatMap((e) => this.throw(e));
// }
// 
// function tApplicationErrors(ctor: typeof Client) {
//     return ctor.fromEvent(this.connection, 'error')
//         .filter((e) => e instanceof Thrift.TApplicationException)
//         .flatMap((e) => this.throw(e));
// }
////

function toCamelCase(text) {
    return text.replace(/_(\w)/g, upperCaseFirstLetter);
}

function upperCaseFirstLetter (match, charAfterDash) {
    return charAfterDash.toUpperCase();
}

function clientConnectMethods() {
    return [
        'connect',
        'get_version',
        'execute_first_step',
        'broadcast_serialized_rows'
    ];
}

function clientSessionMethods() {
    return [
        'disconnect',
        'get_server_status',
        'get_tables',
        'get_table_details',
        'get_users',
        'get_databases',
        'start_heap_profile',
        'stop_heap_profile',
        'get_heap_profile',
        'get_memory_gpu',
        'get_memory_cpu',
        'get_memory_summary',
        'clear_cpu_memory',
        'clear_gpu_memory',
        'sql_execute',
        'sql_execute_df',
        // Same as `sql_execute_df` with TDeviceType.GPU
        // 'sql_execute_gdf',
        'interrupt',
        'sql_validate',
        'set_execution_mode',
        'render_vega',
        'get_result_row_for_pixel',
        'get_frontend_view',
        'get_frontend_views',
        'create_frontend_view',
        'delete_frontend_view',
        'get_link_view',
        'create_link',
        'load_table_binary',
        'load_table',
        'detect_column_types',
        'create_table',
        'import_table',
        'import_geo_table',
        'import_table_status',
        'start_query',
        'render_vega_raw_pixels',
        'insert_data',
        // DEPRECATED, DON'T INCLUDE
        // 'get_table_descriptor',
        // 'get_row_descriptor',
        // 'render',
        // 'get_rows_for_pixels',
        // 'get_row_for_pixel',
    ];
}
