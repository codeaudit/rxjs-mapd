import { Client } from './client';
import { connectProto } from './connect';
import { disconnectProto } from './disconnect';
import { queryProto, queryDFProto } from './query';

import { ArrowReader } from '../apache/arrow';

Client.prototype.query = queryProto;
Client.prototype.queryDF = queryDFProto;
Client.prototype.connect = connectProto;
Client.prototype.disconnect = disconnectProto;

declare module './client' {
    interface Client<T> {
        query: typeof queryProto;
        queryDF: typeof queryDFProto;
        connect: typeof connectProto;
        disconnect: typeof disconnectProto;
    }
}
