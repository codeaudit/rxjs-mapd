import * as rx from 'rxjs';
import { Client } from './client';
import { IScheduler } from 'rxjs/Scheduler';
import { ObservableInput } from 'rxjs/Observable';
import {
    TRow, TPixel, TDBInfo, TStringRow, TDeviceType, TTableType, TCopyParams, TStepResult, TColumnType, TInsertData, TQueryResult,
    TPixelResult, TExecuteMode, TPendingQuery, TDataFrame, TRenderResult, TFrontendView, TDetectResult, TImportStatus,
    TServerStatus, TTableDetails, TMemorySummary, TPixelRowResult, TRawPixelDataResult, TPixelTableRowResult,
} from '../mapd';

import * as bind from './bind';
import { openStatic } from './open';
import { connectStatic } from './connect';
import { disconnectStatic } from './disconnect';
import { queryStatic, queryDFStatic } from './query';

Client.open = openStatic;
Client.query = queryStatic;
Client.queryDF = queryDFStatic;
Client.connect = connectStatic;
Client.disconnect = disconnectStatic;
Client.bindStatics = bind.bindStatics;
Client.bindClientMethods = bind.bindClientMethods;

declare module './client' {
    namespace Client {
        export let from: {
            <T, R>(ish: ArrayLike<T>, scheduler?: IScheduler): Client<R>;
            <T>(ish: ObservableInput<T>, scheduler?: IScheduler): Client<T>
        };

        export let open: typeof openStatic;
        export let query: typeof queryStatic;
        export let queryDF: typeof queryDFStatic;
        export let connect: typeof connectStatic;
        export let disconnect: typeof disconnectStatic;
        export let bindStatics: typeof bind.bindStatics;
        export let bindClientMethods: typeof bind.bindClientMethods;

        export let mapd_getVersion: () => Client<void>;
        export let mapd_connect: (user: string, passwd: string, dbname: string) => Client<string>;
        export let mapd_executeFirstStep: (pending_query: TPendingQuery) => Client<TStepResult>;
        export let mapd_broadcastSerializedRows: (serialized_rows: string, row_desc: TColumnType[], query_id: number) => Client<void>;

        export let mapd_disconnect: {
            (): Client<void>;
            (session: string): Client<void>
        };
        export let mapd_getServerStatus: {
            (): Client<TServerStatus>;
            (session: string): Client<TServerStatus>
        };
        export let mapd_getTables: {
            (): Client<string[]>;
            (session: string): Client<string[]>
        };
        export let mapd_getTableDetails: {
            (table_name: string): Client<TTableDetails>;
            (session: string, table_name: string): Client<TTableDetails>;
        };
        export let mapd_getUsers: {
            (): Client<string[]>;
            (session: string): Client<string[]>
        };
        export let mapd_getDatabases: {
            (): Client<TDBInfo[]>;
            (session: string): Client<TDBInfo[]>
        };
        export let mapd_startHeapProfile: {
            (): Client<void>;
            (session: string): Client<void>
        };
        export let mapd_stopHeapProfile: {
            (): Client<void>;
            (session: string): Client<void>
        };
        export let mapd_getHeapProfile: {
            (): Client<string>;
            (session: string): Client<string>
        };
        export let mapd_getMemoryCpu: {
            (): Client<string>;
            (session: string): Client<string>
        };
        export let mapd_getMemoryGpu: {
            (): Client<string>;
            (session: string): Client<string>
        };
        export let mapd_getMemorySummary: {
            (): Client<TMemorySummary>;
            (session: string): Client<TMemorySummary>
        };
        export let mapd_clearCpuMemory: {
            (): Client<void>;
            (session: string): Client<void>
        };
        export let mapd_clearGpuMemory: {
            (): Client<void>;
            (session: string): Client<void>
        };
        export let mapd_sqlExecute: {
            (query: string, column_format: boolean, nonce: string, first_n: number): Client<TQueryResult>;
            (session: string, query: string, column_format: boolean, nonce: string, first_n: number): Client<TQueryResult>;
        };
        export let mapd_sqlExecuteDf: {
            (query: string, device_type: TDeviceType, device_id: number, first_n: number): Client<TDataFrame>;
            (session: string, query: string, device_type: TDeviceType, device_id: number, first_n: number): Client<TDataFrame>;
        };
        export let mapd_interrupt: {
            (): Client<void>;
            (session: string): Client<void>
        };
        export let mapd_sqlValidate: {
            (query: string): Client<{ [k: string]: TColumnType; }>;
            (session: string, query: string): Client<{ [k: string]: TColumnType; }>;
        };
        export let mapd_setExecutionMode: {
            (mode: TExecuteMode): Client<void>;
            (session: string, mode: TExecuteMode): Client<void>;
        };
        export let mapd_renderVega: {
            (widget_id: number, vega_json: string, compression_level: number, nonce: string): Client<TRenderResult>;
            (session: string, widget_id: number, vega_json: string, compression_level: number, nonce: string): Client<TRenderResult>;
        };
        export let mapd_getResultRowForPixel: {
            (widget_id: number, pixel: TPixel, table_col_names: { [k: string]: string[]; }, column_format: boolean, pixelRadius: number, nonce: string): Client<TPixelTableRowResult>;
            (session: string, widget_id: number, pixel: TPixel, table_col_names: { [k: string]: string[]; }, column_format: boolean, pixelRadius: number, nonce: string): Client<TPixelTableRowResult>;
        };
        export let mapd_getFrontendView: {
            (view_name: string): Client<TFrontendView>;
            (session: string, view_name: string): Client<TFrontendView>;
        };
        export let mapd_getFrontendViews: {
            (): Client<TFrontendView[]>;
            (session: string): Client<TFrontendView[]>
        };
        export let mapd_createFrontendView: {
            (view_name: string, view_state: string, image_hash: string, view_metadata: string): Client<void>;
            (session: string, view_name: string, view_state: string, image_hash: string, view_metadata: string): Client<void>;
        };
        export let mapd_deleteFrontendView: {
            (view_name: string): Client<void>;
            (session: string, view_name: string): Client<void>;
        };
        export let mapd_getLinkView: {
            (link: string): Client<TFrontendView>;
            (session: string, link: string): Client<TFrontendView>;
        };
        export let mapd_createLink: {
            (view_state: string, view_metadata: string): Client<string>;
            (session: string, view_state: string, view_metadata: string): Client<string>;
        };
        export let mapd_loadTableBinary: {
            (table_name: string, rows: TRow[]): Client<void>;
            (session: string, table_name: string, rows: TRow[]): Client<void>;
        };
        export let mapd_loadTable: {
            (table_name: string, rows: TStringRow[]): Client<void>;
            (session: string, table_name: string, rows: TStringRow[]): Client<void>;
        };
        export let mapd_detectColumnTypes: {
            (file_name: string, copy_params: TCopyParams): Client<TDetectResult>;
            (session: string, file_name: string, copy_params: TCopyParams): Client<TDetectResult>;
        };
        export let mapd_createTable: {
            (table_name: string, row_desc: TColumnType[], table_type: TTableType): Client<void>;
            (session: string, table_name: string, row_desc: TColumnType[], table_type: TTableType): Client<void>;
        };
        export let mapd_importTable: {
            (table_name: string, file_name: string, copy_params: TCopyParams): Client<void>;
            (session: string, table_name: string, file_name: string, copy_params: TCopyParams): Client<void>;
        };
        export let mapd_importGeoTable: {
            (table_name: string, file_name: string, copy_params: TCopyParams, row_desc: TColumnType[]): Client<void>;
            (session: string, table_name: string, file_name: string, copy_params: TCopyParams, row_desc: TColumnType[]): Client<void>;
        };
        export let mapd_importTableStatus: {
            (import_id: string): Client<TImportStatus>;
            (session: string, import_id: string): Client<TImportStatus>;
        };
        export let mapd_startQuery: {
            (query_ra: string, just_explain: boolean): Client<TPendingQuery>;
            (session: string, query_ra: string, just_explain: boolean): Client<TPendingQuery>;
        };
        export let mapd_renderVegaRawPixels: {
            (widget_id: number, node_idx: number, vega_json: string): Client<TRawPixelDataResult>;
            (session: string, widget_id: number, node_idx: number, vega_json: string): Client<TRawPixelDataResult>;
        };
        export let mapd_insertData: {
            (insert_data: TInsertData): Client<void>;
            (session: string, insert_data: TInsertData): Client<void>;
        };
    }
}
