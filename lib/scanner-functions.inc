# Override "echo" to prefix current host and scanner name
echo() {
	/bin/echo $current_host $scanner_name $@
}

# Result reporting
result_ok() {
	echo "OK: $full_scanner_name"
}

result_failed() {
	echo "FAILED: $full_scanner_name"
}

result_warning() {
	echo "WARNING: $full_scanner_name"
}
