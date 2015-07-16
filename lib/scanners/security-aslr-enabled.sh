# group: Security
# name: ASLR enabled
# description: Address Space Layout Randomization is to be enabled.
# tags: CCE-27007-4


if [[ $(sysctl -n kernel.randomize_va_space 2>/dev/null) != "2" ]]; then
	result_failed "sysctl kernel.randomize_va_space != 2"
fi
