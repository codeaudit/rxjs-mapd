const { open } = require('../');
const host = `localhost`, port = 9091, encrypted = false;
const username = `mapd`, password = ``, dbName = `mapd`, timeout = 5000;

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
        // .query(`SELECT count(*) FROM flights`) // <- 1 col/1 row
        // .query(`SELECT origin_city FROM flights WHERE dest_city ILIKE 'dallas'`) // <- will work when mapd-core serializes text -> arrow cols
        .query(`SELECT origin_lat, origin_lon FROM flights WHERE dest_city ILIKE 'dallas'`) // 2 cols/many rows
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