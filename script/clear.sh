#!/bin/bash
rm ~/.archway/config/genesis.json

archwayd unsafe-reset-all
archwayd keys delete dsrv -y

for i in {0..3}; do
    echo $i
    archwayd keys delete tester${i} -y
done

rm -rf ~/.archway/config/gentx
