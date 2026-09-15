@echo off
rem Local dev launcher (ASCII only to avoid cmd encoding issues)
set "PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%"
cd /d "%~dp0"
call node_modules\.bin\next.cmd dev -H 127.0.0.1 --port 3200
