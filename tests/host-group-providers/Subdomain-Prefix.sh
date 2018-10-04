#!/usr/bin/env bats


# "Subdomain-Prefix" is a host name extractor, so we test some extractions
@test "domain example.com" {
	echo "example.com" >$RESULT_DIR/.hosts
	output=$($BASE/lib/host-group-providers/Subdomain-Prefix)
	[ "$output" == "Subdomain-Prefix::com example.com" ]
}

@test "subdomain www.example.com" {
	echo "www.example.com" >$RESULT_DIR/.hosts
	output=$($BASE/lib/host-group-providers/Subdomain-Prefix)
	[ "$output" == "Subdomain-Prefix::example www.example.com" ]
}

@test "multiple hosts" {
	echo "www1.example.com www2.example.com" >$RESULT_DIR/.hosts
	output=$($BASE/lib/host-group-providers/Subdomain-Prefix)
	[ "$output" == "Subdomain-Prefix::example www1.example.com
Subdomain-Prefix::example www2.example.com" ]
}

@test "invalid hosts" {
	echo "www1 11" >$RESULT_DIR/.hosts
	output=$($BASE/lib/host-group-providers/Subdomain-Prefix)
	[ "$output" == "" ]
}

