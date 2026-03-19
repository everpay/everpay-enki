# OFA Pay Integration Guide

## Host
- **API Host**: `www.jzc899.com`
- **Back Office URL**: `https://www.jzc899.com/payadmin_en/index.aspx`

## Callback IP Whitelist
The following IPs must be whitelisted for OFA Pay callbacks:
- `18.163.84.121`
- `35.178.134.254`
- `54.206.184.208`
- `3.35.195.201`

## Authentication
- **Login**: Uses Google Authenticator 2FA (QR code A)
  - ⚠️ Screenshot the login QR code on first login — it only appears once
- **Settlement Submission**: Uses a separate QR code (QR code B)
  - The attached settlement QR code is used for settlement submission in OFA backend

## API Documentation
- **OneDrive Link**: `https://1drv.ms/f/c/eaf78b2c6937af52/EjXBn4dXiyJPpTH2QaorOdQBrrSenpRXUAg4HLyLbmlwOQ?e=p75vHz`
- **Password**: `M3nYuotPsHKDfEtMHqPu`
- To view files in browser: click `...` on file name right side → click "Preview"

## Provider Configuration
OFA Pay is configured as the `ofa` provider in the routing system, handling:
- **Regions**: CN, VN, TH, ID, MY, PH, JP, KR, BD, IN, BR, MX, HK, AU
- **Methods**: P2P, P2C, P2PN, P2PO, QP, CRYPTO, Bank Transfer
- **Currencies**: USD, BRL, MXN (settlement currencies)
