const { spawn, spawnSync } = require('child_process');
const prompts = require('prompts');
const chalk = require('chalk');
const fs = require('fs');

const initialBalance = 1000000000000;
const testerKeyNames = ['tester1', 'tester2', 'tester3'];

async function main(archwayd, name, options = {}) {
    try {
        switch (name) {
        case 'new':
            // TODO: Refactoring?
            if(options.moniker == null || options.chainId == null || options.denom == null) {
                // TODO:
                console.log("Need paremeters.");
                return;
            }

            const question = [
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
            //

            keyValidator = await createKey(archwayd, options.moniker);

            const testKeys = [];
            testerKeyNames.forEach(name => {
                const newKey = createKey(archwayd, name)
                testKeys.push(newKey);
            });

            newChain = new LocalChain(archwayd, options.moniker, options.chainId, options.denom);
            await newChain.initNewChain();

            await newChain.addGenesisAccount(keyValidator, initialBalance);
            testKeys.forEach(async k => {
                await newChain.addGenesisAccount(k, initialBalance);
            });

            await newChain.genTx(options.moniker, initialBalance);

            console.info(chalk`{red Validator Key}`);
            printKeyInfo(keyValidator);

            console.info(chalk`{red Test Keys}`);
            testKeys.forEach(k => {
                console.info(`===== ===== ===== ===== =====`);
                printKeyInfo(k);
            });

            break;
        case 'start':
            console.log("Local chain start");
            command = spawn(archwayd.command, [name]);
            break;
        case 'reset':
	    console.log("Reset block data");
	    command = spawn(archwayd.command, ["unsafe-reset-all"]);
	    command.stderr.on('data', (data) => {
                process.stdout.write(`${data}`);
            });	
            break;
        case 'test':
            break;
        default:
            break;
        }
    } catch (e) {
        console.error("Chain Error " + e);
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
        const ret = spawnSync(`archwayd`, ['add-genesis-account', key.address, `${amount}${this.denom}`, '--home', this.archwayd.archwaydHome, '--output', 'json']);
        if (ret.error != null) {
            throw ret.error;
        }
    }

    async genTx(keyName, amount) {
        console.log("Add getTx");

        var ret = spawnSync(`archwayd`, ['gentx', keyName, `${amount}${this.denom}`, '--chain-id', this.chainId, '--home', this.archwayd.archwaydHome]);
        if (ret.error != null) {
            throw ret.error;
        }

        ret = spawnSync(`archwayd`, ['collect-gentxs', '--home', this.archwayd.archwaydHome, ]);
        if (ret.error != null) {
            throw ret.error;
        }
    }
}

createKey = (archwayd, name) => {
    // TODO: Handle already exist.
    const ret = spawnSync(`archwayd`, ['keys', 'add', name, '--home', archwayd.archwaydHome, '--output', 'json']);
    if (ret.error != null) {
        throw ret.error;
    }

    return JSON.parse(ret.stdout.toString());
}

printKeyInfo = key => {
    console.log(chalk`address: {yellow ${key.address}}`);
    console.log(chalk`mnemonic: {yellow ${key.mnemonic}}`);
}

module.exports = main;
