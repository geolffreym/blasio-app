import Components from './components';
const EventEmitter = require('events')
const Utils = require('./utils');
const fs = require('fs');
const mergeOptions = require('merge-options')

class Core {
    constructor(options) {
        const defaults = {
            path: Utils.getRepoPath()
        };
        this._options = mergeOptions(defaults, options);
        this.events = new EventEmitter();
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
    }
    
    async start() {
        if(!fs.existsSync(this._options.path)) {
            fs.mkdirSync(this._options.path);
        }
        this.config = new Components.Config(this._options.path)
        this.distillerDB = new Components.DistillerDB(this)
        this.blocklist = new Components.Blocklist(this);
        this.log = Components.Logger(this._options.path)
        await this.config.open()
        await Components.ipfsHandler.start(this._options.path);
        //await Components.ipfsHandler.ready;
        var {ipfs} = await Components.ipfsHandler.getIpfs();
        this.ipfs = ipfs;
        this.ipfs.id().then(peerInfo => {
            this.log.info(`IPFS operational with PeerID of ${peerInfo.id}`)
        })
        this.pins = new Components.Pins(this)
        await this.pins.start()
    }
    async stop() {
        await Components.ipfsHandler.stop(this._options.path);
        await this.pins.stop()
        this.log.info(`App shutting down`)
    }
}
export default Core;