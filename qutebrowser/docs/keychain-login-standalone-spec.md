# Спецификация: Standalone JavaScript Userscript для Apple Passwords

**Дата:** 2025-11-06
**Цель:** Создать полностью независимый JavaScript userscript для qutebrowser, который напрямую работает с macOS native helper без зависимости от apw daemon.

---

## 1. Обзор архитектуры

### 1.1. Текущее решение (apw-based)
```
qutebrowser → bash userscript → apw CLI → apw daemon → native helper → Touch ID
                                   ↓
                            UDP: localhost:10000
```

**Проблемы:**
- Зависимость от apw daemon (brew services start apw)
- Необходимость `apw auth` после каждого перезапуска
- Двойной Touch ID при безусловном вызове pw + otp

### 1.2. Предлагаемое решение (standalone JS)
```
qutebrowser → node userscript → native helper → Touch ID
                    ↓
              Direct stdin/stdout
              + SRP crypto
              + Form detection
```

**Преимущества:**
- ✅ Полная независимость (нет daemon, нет apw)
- ✅ Интегрированная form detection → условные запросы
- ✅ Единый codebase (JavaScript для всего)
- ✅ Контроль над всей логикой

**Недостатки:**
- ❌ ~1000 строк кода для поддержки
- ❌ Необходимость следить за изменениями macOS API
- ❌ Node.js dependency (хотя, вероятно, уже установлен)

---

## 2. Технические компоненты

### 2.1. Native Helper взаимодействие

**Путь к helper:**
```
/System/Cryptexes/App/System/Library/CoreServices/PasswordManagerBrowserExtensionHelper.app/Contents/MacOS/PasswordManagerBrowserExtensionHelper
```

**Протокол:** Native Messaging (stdin/stdout)

**Формат сообщений:**
```javascript
// Отправка (stdin):
const length = new Uint32Array([messageJSON.length])
const message = Buffer.concat([
  Buffer.from(length.buffer),
  Buffer.from(JSON.stringify(messageJSON))
])
process.stdin.write(message)

// Получение (stdout):
// 1. Читать 4 байта (UInt32 length)
// 2. Читать length байт (JSON payload)
const lengthBuffer = await readBytes(4)
const length = new DataView(lengthBuffer.buffer).getUint32(0, true)
const payload = await readBytes(length)
const response = JSON.parse(payload.toString('utf-8'))
```

### 2.2. SRP Authentication (портирование из apw/src/srp.ts)

**RFC 5054 SRP-6a Protocol:**

**Константы:**
```javascript
// Группа 3072-бит простое число (RFC 5054 Appendix A)
const GROUP_PRIME = BigInt('0x' +
  'FFFFFFFF FFFFFFFF C90FDAA2 2168C234 C4C6628B 80DC1CD1 29024E08...'
  .replaceAll(/[^0-9A-F]/g, '')
)
const GROUP_GENERATOR = 5n
const GROUP_PRIME_BYTES = 384 // 3072 / 8
```

**Шаги:**

1. **Генерация session:**
```javascript
const username = crypto.getRandomValues(new Uint8Array(16))
const clientPrivateKey = readBigInt(crypto.getRandomValues(new Uint8Array(32)))
const clientPublicKey = powermod(GROUP_GENERATOR, clientPrivateKey, GROUP_PRIME) // A = g^a mod N
```

2. **Request Challenge:**
```javascript
const message = {
  cmd: 2, // HANDSHAKE
  msg: {
    QID: "m0",
    PAKE: toBase64({
      TID: serialize(username),
      MSG: 0, // CLIENT_KEY_EXCHANGE
      A: serialize(clientPublicKey),
      VER: "1.0",
      PROTO: [1] // SRP_WITH_RFC_VERIFICATION
    }),
    HSTBRSR: "Arc"
  }
}
```

3. **Получение server challenge:**
```javascript
// Response содержит:
// payload.PAKE (base64) → parse JSON → получить:
// - B (server public key)
// - s (salt)
const pake = JSON.parse(Buffer.from(payload.PAKE, 'base64').toString('utf-8'))
const serverPublicKey = readBigInt(deserialize(pake.B))
const salt = readBigInt(deserialize(pake.s))
```

4. **Compute shared key (после Touch ID + 6-digit PIN):**
```javascript
// u = SHA256(A || B)
const publicKeysHash = readBigInt(
  await sha256(Buffer.concat([
    pad(toBuffer(clientPublicKey), GROUP_PRIME_BYTES),
    pad(toBuffer(serverPublicKey), GROUP_PRIME_BYTES)
  ]))
)

// k = SHA256(N || g)
const multiplier = readBigInt(
  await sha256(Buffer.concat([
    toBuffer(GROUP_PRIME),
    pad(toBuffer(GROUP_GENERATOR), GROUP_PRIME_BYTES)
  ]))
)

// x = SHA256(salt || SHA256(username + ":" + password))
const saltedPassword = readBigInt(
  await sha256(Buffer.concat([
    toBuffer(salt),
    await sha256(username + ":" + pin)
  ]))
)

// S = (B - k * g^x) ^ (a + u * x) mod N
const premasterSecret = powermod(
  serverPublicKey - multiplier * powermod(GROUP_GENERATOR, saltedPassword, GROUP_PRIME),
  clientPrivateKey + publicKeysHash * saltedPassword,
  GROUP_PRIME
)

const sharedKey = readBigInt(await sha256(premasterSecret))
```

5. **Compute M (client verification):**
```javascript
const N_hash = await sha256(GROUP_PRIME)
const g_hash = await sha256(pad(toBuffer(GROUP_GENERATOR), GROUP_PRIME_BYTES))
const I_hash = await sha256(username)

const M = await sha256(Buffer.concat([
  N_hash.map((byte, i) => byte ^ g_hash[i]),
  I_hash,
  toBuffer(salt),
  toBuffer(clientPublicKey),
  toBuffer(serverPublicKey),
  toBuffer(sharedKey)
]))
```

6. **Send verification:**
```javascript
const message = {
  cmd: 2, // HANDSHAKE
  msg: {
    HSTBRSR: "Arc",
    QID: "m2",
    PAKE: toBase64({
      TID: serialize(username),
      MSG: 2, // CLIENT_VERIFICATION
      M: serialize(M, false)
    })
  }
}
```

7. **Verify HAMK:**
```javascript
const hmac = await sha256(Buffer.concat([
  toBuffer(clientPublicKey),
  M,
  toBuffer(sharedKey)
]))

if (readBigInt(deserialize(pake.HAMK)) !== readBigInt(hmac)) {
  throw new Error('Server verification failed')
}

// Success! Save session:
// { username, sharedKey }
```

### 2.3. AES-GCM Encryption (для SDATA payloads)

**Шифрование:**
```javascript
async function encrypt(data, sharedKey) {
  const key = toBuffer(sharedKey).subarray(0, 16)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    'AES-GCM',
    true,
    ['encrypt']
  )

  const iv = crypto.getRandomValues(new Uint8Array(16))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    new TextEncoder().encode(JSON.stringify(data))
  )

  return Buffer.concat([Buffer.from(encrypted), iv])
}
```

**Дешифрование:**
```javascript
async function decrypt(data, sharedKey) {
  const key = toBuffer(sharedKey).subarray(0, 16)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    'AES-GCM',
    true,
    ['decrypt']
  )

  const iv = data.subarray(0, 16)
  const ciphertext = data.subarray(16)

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    ciphertext
  )

  return JSON.parse(Buffer.from(decrypted).toString('utf-8'))
}
```

### 2.4. Commands к Native Helper

**Get Login Names:**
```javascript
async function getLoginNamesForURL(session, url) {
  const sdata = serialize(await encrypt({
    ACT: 5, // GHOST_SEARCH
    URL: url
  }, session.sharedKey))

  return {
    cmd: 4, // GET_LOGIN_NAMES_FOR_URL
    tabId: 1,
    frameId: 1,
    url,
    payload: JSON.stringify({
      QID: "CmdGetLoginNames4URL",
      SMSG: {
        TID: session.username,
        SDATA: sdata
      }
    })
  }
}
```

**Get Password:**
```javascript
async function getPasswordForURL(session, url, loginName) {
  const sdata = serialize(await encrypt({
    ACT: 2, // SEARCH
    URL: url,
    USR: loginName
  }, session.sharedKey))

  return {
    cmd: 5, // GET_PASSWORD_FOR_LOGIN_NAME
    tabId: 0,
    frameId: 0,
    url,
    payload: JSON.stringify({
      QID: "CmdGetPassword4LoginName",
      SMSG: {
        TID: session.username,
        SDATA: sdata
      }
    })
  }
}
```

**Get OTP:**
```javascript
async function getOTPForURL(session, url) {
  const sdata = serialize(await encrypt({
    ACT: 2, // SEARCH
    TYPE: "oneTimeCodes",
    frameURLs: [url]
  }, session.sharedKey))

  return {
    cmd: 17, // DID_FILL_ONE_TIME_CODE
    tabId: 0,
    frameId: 0,
    payload: JSON.stringify({
      QID: "CmdDidFillOneTimeCode",
      SMSG: {
        TID: session.username,
        SDATA: sdata
      }
    })
  }
}
```

### 2.5. Session Management

**Config location:** `~/.qb-keychain/session.json`

**Format:**
```json
{
  "username": "base64_encoded_username",
  "sharedKey": "base64_encoded_shared_key",
  "timestamp": 1699999999999
}
```

**Операции:**
```javascript
function loadSession() {
  const path = `${process.env.HOME}/.qb-keychain/session.json`
  if (!fs.existsSync(path)) return null

  const data = JSON.parse(fs.readFileSync(path, 'utf-8'))
  return {
    username: data.username,
    sharedKey: readBigInt(Buffer.from(data.sharedKey, 'base64'))
  }
}

function saveSession(username, sharedKey) {
  const path = `${process.env.HOME}/.qb-keychain/session.json`
  const dir = path.dirname(path)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(path, JSON.stringify({
    username,
    sharedKey: toBuffer(sharedKey).toString('base64'),
    timestamp: Date.now()
  }))
}
```

---

## 3. Form Detection Logic

### 3.1. Определение типа формы

**Селекторы:**
```javascript
const SELECTORS = {
  username: [
    'input[type="email"]',
    'input[type="text"][name*="user" i]:not([name*="otp" i])',
    'input[autocomplete="username"]',
    'input[autocomplete="email"]'
  ],

  password: [
    'input[type="password"]:not([name*="otp" i])',
    'input[autocomplete="current-password"]',
    'input[autocomplete="new-password"]'
  ],

  otp: [
    'input[autocomplete="one-time-code"]',
    'input[name*="otp" i]',
    'input[name*="code" i][inputmode="numeric"]',
    'input[name*="token" i]',
    'input[type="tel"][name*="code" i]',
    // ... (все 35+ селекторов из текущего скрипта)
  ]
}

function detectFormType() {
  const hasUsername = SELECTORS.username.some(sel => document.querySelector(sel))
  const hasPassword = SELECTORS.password.some(sel => document.querySelector(sel))
  const hasOTP = SELECTORS.otp.some(sel => document.querySelector(sel))

  return { hasUsername, hasPassword, hasOTP }
}
```

### 3.2. Стратегия запросов

```javascript
async function fetchCredentials(url, formType) {
  const results = {}

  // Шаг 1: Список аккаунтов (всегда)
  const accounts = await getLoginNamesForURL(session, url)
  if (accounts.length === 0) {
    throw new Error(`No accounts found for ${url}`)
  }

  // Выбор аккаунта (fzf или первый)
  const selected = accounts.length === 1
    ? accounts[0]
    : await selectAccount(accounts)

  // Шаг 2: Условные запросы
  if (formType.hasPassword) {
    results.password = await getPasswordForURL(session, url, selected.username)
    results.username = selected.username
  }

  if (formType.hasOTP) {
    results.otp = await getOTPForURL(session, url)
  }

  return results
}
```

**Результат:**
- Password page: 1 Touch ID (только `getPasswordForURL`)
- OTP page: 1 Touch ID (только `getOTPForURL`)
- Combined page: 2 Touch ID (оба запроса)

---

## 4. Qutebrowser Integration

### 4.1. Userscript структура

**Shebang:**
```javascript
#!/usr/bin/env node
```

**Environment variables:**
```javascript
const QUTE_URL = process.env.QUTE_URL
const QUTE_FIFO = process.env.QUTE_FIFO
const QUTE_HTML = process.env.QUTE_HTML // опционально
```

### 4.2. JavaScript injection

**Функция:**
```javascript
function injectJS(code) {
  fs.writeFileSync(QUTE_FIFO, `jseval -q ${JSON.stringify(code)}\n`)
}

function showMessage(text, timeout = 3000) {
  fs.writeFileSync(QUTE_FIFO, `message-info "${text}" ${timeout}\n`)
}
```

**Детекция формы:**
```javascript
const detectionCode = `
(function() {
  const SELECTORS = ${JSON.stringify(SELECTORS)};

  const hasUsername = SELECTORS.username.some(sel => document.querySelector(sel));
  const hasPassword = SELECTORS.password.some(sel => document.querySelector(sel));
  const hasOTP = SELECTORS.otp.some(sel => document.querySelector(sel));

  return JSON.stringify({ hasUsername, hasPassword, hasOTP });
})()
`

injectJS(detectionCode)
// Как получить результат? qutebrowser не возвращает jseval результат...
// Решение: писать в localStorage или временный file
```

**Проблема:** `jseval` не возвращает результат в userscript!

**Решение 1:** Записать в `localStorage`:
```javascript
const detectionCode = `
(function() {
  const result = { hasUsername: ..., hasPassword: ..., hasOTP: ... };
  localStorage.setItem('qb_keychain_detection', JSON.stringify(result));
})()
`
injectJS(detectionCode)

// Затем читать через другой jseval:
const readCode = `localStorage.getItem('qb_keychain_detection')`
// Но опять проблема - нет возврата!
```

**Решение 2:** Использовать `spawn-output` с JS через qutebrowser command:
```javascript
// В config.py добавить custom command:
c.aliases['get-form-type'] = 'spawn --output-messages ...'

// Из userscript вызвать через FIFO:
fs.writeFileSync(QUTE_FIFO, 'get-form-type\n')
```

**Решение 3 (ЛУЧШЕЕ):** Парсить HTML напрямую в Node.js:
```javascript
const { JSDOM } = require('jsdom')

// QUTE_HTML - путь к HTML snapshot
const html = fs.readFileSync(process.env.QUTE_HTML, 'utf-8')
const dom = new JSDOM(html)
const document = dom.window.document

const formType = detectFormType() // работает с JSDOM document
```

### 4.3. Autofill injection

**После получения credentials:**
```javascript
const autofillCode = `
(function() {
  const USERNAME_SELECTORS = ${JSON.stringify(SELECTORS.username)};
  const PASSWORD_SELECTORS = ${JSON.stringify(SELECTORS.password)};
  const OTP_SELECTORS = ${JSON.stringify(SELECTORS.otp)};

  const credentials = ${JSON.stringify(results)};

  let filled = 0;

  if (credentials.username) {
    for (const sel of USERNAME_SELECTORS) {
      const field = document.querySelector(sel);
      if (field) {
        field.value = credentials.username;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        filled++;
        break;
      }
    }
  }

  if (credentials.password) {
    for (const sel of PASSWORD_SELECTORS) {
      const field = document.querySelector(sel);
      if (field) {
        field.value = credentials.password;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        filled++;
        break;
      }
    }
  }

  if (credentials.otp) {
    for (const sel of OTP_SELECTORS) {
      const field = document.querySelector(sel);
      if (field) {
        field.value = credentials.otp;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.focus();
        filled++;
        break;
      }
    }
  }

  // Toast notification
  const toast = document.createElement('div');
  toast.style = 'position:fixed;top:20px;right:20px;background:#2e3440;color:#88c0d0;...';
  toast.textContent = filled > 0
    ? \`🔐 Заполнено полей: \${filled}\`
    : '❌ Поля не найдены';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
})()
`

injectJS(autofillCode)
```

---

## 5. CLI Interface

### 5.1. Commands

**Auth (initial setup):**
```bash
qb-keychain auth
# Запрашивает Touch ID + 6-digit PIN
# Сохраняет session в ~/.qb-keychain/session.json
```

**Get credentials (из qutebrowser):**
```bash
qb-keychain get <url>
# Автоматически определяет форму через QUTE_HTML
# Запрашивает только необходимое
# Инжектит через QUTE_FIFO
```

**Manual get:**
```bash
qb-keychain get <url> --password
qb-keychain get <url> --otp
qb-keychain get <url> --both
```

**List accounts:**
```bash
qb-keychain list <url>
```

### 5.2. Qutebrowser config

**config.py:**
```python
config.bind('<Space>p', 'spawn -u qb-keychain get', mode='normal')
config.bind('<Space>P', 'spawn -u qb-keychain get --pick', mode='normal')
```

---

## 6. Dependencies

### 6.1. Runtime
- **Node.js** >= 18 (для crypto.subtle)
- **jsdom** (для HTML parsing)
- **fzf** (опционально, для account selection)
- **Alacritty** (опционально, для auth UI)

### 6.2. NPM packages
```json
{
  "name": "qb-keychain",
  "version": "1.0.0",
  "dependencies": {
    "jsdom": "^23.0.0"
  },
  "bin": {
    "qb-keychain": "./src/cli.js"
  }
}
```

### 6.3. Installation
```bash
cd ~/dev/dotfiles/qutebrowser/userscripts/qb-keychain
npm install
npm link  # Creates /usr/local/bin/qb-keychain symlink
```

---

## 7. File Structure

```
qutebrowser/userscripts/qb-keychain/
├── package.json
├── src/
│   ├── cli.js              # Entry point, arg parsing
│   ├── native-helper.js    # Native helper communication
│   ├── srp.js              # SRP authentication
│   ├── crypto.js           # AES-GCM encryption/decryption
│   ├── session.js          # Session management
│   ├── commands.js         # Get password/OTP commands
│   ├── form-detector.js    # HTML parsing + form detection
│   ├── autofill.js         # Generate autofill JavaScript
│   ├── fzf.js              # Account selection UI
│   └── utils.js            # Buffer helpers, serialization
└── README.md
```

**Размер кода (оценка):**
- `srp.js`: ~300 строк (SRP protocol)
- `crypto.js`: ~100 строк (AES-GCM)
- `native-helper.js`: ~150 строк (stdin/stdout communication)
- `commands.js`: ~200 строк (command builders)
- `session.js`: ~50 строк (load/save)
- `form-detector.js`: ~150 строк (JSDOM parsing)
- `autofill.js`: ~200 строк (JS generation)
- `cli.js`: ~150 строк (arg parsing, main flow)
- `utils.js`: ~100 строк (helpers)

**Итого: ~1400 строк**

---

## 8. Security Considerations

### 8.1. Session storage
- `~/.qb-keychain/session.json` - permissions 600
- sharedKey хранится в base64, но в plain text
- Альтернатива: использовать macOS Keychain для хранения sharedKey (но это добавит зависимость)

### 8.2. Memory
- sharedKey и passwords в памяти (JavaScript strings)
- Node.js не имеет secure memory APIs
- Потенциально уязвимо к memory dumps

### 8.3. Logging
- НЕ логировать passwords, sharedKey, PIN
- Логировать только metadata (domain, username, статусы)

---

## 9. Comparison: Bash vs Standalone JS

| Аспект | Bash + apw | Standalone JS |
|--------|-----------|---------------|
| **LOC** | +200 строк | +1400 строк |
| **Dependencies** | apw (brew) | Node.js, jsdom |
| **Touch ID** | 1-2 (с form detection) | 1-2 (та же логика) |
| **Maintenance** | Minimal (apw updates) | High (macOS API changes) |
| **Setup** | `brew install apw`, `apw auth` | `npm install`, `qb-keychain auth` |
| **Daemon** | Требуется apw daemon | Нет daemon |
| **Startup** | Требуется `apw auth` после boot | Требуется `qb-keychain auth` после boot |
| **Code ownership** | Community (apw) | Personal (you) |
| **Complexity** | Low | High |
| **Form detection** | Integrated | Integrated |
| **Account selection** | fzf in Alacritty | fzf in Alacritty |
| **Error handling** | bash trap | try/catch |
| **Debugging** | bash -x | node --inspect |

---

## 10. Implementation Plan

### Phase 1: Core (4-6 часов)
1. ✅ Setup project structure
2. ✅ Implement `utils.js` (Buffer, serialization, BigInt helpers)
3. ✅ Implement `crypto.js` (SHA-256, powermod, AES-GCM)
4. ✅ Implement `srp.js` (SRP-6a protocol)

### Phase 2: Communication (3-4 часа)
5. ✅ Implement `native-helper.js` (spawn helper, stdin/stdout)
6. ✅ Implement `session.js` (load/save session)
7. ✅ Test authentication flow manually

### Phase 3: Commands (2-3 часа)
8. ✅ Implement `commands.js` (getLoginNames, getPassword, getOTP)
9. ✅ Test credential fetching

### Phase 4: Integration (3-4 часа)
10. ✅ Implement `form-detector.js` (JSDOM parsing)
11. ✅ Implement `autofill.js` (generate JS code)
12. ✅ Implement `fzf.js` (account selection)
13. ✅ Implement `cli.js` (main entry point)

### Phase 5: Testing (2-3 часа)
14. ✅ Test on GitLab (password → OTP flow)
15. ✅ Test on various sites (GitHub, Google, etc.)
16. ✅ Edge cases (no accounts, auth failure, etc.)

### Phase 6: Documentation (1-2 часа)
17. ✅ Write README.md
18. ✅ Document installation
19. ✅ Document troubleshooting

**Total: ~15-22 часа (2-3 дня work)**

---

## 11. Risk Assessment

### High Risk ⚠️
- **macOS API changes**: Apple может изменить native helper протокол в будущих версиях
- **SRP implementation bugs**: Криптография сложная, ошибки могут привести к security issues
- **Touch ID bypass**: Неправильная реализация может позволить обход биометрии

### Medium Risk ⚡
- **Session expiration**: Непонятно как долго session валидна, может потребоваться re-auth
- **JSDOM limitations**: Не все сайты корректно парсятся (dynamic content)
- **Memory leaks**: Node.js может держать credentials в памяти

### Low Risk ✓
- **Performance**: Native helper - основной bottleneck, не userscript
- **Compatibility**: Node.js стабилен, jsdom поддерживает modern HTML

---

## 12. Migration Path

### From apw to standalone:
1. Install qb-keychain: `npm link`
2. Run initial auth: `qb-keychain auth`
3. Update config.py: `spawn -u qb-keychain get`
4. Test on several sites
5. Disable apw daemon: `brew services stop apw`
6. Remove apw if satisfied: `brew uninstall apw`

### Rollback:
1. Re-enable apw daemon: `brew services start apw`
2. Update config.py: `spawn -u keychain-login`
3. Remove qb-keychain: `npm unlink`

---

## 13. Conclusion

### Когда использовать Standalone JS:
- ✅ Хочется полного контроля над логикой
- ✅ Готовность поддерживать ~1400 строк кода
- ✅ Интерес к изучению SRP, криптографии, macOS APIs
- ✅ Не хочется зависеть от apw daemon

### Когда использовать Bash + apw:
- ✅ Хочется простоты и minimal maintenance
- ✅ apw уже работает и поддерживается
- ✅ Form detection решает проблему двойного Touch ID
- ✅ Community support важен

**Рекомендация:** Начать с Bash + form detection (Вариант А), перейти на Standalone JS (Вариант Б) если появятся проблемы с apw или нужны дополнительные фичи.

---

## 14. Next Steps

1. **Сначала:** Реализовать Вариант А (bash + form detection)
2. **Тестировать:** GitLab, GitHub, Google, etc.
3. **Оценить:** Если Вариант А решает проблему → продолжать использовать
4. **Опционально:** Если интересен learning project или apw перестанет работать → начать Вариант Б

**Вопросы для обсуждения:**
- Нужна ли полная независимость от apw?
- Готовность поддерживать custom crypto код?
- Есть ли интерес к learning project (SRP, криптография)?
