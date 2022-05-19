const { spawn, spawnSync } = require('child_process');
const prompts = require('prompts');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const Config = require('../util/config');

const initialBalance = 1000000000000;
const testerKeyNames = ['tester1', 'tester2', 'tester3'];

async function initChain(archwayd, options = {}) {
    if(options.moniker == null || options.chainId == null || options.denom == null) {
        // TODO:
        console.log("Need paremeters.");
        return;
    }

    var question = [
        {
            type: 'confirm',
            name: 'selection',
            message: chalk`{red This step will reset local chain configuration. proceed ?}`,
            initial: false
        }
    ];

    const { selection } = await prompts(question);
    if(!selection) {
        console.warn(chalk`{red bye}`);
        return;
    }

    question = [
        {
            type: 'password',
            name: 'passwd',
            message: "Keyring password"
        }
    ]

    const { passwd } = await prompts(question);
    //

    keyValidator = await createKey(archwayd, options.moniker, passwd);

    const testKeys = [];
    testerKeyNames.forEach(name => {
        const newKey = createKey(archwayd, name, passwd)
        testKeys.push(newKey);
    });

    newChain = new LocalChain(archwayd, options.moniker, options.chainId, options.denom);
    await newChain.initNewChain();

    await newChain.addGenesisAccount(keyValidator, initialBalance);
    testKeys.forEach(async k => {
        await newChain.addGenesisAccount(k, initialBalance);
    });

    await newChain.genTx(options.moniker, initialBalance, passwd);

    console.info(chalk`{red Validator Key}`);
    printKeyInfo(keyValidator);

    console.info(chalk`{red Test Keys}`);
    testKeys.forEach(k => {
        console.info(`===== ===== ===== ===== =====`);
        printKeyInfo(k);
    });
}

async function startChain(archwayd) {
    console.log("Local chain start");
    const startCommand = spawn(archwayd.command, ["start"]);
    startCommand.stdout.pipe(process.stdout);
    startCommand.stderr.pipe(process.stdout);
}

async function resetChain(archwayd) {
    console.log("Reset block data");
    try{
        const resetCommand = spawn(archwayd.command, ["unsafe-reset-all"]);
        resetCommand.stderr.on('data', (data) => {
            process.stdout.write(`${data}`);
        });
    } catch(e) {
        console.error(`Chain Error: ${e}`);
    }
}

async function makeSnapshot(archwayd) {
    console.log("Make a snapshot");
    try {
        const nowDate = new Date();
        const rootPath = path.dirname(await Config.path(this.pathPrefix));
        const mkDir = spawn("mkdir", [`${rootPath}/snapshots`]);
        if (mkDir.error != null){
            throw mkDir.error;
        }
        const snapshot = spawn("tar", ["-C", `${archwayd.archwaydHome}`, "-zcvf", `${rootPath}/snapshots/chaindata_${nowDate.toISOString()}.tar.gz`, `data`]);
        snapshot.stderr.on('data', (data) => {
            process.stdout.write(`${data}`);
            console.log(`Snapshot creation completed. Location: ${rootPath}/snapshots`);
        });
    } catch (e) {
        console.error(e.stderr);
    }
}

class LocalChain {
    constructor(archwayd, moniker, chainId, denom) {
        this.archwayd = archwayd;
        this.moniker = moniker;
        this.chainId = chainId;
        this.denom = denom;
    }

    async resetAll() {
        // TODO:
    }

    async initNewChain() {
        console.log("Initialize new chain");

        const ret = spawnSync(`archwayd`, ['init', this.moniker, '--chain-id', this.chainId, '--home', this.archwayd.archwaydHome]);
        if (ret.error != null) {
            throw ret.error;
        }

        const genesisFilename = `${this.archwayd.archwaydHome}/config/genesis.json`;
        const f = fs.readFileSync(genesisFilename);

        var genesis = JSON.parse(f.toString());

        genesis.app_state.crisis.constant_fee.denom = this.denom;
        genesis.app_state.gov.deposit_params.min_deposit[0].denom = this.denom;
        genesis.app_state.mint.params.mint_denom = this.denom;
        genesis.app_state.staking.params.bond_denom = this.denom;

        fs.writeFileSync(genesisFilename, JSON.stringify(genesis, null, 2));
    }

    async addGenesisAccount(key, amount) {
        console.log("addGenesisAccount");

        const args = [
            'add-genesis-account',
            key.address,
            `${amount}${this.denom}`,
            '--home',
            this.archwayd.archwaydHome,
            '--output',
            'json'
        ];

        const ret = spawnSync(`archwayd`, args);
        if (ret.error != null) {
            throw ret.error;
        }
    }

    async genTx(keyName, amount, passwd) {
        console.log("Add getTx");

        const args = [
            'gentx',
            keyName,
            `${amount}${this.denom}`,
            '--chain-id',
            this.chainId,
            '--keyring-backend',
            'file',
            '--home',
            this.archwayd.archwaydHome
        ];

        var ret = spawnSync(`archwayd`, args, { input: passwd + '\n' });
        if (ret.error != null) {
            throw ret.error;
        }

        ret = spawnSync(`archwayd`, ['collect-gentxs', '--home', this.archwayd.archwaydHome]);
        if (ret.error != null) {
            throw ret.error;
        }
    }
}

createKey = (archwayd, name, passwd) => {
    const args = [
        'keys',
        'add',
        name,
        '--keyring-backend',
        'file',
        '--output',
        'json'
    ];

    const ret = spawnSync(archwayd.command, args, { input: passwd + '\n' })
    if (ret.error != null) {
        throw ret.error;
    }

    return JSON.parse(ret.stdout.toString());
}

printKeyInfo = key => {
    console.log(chalk`address: {yellow ${key.address}}`);
    console.log(chalk`mnemonic: {yellow ${key.mnemonic}}`);
}

module.exports = {
    initChain,
    startChain,
    resetChain,
    makeSnapshot
};
