onRecordAuthWithPasswordRequest((e) => {
  if (!e.collection || e.collection.name !== 'users') return
  if (!e.record) return

  const totpEnabled = e.record.getBool('totp_enabled')
  const secret = e.record.getString('totp_secret')
  if (!totpEnabled || !secret) return

  const totpCode = e?.body?.totp_code || ''
  if (!totpCode) {
    throw new BadRequestError('2FA required', 200, {
      requires_2fa: true,
      username: e.identity,
    })
  }

  // TEMP: skip $http.send, just accept any 6-digit code to test if body is the issue
  if (totpCode.length !== 6) {
    throw new BadRequestError('Invalid verification code')
  }
})

routerAdd('POST', '/api/totp/setup', (c) => {
  const auth = c.auth
  if (!auth) return c.json(401, { message: 'Unauthorized' })

  const username = auth.getString('username') || auth.id

  let res
  try {
    res = $http.send({
      method: 'POST',
      url: 'http://localhost:9090/setup',
      body: JSON.stringify({ user_id: username, issuer: 'PocketBase-TOTP' }),
      headers: { 'Content-Type': 'application/json' },
      timeout: 10,
    })
  } catch (err) {
    return c.json(503, { message: 'TOTP service unavailable' })
  }

  if (res.statusCode !== 200) {
    return c.json(502, { message: 'TOTP service error' })
  }

  const data = res.json
  auth.set('totp_secret', data.secret)
  auth.set('totp_enabled', false)
  $app.save(auth)

  return c.json(200, {
    secret: data.secret,
    qr_code: data.qr_code,
    uri: data.uri,
  })
}, $apis.requireAuth('users'))

routerAdd('POST', '/api/totp/enable', (c) => {
  const auth = c.auth
  if (!auth) return c.json(401, { message: 'Unauthorized' })

  const info = c.requestInfo()
  const code = info?.body?.code
  if (!code) return c.json(400, { message: 'Code is required' })

  const secret = auth.getString('totp_secret')
  if (!secret) return c.json(400, { message: 'TOTP not set up' })

  let res
  try {
    res = $http.send({
      method: 'POST',
      url: 'http://localhost:9090/verify',
      body: JSON.stringify({ secret, code }),
      headers: { 'Content-Type': 'application/json' },
      timeout: 10,
    })
  } catch (err) {
    return c.json(503, { message: 'TOTP service unavailable' })
  }

  if (res.statusCode !== 200 || !res.json?.valid) {
    return c.json(400, { message: 'Invalid code' })
  }

  auth.set('totp_enabled', true)
  $app.save(auth)

  return c.json(200, { message: '2FA enabled' })
}, $apis.requireAuth('users'))

routerAdd('POST', '/api/totp/disable', (c) => {
  const auth = c.auth
  if (!auth) return c.json(401, { message: 'Unauthorized' })

  auth.set('totp_enabled', false)
  auth.set('totp_secret', null)
  $app.save(auth)

  return c.json(200, { message: '2FA disabled' })
}, $apis.requireAuth('users'))

routerAdd('GET', '/api/totp/status', (c) => {
  const auth = c.auth
  if (!auth) return c.json(401, { message: 'Unauthorized' })

  return c.json(200, {
    totp_enabled: auth.getBool('totp_enabled'),
    totp_setup: !!auth.getString('totp_secret'),
  })
}, $apis.requireAuth('users'))
