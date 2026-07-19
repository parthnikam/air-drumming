export async function startCamera(video: HTMLVideoElement) {
  video.srcObject = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: 1280, height: 720 },
    audio: false,
  })
  await video.play()
}
