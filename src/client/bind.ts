import { Observable } from 'rxjs';
import { getReader } from '../apache/arrow';
import { Client, ClientStatics } from './client';
import { queryCPUDFStatic, queryGPUDFStatic } from './query';

export function bindStatics(this: typeof Client, statics: ClientStatics) {
    class BoundClient<T> extends this<T> {
        lift<R = T>(operator): BoundClient<R> {
            const observable = new BoundClient<R>(this);
            observable.operator = operator;
            return observable;
        }
    }
    return bindObservableMethods(Observable, Object.keys(statics).reduce((ctor, prop) => (
        (ctor[prop] = statics[prop]) && ctor || ctor
    ), BoundClient));
}

export function bindCPUMethods(this: typeof Client, statics: ClientStatics) {
    return this.bindStatics({
        query: queryCPUDFStatic, toArrow: getReader, ...statics
    });
}

export function bindGPUMethods(this: typeof Client, statics: ClientStatics) {
    return this.bindStatics({
        query: queryGPUDFStatic, toArrow: getReader, ...statics
    });
}

export function bindClientMethods(this: typeof Client, statics: ClientStatics) {
    function bindConnectMethod(method) {
        return function boundStaticFn<T>(this: typeof Client, ...args: any[]) {
            return this.usingConnection<T>(
                this.bindNodeCallback<T>(resetThriftClientOnArgumentError).bind(this.mapd, method, ...args));
        };
    }
    function bindSessionMethod(method) {
        return function boundStaticFn<T>(this: typeof Client, ...args: any[]) {
            return this.usingConnection<T>(!this.session
                 ? this.bindNodeCallback<T>(resetThriftClientOnArgumentError).bind(this.mapd, method, ...args)
                 : this.bindNodeCallback<T>(resetThriftClientOnArgumentError).bind(this.mapd, method, this.session, ...args)
            );
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

// If a Thrift method's arguments are malformed, the Thrift transport (TBufferedTransport, etc.) will
// throw a helpful error. Unfortunately, it doesn't flush its internal buffer or dereference the node
// callback. The former means the next RPC will almost certainly fail, and the latter is a memory leak.
// This function catches any error thrown from an RPC and does the necessary cleanup work.
// 
// implementation note: This function is written to accept the Thrift client as the `this` binding, the
// client method as the first argument, and the method's arguments as rest params. This is to avoid creating
// a new instance of this function for each client method, which should make it easier for VMs to optimize.
function resetThriftClientOnArgumentError(this: any /* <- the Thrift Client */, method, ...args) {
    try {
        method.apply(this, args);
    } catch (e) {
        // `this.output` is the Thrift transport instance
        this.output.outCount = 0;
        this.output.outBuffers = [];
        this.output._seqid = null;
        // dereference the callback
        this._reqs[this._seqid] = null;
        throw e; // re-throw the error to Rx
    }
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
        'get_memory_summary',
        'clear_cpu_memory',
        'clear_gpu_memory',
        'sql_execute',
        'sql_execute_df',
        'sql_execute_gpudf',
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
        'get_table_descriptor',
        'get_row_descriptor',
        'render',
        'get_rows_for_pixels',
        'get_row_for_pixel'
    ];
}