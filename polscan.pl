#!/usr/bin/perl -w

# Polscan: a Debian policy scanner

# Copyright (C) 2015-2018  Lars Windolf <lars.windolf@gmx.de>
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

use strict;

use JSON;
use YAML;
use File::Basename qw(dirname);
use File::Path qw(make_path);

my $SCHEMA_VERSION = 1;
my $BASE = dirname($0);
$BASE = `readlink -e "$BASE"`;
chomp $BASE;

my ($CONF_DIR, $LIB_DIR, $RESULT_DIR);

# FHS magic
if ($BASE eq "/usr/bin") {
	$CONF_DIR = "/etc/polscan/";
	$LIB_DIR  = "/usr/lib/polscan/";
} else {
	$CONF_DIR = "${BASE}/etc/";
	$LIB_DIR  = "${BASE}/lib";
}

# Load config
my $config = YAML::LoadFile("$CONF_DIR/polscan.yaml") or die "Failed to parse '$CONF_DIR/polscan.yaml' ($!)";

if(defined($config->{RESULT_BASE_DIR}) and $config->{RESULT_BASE_DIR} ne "") {
	$RESULT_DIR = $config->{RESULT_BASE_DIR} ."/results";
} else {
	$RESULT_DIR = "$BASE/results";
}

my $DATE = `date +%Y/%m/%d`;
chomp $DATE;

# FIXME: proper getops
# Command line parsing, setup environment
my $MODE = "scan";
if ($#ARGV > 1 and $ARGV[1] eq "-r") {
	$MODE = "report";
	$DATE = $ARGV[2];
	shift(@ARGV);
	shift(@ARGV);
}

my $HOST_LIST = "";
if ($#ARGV > 1 and $ARGV[1] eq "-l") {
	$HOST_LIST = $ARGV[1];
	shift(@ARGV);
	shift(@ARGV);
}

# Determine previous scan date (going back up to 7 days)
my $i = 1;
my $ONE_DAY_AGO = "nonsense";
while((! -d "$RESULT_DIR/$ONE_DAY_AGO") && ($i < 30)) {
	$ONE_DAY_AGO = `date -d "$DATE $i day ago" +%Y/%m/%d`;
	chomp $ONE_DAY_AGO;
	$i++;
}

################################################################################
# Common helpers
################################################################################

################################################################################
# Scanner mode
################################################################################
sub scan() {

	# 0. Prepare output dir
	make_path $RESULT_DIR unless(-d $RESULT_DIR) or die "Failed to mkdir '$RESULT_DIR' ($!)";

	# 1. If none given determine host list automatically
	if($HOST_LIST eq "") {
		# Some host list providers might want to the following env vars
		$ENV{RESULT_BASE_DIR} = $RESULT_DIR;
		$ENV{ONE_DAY_AGO} = $ONE_DAY_AGO;

		foreach my $h (@{$config->{HOST_LIST_PROVIDER}}) {
			print "Fetching host list (provider '$h')...\n";
	        my $HLP = "$LIB_DIR/host-list-providers/$h";
	        die "ERROR: Could not find host list provider $HLP" unless(-f $HLP);
	        $HOST_LIST = "${HOST_LIST}\n" . `$HLP`;
	        die "ERROR: Running host list provider '$h' failed ($!)!" if($? != 0);
		}
	}

	die "ERROR: Could not find any hosts! Aborting." if($HOST_LIST eq "");
	print "Host list: $HOST_LIST\n";
}

scan() if($MODE eq "scan");
report() if($MODE eq "report");

print "Done.\n";
exit;
