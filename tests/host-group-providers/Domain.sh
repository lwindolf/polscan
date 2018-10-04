#!/usr/bin/env bats


# "Domain" is a host name extractor, so we test some extractions
@test "domain example.com" {
	echo "example.com" >$RESULT_DIR/.hosts
	output=$($BASE/lib/host-group-providers/Domain)
	[ "$output" == "Domain::com example.com" ]
}

@test "subdomain www.example.com" {
	echo "www.example.com" >$RESULT_DIR/.hosts
	output=$($BASE/lib/host-group-providers/Domain)
	[ "$output" == "Domain::example.com www.example.com" ]
}

@test "multiple hosts" {
	echo "www1.example.com www2.example.com" >$RESULT_DIR/.hosts
	output=$($BASE/lib/host-group-providers/Domain)
	[ "$output" == "Domain::example.com www1.example.com
Domain::example.com www2.example.com" ]
}

@test "invalid hosts" {
	echo "www1 11" >$RESULT_DIR/.hosts
	output=$($BASE/lib/host-group-providers/Domain)
	[ "$output" == "" ]
}

