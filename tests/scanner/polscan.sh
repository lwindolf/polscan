#!/usr/bin/env bats


# Test for Perl syntax of scanner script
@test "Perl syntax check polscan.pl" {
	output=$(perl -c ../polscan.pl)
	[ $? -eq 0 ]
}

