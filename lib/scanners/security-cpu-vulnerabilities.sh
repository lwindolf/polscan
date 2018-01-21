# group: Security
# name: CPU vulnerabilities
# description: Checks for Meltdown and Specte mitigations
# solution: Upgrade kernel to 4.15+

if grep -q "Mitigation: PTI" /sys/devices/system/cpu/vulnerabilities/meltdown 2>/dev/null; then
	result_ok
else
	result_failed "No Meltdown mitigation found!"
fi

if grep -q "Vulnerable: Minimal generic ASM retpoline" /sys/devices/system/cpu/vulnerabilities/spectre_v2 2>/dev/null; then
	result_ok
else
	result_failed "No Spectre v2 mitigation found!"
fi
