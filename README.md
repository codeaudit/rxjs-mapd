# reactive node bindings to [mapd-core](https://github.com/mapd/mapd-core) via [rxjs](https://github.com/ReactiveX/rxjs) and [apache arrow](http://arrow.apache.org/)

A thin Observable wrapper for connecting to mapd-core. Interact with query results in host or device memory as Arrow columns.

### install:
`npm install rxjs-mapd`

### collaborate:
`git clone git@github.com:graphistry/rxjs-mapd.git`

### notes:
- only meant for node
- no GPU Arrows yet (see todos #1)
- should work with docker (see [`docker-run --ipc`](https://docs.docker.com/engine/reference/run/#ipc-settings-ipc) for details)

### todos:
1. add IPC handlers to [`node-cuda`](https://github.com/graphistry/node-cuda) so we can use GPU Arrows
1. need to investigate runnning mapd-core in CI so I can write tests
1. break out custom Thrift setup into separate `rxjs-thrift` module
1. contribute typings, bugfixes, and cuda integration to Apache Arrow's JS lib then switch
1. submit PRs to Apache's Thrift compiler for smaller files, better typings, and option to omit Q
1. finish writing LINQ in JS and fold this into that, so we can [JIT to LLIR](https://github.com/cucapra/node-llvmc) and run LINQ on GPUs

### usage:
code from `examples/index.js`:
```javascript
/**
 * Assumes default mapd-core setup and flights_2008_10k test dataset
 */
import Client from 'rxjs-mapd';
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
const mapdSessions = BoundClient.connect(dbName, username, password, timeout);

mapdSessions
    .flatMap((session) => session
        .queryDF(`SELECT count(*) as row_count FROM flights_2008_10k`)
        .disconnect()
    ).subscribe(printArrowTable, (err) => console.error(err));

mapdSessions
    .flatMap((session) => session
        .queryDF(`SELECT origin_city FROM flights_2008_10k WHERE dest_city ILIKE 'dallas' LIMIT 5`)
        .disconnect()
    ).subscribe(printArrowTable, (err) => console.error(err));

mapdSessions
    .flatMap((session) => session
        .queryDF(`SELECT origin_lat, origin_lon FROM flights_2008_10k WHERE dest_city ILIKE 'dallas' LIMIT 5`)
        .disconnect()
    ).subscribe(printArrowTable, (err) => console.error(err));

function printArrowTable(arrow, schema = arrow.getSchema()) {
    let rows, table = [
        schema.map(({ name }) => name).join(', ')
    ];
    while ((rows = arrow.loadNextBatch()) > 0) {
        for (let row = -1; ++row < rows;) {
            const tRow = [];
            for (const { name } of schema) {
                tRow.push(arrow.getVector(name).get(row));
            }
            table.push(tRow.join(', '));
        }
    }
    console.log(table.join('\n'));
}
```
