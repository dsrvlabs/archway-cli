# Running Archway CLI in Local Env challange

## Requirements

- Follow official [install document](https://docs.archway.io/docs/create/getting-started/install)
- For now, docker version `archwayd` is not supported. You need to setup `archwayd` as binary.

## Create new project

Before start to test new command. You need to create `archway` project.

```
~$ archway new --no-docker
```

For now, you should add `--no-docker` option because current version of this project doesn't support docker version of `archway`.

## Configure new local chain

Configure new local chain for development purpose.
When you configure new local chain, you need these,
- Node's moniker.
- Chain ID.
- Denomination for token.

To create local chain, try to run below command.

```
# Command format
~$ archway chain new --moniker <YOUR MONIKER> --chain-id <CHAIN ID> --denom <DENOM e.g. utorii>

# Example
~$ archway chain new -m dsrv -c localtest -d utorii

✔ This step will reset local chain configuration. proceed ? … yes
✔ Keyring password … **************
Initialize new chain
Add getTx
Validator Key
address: archway13pfpsmgxq8fkxt49v2zzct4f89keh99wxr8pa9
mnemonic: nation puzzle thunder shoot follow range bicycle item infant vault october school rare hat judge course mom marriage present mammal chimney village bitter horror
Test Keys
===== ===== ===== ===== =====
address: archway1dpry6rzflydskramqag06ns70hd7mrnz0el85f
mnemonic: phone drill push cake impact predict online slim paper meadow fragile ivory airport airport test diamond hunt inherit hard analyst session coast injury bunker
===== ===== ===== ===== =====
address: archway16xchamksank7496nz5npqw7r6f6dnt2gmj7wqu
mnemonic: bulk world captain improve kitchen rate hurdle below element lock rice lava west early adapt shop zebra announce sugar health fabric laptop broom suspect
===== ===== ===== ===== =====
address: archway1nkmnvdyd7evklnsnp8mr2fcdp36fa0x0dwm5t2
mnemonic: unique antenna crane hen midnight glance bring song tenant bridge bullet delay notice glory duty need voice similar defense vendor include canal swim assume
```

If command executed successfully, new chain might be created on *$HOME/.archway* and also new 4 keys are created on keyring on *file* backend.
So you need `--keyring-backend=file` option to query keyring.
That was dicision to support both OSX and Linux because default keyring backend on OSX is **keychain access** which is not available on Linux.

```
~$ archwayd keys list --keyring-backend=file
Enter keyring passphrase:
- name: dsrv
  type: local
  address: archway13pfpsmgxq8fkxt49v2zzct4f89keh99wxr8pa9
  pubkey: '{"@type":"/cosmos.crypto.secp256k1.PubKey","key":"A8ti6bqt4pfpLtq+fJMFUyNVijxXO6VmSJGF01NX9/xF"}'
  mnemonic: ""
- name: tester1
  type: local
  address: archway1dpry6rzflydskramqag06ns70hd7mrnz0el85f
  pubkey: '{"@type":"/cosmos.crypto.secp256k1.PubKey","key":"A1+f+ndvNA3NFKZ4TUIMaWV3lf4MzbM6/DDTqepPPvXp"}'
  mnemonic: ""
- name: tester2
  type: local
  address: archway16xchamksank7496nz5npqw7r6f6dnt2gmj7wqu
  pubkey: '{"@type":"/cosmos.crypto.secp256k1.PubKey","key":"AhCyi7ghD00onbsmnHhAkywYroiOpd+DN9qAtvOYDgwV"}'
  mnemonic: ""
- name: tester3
  type: local
  address: archway1nkmnvdyd7evklnsnp8mr2fcdp36fa0x0dwm5t2
  pubkey: '{"@type":"/cosmos.crypto.secp256k1.PubKey","key":"ApaqFXLc3T3lDz/kFyhBal5h7cyvypbQgqUT8U9yNye2"}'
  mnemonic: ""
```

The account with selected moniker is validator's account and the others are for testing.
Testing accounts have enough tokens on genesis.

## Start new local chain

When you configured new local chain successfully then you can start chain in your local machine.

```
~$ archway chain start
```

## Create snapshot for local chain

To backup current local chain, you need stop local chain first and move to `archway` project directory.
Then execute below.

```
~$ archway chain snapshot
```

Zip file for current chain data will be stored into `$PROJECT_HOME/snapshot`.

## Future works
- Docker support.
- Enhance snapshot feature. Provide snapshot and recovery command with fluent CLI UX.
- Handle more errors and beatify logs.
