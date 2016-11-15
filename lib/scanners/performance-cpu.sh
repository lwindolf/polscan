# group: Performance
# name: Powersave Off
# description: On production hardware servers we do not want power saving active.
# solution: Install and configure cpufrequtils
# source: https://wiki.debian.org/HowTo/CpuFrequencyScaling
# source: https://wiki.archlinux.org/index.php/CPU_frequency_scaling

if grep -q powersave /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor 2>/dev/null; then
	result_failed "Some CPUs have powersave enabled!"
else
	result_ok
fi

