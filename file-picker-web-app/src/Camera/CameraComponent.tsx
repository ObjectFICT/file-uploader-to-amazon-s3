import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import './CameraComponent.css';
import {
  CameraMode,
  CameraModeButton,
  ChangeFacingCameraButton,
  CloseButton,
  Control,
  LoaderWrapper,
  Preview,
  TakePhotoButton,
  UploadButton,
  UploadControl,
  UploadFile,
  WebcamWrapper,
  Wrapper
} from './CameraComponentStyleHelper';

const CameraComponent = () => {
  const mediaRecorderRef = useRef<MediaRecorder>(null);
  const webcamRef = useRef<Webcam>(null);
  const [selectedMode, setSelectedMode] = useState('photo');
  const [emptyMode, setEmptyMode] = useState({ order: 2 });
  const [changeCamera, setChangeCamera] = useState('environment');
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [videoFormat, setVideoFormat] = useState<string | null>();
  const [deviceId, setDeviceId] = useState({});
  const [devices, setDevices] = useState([]);
  const [isReadyToUpload, setReadyToUpload] = useState(false);
  const [preview, setPreview] = useState<any>()
  const [videoURL, setVideoURL] = useState<string>();
  const [file, setFile] = useState<File>();
  const [isUploading, setUploading] = useState(false);
  const videoConstraints = { video: true, facingMode: { exact: changeCamera } };
  const videoConstraintsForChrome = { video: true, deviceId: { exact: deviceId } }
  const audioConstraints = { noiseSuppression: true, echoCancellation: true };

  // @ts-ignore
  const isChrome = () => {
    // @ts-ignore
    const isChromium = window.chrome;
    const winNav = window.navigator;
    const vendorName = winNav.vendor;
    // @ts-ignore
    const isOpera = typeof window.opr !== 'undefined';
    const isIEedge = winNav.userAgent.indexOf('Edg') > -1;
    const isIOSChrome = winNav.userAgent.match('CriOS');
    let isChrome = false;
    if (isIOSChrome) {
      // is Google Chrome on IOS
      return false;
    } else return isChromium !== null &&
      typeof isChromium !== 'undefined' &&
      vendorName === 'Google Inc.' && !isOpera && !isIEedge;
  };

  const handleDevices = useCallback(
    // @ts-ignore
    mediaDevices => setDevices(mediaDevices.filter(({ kind }) => kind === 'videoinput')),
    [setDevices]
  );

  const capture = useCallback(() => {
    if (webcamRef.current) {
      let screen = webcamRef.current.getScreenshot();
      if (screen !== null) {
        setFile(base64ToFile(screen))
      }
      setReadyToUpload(true);
      setPreview(screen);
    }
  }, [webcamRef, setFile]);

  const handleStartCaptureClick = useCallback(() => {
    if (webcamRef.current) {
      let options = {};
      setCapturing(true);

      if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
        options = {
          mimeType: 'video/webm; codecs=vp9'
        };
        setVideoFormat('video/webm');
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        options = {
          mimeType: 'video/webm'
        };
        setVideoFormat('video/webm');
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        options = {
          mimeType: 'video/mp4',
          videoBitsPerSecond: 100000
        };
        setVideoFormat('video/mp4');
      } else {
        console.error('No suitable mimetype found for this device');
        alert('No suitable mimetype found for this device');
        setCapturing(false);
        setVideoFormat(null);
        return;
      }

      // @ts-ignore
      mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, options);
      mediaRecorderRef.current.addEventListener('dataavailable', handleDataAvailable);
      mediaRecorderRef.current.start();
    }

  }, [webcamRef, setCapturing, mediaRecorderRef]);

  const handleDataAvailable = useCallback(
    ({ data }) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data));
      }
    },
    [setRecordedChunks]
  );

  const handleStopCaptureClick = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setCapturing(false);
      setReadyToUpload(true);
    }

  }, [mediaRecorderRef, webcamRef, setCapturing, recordedChunks]);

  const base64ToFile = (URI: string) => {
    const byteString = atob(URI.split(',')[1]);
    const type = URI.split(',')[0].split(':')[1].split(';')[0]
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }

    return new File(
      [new Blob([arrayBuffer])],
      'image.' + type.split('/')[1],
      { type: type }
    );
  }

  const selectFileFromGallery = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setReadyToUpload(true);
      setFile(e.target.files[0]);
      const url = URL.createObjectURL(e.target.files[0]);

      if (selectedMode === 'photo') {
        setPreview(url)
      }

      if (selectedMode === 'video') {
        setVideoURL(url)
      }
    }
  }

  const selectVideoMode = () => {
    setEmptyMode({ order: 0 })
    setSelectedMode('video')
  }

  const selectPhotoMode = () => {
    setEmptyMode({ order: 2 })
    setSelectedMode('photo')
  }

  const makePhotoOrVideo = () => {
    if (selectedMode === 'photo') {
      capture();
    }

    if (selectedMode === 'video') {
      !capturing ? handleStartCaptureClick() : handleStopCaptureClick();
    }
  }

  const changeCameraView = () => {
    if (!isChrome()) {
      setChangeCamera(changeCamera === 'user' ? 'environment' : 'user');
    }
  }

  const closeUpload = () => {
    setReadyToUpload(false)

    if (selectedMode === 'video') {
      setRecordedChunks([]);
    }
  }

  const upload = () => {
    if (file === undefined) {
      alert('Something happened:( Please try again!')
      return;
    }

    setUploading(true)

    const url = 'https://7oxazxpmsm.loclx.io/api/upload?type=' + file.type;
    const formData = new FormData();
    formData.append('file', file);

    const ajax = new XMLHttpRequest();
    ajax.onload = () => {
      setUploading(false)
      alert('File uploaded!');
      setReadyToUpload(false)

    };
    ajax.onerror = () => {
      setUploading(false)
      alert('Something happened:( Please try again later!');
      setReadyToUpload(false)
    }

    ajax.open('POST', url);
    ajax.send(formData);
  }

  useEffect(
    () => {
      navigator.mediaDevices.enumerateDevices().then(handleDevices);
      setDeviceId(devices[0]);
    },
    [handleDevices]
  );

  useEffect(
    () => {
      if (videoFormat != null) {
        const blob = new Blob(recordedChunks, { type: videoFormat });
        setVideoURL(URL.createObjectURL(blob));
        setFile(new File([blob], 'video.' + videoFormat.split('/')[1], { type: videoFormat }))
      }
    },
    [recordedChunks]
  );

  return (
    <Wrapper>
      {
        isUploading &&
        <LoaderWrapper>
          <div className="loader">Loading...</div>
        </LoaderWrapper>
      }

      {!isReadyToUpload ?
        <WebcamWrapper>
          <Webcam audio={true}
                  muted={true}
                  ref={webcamRef}
            // @ts-ignore
                  videoConstraints={isChrome() ? videoConstraintsForChrome : videoConstraints}
                  audioConstraints={audioConstraints}
                  height={'100%'}
                  width={'100%'}
                  style={{
                    width: '100%',
                    height: '100%'
                  }}/>
        </WebcamWrapper>
        :
        <Preview>
          {selectedMode === 'video' ?
            // <ReactPlayer url={videoURL}/>
            <video key={videoURL} width="100%" controls>
              <source src={videoURL} type={'video/webm'}/>
            </video>
            :
            <img style={{ width: '100%', }} src={preview} alt={'Image'}/>
          }
        </Preview>
      }
      {!isReadyToUpload ?
        <>
          <CameraMode>
            <CameraModeButton style={{
              color: selectedMode === 'video' ? 'yellow' : 'white',
              order: selectedMode === 'video' ? 1 : 0
            }}
                              onClick={selectVideoMode}>VIDEO</CameraModeButton>
            <CameraModeButton style={{
              color: selectedMode === 'photo' ? 'yellow' : 'white',
              order: selectedMode === 'photo' ? 1 : 2
            }}
                              onClick={selectPhotoMode}>PHOTO</CameraModeButton>
            <CameraModeButton style={emptyMode}></CameraModeButton>
          </CameraMode>
          <Control>
            {!capturing &&
              <UploadFile form={'upload_file'}>
                <input id="upload_file"
                       type={'file'}
                       style={{ display: 'none' }}
                       accept={selectedMode === 'video' ? 'video/*' : 'image/*'}
                       onChange={selectFileFromGallery}/>
              </UploadFile>
            }
            <TakePhotoButton className={capturing ? 'startRecordVideo' : ''}
                             onClick={makePhotoOrVideo}/>
            {!capturing &&
              <ChangeFacingCameraButton
                className={devices.length <= 1 && isChrome() ? 'disabled' : ''}
                disabled={devices.length <= 1 && isChrome()}
                onClick={changeCameraView}/>
            }
          </Control>
        </>
        :
        <UploadControl>
          <CloseButton onClick={closeUpload}/>
          <UploadButton onClick={upload}/>
        </UploadControl>
      }

    </Wrapper>
  );
};

export default CameraComponent;