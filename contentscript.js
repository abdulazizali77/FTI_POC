var rightClick;
var leftClick;
var hoveredElement;

function getElementBoundingBox(key) {
    //should this be in a Promise?
    var elems = document.getElementsByTagName("IFRAME");
    var advertIframe = elems[0];
    var rect = advertIframe.getBoundingClientRect();
    return rect;
};

function cropImageDataURI(originalDataURI, cropRectangle) {
    return new Promise(function (resolve, reject) {
        var originalImage = new Image();
        originalImage.src = originalDataURI;
        originalImage.decode()
        //is this possible to pass this rectangle?
            .then(() => {
                    let canvas = document.createElement("CANVAS");
                    canvas.width = cropRectangle.width;
                    canvas.height = cropRectangle.height;
                    var canvasCtx = canvas.getContext("2d", {alpha: false});
                    canvasCtx.drawImage(originalImage,
                        cropRectangle.left, cropRectangle.top, cropRectangle.width, cropRectangle.height,
                        0, 0, cropRectangle.width, cropRectangle.height);
                    window.croppedDataURL = canvas.toDataURL();
                    console.log("crop=" + window.croppedDataURL);
                    //alert("crop="+window.croppedDataURL);
                    resolve(window.croppedDataURL);
                }
            )
            .catch(() => {
                reject("decoding problem");
            });
    });
}

function dataURItoBlob(dataURI) {
    var byteStr;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteStr = atob(dataURI.split(',')[1]);
    else
        byteStr = unescape(dataURI.split(',')[1]);

    var mimeStr = dataURI.split(',')[0].split(':')[1].split(';')[0];

    var arr = new Uint8Array(byteStr.length);
    for (var i = 0; i < byteStr.length; i++) {
        arr[i] = byteStr.charCodeAt(i);
    }

    return new Blob([arr], {type: mimeStr});

}

function contextMenuListener(e) {
    var extra = "";
    if (e != undefined) {
        extra = " pageX=" + e.pageX + " pageY=" + e.pageY + " clientX=" + e.clientX + " clientY=" + e.clientY;
        window.rightClick = {pageX: e.pageX, pageY: e.pageY, clientX: e.clientX, clientY: e.clientY};
    } else {
        alert("event undefined!");
    }

    alert("contextMenuListener e=" + e + " " + extra);

}

function clickListener(e) {
    var extra = "";
    if (e != undefined) {
        extra = "clientX=" + e.clientX + " clientY=" + e.clientY + " pageX=" + e.pageX + " pageY=" + e.pageY;
        window.leftClick = e;
    } else {
        alert("event undefined!");
    }
    //alert("clickListener e=" + e + " " + extra);
}

function mouseOver(e) {
    var elems = document.querySelectorAll("iframe:hover");
    var extra = "";
    var rect;
    if (elems != undefined) {
        extra = "elems.length=" + elems.length + "\n";
        if (elems.length != undefined) {
            for (i = 0; i < elems.length; ++i) {
                rect = elems[i].getBoundingClientRect();
                extra += "tagName=" + elems[i].tagName + " id=" + elems[i].id
                    + " rect.width=" + rect.width + " rect.height=" + rect.height + " rect.top=" + rect.top + " rect.left=" + rect.left + " \n";
            }
        }
    }
    window.hoveredElement = {
        id: elems[0].id,
        name: elems[0].name,
        tagName: elems[0].tagName,
        rect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
        }
    };
    /*
    alert(arguments.length
        + " hoveredElement.id=" + hoveredElement.id,
        +" hoveredElement.name=" + hoveredElement.name,
        +" hoveredElement.tagName=" + hoveredElement.tagName,
        +" hoveredElement.rect.top=" + hoveredElement.rect.top
        + " hoveredElement.rect.left=" + hoveredElement.rect.left
        + " pageX=" + e.pageX + " pageY=" + e.pageY + " " + extra);
        */
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.text === 'get_element_bounding_rectangle') {
        sendResponse(getElementBoundingBox());
    }
    if (msg.text === 'crop_image') {
        //alert("chrome.runtime=" + chrome.runtime + " chrome.extension=" + chrome.extension);
        cropImageDataURI(msg.originalDataURI, msg.cropRectangle).then((returnedDataURI) => {
            //alert("sendResponse=" + sendResponse + " returnedDataURI=" + returnedDataURI);
            sendResponse(returnedDataURI);
        });
    }
    if (msg.text === 'install_listeners') {
        //alert("install_listeners " + document + " " + document.body);
        //document.oncontextmenu = contextMenuListener;
        //document.onclick = clickListener;

        try {
            var elems = document.getElementsByTagName("IFRAME");
            var i;
            for (i = 0; i < elems.length; ++i) {
                //alert("elems[" + i + "].tagName" + elems[i].tagName + " id" + elems[i].id + " url=" + elems[i].url);
                elems[i].onmouseover = mouseOver;
            }
        } catch (error) {
            alert(error);
            console.log(error);
        }

        sendResponse(document);
    }
    if (msg.text === 'uninstall_listeners') {
        //alert("uninstall_listeners");
        sendResponse(document);
    }
    if (msg.text === 'get_rightclick') {
        //alert("get_rightclick " + window.rightClick.pageX + " " + window.rightClick.pageY + " " + window.rightClick.clientX + " " + window.rightClick.clientY);
        var extra = "";
        if (window.hoveredElement != undefined) {
            if (window.hoveredElement.rect != undefined) {
                extra += "window.hoveredElement.rect.top=" + window.hoveredElement.rect.top
                    + " window.hoveredElement.rect.left=" + window.hoveredElement.rect.left
                    + " window.hoveredElement.rect.width=" + window.hoveredElement.rect.width
                    + " window.hoveredElement.rect.height=" + window.hoveredElement.rect.height;
            }
        }
        //alert("get_rightclick window.hoveredElement=" + window.hoveredElement + " \n" + extra);
        sendResponse(window.hoveredElement);//WTF
    }
    return true;
});