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
- only compatible with the [@graphistry/mapd-core#shm-ipc](https://github.com/graphistry/mapd-core/tree/shm-ipc) fork (temporary)

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

import open from 'rxjs-mapd';
const host = `localhost`, port = 9091, encrypted = false;
const username = `mapd`, password = `HyperInteractive`, dbName = `mapd`, timeout = 5000;
/**
 * establish the thrift connection to the mapd-core server and emit an rxjs-mapd Client Observable
 * open also accepts named parameters:
 * ```
 * open({
 *     host, port, secure,
 *     protocol: `sock`, transport: `binary`
 * })
 * ```
 */
open(host, port, encrypted)
    /**
     * connect the emitted Client to a mapd-core db. This is a convenience method for
     * calling `connect` on the emitted client via flatMap, so it's identical to this:
     * ```
     * open(...).flatMap((client) => client.connect(username, password, dbName, timeout))
     * ```
     * `connect` also accepts named parameters:
     * ```
     * connect({ dbName, timeout, username, password })
     * ```
     */
    .connect(username, password, dbName, timeout)
    .flatMap((client) => client
        // .query(`SELECT count(*) FROM flights_2008_10k`) // <- 1 col/1 row
        // .query(`SELECT origin_city FROM flights_2008_10k WHERE dest_city ILIKE 'dallas'`) // <- will work when mapd-core serializes categorical results to arrows
        .query(`SELECT origin_lat, origin_lon FROM flights_2008_10k WHERE dest_city ILIKE 'dallas'`) // 2 cols/many rows
        .toArrow()
        .repeat(2) // <- execute the query again -- everything's an Observable!
        .disconnect() // <- disconnect this client session when finished
    )
    .subscribe(printArrowTable, (err) => console.error(err));

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
