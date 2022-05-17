const debug = require('debug')('archwayd');
const chalk = require('chalk');
const { spawn } = require('promisify-child-process');
const { prompts, PromptCancelledError } = require('../../util/prompts');
const { pathExists, mv } = require('../../util/fs');

const KeysCommands = require('./keys');
const TxCommands = require('./tx');

const DefaultArchwaydVersion = 'latest';
const DefaultArchwaydHome = `${process.env.HOME}/.archway`;

/**
 * Facade for the archwayd client, which supports both Docker and binary implementations.
 */
class DefaultArchwayClient {
  #archwaydHome;
  #extraArgs;
  #keys;
  #tx;

  constructor({ archwaydHome = DefaultArchwaydHome, extraArgs = [] }) {
    this.#archwaydHome = archwaydHome;
    this.#extraArgs = extraArgs;
    this.#keys = new KeysCommands(this);
    this.#tx = new TxCommands(this);
  }

  get command() {
    return 'archwayd';
  }

  get archwaydHome() {
    return this.#archwaydHome;
  }

  get extraArgs() {
    return this.#extraArgs;
  }

  get workingDir() {
    return '.';
  }

  get keys() {
    return this.#keys;
  }

  get tx() {
    return this.#tx;
  }

  parseArgs(args = []) {
    return [...this.extraArgs, ...args];
  }

  run(subCommand, args = [], options = { stdio: 'inherit' }) {
    const command = this.command;
    const parsedArgs = this.parseArgs([subCommand, ...args]);
    debug(command, ...parsedArgs);
    return spawn(command, parsedArgs, { ...options, encoding: 'utf8' });
  }
}

class DockerArchwayClient extends DefaultArchwayClient {
  constructor({ archwaydVersion = DefaultArchwaydVersion, testnet, ...options }) {
    super(options);

    this.archwaydVersion = testnet || archwaydVersion;
  }

  get command() {
    return 'docker';
  }

  get workingDir() {
    return this.archwaydHome;
  }

  get extraArgs() {
    const dockerArgs = DockerArchwayClient.#getDockerArgs(this.workingDir, this.archwaydVersion);
    return [...dockerArgs, ...super.extraArgs];
  }

  static #getDockerArgs(archwaydHome, archwaydVersion) {
    return [
      'run',
      '--rm',
      '-it',
      `--volume=${archwaydHome}:/root/.archway`,
      `archwaynetwork/archwayd:${archwaydVersion}`
    ];
  }

  async checkHomePath() {
    const oldArchwayHome = '/var/tmp/.archwayd';
    if (this.archwaydHome === oldArchwayHome || !await pathExists(oldArchwayHome)) {
      return;
    }

    const questions = [
      {
        type: 'confirm',
        name: 'move',
        message: chalk`I've found a keystore in {cyan ${oldArchwayHome}}. Would you like to move it to {cyan ${this.archwaydHome}}?`,
        initial: true
      }, {
        type: async prev => prev && await pathExists(this.archwaydHome) ? 'confirm' : null,
        name: 'overwrite',
        message: chalk`The directory {cyan ${this.archwaydHome}} is not empty. Would you like to overwrite its contents?`,
        initial: true
      }
    ];

    try {
      const { move, overwrite } = await prompts(questions);

      if (move) {
        await mv(oldArchwayHome, this.archwaydHome, overwrite);
      }
    } catch (e) {
      if (e instanceof PromptCancelledError) {
        console.warn(chalk`{yellow Cancelled moving keystore}`);
      } else {
        console.error(`Failed to move directory: ${e.message || e}\n`);
      }
    } finally {
      console.info();
    }
  }
}

async function clientFactory({ docker = false, checkHomePath = false, ...options } = {}) {
  if (docker) {
    const client = new DockerArchwayClient(options);
    if (checkHomePath) {
      await client.checkHomePath();
    }
    return client;
  } else {
    return new DefaultArchwayClient(options);
  }
}

module.exports = {
  DefaultArchwaydHome,
  DefaultArchwaydVersion,
  createClient: clientFactory
};
