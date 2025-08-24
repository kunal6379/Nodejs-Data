http://man-coupon.gl.at.ply.gg:53529/



install openssh server from optional features
-----

Start-Service sshd

Set-Service -Name sshd -StartupType 'Automatic'

New-NetFirewallRule -Name sshd -DisplayName 'OpenSSH Server (sshd)' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22
