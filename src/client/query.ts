import { Client } from '../client';
import { TGpuDataFrame } from '../mapd';
import { get as shmat } from 'shm-typed-array';
import { getReader, ArrowReader } from '../apache/arrow';

export function queryProto(this: Client<typeof Client>, query: string, limit = -1, deviceId = 0): Client<Buffer> {
    const ThisCtor = this.constructor as typeof Client;
    return this.flatMap<typeof Client, Buffer>(
        ThisCtor.query.bind(ThisCtor, query, limit)
    ) as Client<Buffer>;
}

export function queryStatic(this: typeof Client, query: string, limit = -1, deviceId = 0): Client<Buffer> {
    throw new Error('`query` can only be called after connecting to a database');
}

export function queryCPUDFStatic(this: typeof Client, query: string, limit = -1) {
    return this.mapd_sqlExecuteDf(query, Math.max(-1, limit)).map(sharedMemoryAttach);
}

export function queryGPUDFStatic(this: typeof Client, query: string, limit = -1, deviceId = 0) {
    return this.mapd_sqlExecuteGpudf(query, deviceId, Math.max(-1, limit)).map(cudaMemoryAttach);
}

function sharedMemoryAttach({ df_handle }: TGpuDataFrame): Buffer {
    return shmat(+df_handle, 'Buffer');
}

function cudaMemoryAttach({ df_handle }: TGpuDataFrame): Buffer {
    throw new Error('todo: implement node-cuda IPC');
}

export { queryStatic as _static, queryProto as _proto };