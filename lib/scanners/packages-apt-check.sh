# group: Packages
# name: No APT errors
# description: Checks if all APT dependencies are fine (using 'apt-get check')
# solution-cmd: apt-get -f install

output=$(/usr/bin/apt-get check 2>/dev/null)
if [ $? -eq 0 ]; then
	result_ok
else
	result_failed "'apt-get check' reports problems: $output"
fi
