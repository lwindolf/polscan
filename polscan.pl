#!/usr/bin/perl -w

# Polscan: a Debian / kubernetes policy scanner

# Copyright (C) 2015-2020  Lars Windolf <lars.windolf@gmx.de>
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
use File::Copy qw(copy);
use File::Basename qw(dirname);
use File::Path qw(make_path);
use List::MoreUtils qw(uniq);
use IPC::Run qw(run);
use Env qw(RESULT_DIR);

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

my $DATE = `date +%Y/%m/%d`;
chomp $DATE;

$config->{RESULT_BASE_DIR} = "${BASE}/results" unless(defined($config->{RESULT_BASE_DIR}) and $config->{RESULT_BASE_DIR} ne "");

# FIXME: implement syntax help
# FIXME: proper getops
# Command line parsing, setup environment
my $MODE = "scan";
if ($#ARGV > 0 and $ARGV[0] eq "-r") {
	$MODE = "report";
	$DATE = $ARGV[1];
	shift(@ARGV);
	shift(@ARGV);
}

my $HOST_LIST = "";
if ($#ARGV > 0 and $ARGV[0] eq "-l") {
	$HOST_LIST = $ARGV[1];
	shift(@ARGV);
	shift(@ARGV);
}

my $TEST = "";
if ($#ARGV > 0 and $ARGV[0] eq "-t") {
	$TEST = $ARGV[1];
	shift(@ARGV);
	shift(@ARGV);
}

$RESULT_DIR .= $config->{RESULT_BASE_DIR}."/results/". $DATE;
my $JSON_DIR = $config->{RESULT_BASE_DIR}."/results/json/". $DATE;

# Determine previous scan date (going back up to 7 days)
my $i = 1;
my $ONE_DAY_AGO = "nonsense";
while((! -d $config->{RESULT_BASE_DIR}."/$ONE_DAY_AGO") && ($i < 30)) {
	$ONE_DAY_AGO = `date -d "$DATE $i day ago" +%Y/%m/%d`;
	chomp $ONE_DAY_AGO;
	$i++;
}

################################################################################
# Common helpers
################################################################################

################################################################################
# Extract meta data from scanner files
#
# $1    file name
#
# Returns hash of meta data
################################################################################
sub get_policy_info($) {
    my %i = ();
    my $filename = $_[0];

    open my $SF, "<", $filename || die($!);
    my $script = do { local $/; <$SF> };
    foreach my $l (split(/\n/, $script)) {
        next unless($l =~ /^#\s+(\w+):\s+(.+)$/);
        $i{$1} = $2;
    }

    return \%i;
}

################################################################################
# Scanner mode
################################################################################

################################################################################
# Uses global $HOST_LIST or configured host group providers to produce a list
# of hosts to be scanned
#
# Returns a ref on an array of hosts
################################################################################
sub get_host_list() {
	my $result = $HOST_LIST;

	# 1. If none given determine host list automatically
	if($HOST_LIST eq "") {
		# Some host list providers might want to the following env vars
		$ENV{RESULT_BASE_DIR} = $config->{RESULT_BASE_DIR};
		$ENV{ONE_DAY_AGO} = $ONE_DAY_AGO;

		foreach my $h (@{$config->{HOST_LIST_PROVIDER}}) {
			print "Fetching host list (provider '$h')...\n";
		    my $HLP = "$LIB_DIR/host-list-providers/$h";
		    die "ERROR: Could not find host list provider $HLP" unless(-f $HLP);
		    $result = "$result\n" . `$HLP`;
		    die "ERROR: Running host list provider '$h' failed ($!)!" if($? != 0);
		}
	}
	die "ERROR: Could not find any hosts! Aborting." if($result eq "");
	print "Host list: $result\n";
	my @result = split(/[\n\s]+/, $result);
	return \@result;
}

################################################################################
# Returns all scanner file names for a given type
#
# $1	type 'standalone' or 'scanners' (for remote)
################################################################################
sub get_scanners($) {
	my $config = $CONF_DIR . "/" . $_[0] . ".conf";

	die "Could not find scanner config file '$config'" unless(-f $config);
	# FIXME: make this Perl'ish
	return `grep -v "^ *#" "$config" 2>/dev/null`;
}

################################################################################
# Uses global $TEST or reads the configured scanners
#
# Returns a newline separated list of scanners
################################################################################
sub get_scanner_list() {
	my $list;

	if($TEST eq "" || $TEST eq "all") {
		$list = get_scanners('scanners');
	} else {
		$list = $TEST;
	}

	my @list = split(/\n/, $list);
	return \@list;
}

################################################################################
# Builds a scanner script and performs a scan on multiple hosts
################################################################################
sub scan() {

	# 0. Prepare output dir
	unless (-d $RESULT_DIR) {
    	make_path $RESULT_DIR or die "Failed to mkdir '$RESULT_DIR' ($!)";
    }

	my $hosts = get_host_list();
	my $scanners = get_scanner_list();

    # 2. Build remote scanner script
    my $scannerfile = "/tmp/polscan-remote-scanner.$$";
    my $scannercode = `cat "$LIB_DIR/scanner-header.inc" "$LIB_DIR/scanner-functions.inc"`;
	foreach my $scanner (@$scanners) {
		my $file = "$LIB_DIR/scanners/$scanner";
		unless(-f $file) {
			warn "WARNING: Unknown policy '$scanner'!";
		} else {
			my $i = get_policy_info ($file);
			$scannercode .= "\npolicy_name='$i->{name}'; policy_group='$i->{group}'";
			$scannercode .= "\n". `cat "$file"`;
		}
    }
	# Add marker result for completed scan
	$scannercode .= "\npolicy_name=\'Polscan remote scan\' policy_group=Polscan result_ok\n";

	open my $RSS, ">$scannerfile" || die ($!);
	print $RSS $scannercode;
	close $RSS;

	print "Running remote scans...\n";

	# We usually suffix sudo...
    my $remotes = "@$hosts";
	if($config->{SUDO_CMD} ne "") {
	    $remotes = join ("\n", map { $_ . " " . $config->{SUDO_CMD} } @$hosts);
	}

	# And run parallelized with xargs
	my ($out, $err);
	if($TEST eq "") {
    	$out="${RESULT_DIR}/\${host/ */}";
		$err="${RESULT_DIR}/\${host/ */}.err";
    } else {
		$out="&1";
		$err="&2";
    }
	eval {
    	run(
	        ["xargs", "-n1", "--replace={}", "-n", "1", "-P", $config->{SCAN_CONCURRENCY},
    	     "/bin/bash", "-c", "host='{}';printf '%s\n' \"\${host/ */}\" && $config->{SSH_CMD} {} \"/bin/bash < <(/bin/cat -)\" <${scannerfile} >$out 2>$err || printf 'SSH to host failed!\n' >$err"],
    	    "<", \$remotes
    	);
    };
    die $@ if($@);

	unlink $scannerfile;

	report();
}

################################################################################
# Reporting mode: Compile results to JSON
################################################################################

################################################################################
# Dump a result structure to JSON file and add standard meta fields
#
# $1    data ref
# $2    file name
# $3    root key
################################################################################
sub write_json($$$) {
    my ($data, $name, $root) = @_;
    my $dump = {
        date => $DATE,
        schema => $SCHEMA_VERSION,
        $root => $data
    };

    open(my $FILE, ">", "$JSON_DIR/$name.json") || die "Failed to write to '$JSON_DIR/$name.json' ($!)";
	print "Writing $name.json...\n";
    print $FILE encode_json($dump);
}

sub report() {

 	# 0. Prepare output dir
	die "No results for this day!" unless(-d $RESULT_DIR);
 	unless(-d $JSON_DIR) {
     	make_path $JSON_DIR or die "Failed to mkdir '$JSON_DIR' ($!)";
    }

    # Determine host list from input result dir
    # FIXME: perlify
    chdir($RESULT_DIR) or die "Cannot chdir ($!)!";
    my $hosts = `ls`;

    # Never overwrite host groups without need
    unless(-f "${JSON_DIR}/host_groups.json") {
        # Determine host group names
        #
        # Note: $RESULT_DIR global var is exported to Env
        # as some host group providers might want to use it
		my $hgs = "";
		foreach my $hgp (@{$config->{HOST_GROUP_PROVIDERS}}) {
			$hgs .= `RESULT_DIR=$RESULT_DIR $LIB_DIR/host-group-providers/$hgp`;
		}
		my %hostgroups = ();
		foreach my $hg (uniq(split(/\n/, $hgs))) {
		    next unless($hg =~ /^([\w:]+)\s+(.+)$/);
		    $hostgroups{$1} = [] unless(defined($hostgroups{$1}));
		    push(@{$hostgroups{$1}}, $2);
        }
        write_json(\%hostgroups, "host_groups", "results");
    } else {
        print "Using existing host_groups.json.\n";
    }

	# Produce vulnerability index
	my $vulns = `ls | xargs -n1 grep -H "^Security VULN "`;
	my @vulns = ();
	foreach my $v (split(/\n/, $vulns)) {
		# Parse syntax
		#    myhost:Security VULN |||$pkg||| {"cve": "$cve", "pkg": "$pkg", "tags": ["${tags}"]}
		next unless($v =~ /([^:]*):.*\|\|\| (\{.+)$/);
		eval {
			push(@vulns, { host => $1, %{from_json($2)} });
		};
	}
	write_json(\@vulns, "vulnerabilities", "results");

	# Produce inventory indices
	printf "Compiling inventories...\n";
	#while read host group severity details; do
#		inventory=${details/#|||/}
#		inventory=${inventory/|||*/}
#		message=${details/*|||/}
#		echo -n '{"host": "'$host'", "values": "'"${message//\"/\'}"'"},' >> "$JSON_DIR/$group ${inventory}.json.tmp"
#		inventory_types["$group_${inventory// /_}"]="$group $inventory"
#	done < <(
#		ls | xargs -n1 egrep -H "^[a-zA-Z0-9_-][a-zA-Z0-9_-]* INVENTORY " |\
#		sed 's/:/ /'
#	)
#
#	for key in ${!inventory_types[*]}; do
#		name=${inventory_types[$key]}
#		cat "$JSON_DIR/${name}.json.tmp" | write_json list "inventory $name" results
#		rm "$JSON_DIR/${name}.json.tmp"
#	done
}

scan() if($MODE eq "scan");
report() if($MODE eq "report");

print "Done.\n";
exit;
