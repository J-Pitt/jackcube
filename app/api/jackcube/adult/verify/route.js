import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { password } = await request.json()
    const expected = process.env.ADULT_GAMES_PASSWORD || 'cube18'
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
