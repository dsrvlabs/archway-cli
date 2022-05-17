const { add } = require('lodash');
const prompts = require('prompts');
const spawk = require('spawk');
const Chain = require('../chain');
const { spawn, spawnSync } = require('child_process');

describe('chain.new', () => {
    test('Configure new local chain', async () => {
        console.log('test chain new');
    });
});

describe('chain.question', () => {
    test('chain.q', async () => {
        console.log('hello world');

        const question = [
            {
                type: 'confirm',
                name: 'createNew',
                message: "will reset all proceed ?",
                initial: false
            }
        ];

        try {
            const { createNew } = await prompts(question);
            console.log("Your selection", createNew);
        } catch(e) {
            console.log("Err " + e);
        }
    });
});

describe('chain.createkey', () => {
    test('chain.createkey', async () => {

        const question = [
            {
                type: 'text',
                name: 'passwd',
                message: "Keyring password"
            }
        ]

        try {
            // const { passwd } = await prompts(question);
            // console.log("password...", passwd);

            const passwd = '@validator2022\n';

            var add = spawn('archwayd', ['keys', 'add', 'unittest', '--keyring-backend', 'file', '--output', 'json'])
            add.stdin.write(passwd);
            // add.stdin.end();

            console.info(add.stdout.toString());
            console.info(add.stderr.toString());
        } catch (e) {
            console.error(e);
        }
    });
});