import * as rx from 'rxjs';
import { Client } from './client';
import { IScheduler } from 'rxjs/Scheduler';
import { ObservableInput } from 'rxjs/Observable';
import {
    TRow, TPixel, TDBInfo, TStringRow, TTableType, TCopyParams, TStepResult, TColumnType, TInsertData, TQueryResult,
    TPixelResult, TExecuteMode, TPendingQuery, TGpuDataFrame, TRenderResult, TFrontendView, TDetectResult, TImportStatus,
    TServerStatus, TTableDetails, TMemorySummary, TPixelRowResult, TRawPixelDataResult, TPixelTableRowResult,
} from '../mapd';

import * as bind from './bind';
import { _static as queryImpl } from './query';
import { _static as toArrowImpl } from './toArrow';
import { _static as connectImpl } from './connect';
import { _static as disconnectImpl } from './disconnect';

Client.query = queryImpl;
Client.toArrow = toArrowImpl;
Client.connect = connectImpl;
Client.disconnect = disconnectImpl;
Client.bindStatics = bind.bindStatics;
Client.bindCPUMethods = bind.bindCPUMethods;
Client.bindGPUMethods = bind.bindGPUMethods;
Client.bindClientMethods = bind.bindClientMethods;

declare module './client' {
    namespace Client {
        export let from: {
            <T, R>(ish: ArrayLike<T>, scheduler?: IScheduler): Client<R>;
            <T>(ish: ObservableInput<T>, scheduler?: IScheduler): Client<T>
        };
        export let query: typeof queryImpl;
        export let toArrow: typeof toArrowImpl;
        export let connect: typeof connectImpl;
        export let disconnect: typeof disconnectImpl;
        export let bindStatics: typeof bind.bindStatics;
        export let bindCPUMethods: typeof bind.bindCPUMethods;
        export let bindGPUMethods: typeof bind.bindGPUMethods;
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
            (query: string, first_n: number): Client<TGpuDataFrame>;
            (session: string, query: string, first_n: number): Client<TGpuDataFrame>;
        };
        export let mapd_sqlExecuteGpudf: {
            (query: string, device_id: number, first_n: number): Client<TGpuDataFrame>;
            (session: string, query: string, device_id: number, first_n: number): Client<TGpuDataFrame>;
        };
        export let mapd_interrupt: { (): Client<void>; (session: string): Client<void>};
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
        export let mapd_getFrontendViews: { (): Client<TFrontendView[]>; (session: string): Client<TFrontendView[]>};
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
        export let mapd_getTableDescriptor: {
            (table_name: string): Client<{ [k: string]: TColumnType; }>;
            (session: string, table_name: string): Client<{ [k: string]: TColumnType; }>;
        };
        export let mapd_getRowDescriptor: {
            (table_name: string): Client<TColumnType[]>;
            (session: string, table_name: string): Client<TColumnType[]>;
        };
        export let mapd_render: {
            (query: string, render_type: string, nonce: string): Client<TRenderResult>;
            (session: string, query: string, render_type: string, nonce: string): Client<TRenderResult>;
        };
        export let mapd_getRowsForPixels: {
            (widget_id: number, pixels: TPixel[], table_name: string, col_names: string[], column_format: boolean, nonce: string): Client<TPixelResult>;
            (session: string, widget_id: number, pixels: TPixel[], table_name: string, col_names: string[], column_format: boolean, nonce: string): Client<TPixelResult>;
        };
        export let mapd_getRowForPixel: {
            (widget_id: number, pixel: TPixel, table_name: string, col_names: string[], column_format: boolean, pixelRadius: number, nonce: string): Client<TPixelRowResult>;
            (session: string, widget_id: number, pixel: TPixel, table_name: string, col_names: string[], column_format: boolean, pixelRadius: number, nonce: string): Client<TPixelRowResult>;
        };
    }
}
