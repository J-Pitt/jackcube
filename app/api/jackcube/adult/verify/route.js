import { NextResponse } from 'next/server'

/** Read at request time so Amplify/runtime env vars are not replaced by the dev fallback at build. */
function expectedAdultPassword() {
  const fromEnv = process.env.ADULT_GAMES_PASSWORD
  if (fromEnv) return fromEnv
  if (process.env.NODE_ENV === 'development') return 'cube18'
  return ''
}

export async function POST(request) {
  try {
    const { password } = await request.json()
    const expected = expectedAdultPassword()
    if (!expected) {
      return NextResponse.json(
        { success: false, error: 'Adult games password is not configured on the server' },
        { status: 503 }
      )
    }
    if (!password || password !== expected) {
      return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Server error', details: err.message },
      { status: 500 }
    )
  }
}
