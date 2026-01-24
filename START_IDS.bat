@echo off
REM Wrapper script to preserve compatibility after renaming AgisFL -> IDS branding
REM This calls the original startup script.
call "%~dp0START_AGISFL.bat" %*
