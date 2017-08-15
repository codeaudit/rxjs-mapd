require('source-map-support').install({ environment:'node' });

const { Client } = require('../');
const { Observable } = require('rxjs');
const { Table } = require('apache-arrow');
const host = `localhost`, port = 9091, encrypted = false;
const username = `mapd`, password = `HyperInteractive`, dbName = `mapd`, timeout = 5000;

/**
 * Bind the Thrift configuration params to a static Client class.
 * Connections established via the returned Client class will inherit
 * the Thrift configuration arguments from this call.
 * `open` also accepts named parameters:
 * ```
 * Client.open({
 *     host, port, encrypted,
 *     protocol: `net`,
 *     transport: `binary`
 * })
 * ```
 */
const BoundClient = Client.open(host, port, encrypted);

/**
 * Create an Observable of static Client classes, where each class represents a distinct
 * connection to the specified database. A new session is established for each subscriber
 * to the Observable. Each session ref-counts its underlying Thrift transport,
 * automatically opening and closing the transport on demand.
 * `connect` also accepts named parameters:
 * ```
 * connect({ dbName, username, password, timeout })
 * ```
 */
const MapDSessions = BoundClient.connect(dbName, username, password, timeout);

MapDSessions
    .flatMap((session) => getCounts(session).disconnect())
    .map(([schema, records]) => Table.from(schema, records))
    .subscribe((table) => console.log(table.toString() + '\n'));

MapDSessions
    .flatMap((session) => getOrigins(session).disconnect())
    .map(([schema, records]) => Table.from(schema, records))
    .subscribe((table) => console.log(table.toString() + '\n'));

MapDSessions
    .flatMap((session) => getLatLong(session).disconnect())
    .map(([schema, records]) => Table.from(schema, records))
    .subscribe((table) => console.log(table.toString() + '\n'));

function getCounts(session) {
    return session.queryDF(`SELECT count(*) as row_count FROM flights_2008_10k`);
}

function getOrigins(session) {
    return session.queryDF(`SELECT origin_city FROM flights_2008_10k WHERE dest_city ILIKE 'dallas' LIMIT 5`);
}

function getLatLong(session) {
    return session.queryDF(`SELECT origin_lat, origin_lon FROM flights_2008_10k WHERE dest_city ILIKE 'dallas' LIMIT 5`);
}

function writeArrows(name) {
    return function write([schema, records]) {
        const fs = require('fs');
        try {
            const s = fs.statSync(`./arrows/${name}`);
            if (!s || !s.isDirectory()) {
                throw new Error();
            }
        } catch (e) {
            fs.mkdirSync(`./arrows/${name}`);
        }
        fs.writeFileSync(`./arrows/${name}/schema.arrow`, schema);
        fs.writeFileSync(`./arrows/${name}/records.arrow`, records);
    }
}

//
// Or run the following to test that the underlying Thrift
// connections for each session are opened and closed on demand
//
/*
const t1 = MapDSessions.flatMap((session) => Observable.concat(
    getCounts(session), printNewLineObs(),
    getOrigins(session), printNewLineObs(),
    getLatLong(session), printNewLineObs(),
    delayObs(500, getCounts(session)), printNewLineObs(),
    delayObs(500, getOrigins(session)), printNewLineObs(),
    delayObs(500, getLatLong(session)), printNewLineObs(),
    session.disconnect()
));

const t2 = MapDSessions.flatMap((session) => Observable.concat(
    getCounts(session), printNewLineObs(),
    getOrigins(session), printNewLineObs(),
    getLatLong(session), printNewLineObs(),
    delayObs(500, getCounts(session)), printNewLineObs(),
    delayObs(500, getOrigins(session)), printNewLineObs(),
    delayObs(500, getLatLong(session)), printNewLineObs(),
    session.disconnect()
));

t1.concat(delayObs(500, t2))
    .map(toArrow)
    .subscribe(printArrowTable, (err) => console.error(err));

function printNewLineObs() {
    return Observable.defer(() => console.log('') || Observable.empty());
}

function delayObs(t, obs) {
    return Observable.timer(t).mergeMapTo(obs);
}
*/
