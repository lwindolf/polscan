# group: System
# name: No APT errors
# description: Checks if all APT dependencies are fine (using 'apt-get check')

output=$(apt-get check)
if [ $? -eq 0 ]; then
	result_ok
else
	result_failed "'apt-get check' reports problems: $output"
fi
