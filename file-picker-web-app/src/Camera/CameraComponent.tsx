import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import './CameraComponent.css';
import {
  CameraMode,
  CameraModeButton,
  ChangeFacingCameraButton,
  CloseButton,
  Control,
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
  const [image, setImage] = useState<String | null>(null);
  const [file, setFile] = useState<File>();
  const [changeCamera, setChangeCamera] = useState('environment');
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [videoFormat, setVideoFormat] = useState<string | null>();
  const [deviceId, setDeviceId] = useState({});
  const [devices, setDevices] = useState([]);
  const videoConstraints = { video: true, facingMode: { exact: changeCamera } };
  const videoConstraintsForChrome = { video: true, deviceId: { exact: deviceId } }
  const audioConstraints = { noiseSuppression: true, echoCancellation: true };
  const [isReadyToUpload, setReadyToUpload] = useState(false);
  const [preview, setPreview] = useState<any>()
  const [videoURL, setVideoURL] = useState<string>();

  // @ts-ignore
  const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

  const handleDevices = useCallback(
    // @ts-ignore
    mediaDevices => setDevices(mediaDevices.filter(({ kind }) => kind === 'videoinput')),
    [setDevices]
  );

  const capture = useCallback(() => {
    if (webcamRef.current) {
      let screen = webcamRef.current.getScreenshot();
      setImage(screen);
      setReadyToUpload(true);
      setPreview(screen);
    }
  }, [webcamRef, setImage]);

  const handleStartCaptureClick = useCallback(() => {
    if (webcamRef.current) {
      let options = {};
      setCapturing(true);

      if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
        options = {
          mimeType: 'video/webm; codecs=vp9'
        };
        setVideoFormat('webm');
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        options = {
          mimeType: 'video/webm'
        };
        setVideoFormat('webm');
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        options = {
          mimeType: 'video/mp4',
          videoBitsPerSecond: 100000
        };
        setVideoFormat('mp4');
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


  const selectFileFromGallery = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setReadyToUpload(true);
      const url = URL.createObjectURL(e.target.files[0]);
      selectedMode === 'video' ? setVideoURL(url) : setPreview(url);
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
    if (!isChrome) {
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
    if (image == null) {
      return;
    }
    const type = 'image/png'
    // const data = new FormData();
    // data.append('file', image.toString())

    fetch('http://ec2-100-24-118-157.compute-1.amazonaws.com/api/upload?type=' + type, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: dataURItoBlob(image.toString(), () => {
      })
    })
      .then((res) => res.json())
      .then((data) => console.log(data))
      .catch((err) => console.error(err));
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
        setVideoURL(URL.createObjectURL(new Blob(recordedChunks, { type: videoFormat })))
      }
    },
    [recordedChunks]
  );

  return (
    <Wrapper>
      {!isReadyToUpload ?
        <WebcamWrapper>
          <Webcam audio={true}
                  muted={true}
                  ref={webcamRef}
            // @ts-ignore
                  videoConstraints={isChrome ? videoConstraintsForChrome : videoConstraints}
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
            <video key={videoURL} width="100%" controls>
              <source src={videoURL}/>
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
                className={devices.length <= 1 && isChrome ? 'disabled' : ''}
                disabled={devices.length <= 1 && isChrome}
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

function dataURItoBlob(dataURI: string, callback: any) {
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  var byteString = atob(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  // write the ArrayBuffer to a blob, and you're done
  var bb = new Blob([ab]);
  return bb;
}

export default CameraComponent;