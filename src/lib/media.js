/**
 * Browser media access helpers. getUserMedia requires a secure context
 * (https:// or localhost). Plain http://192.168.x.x will not work.
 */

export function getMediaSupportError() {
  if (typeof window === 'undefined') return null

  if (!window.isSecureContext) {
    const host = window.location.hostname
    const isLan = /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(host)
    if (isLan) {
      return 'Video/voice needs HTTPS on your phone. For local testing, use localhost on each device, or deploy to Amplify (HTTPS).'
    }
    return 'Camera and microphone require HTTPS or localhost.'
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return 'This browser does not support camera/microphone access here.'
  }

  return null
}

/**
 * Turn a raw getUserMedia error into a short, actionable message. The browser's
 * own wording ("...not allowed by the platform in the current context...") is
 * cryptic; the usual real cause on phones is an in-app browser webview blocking
 * the camera, or a remembered permission denial.
 */
export function describeMediaError(err) {
  const name = err?.name || ''
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Camera/mic is blocked. If you opened this from inside another app (Instagram, Messenger, TikTok…), tap the menu and choose "Open in Safari/Chrome." Otherwise allow camera + mic for this site, then retry.'
  }
  if (name === 'NotReadableError' || name === 'AbortError') {
    return 'Your camera/mic is busy in another app or tab. Close it and retry.'
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No usable camera/mic was found on this device.'
  }
  return err?.message || 'Could not access camera/microphone.'
}

export async function requestUserMedia(constraints) {
  const supportError = getMediaSupportError()
  if (supportError) throw new Error(supportError)

  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints)
  }

  const legacy =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia

  if (legacy) {
    return new Promise((resolve, reject) => {
      legacy.call(navigator, constraints, resolve, reject)
    })
  }

  throw new Error('Camera and microphone are not available in this browser.')
}

/** Try video+audio, fall back to audio-only if camera is denied or missing. */
export async function requestLobbyMedia() {
  try {
    return await requestUserMedia({
      audio: true,
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    })
  } catch (err) {
    const name = err?.name || ''
    if (name === 'NotFoundError' || name === 'NotAllowedError' || name === 'OverconstrainedError') {
      return requestUserMedia({ audio: true, video: false })
    }
    throw err
  }
}

export function hasVideoTrack(stream) {
  return stream?.getVideoTracks?.().length > 0
}

/** Webcam on the main screen / TV device. */
export async function requestRoomCameraMedia() {
  try {
    return await requestUserMedia({
      audio: true,
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    })
  } catch (err) {
    const name = err?.name || ''
    if (name === 'NotFoundError' || name === 'NotAllowedError' || name === 'OverconstrainedError') {
      return requestUserMedia({ audio: true, video: false })
    }
    throw err
  }
}
