# group: Packages
# name: Inventory
# description: Inventory only scanner for 3rd party repos

PACKAGES_INVENTORY_3RD_PARTY_REPOS_WHITELIST=${PACKAGES_INVENTORY_3RD_PARTY_REPOS_WHITELIST-nowhitelistconfigured}

result_inventory "3rd Party Repos" $(egrep -hv "^#|debian.org|aptrepo" /etc/apt/sources.list /etc/apt/sources.list.d/* | sed 's/.*htt[ps]*:\/\///;s/[ \/].*//;s/^deb\.//;s/^packages\.//' | sort -u)

