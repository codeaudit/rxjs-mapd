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
            return this.usingConnection<T>(this.bindNodeCallback<T>(method).bind(this.mapd, ...args));
        };
    }
    function bindSessionMethod(method, name) {
        return function boundStaticFn<T>(this: typeof Client, ...args: any[]) {
            return this.usingConnection<T>(!this.session
                 ? this.bindNodeCallback<T>(method).bind(this.mapd, ...args)
                 : this.bindNodeCallback<T>(method).bind(this.mapd, this.session, ...args)
            );
        };
    }
    return (
        clientConnectMethods().reduce((ctor, prop) => (
            (ctor[`mapd_${toCamelCase(prop)}`] = bindConnectMethod(ctor.mapd[prop])) && ctor || ctor
        ),
        clientSessionMethods().reduce((ctor, prop) => (
            (ctor[`mapd_${toCamelCase(prop)}`] = bindSessionMethod(ctor.mapd[prop], prop)) && ctor || ctor
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