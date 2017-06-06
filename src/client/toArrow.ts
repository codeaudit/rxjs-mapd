import { Client } from './client';
import { ArrowReader } from '../apache/arrow';

export function toArrowProto(this: Client<Buffer>, converter?: (buf: any) => ArrowReader) {
    return this.map(converter || (this.constructor as typeof Client).toArrow) as Client<ArrowReader>;
}

export function toArrowStatic(buf: any): ArrowReader {
    throw new Error('static arrow converter must be overridden');
}

export { toArrowStatic as _static, toArrowProto as _proto };