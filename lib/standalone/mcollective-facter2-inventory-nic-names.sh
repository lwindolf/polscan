#!/bin/bash

# group: System
# name: NIC Names
# description: Inventory only scanner determining NIC names via facter 2. Probably won't work with facter 3+

mco inventory --script <(/bin/echo "
inventory do
  format '%s System INVENTORY |||NIC Names||| %s'
  fields { [ identity, facts['interfaces']] }
end
") 2>/dev/null | sed "s/,/ /g;s/ lo//" | grep -v '\|\|\| $'
