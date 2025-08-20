@echo off
setlocal

pushd %~dp0\..

IF "%~1" == "" (
	set AUTHORITY=vscode-remote://test+test/
	:: backward to forward slashed
	set EXT_PATH=%CD:\=/%/extensions

	:: Download nodejs executable for remote
	call npm run gulp node
) else (
	set AUTHORITY=%1
	set EXT_PATH=%2
	set VSCODEUSERDATADIR=%3
)
IF "%VSCODEUSERDATADIR%" == "" (
	set VSCODEUSERDATADIR=%TMP%\vscodeuserfolder-%RANDOM%-%TIME:~6,5%
)

set REMOTE_EXT_PATH=%AUTHORITY%%EXT_PATH%
set VSCODECRASHDIR=%~dp0\..\.build\crashes
set VSCODELOGSDIR=%~dp0\..\.build\logs\integration-tests-remote
set TESTRESOLVER_DATA_FOLDER=%TMP%\testresolverdatafolder-%RANDOM%-%TIME:~6,5%
set TESTRESOLVER_LOGS_FOLDER=%VSCODELOGSDIR%\server

if "%VSCODE_REMOTE_SERVER_PATH%"=="" (
	echo Using remote server out of sources for integration tests
) else (
	set TESTRESOLVER_INSTALL_BUILTIN_EXTENSION=ms-vscode.vscode-smoketest-check
	echo Using '%VSCODE_REMOTE_SERVER_PATH%' as server path
)

:: Figure out which Electron to use for running tests
if "%INTEGRATION_TEST_ELECTRON_PATH%"=="" (
	chcp 65001
	set INTEGRATION_TEST_ELECTRON_PATH=.\scripts\code.bat
	set API_TESTS_EXTRA_ARGS_BUILT=

	echo Running integration tests out of sources.
) else (
	set VSCODE_CLI=1
	set ELECTRON_ENABLE_LOGGING=1

	:: Extra arguments only when running against a built version
	set API_TESTS_EXTRA_ARGS_BUILT=--extensions-dir=%EXT_PATH% --enable-proposed-api=vscode.vscode-test-resolver --enable-proposed-api=vscode.vscode-api-tests

 	echo Using %INTEGRATION_TEST_ELECTRON_PATH% as Electron path
)

echo Storing crash reports into '%VSCODECRASHDIR%'
echo Storing log files into '%VSCODELOGSDIR%'


:: Tests in the extension host

set API_TESTS_EXTRA_ARGS=--disable-telemetry --disable-experiments --skip-welcome --skip-release-notes --crash-reporter-directory=%VSCODECRASHDIR% --logsPath=%VSCODELOGSDIR% --no-cached-data --disable-updates --use-inmemory-secretstorage --disable-inspect --disable-workspace-trust --user-data-dir=%VSCODEUSERDATADIR% --disable-extensions --disable-extension-recommendations --performance-startup --disable-dev-tools

echo.
echo ### API tests (folder) - Started at %time%
call "%INTEGRATION_TEST_ELECTRON_PATH%" --folder-uri=%REMOTE_EXT_PATH%/vscode-api-tests/testWorkspace --extensionDevelopmentPath=%REMOTE_EXT_PATH%/vscode-api-tests --extensionTestsPath=%REMOTE_EXT_PATH%/vscode-api-tests/out/singlefolder-tests %API_TESTS_EXTRA_ARGS% %API_TESTS_EXTRA_ARGS_BUILT%
if %errorlevel% neq 0 exit /b %errorlevel%
echo ### API tests (folder) - Completed at %time%

echo.
echo ### API tests (workspace) - Started at %time%
call "%INTEGRATION_TEST_ELECTRON_PATH%" --file-uri=%REMOTE_EXT_PATH%/vscode-api-tests/testworkspace.code-workspace --extensionDevelopmentPath=%REMOTE_EXT_PATH%/vscode-api-tests --extensionTestsPath=%REMOTE_EXT_PATH%/vscode-api-tests/out/workspace-tests %API_TESTS_EXTRA_ARGS% %API_TESTS_EXTRA_ARGS_BUILT%
if %errorlevel% neq 0 exit /b %errorlevel%
echo ### API tests (workspace) - Completed at %time%

:: Skip non-essential tests in CI to reduce execution time
if not "%GITHUB_ACTIONS%"=="" (
    echo ### Skipping TypeScript, Markdown, Emmet, Git, Ipynb, and Configuration editing tests in CI to reduce execution time
    goto :cleanup
)

echo.
echo ### TypeScript tests - Started at %time%
call "%INTEGRATION_TEST_ELECTRON_PATH%" --folder-uri=%REMOTE_EXT_PATH%/typescript-language-features/test-workspace --extensionDevelopmentPath=%REMOTE_EXT_PATH%/typescript-language-features --extensionTestsPath=%REMOTE_EXT_PATH%/typescript-language-features\out\test\unit %API_TESTS_EXTRA_ARGS% %API_TESTS_EXTRA_ARGS_BUILT%
if %errorlevel% neq 0 exit /b %errorlevel%
echo ### TypeScript tests - Completed at %time%

:cleanup

:: Cleanup

IF "%3" == "" (
	rmdir /s /q %VSCODEUSERDATADIR%
)

rmdir /s /q %TESTRESOLVER_DATA_FOLDER%

popd

endlocal
