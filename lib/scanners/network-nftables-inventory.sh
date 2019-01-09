#!/bin/bash

# group: Network
# name: nftables Inventory
# description: Inventory only scanner determining which firewall modules are active and how many rules are there

# Check for kernel modules
#
# - ip_tables (indicating iptables)
# - iptable_nat (to indicate iptables with NAT active)
# - nf_tables (to indicate active nf_tables

modules=$(lsmod|grep -E "^(nf_tables|ip_tables|iptable_nat)" | awk '{print $1}')

result_inventory "Firewall Modules" $modules

result_inventory "ip_tables Rule Count" $(
(
	if [[ $modules =~ ip_tables ]]; then
		iptables -L -n
	fi

	# To avoid accidentily loading nfconntrack on servers with 
	# many connections we do not do "iptables -L -t nat"
) | wc -l
)

result_inventory "nf_tables Rule Count" $(
(
	if [[ $modules =~ nf_tables ]]; then
		nft list tables
	fi
) | wc -l
)
