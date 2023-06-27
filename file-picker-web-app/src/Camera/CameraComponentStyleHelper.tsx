import styled from 'styled-components';
import makePhoto from './makePhoto.svg';
import cameraRear from './camera-rear.svg';
import upload from './uploadFile.svg';
import close from './close.svg';
import next from './next.svg';

export const Wrapper = styled.div`
  position: fixed;
  width: 100%;
  height: 100%;
  z-index: 1;
  background: #000000;
`;

export const Control = styled.div`
  position: fixed;
  display: flex;
  right: 0;
  width: 20%;
  min-width: 130px;
  min-height: 130px;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  z-index: 10;
  align-items: center;
  justify-content: center;
  padding: 50px;
  box-sizing: border-box;
  flex-direction: column-reverse;

  @media (max-aspect-ratio: 1/1) {
    flex-direction: row;
    bottom: 0;
    width: 100%;
    height: 20%;
  }

  @media (max-width: 400px) {
    padding: 10px;
  }
`;

export const Button = styled.button`
  outline: none;
  color: white;
  opacity: 1;
  background-position-x: 0;
  background-position-y: 0;
  padding: 0;
  text-shadow: 0 0 4px black;
  background: transparent none no-repeat center center;
  pointer-events: auto;
  cursor: pointer;
  z-index: 2;
  border: none;
`;

export const TakePhotoButton = styled(Button)`
  background-size: 50px;
  background: url(${makePhoto}) no-repeat center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 15%;

`;

export const ChangeFacingCameraButton = styled(Button)`
  background-size: 50px;
  background: url(${cameraRear}) no-repeat center;
  width: 20px;
  height: 20px;
  padding: 25px;

  @media (max-width: 400px) {
    background-size: cover;
    padding: 20px;
    margin: 0 20px;
  }
`;

export const UploadFile = styled.label`
  width: 0;
  height: 0;
  display: block;
  background: url(${upload}) no-repeat center;
  background-size: cover;
  padding: 25px;
  outline: none;

  @media (max-width: 400px) {
    background-size: cover;
    padding: 20px;
    margin: 0 20px;
  }
`;

export const CameraMode = styled.div`
  width: 100%;
  height: 30%;
  z-index: 10;
  position: fixed;
  right: 0;
  color: white;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  background: rgba(0, 0, 0, 0.3);
  box-sizing: border-box;

  @media (max-aspect-ratio: 1/1) {
    flex-direction: row;
    bottom: 20%;
    width: 100%;
    height: 5%;
  }
`;

export const CameraModeButton = styled.div`
  padding: 10px;
  width: 15%;
`;

export const WebcamWrapper = styled.div`
  height: 75%;
  display: flex;
  align-content: space-between;
`;

export const Preview = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 75%;
`;

export const UploadControl = styled.div`
  width: 100%;
  height: 30%;
  z-index: 10;
  position: fixed;
  right: 0;
  color: white;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  justify-content: space-between;
  text-align: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
  padding: 0 5%;

  @media (max-aspect-ratio: 1/1) {
    flex-direction: row;
    bottom: 0;
    width: 100%;
    height: 25%;
  }
`;

export const UploadControlButton = styled(Button)`
  width: 70px;
  height: 70px;
`;

export const CloseButton = styled(UploadControlButton)`
  background: url(${close}) no-repeat center;
  background-size: 100%;
`;

export const UploadButton = styled(UploadControlButton)`
  background: url(${next}) no-repeat center;
  background-size: 100%;

`;

