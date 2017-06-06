import { Client } from './client';
import { _proto as query } from './query';
import { _proto as toArrow } from './toArrow';
import { _proto as connect } from './connect';
import { _proto as disconnect } from './disconnect';

import { ArrowReader } from '../apache/arrow';

Client.prototype.query = query;
Client.prototype.toArrow = toArrow;
Client.prototype.connect = connect;
Client.prototype.disconnect = disconnect;

declare module './client' {
    interface Client<T> {
        query: typeof query;
        toArrow: typeof toArrow;
        connect: typeof connect;
        disconnect: typeof disconnect;
    }
}
