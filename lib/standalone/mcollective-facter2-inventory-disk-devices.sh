#!/bin/bash

# group: System
# name: Disk Devices
# description: Inventory only scanner determining disk devices via facter 2. Probably won't work with facter 3+

mco inventory --script <(/bin/echo "
inventory do
  format '%s System INVENTORY |||Disk Devices||| %s'
  fields { [ identity, facts['disks']] }
end
") 2>/dev/null | grep -v '\|\|\| $'
