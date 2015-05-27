# Override "echo" to prefix current host and policy infos
echo() {
	/bin/echo $current_host $policy_group $@
}

# Result reporting
result_ok() {
	echo "OK |||$policy_name||| $@"
}

result_failed() {
	echo "FAILED |||$policy_name||| $@"
}

result_warning() {
	echo "WARNING |||$policy_name||| $@"
}
