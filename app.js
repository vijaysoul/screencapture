const {desktopCapturer, ipcRenderer, remote} = require('electron')
const domify = require('domify')

let localStream
let microAudioStream
let recordedChunks = []
let numRecordedChunks = 0
let recorder
let includeMic = false
// let includeSysAudio = false

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#screenshot').addEventListener('click', screenCapturer)
  document.querySelector('#record').addEventListener('click', recordDesktop)
  // document.querySelector('#play').addEventListener('click', playVideo)
  // document.querySelector('#pause').addEventListener('click', pauseRecording)
  document.querySelector('#stop').addEventListener('click', stopRecording)
  // document.querySelector('#resume').addEventListener('click', resumeRecording)
  document.querySelector('#play').addEventListener('click', play)
  // document.querySelector('#download-button').addEventListener('click', save)
})

const playVideo = () => {
  remote.dialog.showOpenDialog({properties: ['openFile']}, (filename) => {
    console.log(filename)
    let video = document.querySelector('video')
    video.muted = false
    video.src = filename
  })
}

// const disableButtons = () => {
//   document.querySelector('#record').disabled = true


const cleanRecord = () => {
  let video = document.querySelector('video');
  video.controls = false;
  recordedChunks = []
  numRecordedChunks = 0
}

ipcRenderer.on('source-id-selected', (event, sourceId) => {
  // Users have cancel the picker dialog.
  if (!sourceId) return
  console.log(sourceId)
  onAccessApproved(sourceId)
})

const screenCapturer = () => {
  ipcRenderer.send('screen-shot', { types: ['screen'] })
}

const recordDesktop = () => {
  cleanRecord()
  ipcRenderer.send('show-picker', { types: ['screen'] })
}

const recorderOnDataAvailable = (event) => {
  if (event.data && event.data.size > 0) {
    recordedChunks.push(event.data)
    numRecordedChunks += event.data.byteLength
  }
}

const stopRecording = () => {
  console.log('Stopping record and starting download')
  recorder.stop()
  localStream.getVideoTracks()[0].stop()
  save()
}

const play = () => {
  // Unmute video.
  let video = document.querySelector('video')
  video.controls = true;
  video.muted = false
  let blob = new Blob(recordedChunks, {type: 'video/webm'})
  video.src = window.URL.createObjectURL(blob)
}

const save = () => {
  let blob = new Blob(recordedChunks, {type: 'video/webm'})
  let url = URL.createObjectURL(blob)
  let a = document.createElement('a')
  document.body.appendChild(a)
  a.style = 'display: none'
  a.href = url
  a.download = 'electron-screen-recorder.mp4'
  a.click()
  setTimeout(function () {
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }, 100)
}

const getMediaStream = (stream) => {
  let video = document.querySelector('video')
  video.src = URL.createObjectURL(stream)
  localStream = stream
  stream.onended = () => { console.log('Media stream ended.') }

  let videoTracks = localStream.getVideoTracks()

  if (includeMic) {
    console.log('Adding audio track.')
    let audioTracks = microAudioStream.getAudioTracks()
    localStream.addTrack(audioTracks[0])
  }

  try {
    console.log('Start recording the stream.')
    recorder = new MediaRecorder(stream)
  } catch (e) {
    console.assert(false, 'Exception while creating MediaRecorder: ' + e)
    return
  }
  recorder.ondataavailable = recorderOnDataAvailable
  recorder.onstop = () => { console.log('recorderOnStop fired') }
  recorder.start()
  console.log('Recorder is started.')
}

const getUserMediaError = () => {
  console.log('getUserMedia() failed.')
}

const onAccessApproved = (id) => {
  if (!id) {
    console.log('Access rejected.')
    return
  }
  console.log('Window ID: ', id)
  navigator.webkitGetUserMedia({
    audio: false,
    video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: id,
      maxWidth: window.screen.width, maxHeight: window.screen.height } }
  }, getMediaStream, getUserMediaError)
}
