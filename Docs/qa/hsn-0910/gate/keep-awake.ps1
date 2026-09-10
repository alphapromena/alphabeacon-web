# A process-scoped keep-awake for an unattended live round (state.md trap 23):
# ES_CONTINUOUS | ES_SYSTEM_REQUIRED, held for the life of this process and
# released when it ends. No power setting is changed.
# (Windows PowerShell 5.1 parses 0x80000000 as a negative int32, so the flags
# are written in decimal.)
Add-Type -Namespace Win32 -Name Power -MemberDefinition @'
[DllImport("kernel32.dll", SetLastError = true)]
public static extern uint SetThreadExecutionState(uint esFlags);
'@
[uint32]$ES_CONTINUOUS = 2147483648
[uint32]$ES_SYSTEM_REQUIRED = 1
$previous = [Win32.Power]::SetThreadExecutionState($ES_CONTINUOUS -bor $ES_SYSTEM_REQUIRED)
Write-Output ("keep-awake: held at " + (Get-Date).ToUniversalTime().ToString('o') + " (previous state " + $previous + ")")
while ($true) { Start-Sleep -Seconds 60 }
