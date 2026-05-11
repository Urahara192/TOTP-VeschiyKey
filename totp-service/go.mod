module totp-auth-system/totp-service

go 1.25.0

require (
	github.com/Urahara192/totp-lib v0.0.0-00010101000000-000000000000
	github.com/google/uuid v1.6.0
	modernc.org/sqlite v1.50.1
)

require (
	github.com/boombuler/barcode v1.0.1-0.20190219062509-6c824513bacc // indirect
	github.com/dustin/go-humanize v1.0.1 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/ncruces/go-strftime v1.0.0 // indirect
	github.com/pquerna/otp v1.4.0 // indirect
	github.com/remyoudompheng/bigfft v0.0.0-20230129092748-24d4a6f8daec // indirect
	github.com/skip2/go-qrcode v0.0.0-20200617195104-da1b6568686e // indirect
	golang.org/x/sys v0.42.0 // indirect
	modernc.org/libc v1.72.3 // indirect
	modernc.org/mathutil v1.7.1 // indirect
	modernc.org/memory v1.11.0 // indirect
)

replace github.com/Urahara192/totp-lib => ../totp-lib
