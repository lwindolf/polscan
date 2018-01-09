# group: Security
# name: pcid CPU flag
# description: /proc/cpuinfo must contain pcid
# reference: https://groups.google.com/forum/m/#!topic/mechanical-sympathy/L9mHTbeQLNU
# reference: https://www.theregister.co.uk/2018/01/09/meltdown_spectre_slowdown/
# solution: For VMs ensure your hyporvisor passes the CPU feature flag. For HW host: get a CPU supporting PCID

if grep -q pcid /proc/cpuinfo; then
	result_ok "pcid feature present"
else
	result_failed "Processor feature PCID is not present!"
fi

