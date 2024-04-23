// SPDX-License-Identifier: MIT
// See LICENSE.txt for more information.
'use strict';
(function () {
    const videoResolutionChoices = [
        { label: '144p (256\xd7144px)', width: 256, height: 144 },
        { label: '240p (427\xd7240px)', width: 427, height: 240 },
        { label: '360p (640\xd7360px)', width: 640, height: 360 },
        { label: '480p, SD (720\xd7480px)', width: 720, height: 480 },
        { label: '720p, HD (1280\xd7720px)', width: 1280, height: 720 },
        { label: '1080p, FullHD (1920\xd71080px)', width: 1920, height: 1080 },
        { label: '1440p (2560\xd71440px)', width: 2560, height: 1440 },
        { label: '2160p, 4K (2560\xd71440px)', width: 3840, height: 2160 },
    ];
    const videoFrameRateChoices = [
        { label: '10fps', frameRate: 10 },
        { label: '15fps', frameRate: 15 },
        { label: '24fps', frameRate: 24 },
        { label: '30fps', frameRate: 30 },
        { label: '60fps', frameRate: 60 },
    ];

    let currentDeviceIds = { video: '', audio: '', width: 0, height: 0, fps: 0 };
    let videoResolutionSelection = 4; // 720p
    let videoFrameRateSelection = 3; // 30fps
    let previewStream = null;
    let isVideoVisibled = true;

    function startPreviewStream(videoElm, device) {
        return new Promise((resolve, reject) => {
            if (!device || !device.video || !device.audio) {
                reject(null);
                return;
            }
            const constraints = {
                audio: ((id) => {
                    if (!id) {
                        return false;
                    }
                    return {
                        deviceId: { exact: id },
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false,
                    };
                })(device.audio),
                video: ((id, w, h, fps) => {
                    if (!id) {
                        return false;
                    }
                    return {
                        deviceId: { exact: id },
                        width: { min: 256, ideal: w, max: 3840 },
                        height: { min: 144, ideal: h, max: 2160 },
                        frameRate: { min: 10, ideal: fps, max: 60 },
                    };
                })(device.video, device.width, device.height, device.fps),
            };
            navigator.mediaDevices
                .getUserMedia(constraints)
                .then((stream) => {
                    videoElm.srcObject = stream;
                    videoElm.onloadedmetadata = (_) => {
                        videoElm.play();
                        resolve(stream);
                    };
                })
                .catch((e) => {
                    showErrorMessageDialog(e.name + ': ' + e.message);
                    reject(null);
                });
        });
    }

    function stopPreviewStream(videoElm) {
        const stream = videoElm.srcObject;
        stream.getTracks().forEach((track) => {
            track.stop();
        });
        videoElm.srcObject = null;
    }

    function setVideoVisibled(visibled) {
        const videoElm = document.querySelector('video');
        const buttonElm = document.getElementById('video-mute-switch');
        if (visibled) {
            // ビデオの表示化
            isVideoVisibled = true;
            videoElm.style.visibility = '';
            buttonElm.classList.remove('button-disabled');
        } else {
            // ビデオの非表示化
            isVideoVisibled = false;
            videoElm.style.visibility = 'hidden';
            buttonElm.classList.add('button-disabled');
        }
    }

    function setAudioMuted(muted) {
        const videoElm = document.querySelector('video');
        const buttonElm = document.getElementById('audio-mute-switch');
        videoElm.muted = muted;
        if (muted) {
            // ミュート設定
            buttonElm.classList.add('button-disabled');
        } else {
            // ミュート解除
            buttonElm.classList.remove('button-disabled');
        }
    }

    /**
     * 映像入力と音声入力のデバイス一覧を取得します
     * @returns 取得できた映像入力デバイスと音声入力デバイスの一覧。一覧は、キーにデバイスID、値にデバイス名を保持する
     */
    async function getDeviceList() {
        const devinfo = await (async () => {
            if (!previewStream) {
                // アクティブなストリームがない時にデバイス一覧を取得するために、一時的にストリームを有効にする
                console.log('Use dummystream');
                try {
                    const dummystream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const getCurrentDeviceId = (tracks) => {
                        if (tracks.length === 0) {
                            return '';
                        }
                        return tracks[0].getSettings().deviceId || '';
                    };
                    const currentVideoDeviceId = getCurrentDeviceId(dummystream.getVideoTracks());
                    const currentAudioDeviceId = getCurrentDeviceId(dummystream.getAudioTracks());
                    console.log(currentVideoDeviceId, currentAudioDeviceId);
                    dummystream.getTracks().forEach((track) => track.stop());
                    return {
                        devices: devices,
                        current: { video: currentVideoDeviceId, audio: currentAudioDeviceId },
                    };
                } catch (e) {}
            }
            return {
                devices: await navigator.mediaDevices.enumerateDevices(),
                current: { video: currentDeviceIds.video, audio: currentDeviceIds.audio },
            };
        })();
        console.log(devinfo.devices);
        const devices = devinfo.devices;
        const videoDevices = Object.fromEntries(
            devices.filter((d) => d.kind === 'videoinput' && d.deviceId).map((v) => [v.deviceId, v.label]),
        );
        const audioDevices = Object.fromEntries(
            devices.filter((d) => d.kind === 'audioinput' && d.deviceId).map((v) => [v.deviceId, v.label]),
        );
        return Promise.resolve({
            video: videoDevices,
            audio: audioDevices,
            current: devinfo.current,
        });
    }

    async function showErrorMessageDialog(message) {
        return new Promise((resolve, _) => {
            const dialog = document.getElementById('errorMessageDialog');
            const errorMessageElm = document.getElementById('errorMessage');
            errorMessageElm.textContent = message;
            const closeFunc = (_) => {
                dialog.removeEventListener(closeFunc);
                resolve('');
            };
            dialog.addEventListener('close', closeFunc);
            document.getElementById('errorMessageDialog').showModal();
        });
    }

    /**
     * 映像/音声デバイス一覧をドロップダウンリストに設定します
     * @param {*} elm 設定対象のselect要素
     * @param {*} labels デバイスIDをキー、ラベルを値とするオブジェクト
     * @param {*} cur 初期状態で選択するデバイスID
     */
    function buildDeviceListSelection(elm, labels, cur) {
        while (elm.firstChild) {
            elm.firstChild.remove();
        }
        const ids = Object.keys(labels);
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '-- Disabled --';
        if (ids.length == 0) {
            opt.disabled = true;
            opt.defaultSelected = true;
        }
        elm.appendChild(opt);
        ids.forEach((k) => {
            const opt = document.createElement('option');
            opt.value = k;
            if (cur && k === cur) {
                opt.defaultSelected = true;
            }
            const label = labels[k].replace(/\s\([0-9a-fA-F]{4}:[0-9a-fA-F]{4}\)$/, '');
            opt.textContent = label;
            elm.appendChild(opt);
        });
        elm.disabled = ids.length === 0;
    }

    /**
     * 一般的なドロップダウンリストを生成します
     * @param {*} elm 設定対象のselect要素
     * @param {*} labels 要素にlabelを持つオブジェクトの配列
     * @param {*} curidx 初期状態で選択する配列のインデックス
     */
    function buildSelection(elm, labels, curidx) {
        while (elm.firstChild) {
            elm.firstChild.remove();
        }
        labels.forEach((value, index) => {
            if ('label' in value) {
                const opt = document.createElement('option');
                if (index === curidx) {
                    opt.defaultSelected = true;
                }
                opt.value = index.toString();
                opt.textContent = value['label'];
                elm.appendChild(opt);
            }
        });
    }

    /**
     * デバイス選択ダイアログを表示します
     * @param {*} initialDeviceID
     * @returns
     */
    async function showDeviceSelectDialog() {
        return new Promise((resolve, _) => {
            getDeviceList()
                .then((devices) => {
                    // デバイスリストの構築
                    buildDeviceListSelection(
                        document.getElementById('videoDeviceList'),
                        devices.video,
                        devices.current.video,
                    );
                    buildDeviceListSelection(
                        document.getElementById('audioDeviceList'),
                        devices.audio,
                        devices.current.audio,
                    );
                    // 映像設定
                    buildSelection(
                        document.getElementById('videoResolutionList'),
                        videoResolutionChoices,
                        videoResolutionSelection,
                    );
                    buildSelection(
                        document.getElementById('videoFrameRateList'),
                        videoFrameRateChoices,
                        videoFrameRateSelection,
                    );
                    // イベントハンドラの設定
                    const dialog = document.getElementById('selectDeviceDialog');
                    const confirmBtn = document.getElementById('selectDeviceConfirmButton');
                    const confirmClickFunc = (e) => {
                        e.preventDefault();
                        dialog.close('confirm');
                    };
                    confirmBtn.addEventListener('click', confirmClickFunc);
                    const dialogCloseFunc = (_) => {
                        confirmBtn.removeEventListener('click', confirmClickFunc);
                        dialog.removeEventListener('close', dialogCloseFunc);
                        const k = dialog.returnValue;
                        console.log(k);
                        if (k === 'cancel') {
                            resolve(false); // cancel
                        } else {
                            const videoId = document.getElementById('videoDeviceList').value;
                            const audioId = document.getElementById('audioDeviceList').value;
                            videoResolutionSelection = parseInt(
                                document.getElementById('videoResolutionList').value,
                                10,
                            );
                            videoFrameRateSelection = parseInt(document.getElementById('videoFrameRateList').value, 10);
                            const videoWidth = videoResolutionChoices[videoResolutionSelection]['width'];
                            const videoHeight = videoResolutionChoices[videoResolutionSelection]['height'];
                            const videoFrameRate = videoFrameRateChoices[videoFrameRateSelection]['frameRate'];
                            resolve({
                                video: videoId,
                                audio: audioId,
                                width: videoWidth,
                                height: videoHeight,
                                fps: videoFrameRate,
                            });
                        }
                    };
                    dialog.addEventListener('close', dialogCloseFunc);
                    dialog.showModal();
                })
                .catch((e) => {
                    showErrorMessageDialog(e.name + ': ' + e.message).then((_) => {
                        resolve(null);
                    });
                });
        });
    }

    document.getElementById('settings-button').addEventListener('click', (_) => {
        showDeviceSelectDialog().then((device) => {
            if (device === false) {
                // デバイスの有効化をキャンセル
                console.log('デバイスの有効化をキャンセルしました');
            } else if (
                device.video === currentDeviceIds.video &&
                device.audio === currentDeviceIds.audio &&
                device.width === currentDeviceIds.width &&
                device.height === currentDeviceIds.height &&
                device.fps === currentDeviceIds.fps
            ) {
                // デバイスの設定に変更がない
                console.log('デバイス設定は変更されませんでした');
            } else {
                // デバイスの設定が変更された
                console.log(device);
                // プレビュー中なら止める
                const nowPreviewing = !!previewStream;
                if (nowPreviewing) {
                    stopPreviewStream(document.querySelector('video'));
                    previewStream = null;
                }
                currentDeviceIds = device;
                // プレビューの開始
                startPreviewStream(document.querySelector('video'), currentDeviceIds)
                    .then((stream) => {
                        previewStream = stream;
                        if (currentDeviceIds.video) {
                            setVideoVisibled(isVideoVisibled);
                        } else {
                            document.querySelector('video').style.visibility = 'hidden';
                        }
                    })
                    .catch((_) => {
                        previewStream = null;
                        document.querySelector('video').style.visibility = 'hidden';
                    });
            }
        });
    });

    document.getElementById('volume-slider').addEventListener('input', (_) => {
        const videoElm = document.querySelector('video');
        const volumeSliderElm = document.getElementById('volume-slider');
        const v = volumeSliderElm.value / 100.0;
        volumeSliderElm.style.setProperty('--video-volume', volumeSliderElm.value + '%');
        videoElm.volume = v * v;
    });

    document.getElementById('audio-mute-switch').addEventListener('click', (_) => {
        const videoElm = document.querySelector('video');
        setAudioMuted(!videoElm.muted);
    });

    document.getElementById('video-mute-switch').addEventListener('click', (_) => {
        setVideoVisibled(!isVideoVisibled);
    });

    let iconHideTimerId = 0;
    let cursorHideTimerId = 0;
    const timerFunc = (_) => {
        document.body.classList.add('active', 'cursorvisible');
        // アイコン非表示タイマー
        if (iconHideTimerId) {
            clearTimeout(iconHideTimerId);
        }
        iconHideTimerId = setTimeout(() => {
            document.body.classList.remove('active');
            iconHideTimerId = 0;
        }, 200);
        // カーソル非表示タイマー
        if (cursorHideTimerId) {
            clearTimeout(cursorHideTimerId);
        }
        cursorHideTimerId = setTimeout(() => {
            document.body.classList.remove('cursorvisible');
            cursorHideTimerId = 0;
        }, 3000);
    };

    document.body.addEventListener('pointermove', timerFunc, { capture: true });
    document.body.addEventListener('pointerdown', timerFunc, { capture: true });
})();
