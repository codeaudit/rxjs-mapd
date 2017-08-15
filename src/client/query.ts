import { Observable } from 'rxjs';
import { Client } from './client';
import * as shm from 'shm-typed-array';
import { TQueryResult, TDeviceType, TDataFrame } from '../mapd';

export function queryStatic(this: typeof Client, query: string, limit = -1) {
    return this.mapd_sqlExecute(query, true, `${this.nonce++}`, Math.max(-1, limit));
}

export function queryDFStatic(this: typeof Client, query: string, limit = -1, deviceId = 0) {
    const _limit = Math.max(-1, limit);
    const _deviceId = Math.abs(deviceId % (this.gpus + 1));
    return (this.gpus <= 0
        ? this.mapd_sqlExecuteDf(query, TDeviceType.CPU, 0, _limit).map(sharedMemoryAttach)
        : this.mapd_sqlExecuteDf(query, TDeviceType.GPU, _deviceId, _limit).map(cudaMemoryAttach)
    ) as Client<Buffer[]>;
}

export function queryProto(this: Client<typeof Client>, query: string, limit = -1) {
    return this.flatMap((client) => client.query(query, limit)) as Client<TQueryResult>;
}

export function queryDFProto(this: Client<typeof Client>, query: string, limit = -1, deviceId = 0) {
    return this.flatMap((client) => client.queryDF(query, limit, deviceId)) as Client<Buffer[]>;
}

function sharedMemoryAttach(df: TDataFrame): Buffer[] {
    const sm_size = +df.sm_size - 4, df_size = +df.df_size;
    const sm_handle = (<any> df.sm_handle).readUInt32LE(0);
    const df_handle = (<any> df.df_handle).readUInt32LE(0);
    const sm_buffer: Buffer = shm.get(sm_handle, 'Buffer');
    const df_buffer: Buffer = shm.get(df_handle, 'Buffer');
    return [sm_buffer, df_buffer];
}

/*
function sharedMemoryAttach(df: TDataFrame): Buffer {
    // todo: why does mapd add an extra 4 bytes to sm_size?
    const sm_size = +df.sm_size - 4, df_size = +df.df_size;
    const sm_handle = (<any> df.sm_handle).readUInt32LE(0);
    const df_handle = (<any> df.df_handle).readUInt32LE(0);
    const sm_buffer: Buffer = shm.get(sm_handle, 'Buffer');
    const df_buffer: Buffer = shm.get(df_handle, 'Buffer');
    // memcpy schema + batches into node. With the addition
    // of DictionaryBatches and the upgrade to Arrow 0.4.1,
    // mapd stopped encoding the schema into the df_buffer,
    // and started sending them separately. Until we have a
    // decoupled Arrow implementation that can read schemas
    // and messages from different buffers, gotta live with
    // this.
    const arrow_buf = new Buffer(sm_size + df_size);
    sm_buffer.copy(arrow_buf, 0, 0, sm_size);
    df_buffer.copy(arrow_buf, sm_size);
    shm.detach(sm_handle, false);
    shm.detach(df_handle, false);
    return arrow_buf;
}
*/

function cudaMemoryAttach(df: TDataFrame): Buffer[] {
    throw new Error('todo: implement node-cuda IPC');
}
