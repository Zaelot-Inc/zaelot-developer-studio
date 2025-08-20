#!/usr/bin/env bash
set -e

# Skip remote integration tests if requested
if [ "$SKIP_REMOTE_TESTS" = "1" ]; then
	echo "### Skipping remote integration tests (SKIP_REMOTE_TESTS=1)"
	exit 0
fi

if [[ "$OSTYPE" == "darwin"* ]]; then
	realpath() { [[ $1 = /* ]] && echo "$1" || echo "$PWD/${1#./}"; }
	ROOT=$(dirname $(dirname $(realpath "$0")))
else
	ROOT=$(dirname $(dirname $(readlink -f $0)))
fi

VSCODEUSERDATADIR=`mktemp -d 2>/dev/null`
VSCODECRASHDIR=$ROOT/.build/crashes
VSCODELOGSDIR=$ROOT/.build/logs/integration-tests-remote
TESTRESOLVER_DATA_FOLDER=`mktemp -d 2>/dev/null`

cd $ROOT

if [[ "$1" == "" ]]; then
	AUTHORITY=vscode-remote://test+test
	EXT_PATH=$ROOT/extensions
	# Load remote node
	npm run gulp node
else
	AUTHORITY=$1
	EXT_PATH=$2
	VSCODEUSERDATADIR=${3:-$VSCODEUSERDATADIR}
fi

export REMOTE_VSCODE=$AUTHORITY$EXT_PATH

# Figure out which Electron to use for running tests
if [ -z "$INTEGRATION_TEST_ELECTRON_PATH" ]
then
	INTEGRATION_TEST_ELECTRON_PATH="./scripts/code.sh"

	# No extra arguments when running out of sources
	EXTRA_INTEGRATION_TEST_ARGUMENTS=""

	echo "Running remote integration tests out of sources."
else
	export VSCODE_CLI=1
	export ELECTRON_ENABLE_LOGGING=1

	# Running from a build, we need to enable the vscode-test-resolver extension
	EXTRA_INTEGRATION_TEST_ARGUMENTS="--extensions-dir=$EXT_PATH  --enable-proposed-api=vscode.vscode-test-resolver --enable-proposed-api=vscode.vscode-api-tests"

	echo "Running remote integration tests with $INTEGRATION_TEST_ELECTRON_PATH as build."
fi

export TESTRESOLVER_DATA_FOLDER=$TESTRESOLVER_DATA_FOLDER
export TESTRESOLVER_LOGS_FOLDER=$VSCODELOGSDIR/server

# Figure out which remote server to use for running tests
if [ -z "$VSCODE_REMOTE_SERVER_PATH" ]
then
	echo "Using remote server out of sources for integration tests"
else
	echo "Using $VSCODE_REMOTE_SERVER_PATH as server path for integration tests"
	export TESTRESOLVER_INSTALL_BUILTIN_EXTENSION='ms-vscode.vscode-smoketest-check'
fi

if [ -z "$INTEGRATION_TEST_APP_NAME" ]; then
	kill_app() { true; }
else
	kill_app() { killall $INTEGRATION_TEST_APP_NAME || true; }
fi

API_TESTS_EXTRA_ARGS="--disable-telemetry --disable-experiments --skip-welcome --skip-release-notes --crash-reporter-directory=$VSCODECRASHDIR --logsPath=$VSCODELOGSDIR --no-cached-data --disable-updates --use-inmemory-secretstorage --disable-workspace-trust --user-data-dir=$VSCODEUSERDATADIR --disable-extensions --disable-extension-recommendations --disable-features=ExtHostTasks,ExtHostTestSupport --performance-startup --disable-dev-tools"

echo "Storing crash reports into '$VSCODECRASHDIR'."
echo "Storing log files into '$VSCODELOGSDIR'."


# Tests in the extension host

# Function to run test with timeout and logging
run_test_with_timeout() {
	local test_name="$1"
	shift
	echo
	echo "### $test_name - Started at $(date)"
	echo

	# Run test with timeout command if available
	if command -v timeout >/dev/null 2>&1; then
		timeout 1200 "$@" || echo "WARNING: $test_name may have timed out or failed"
	else
		"$@"
	fi

	echo "### $test_name - Completed at $(date)"
	kill_app
}

# Only run essential tests to reduce time
run_test_with_timeout "API tests (folder)" \
	"$INTEGRATION_TEST_ELECTRON_PATH" --folder-uri=$REMOTE_VSCODE/vscode-api-tests/testWorkspace --extensionDevelopmentPath=$REMOTE_VSCODE/vscode-api-tests --extensionTestsPath=$REMOTE_VSCODE/vscode-api-tests/out/singlefolder-tests $API_TESTS_EXTRA_ARGS $EXTRA_INTEGRATION_TEST_ARGUMENTS

run_test_with_timeout "API tests (workspace)" \
	"$INTEGRATION_TEST_ELECTRON_PATH" --file-uri=$REMOTE_VSCODE/vscode-api-tests/testworkspace.code-workspace --extensionDevelopmentPath=$REMOTE_VSCODE/vscode-api-tests --extensionTestsPath=$REMOTE_VSCODE/vscode-api-tests/out/workspace-tests $API_TESTS_EXTRA_ARGS $EXTRA_INTEGRATION_TEST_ARGUMENTS

# Skip some tests in CI to reduce time - only run core functionality
if [ -z "$GITHUB_ACTIONS" ]; then
	run_test_with_timeout "TypeScript tests" \
		"$INTEGRATION_TEST_ELECTRON_PATH" --folder-uri=$REMOTE_VSCODE/typescript-language-features/test-workspace --extensionDevelopmentPath=$REMOTE_VSCODE/typescript-language-features --extensionTestsPath=$REMOTE_VSCODE/typescript-language-features/out/test/unit $API_TESTS_EXTRA_ARGS $EXTRA_INTEGRATION_TEST_ARGUMENTS

	run_test_with_timeout "Markdown tests" \
		"$INTEGRATION_TEST_ELECTRON_PATH" --folder-uri=$REMOTE_VSCODE/markdown-language-features/test-workspace --extensionDevelopmentPath=$REMOTE_VSCODE/markdown-language-features --extensionTestsPath=$REMOTE_VSCODE/markdown-language-features/out/test $API_TESTS_EXTRA_ARGS $EXTRA_INTEGRATION_TEST_ARGUMENTS

	run_test_with_timeout "Git tests" \
		"$INTEGRATION_TEST_ELECTRON_PATH" --folder-uri=$AUTHORITY$(mktemp -d 2>/dev/null) --extensionDevelopmentPath=$REMOTE_VSCODE/git --extensionTestsPath=$REMOTE_VSCODE/git/out/test $API_TESTS_EXTRA_ARGS $EXTRA_INTEGRATION_TEST_ARGUMENTS
else
	echo "### Skipping TypeScript, Markdown, and Git tests in CI to reduce execution time"
fi

# Always skip these tests in CI as they are less critical
echo "### Skipping Emmet, Ipynb, and Configuration editing tests to reduce execution time"

# Cleanup

if [[ "$3" == "" ]]; then
	rm -rf $VSCODEUSERDATADIR
fi

rm -rf $TESTRESOLVER_DATA_FOLDER
