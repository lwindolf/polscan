# FIXME: Check $LIB_DIR, $CONF_DIR, $BASE_DIR

CONF_FILE=${CONF_DIR}/polscan.conf
REMOTE_SCANNERS_FILE=${CONF_DIR}/scanners.conf
STANDALONE_SCANNERS_FILE=${CONF_DIR}/standalone.conf

if [ ! -f $CONF_FILE ]; then
	echo "ERROR: Could not find $CONF_FILE"
	exit 1
fi
set -a
source $CONF_FILE
set +a

# Select result dir
if [ "$RESULT_BASE_DIR" == "" ]; then
	RESULT_BASE_DIR=${BASE}/results
fi

# Syntax: polscan [-l <host list>] [<date>]

if [ "$1" == "-l" ]; then
	shift
	HOST_LIST=$1
	shift
else
	HOST_LIST=
fi

LATEST=0
if [ "$1" == "" ]; then
	DATE=$(date +%Y/%m/%d)
	LATEST=1
fi

# Determine previous date (going back up to 7 days)
i=1
ONE_DAY_AGO=nonsense
while [ ! -d "$RESULT_BASE_DIR/$ONE_DAY_AGO" ]; do
	ONE_DAY_AGO=$(date -d "$DATE $i day ago" +%Y/%m/%d)
	i=$(( $i + 1 ))
done

RESULT_DIR="${RESULT_BASE_DIR}/${DATE}"
JSON_DIR="${RESULT_BASE_DIR}/json/${DATE}"

################################################################################
# Determine host groups
#
# Host group providers give <host group>+<host> tuples. Which we regroup here
# to per host group host lists.
#
# Fills the global hash "host_groups"
################################################################################

declare -A host_groups

load_host_groups() {
	export HOST_LIST	# Some providers might want to use it
	export RESULT_DIR	# Some providers might want to use it

	while read host_group host rest; do
		host_groups[''$host_group]="${host_groups[''$host_group]}${host} "
	done < <($LIB_DIR/host-group-providers/$HOST_GROUP_PROVIDERS | grep -v '^$')
}

################################################################################
# get_policy_info
#
# $1	file name
# $2	info type (e.g. 'tags', 'solution', 'solution-cmd')
#
# Returns list of tag string of policy checked by that file
################################################################################
get_policy_info() {
	sed "
		/# $2:/!d;
		s/^[^:]*: *//;
	" "$1"
}

################################################################################
# get_scanners
#
# $1	type "standalone" or "remote"
#
# Returns scanner filename
################################################################################
get_scanners() {
	scanner_type=$1

	case $scanner_type in
		remote)
			conf_file="$REMOTE_SCANNERS_FILE"
			;;
		standalone)
			conf_file="$STANDALONE_SCANNERS_FILE"
			;;
		*)
			echo "ERROR: get_scanners() called with invalid scanner type!"
			exit 1
	esac

	grep -v "^ *#" "$conf_file" 2>/dev/null
}

################################################################################
# get_available_scanners
#
# $1	type "standalone" or "remote"
#
# Returns scanner file names (relative to root dir) for all available scanners
# of a type
################################################################################
get_available_scanners() {
	scanner_type=$1

	case $scanner_type in
		remote)
			dir="scanners"
			;;
		standalone)
			dir="standalone"
			;;
		*)
			echo "ERROR: get_available_scanners() called with invalid scanner type!"
			exit 1
	esac

	(cd "$LIB_DIR"; grep -l "^# group: [^[:space:]]" "${dir}"/* 2>/dev/null)
}
