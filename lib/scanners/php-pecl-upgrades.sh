# group: PHP
# name: PECL Upgrades
# description: Checks there are PECL installed modules that have pending upgrades
# solution-cmd: pecl upgrade-all

packages=$(pecl list 2>/dev/null |grep -A1000 ^PACKAGE | grep -v "PACKAGE")
if [ "$packages" != "" ]; then
	upgrades=$(pecl list-upgrades | cat | grep -A1000 PACKAGE | grep -v "PACKAGE")
	if [ "$upgrades" != "" ]; then
		result_warning "Pending PECL upgrades: $upgrades"
	else
		result_ok
	fi
fi	
