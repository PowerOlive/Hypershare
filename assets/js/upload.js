// common variables
var iBytesUploaded = 0;
var iBytesTotal = 0;
var iPreviousBytesLoaded = 0;
var oTimer = 0;
var sResultFileSize = '';

function secondsToTime(secs) {
    var hr = Math.floor(secs / 3600);
    var min = Math.floor((secs - (hr * 3600)) / 60);
    var sec = Math.floor(secs - (hr * 3600) - (min * 60));

    if (hr < 10) {
        hr = "0" + hr;
    }
    if (min < 10) {
        min = "0" + min;
    }
    if (sec < 10) {
        sec = "0" + sec;
    }
    if (hr) {
        hr = "00";
    }
    return hr + ':' + min + ':' + sec;
};

function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Bytes';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};

function clearList() {
	var ul = document.getElementById("fileList");
    while (ul.hasChildNodes()) {
        ul.removeChild(ul.firstChild);
    }
}
function fieldChanged() {
    var input = document.getElementById("fileToUpload");
    var ul = document.getElementById("fileList");

	clearList();
    for (var i = 0; i < input.files.length; i++) {
        var li = document.createElement("li");
		var file = input.files.item(i); 

        var fileSize = 0;
        if (file.size > 1024 * 1024 * 1024)
            fileSize = (Math.round(file.size * 100 / (1024 * 1024 * 1024)) / 100).toString() + 'GB';
        else if (file.size > 1024 * 1024)
            fileSize = (Math.round(file.size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
        else
            fileSize = (Math.round(file.size * 100 / 1024) / 100).toString() + 'KB';

        li.innerHTML = "<strong>" + file.name + "</strong> (" + fileSize + ") " + "<i>" + file.type + "</i>";
        ul.appendChild(li);
    }

    if (!ul.hasChildNodes()) {
        var li = document.createElement("li");
        li.innerHTML = 'No Files Selected';
        ul.appendChild(li);
    }
}

function uploadFile() {
    iPreviousBytesLoaded = 0;

    var fd = new FormData();
    var fileCount = document.getElementById('fileToUpload').files.length;

    for (var x = 0; x < fileCount; x++) {
        fd.append("fileToUpload[]", document.getElementById('fileToUpload').files[x]);
    }

    var xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", uploadProgress, false);
    xhr.addEventListener("load", uploadFinish, false);
    xhr.addEventListener("error", uploadError, false);
    xhr.addEventListener("abort", uploadAbort, false);
    xhr.open("POST", "/");
    xhr.send(fd);

    // set inner timer
    oTimer = setInterval(doInnerUpdates, 300);
}

function doInnerUpdates() { // we will use this function to display upload speed
    var iCB = iBytesUploaded;
    var iDiff = iCB - iPreviousBytesLoaded;

    // if nothing new loaded - exit
    if (iDiff == 0)
        return;

    iPreviousBytesLoaded = iCB;
    iDiff = iDiff * 2;
    var iBytesRem = iBytesTotal - iPreviousBytesLoaded;
    var secondsRemaining = iBytesRem / iDiff;

    // update speed info
    var iSpeed = iDiff.toString() + 'B/s';
    if (iDiff > 1024 * 1024) {
        iSpeed = (Math.round(iDiff * 100 / (1024 * 1024)) / 100).toString() + 'MB/s';
    } else if (iDiff > 1024) {
        iSpeed = (Math.round(iDiff * 100 / 1024) / 100).toString() + 'KB/s';
    }

    document.getElementById('speed').innerHTML = iSpeed;
    document.getElementById('remaining').innerHTML = secondsToTime(secondsRemaining);
}

function uploadProgress(e) {
    if (e.lengthComputable) {
        iBytesUploaded = e.loaded;
        iBytesTotal = e.total;
        var iPercentComplete = Math.round(e.loaded * 100 / e.total);
        var iBytesTransfered = bytesToSize(iBytesUploaded);

        document.getElementById('progressNumber').innerHTML = iPercentComplete.toString() + '%';
        document.getElementById('b_transfered').innerHTML = iBytesTransfered;
    } else {
        document.getElementById('progress').innerHTML = 'unable to compute';
    }
}

function uploadFinish(e) {
	alert("Finished");
    var ul = document.getElementById("fileList");
    result = JSON.parse(e.target.responseText);

	clearList();
    for (i in result) {
		var li = document.createElement("li");
        li.innerHTML = '<a href="/assets/uploads/' + result[i].Hash + '" >' + result[i].Name + '</a> <i>Uploaded</i>';
        ul.appendChild(li);
    }

    document.getElementById('progressNumber').innerHTML = '100%';
    document.getElementById('remaining').innerHTML = '00:00:00';

    clearInterval(oTimer);
}

function uploadError(e) {
    alert("There was an error attempting to upload the file.");
    clearInterval(oTimer);
}

function uploadAbort(e) {
    alert("The upload has been canceled by the user or the browser dropped the connection.");
    clearInterval(oTimer);
}