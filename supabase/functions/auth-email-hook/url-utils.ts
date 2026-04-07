const LOVABLE_HOST_SUFFIXES = ['.lovable.app', '.lovable.dev']
const RECOVERY_PATH = '/reset-password'

function isLovableHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase()
  return (
    normalized === 'lovable.app' ||
    normalized === 'lovable.dev' ||
    LOVABLE_HOST_SUFFIXES.some((suffix) => normalized.endsWith(suffix))
  )
}

function buildRecoveryUrl(fallbackOrigin: string): URL {
  return new URL(RECOVERY_PATH, fallbackOrigin)
}

export function normalizeAuthActionUrl(
  rawUrl: string | undefined,
  emailType: string,
  fallbackOrigin: string
): string {
  if (!rawUrl || emailType !== 'recovery') {
    return rawUrl ?? ''
  }

  const fallbackRecoveryUrl = buildRecoveryUrl(fallbackOrigin)

  try {
    const actionUrl = new URL(rawUrl)
    const redirectTo = actionUrl.searchParams.get('redirect_to')

    if (redirectTo) {
      const redirectUrl = new URL(redirectTo, fallbackRecoveryUrl)

      if (isLovableHost(redirectUrl.hostname)) {
        redirectUrl.protocol = fallbackRecoveryUrl.protocol
        redirectUrl.host = fallbackRecoveryUrl.host
      }

      redirectUrl.pathname = fallbackRecoveryUrl.pathname
      redirectUrl.search = ''
      actionUrl.searchParams.set('redirect_to', redirectUrl.toString())
      return actionUrl.toString()
    }

    if (actionUrl.pathname.includes('/verify')) {
      actionUrl.searchParams.set('redirect_to', fallbackRecoveryUrl.toString())
      return actionUrl.toString()
    }

    if (isLovableHost(actionUrl.hostname)) {
      actionUrl.protocol = fallbackRecoveryUrl.protocol
      actionUrl.host = fallbackRecoveryUrl.host
      actionUrl.pathname = fallbackRecoveryUrl.pathname
      actionUrl.search = ''
      return actionUrl.toString()
    }

    return actionUrl.toString()
  } catch {
    return rawUrl
  }
}

export function describeAuthActionUrl(rawUrl: string | undefined): {
  linkHost: string | null
  redirectHost: string | null
} {
  if (!rawUrl) {
    return { linkHost: null, redirectHost: null }
  }

  try {
    const actionUrl = new URL(rawUrl)
    const redirectTo = actionUrl.searchParams.get('redirect_to')
    const redirectHost = redirectTo ? new URL(redirectTo, actionUrl).hostname : null

    return {
      linkHost: actionUrl.hostname,
      redirectHost,
    }
  } catch {
    return { linkHost: null, redirectHost: null }
  }
}