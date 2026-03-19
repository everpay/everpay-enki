# OFA Pay Integration Guide

## Host
- **API Host**: `www.jzc899.com`
- **Request URL**: `https://www.jzc899.com/pay/order.aspx`
- **Back Office URL**: `https://www.jzc899.com/payadmin_en/index.aspx`

## Callback IP Whitelist
The following IPs must be whitelisted for OFA Pay callbacks:
- `18.163.84.121`
- `35.178.134.254`
- `54.206.184.208`
- `3.35.195.201`

## Authentication
- **Login Account**: `ep_nadmin`
- **Login Password**: Stored as secret `OFAPAY_LOGIN_PASSWORD`
- **Login**: Uses Google Authenticator 2FA (QR code A)
  - ⚠️ Screenshot the login QR code on first login — it only appears once
- **Settlement Submission**: Uses a separate QR code (QR code B)
  - The attached settlement QR code is used for settlement submission in OFA backend

## API Documentation
- **OneDrive Link**: `https://1drv.ms/f/c/eaf78b2c6937af52/EjXBn4dXiyJPpTH2QaorOdQBrrSenpRXUAg4HLyLbmlwOQ?e=p75vHz`
- **Password**: `M3nYuotPsHKDfEtMHqPu`
- To view files in browser: click `...` on file name right side → click "Preview"

## Payment Methods (scode / key pairs)

All API keys are stored as secrets with naming convention `OFAPAY_KEY_{SCODE}`.

### CNY (China)
| Service Name | Pay Type | Internal Ref | scode |
|---|---|---|---|
| EP_CNY_Alipay | P2P | CL2 | 258223137401 |
| EP_CNY_P2P_Manual | P2P | CL1 | 258223137402 |
| EP_CNY_ECNY | P2P | CL4 | 258223137403 |

### VND (Vietnam)
| Service Name | Pay Type | Internal Ref | scode |
|---|---|---|---|
| EP_VND_VietQR_FX | VND | DG1 | 258223137404 |
| EP_VND_VietQR_Gaming | VND | DG1 | 258223137405 |
| EP_VND_MOMO | VND | BL1 | 258223137406 |
| EP_VND_Zalo | VND | BL2 | 258223137407 |
| EP_VND_Viettelpay | VND | BL4 | 258223137408 |

### IDR (Indonesia)
| Service Name | Pay Type | Internal Ref | scode |
|---|---|---|---|
| EP_IDR_OB_FX | IDR | CH3 | 258223137409 |
| EP_IDR_OB_Gaming | IDR | CH3 | 258223137410 |
| EP_IDR_VA_FX | IDR | CH2 | 258223137411 |
| EP_IDR_VA_Gaming | IDR | CH2 | 258223137412 |
| EP_IDR_QRIS_FX | IDR | CH1 | 258223137413 |
| EP_IDR_QRIS_Gaming | IDR | CH1 | 258223137414 |

### PHP (Philippines)
| Service Name | Pay Type | Internal Ref | scode |
|---|---|---|---|
| EP_PHP_Gcash | PHP | BV1 | 258223137415 |
| EP_PHP_Maya | PHP | BV1 | 258223137416 |
| EP_PHP_QRPH | PHP | BV15 | 258223137417 |
| EP_PHP_GrabPay | PHP | BV5 | 258223137418 |

### INR (India)
| Service Name | Pay Type | Internal Ref | scode |
|---|---|---|---|
| EP_INR_UPI | INR | CJ5 | 258223137419 |

### Crypto
| Service Name | Pay Type | Internal Ref | scode |
|---|---|---|---|
| EP_Crypto_TRC | CRYPTO | CG1 | 258223137420 |
| EP_Crypto_ERC | CRYPTO | CG1 | 258223137421 |

### Payouts
| Service Name | Pay Type | Internal Ref | scode |
|---|---|---|---|
| EP_JPY_Payout | JPY | BP2 | 258223137422 |
| EP_KRW_Payout | KRW | DF1 | 258223137423 |

### BDT (Bangladesh)
| Service Name | Pay Type | Internal Ref | scode |
|---|---|---|---|
| EP_BDT_Nagad | BDT | CR1 | 258223137424 |
| EP_BDT_Bkash | BDT | CR3 | 258223137425 |

## Provider Configuration
OFA Pay is configured as the `ofa` provider in the routing system, handling:
- **Regions**: CN, VN, TH, ID, MY, PH, JP, KR, BD, IN, BR, MX, HK, AU
- **Methods**: P2P, P2C, P2PN, P2PO, QP, CRYPTO, Bank Transfer, UPI, MOMO, Zalo, GCash, Maya, QRIS, VietQR, Bkash, Nagad
- **Currencies**: CNY, VND, IDR, PHP, INR, JPY, KRW, BDT, USD, BRL, MXN
