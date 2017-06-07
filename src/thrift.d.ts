declare module 'thrift' {

    function createClient(ServiceClient: any, connection: any): any;
    function createConnection(host: any, port: any, options: any): any;
    function createHttpClient(ServiceClient: any, connection: any): any;
    function createHttpConnection(host: any, port: any, options: any): any;
    function createMultiplexServer(processor: any, options: any): any;
    function createSSLConnection(host: any, port: any, options: any): any;
    function createServer(processor: any, handler: any, options: any): any;
    function createStdIOClient(ServiceClient: any, connection: any): any;
    function createStdIOConnection(command: any, options: any): any;
    function createWSClient(ServiceClient: any, connection: any): any;
    function createWSConnection(host: any, port: any, options: any): any;
    function createWebServer(options: any): any;
    function createXHRClient(ServiceClient: any, connection: any): any;
    function createXHRConnection(host: any, port: any, options: any): any;

    type TTransport = TBufferedTransport | TFramedTransport;
    type TProtocol = TBinaryProtocol | TCompactProtocol | TJSONProtocol;
    type TConnection = Connection | HttpConnection | WSConnection | XHRConnection;

    namespace Thrift {

        function objectLength(obj: any): number;
        function copyMap(obj: any, types: any[]): any;
        function copyList(lst: any[], types: any[]): any;
        function inherits(constructor: any, superConstructor: any): any;

        enum Type {
            STOP = 0,
            VOID = 1,
            BOOL = 2,
            BYTE = 3,
            I08 = 3,
            DOUBLE = 4,
            I16 = 6,
            I32 = 8,
            I64 = 10,
            STRING = 11,
            UTF7 = 11,
            STRUCT = 12,
            MAP = 13,
            SET = 14,
            LIST = 15,
            UTF8 = 16,
            UTF16 = 17
        }

        enum MessageType {
            CALL = 1,
            EXCEPTION = 2,
            ONEWAY = 3,
            REPLY = 4,
        }

        enum TApplicationExceptionType {
            UNKNOWN = 0,
            UNKNOWN_METHOD = 1,
            INVALID_MESSAGE_TYPE = 2,
            WRONG_METHOD_NAME = 3,
            BAD_SEQUENCE_ID = 4,
            MISSING_RESULT = 5,
            INTERNAL_ERROR = 6,
            PROTOCOL_ERROR = 7,
            INVALID_TRANSFORM = 8,
            INVALID_PROTOCOL = 9,
            UNSUPPORTED_CLIENT_TYPE = 10
        }

        enum TProtocolExceptionType {
            UNKNOWN = 0,
            INVALID_DATA = 1,
            NEGATIVE_SIZE = 2,
            SIZE_LIMIT = 3,
            BAD_VERSION = 4,
            NOT_IMPLEMENTED = 5,
            DEPTH_LIMIT = 6
        }

        class TException implements Error {
            name: string;
            message: string;
            constructor(message: string);
            toString(): any;
            getMessage(): string;
        }

        class TProtocolException implements Error {
            type: any;
            name: string;
            message: string;
            constructor(type: any, message: any);
        }

        class TApplicationException extends TException {
            constructor(type: any, message: any);
            read(input: any): void;
            write(output: any): void;
        }
    }

    class Connection extends EventTarget {
        constructor(stream: any, options: any);
        connection_gone(): void;
        destroy(): void;
        end(): void;
        initialize_retry_vars(): void;
        write(data: any): void;
    }

    class HttpConnection extends Connection {
        constructor(host: any, port: any, options: any);
        write(data: any): void;
    }

    class Int64 {
        constructor(a1: any, a2: any, ...args: any[]);
        copy(targetBuffer: any, targetOffset: any): void;
        inspect(): any;
        setValue(hi: any, lo: any, ...args: any[]): void;
        toBuffer(rawBuffer: any): any;
        toNumber(allowImprecise: any): any;
        toOctetString(sep: any): any;
        toString(radix: any): any;
        valueOf(): any;
        static MAX_INT: number;
        static MIN_INT: number;
    }

    class MultiplexedProcessor {
        constructor(stream: any, options: any);
        process(inp: any, out: any): any;
        registerProcessor(name: any, handler: any): void;
    }

    class Multiplexer {
        constructor();
        createClient(serviceName: any, ServiceClient: any, connection: any): any;
    }

    class TBinaryProtocol {
        constructor(trans: any, strictRead: any, strictWrite: any);
        flush(): any;
        getTransport(): any;
        readBinary(): any;
        readBool(): any;
        readByte(): any;
        readDouble(): any;
        readFieldBegin(): any;
        readFieldEnd(): void;
        readI16(): any;
        readI32(): any;
        readI64(): any;
        readListBegin(): any;
        readListEnd(): void;
        readMapBegin(): any;
        readMapEnd(): void;
        readMessageBegin(): any;
        readMessageEnd(): void;
        readSetBegin(): any;
        readSetEnd(): void;
        readString(): any;
        readStructBegin(): any;
        readStructEnd(): void;
        skip(type: any): void;
        writeBinary(arg: any): void;
        writeBool(bool: any): void;
        writeByte(b: any): void;
        writeDouble(dub: any): void;
        writeFieldBegin(name: any, type: any, id: any): void;
        writeFieldEnd(): void;
        writeFieldStop(): void;
        writeI16(i16: any): void;
        writeI32(i32: any): void;
        writeI64(i64: any): void;
        writeListBegin(etype: any, size: any): void;
        writeListEnd(): void;
        writeMapBegin(ktype: any, vtype: any, size: any): void;
        writeMapEnd(): void;
        writeMessageBegin(name: any, type: any, seqid: any): void;
        writeMessageEnd(): void;
        writeSetBegin(etype: any, size: any): void;
        writeSetEnd(): void;
        writeString(arg: any): void;
        writeStringOrBinary(name: any, encoding: any, arg: any): void;
        writeStructBegin(name: any): void;
        writeStructEnd(): void;
    }

    class TBufferedTransport {
        constructor(buffer: any, callback: any);
        borrow(): any;
        close(): void;
        commitPosition(): void;
        consume(bytesConsumed: any): void;
        ensureAvailable(len: any): void;
        flush(): void;
        isOpen(): any;
        open(): void;
        read(len: any): any;
        readByte(): any;
        readDouble(): any;
        readI16(): any;
        readI32(): any;
        readString(len: any): any;
        rollbackPosition(): void;
        setCurrSeqId(seqid: any): void;
        write(buf: any): void;
        static receiver(callback: any, seqid: any): any;
    }

    class TCompactProtocol {
        constructor(trans: any);
        flush(): any;
        getCompactType(ttype: any): any;
        getTType(type: any): any;
        getTransport(): any;
        i32ToZigzag(n: any): any;
        i64ToZigzag(l: any): any;
        readBinary(): any;
        readBool(): any;
        readByte(): any;
        readDouble(): any;
        readFieldBegin(): any;
        readFieldEnd(): void;
        readI16(): any;
        readI32(): any;
        readI64(): any;
        readListBegin(): any;
        readListEnd(): void;
        readMapBegin(): any;
        readMapEnd(): void;
        readMessageBegin(): any;
        readMessageEnd(): void;
        readSetBegin(): any;
        readSetEnd(): void;
        readString(): any;
        readStructBegin(): any;
        readStructEnd(): void;
        readVarint32(): any;
        readVarint64(): any;
        skip(type: any): void;
        writeBinary(arg: any): void;
        writeBool(value: any): void;
        writeByte(b: any): void;
        writeCollectionBegin(elemType: any, size: any): void;
        writeDouble(v: any): void;
        writeFieldBegin(name: any, type: any, id: any): any;
        writeFieldBeginInternal(name: any, fieldType: any, fieldId: any, typeOverride: any): void;
        writeFieldEnd(): void;
        writeFieldStop(): void;
        writeI16(i16: any): void;
        writeI32(i32: any): void;
        writeI64(i64: any): void;
        writeListBegin(elemType: any, size: any): void;
        writeListEnd(): void;
        writeMapBegin(keyType: any, valType: any, size: any): void;
        writeMapEnd(): void;
        writeMessageBegin(name: any, type: any, seqid: any): void;
        writeMessageEnd(): void;
        writeSetBegin(elemType: any, size: any): void;
        writeSetEnd(): void;
        writeString(arg: any): void;
        writeStringOrBinary(name: any, encoding: any, arg: any): void;
        writeStructBegin(name: any): void;
        writeStructEnd(): void;
        writeVarint32(n: any): void;
        writeVarint64(n: any): void;
        zigzagToI32(n: any): any;
        zigzagToI64(n: any): any;
        static PROTOCOL_ID: number;
        static TTypeToCType: number[];
        static TYPE_BITS: number;
        static TYPE_MASK: number;
        static TYPE_SHIFT_AMOUNT: number;
        static Types: {
            CT_BINARY: number;
            CT_BOOLEAN_FALSE: number;
            CT_BOOLEAN_TRUE: number;
            CT_BYTE: number;
            CT_DOUBLE: number;
            CT_I16: number;
            CT_I32: number;
            CT_I64: number;
            CT_LIST: number;
            CT_MAP: number;
            CT_SET: number;
            CT_STOP: number;
            CT_STRUCT: number;
        };
        static VERSION_MASK: number;
        static VERSION_N: number;
    }

    class TFramedTransport {
        constructor(buffer: any, callback: any);
        borrow(): any;
        close(): void;
        commitPosition(): void;
        consume(bytesConsumed: any): void;
        ensureAvailable(len: any): void;
        flush(): void;
        isOpen(): any;
        open(): void;
        read(len: any): any;
        readByte(): any;
        readDouble(): any;
        readI16(): any;
        readI32(): any;
        readString(len: any): any;
        rollbackPosition(): void;
        setCurrSeqId(seqid: any): void;
        write(buf: any, encoding: any): void;
        static receiver(callback: any, seqid: any): any;
    }

    class TJSONProtocol {
        constructor(trans: any);
        flush(): any;
        getTransport(): any;
        readBinary(): any;
        readBool(): any;
        readByte(): any;
        readDouble(): any;
        readFieldBegin(): any;
        readFieldEnd(): void;
        readI16(): any;
        readI32(f: any): any;
        readI64(): any;
        readListBegin(): any;
        readListEnd(): void;
        readMapBegin(): any;
        readMapEnd(): void;
        readMessageBegin(): any;
        readMessageEnd(): void;
        readSetBegin(): any;
        readSetEnd(): any;
        readString(): any;
        readStructBegin(): any;
        readStructEnd(): void;
        readValue(f: any): any;
        skip(type: any): void;
        writeBinary(arg: any): void;
        writeBool(bool: any): void;
        writeByte(byte: any): void;
        writeDouble(dub: any): void;
        writeFieldBegin(name: any, fieldType: any, fieldId: any): void;
        writeFieldEnd(): void;
        writeFieldStop(): void;
        writeI16(i16: any): void;
        writeI32(i32: any): void;
        writeI64(i64: any): void;
        writeListBegin(elemType: any, size: any): void;
        writeListEnd(): void;
        writeMapBegin(keyType: any, valType: any, size: any): void;
        writeMapEnd(): void;
        writeMessageBegin(name: any, messageType: any, seqid: any): void;
        writeMessageEnd(): void;
        writeSetBegin(elemType: any, size: any): void;
        writeSetEnd(): void;
        writeString(arg: any): void;
        writeStructBegin(name: any): void;
        writeStructEnd(): void;
        writeToTransportIfStackIsFlushable(): void;
        static RType: {
            dbl: number;
            i16: number;
            i32: number;
            i64: number;
            i8: number;
            lst: number;
            map: number;
            rec: number;
            set: number;
            str: number;
            tf: number;
        };
        static Type: {
            '10': string;
            '11': string;
            '12': string;
            '13': string;
            '14': string;
            '15': string;
            '2': string;
            '3': string;
            '4': string;
            '6': string;
            '8': string;
        };
        static Version: number;
    }

    class WSConnection extends Connection {
        constructor(host: any, port: any, options: any);
        close(): void;
        isOpen(): any;
        open(): void;
        uri(): any;
        write(data: any): void;
    }

    class XHRConnection extends Connection {
        constructor(host: any, port: any, options: any);
        close(): void;
        flush(): any;
        getSendBuffer(): any;
        getXmlHttpRequestObject(): any;
        isOpen(): any;
        open(): void;
        read(len: any): any;
        readAll(): any;
        setRecvBuffer(buf: any): void;
        write(buf: any): void;
    }
}
