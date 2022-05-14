const prompts = require('prompts');
const spawk = require('spawk');
const Chain = require('../chain');

describe('chain.new', () => {
    test('Configure new local chain', async () => {
        console.log('test chain new');
    });
});

//describe('start local chain', () => {
//    test('', async () => {
//        console.log('test chain start');
//        const archwayd = spawk.spawn('archwayd');
//
//        await Chain('start', {});
//
//        expect(archwayd.calledWith).toMatchObject({
//            command: 'archwayd',
//            args: ['start']
//        });
//    });
//});

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