#!/usr/bin/env bats


# We test the auto_detect provider by checking wether he returns 
# results from Domain and Subdomain-Prefix by passing some hosts via
# env variable $HOST_LIST

@test "multiple hosts from Domain and Subdomain-Prefix" {
	export HOST_LIST="www1.example.com www2.example.com"
	output=$($BASE/lib/host-group-providers/auto_detect)
	[[ "$output" =~ Domain::example.com.www1.example.com ]] && \
	[[ "$output" =~ Domain::example.com.www2.example.com ]] && \
	[[ "$output" =~ Subdomain-Prefix::example.www1.example.com ]] && \
	[[ "$output" =~ Subdomain-Prefix::example.www2.example.com ]]
}
