# Override "echo" to prefix current host and policy infos
echo() {
	/bin/echo $current_host $policy_group "$@"
}

# Reporting findings
result_ok() {
	echo "OK |||$policy_name||| $@"
}

result_failed() {
	echo "FAILED |||$policy_name||| $@"
}

result_warning() {
	echo "WARNING |||$policy_name||| $@"
}

# Inventory handling
result_inventory() {
	name=$1; shift

	echo "INVENTORY |||$name||| $@"
}
