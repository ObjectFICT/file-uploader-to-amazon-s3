const get = (el) => document.getElementById(el);

const progressHandler = (event) => {
  const percent = (event.loaded / event.total) * 100;

  get("uploadedFileSize").innerHTML = "Uploaded " + event.loaded + " bytes of " + event.total;
  get("progressBar").value = Math.round(percent);
  get("status").innerHTML = Math.round(percent) + "% uploaded... please wait";

  if (Math.round(percent) === 100) {
    get("status").innerHTML = "Successfully uploaded!";
    get("uploadedFileSize").innerHTML = "Uploaded " + event.total + " bytes!";
  }
}

const completeHandler = (event) => {
  get("progressBar").value = 0;
}

const errorHandler = (event) => {
  console.log("handle error")
  get("status").innerHTML = "Upload Failed";
}

const abortHandler = (event) => {
  get("status").innerHTML = "Upload Aborted";
}

const selectFileHandler = () => {
  get("progressBar").value = 0;
  get("status").innerHTML = null;
  get("uploadedFileSize").innerHTML = null;
}

const uploadFile = () => {
  const host = window.location.protocol + "//" + window.location.host;
  const file = get("uploadedFile").files[0];
  const formData = new FormData();
  const ajax = new XMLHttpRequest();

  formData.append("file", file);

  ajax.upload.addEventListener("progress", progressHandler, false);
  ajax.addEventListener("load", completeHandler, false);
  ajax.addEventListener("error", errorHandler, false);
  ajax.addEventListener("abort", abortHandler, false);
  ajax.open("POST", host + "/api/upload");
  ajax.send(formData);

  ajax.onreadystatechange = function () {
    if (this.readyState === 4) {
      get("response").innerHTML = this.responseText;
      console.log(this.responseText)
    }
  }

}