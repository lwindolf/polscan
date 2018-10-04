#!/usr/bin/env bats


# We test the auto_detect provider by checking wether he returns 
# results from Domain and Subdomain-Prefix by passing some hosts via
# $RESULT_DIR/.hosts

@test "multiple hosts from Domain and Subdomain-Prefix" {
	echo "www1.example.com www2.example.com" >$RESULT_DIR/.hosts
	output=$($BASE/lib/host-group-providers/auto_detect)
	[[ "$output" =~ Domain::example.com.www1.example.com ]] && \
	[[ "$output" =~ Domain::example.com.www2.example.com ]] && \
	[[ "$output" =~ Subdomain-Prefix::example.www1.example.com ]] && \
	[[ "$output" =~ Subdomain-Prefix::example.www2.example.com ]]
}
