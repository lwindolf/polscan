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

my $RESULT_DIR = "$BASE/results";
my ($CONF_DIR, $LIB_DIR, $DATE);

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

# Command line parsing, setup environment
my $MODE = "scan";
if ($#ARGV > 1 and $ARGV[1] eq "-r") {
	$MODE = "report";
	$DATE = $ARGV[1];
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

	# FIXME
}
