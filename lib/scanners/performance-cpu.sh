# group: Performance
# name: Powersave Off
# description: On production hardware servers we do not want any type of power saving active. Checks both the CPU scaling governor /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor and if the Intel pstate driver is active with min_perf_pct at 100
# solution: For non-Intel: Install and configure cpufrequtils, For Intel: set /sys/devices/system/cpu/intel_pstate/min_perf_pct to 100
# source: https://wiki.debian.org/HowTo/CpuFrequencyScaling
# source: https://wiki.archlinux.org/index.php/CPU_frequency_scaling

if grep -q powersave /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor 2>/dev/null; then
	if [ -f /sys/devices/system/cpu/intel_pstate/min_perf_pct ]; then
		min_perf_pct=$(cat /sys/devices/system/cpu/intel_pstate/min_perf_pct)
		if [ "$min_perf_pct" = 100 ]; then
			result_ok "Intel pstate is active and min_perf_pct=100"
		else
			result_warning "Intel pstate is active and min_perf_pct!=100 (is $min_perf_pct)"
		fi
	else
		result_failed "Some CPUs have powersave enabled!"
	fi
else
	result_ok "Scaling governor != powersave"
fi

result_inventory "cpufreq scaling_governor" $(cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor 2>/dev/null | sort | uniq)
result_inventory "intel pstate"             $(cd /sys/devices/system/cpu/intel_pstate/ 2>/dev/null && grep . * | sort | xargs)
