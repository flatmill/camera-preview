# camera-preview

( English version / [日本語版](./README_ja.md) )

This is a web page that plays webcam video and audio on the browser.

## DEMO

[Camera Preview site on GitHub Pages](https://flatmill.github.io/camera-preview/)

## Description

- Displays and plays video and audio from a webcam or other input device in the browser.
  - Nothing is displayed or played except for the video and audio of the device.
  - Video ON/OFF, audio ON/OFF, and volume can be controlled in the browser.
- The tab sharing function of Google Meet allows you to share images obtained from webcams, video capture, etc.
  - This feature is useful for other web conferencing systems that allow screen sharing.
  - You can draw the attention of other participants in Google Meet to the video.

## Requirement

Web pages work in many modern web browsers.

## Installation

- Place the files in the `public` directory on any web server.
- Configure the web server to allow access to `index.html` via HTTPS.

## Usage

### Easy to use

- When you move the mouse pointer on the screen or tap the screen, the control panel appears in the upper right corner.
- Select the gear (⚙) icon to display the device selection dialog.
  - Before the dialog appears, the browser may ask you for permission to use the camera and microphone. At this time, please grant permission to use them.
- Once the device, resolution, and frame rate are selected, the video and audio will appear in the browser.
- If you stop moving the mouse pointer on the screen or do not tap the screen, the control panel will slowly disappear.
  - If you move the mouse pointer or tap the screen again, the control panel will appear.

### About icons on the operation panel

The following is a description of the control panel located in the upper right corner of the screen:

- Camera (📷) icon ... Turns the video display ON/OFF.
- Speaker (🔈) icon ... Turns audio output ON/OFF (mute button).
- Slider ... Changes the volume of the audio output. Rightmost is maximum, leftmost is minimum.
- Gear (⚙) icon ... Displays the device settings dialog.

### About the Device Settings Dialog

The contents of the device selection dialog are as follows

- Video Device ... Select the video device to be displayed on the screen.
  - "-- Disabled --" indicates that the video device is not used.
- Video Resolution ... Select the resolution from the video device.
  - It may not be displayed in the specified resolution.
- Video Frame Rate ... Select the frame rate from the video device.
  - It may not be displayed at the specified frame rate.
- Audio Device ... Select the audio device to be played on the browser.
  - "-- Disabled --" indicates that the audio device is not used.
  - Depending on the device you set, feedback may occur. Please be careful.

### Troubleshooting

- Devices do not appear in the list or video is not displayed
  - Please check if the corresponding video/audio device is connected.
  - The OS or security software settings may have prevented the camera or microphone from being used in the browser. Please check the relevant settings.

## Author

flatmill

## License

[MIT](LICENSE.txt)
