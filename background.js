var currentTab;
var add_menu;
var find_menu;
var listenersInstalled = 0;
var serverConfig = {
    serverProtocol: "http",
    serverHost: "192.168.56.1",
    serverPort: 8080,
    basePath: "",
    advertService: "/adverts"
};
var sessionUsername = "admin";
var sessionPassword = "password";

function toggleExtension(){
    //check for local storage if extension is enabled for current site/url
    //when button is clicked
}

function calculateMd5(dataURL) {
    var dataURLByteString = atob(dataURL.split(',')[1]);
    var dataURLArrayBuffer = Uint8Array.from(dataURLByteString, ch => ch.charCodeAt(0)).buffer;
    var dataURLMd5 = md5.update(dataURLArrayBuffer);
    //FIXME: send byteString or base64?
    return {md5Index: dataURLMd5.toString(), imageData: dataURLByteString, original: dataURL};
}

function afterCrop(returnedDataURI) {
    alert("afterCrop returnedDataURI=" + returnedDataURI);

    //calculate md5
    // sendGetAnnotationRequest(calculateMd5(returnedDataURI)).then((response) => {
    //     alert("sendGetAnnotationRequest afterCrop response=" + response + "\n" + returnedDataURI);
    //     chrome.tabs.create({url: returnedDataURI}, function (tab) {
    //         //alert("tab=" + tab.id);
    //     });
    // });

    sendAddAnnotationRequest(returnedDataURI).then((response) => {
        alert("sendGetAnnotationRequest\nafterCrop "
            + "returnedDataURI.md5Index=" + returnedDataURI.md5Index
            //+ "returnedDataURI.original.length=" + returnedDataURI.original.length
            + "response.md5Index=" + response.md5Index
            + "response.original.length=" + response.original.length
            + "\n" + response.original);
        chrome.tabs.create({url: response.original}, function (tab) {
            //alert("tab=" + tab.id);
        });
    });
}

function getImgDataUri() {
    //alert("getImgDataUri");
    return new Promise(
        (resolve, reject) => {
            chrome.tabs.captureVisibleTab(null, {format: "png"}, function (dataURI) {
                if (dataURI != undefined) {
                    resolve(dataURI);
                } else {
                    reject("error during captureVisibleTab");
                }
            });
        }
    );
}

chrome.browserAction.onClicked.addListener(function (tab) {

    var extra = "";
    if (tab != undefined) {
        extra = "tab.id=" + tab.id;
    }
    if (chrome.tabs != undefined) {
        extra = extra + " captureVisibleTab=" + chrome.tabs.captureVisibleTab + " " + " tabs.query=" + chrome.tabs.query;
    }

    //alert("browserAction onClicked chrome.tabs=" + chrome.tabs + " " + extra);

    //mainBrowserAction(tab, {clientX: 100, clientY: 100});
});

// chrome.commands.onCommand.addListener(function (command) {
//     if (command == "add_comment") {
//         // Get the currently selected tab
//         chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
//             // Toggle the pinned status
//             var current = tabs[0];
//
//         });
//     }
// });

function sendGenericRequest(method, methodArgs, headersArray) {
    return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();

        }
    );
}

function handleEvent(e) {
    //log.textContent = log.textContent + `${e.type}: ${e.loaded} bytes transferred\n`;
    console.log("handleEvent arguments.length=" + arguments.length + " e=" + e);
}

function addListeners(xhr) {
    xhr.addEventListener('loadstart', handleEvent);
    xhr.addEventListener('load', handleEvent);
    xhr.addEventListener('loadend', handleEvent);
    xhr.addEventListener('progress', handleEvent);
    xhr.addEventListener('error', handleEvent);
    xhr.addEventListener('abort', handleEvent);
}

//FIXME: IM SO ASHAMED OF MY CODE I MIGHT AS WELL WALK AROUND WITH NO PANTS
function sendAddAnnotationRequest(advertObject) {
    return new Promise((resolve, reject) => {
            alert("sendAddAnnotationRequest"
                + " advertObject.md5Index=" + advertObject.md5Index
                //+ " advertObject.imageData=" + advertObject.imageData
            );
            let localadvertObj = {md5Index: advertObject.md5Index, imageData: advertObject.imageData};
            let xhr = new XMLHttpRequest();
            var url = serverConfig.serverProtocol + "://" + serverConfig.serverHost + ":" + serverConfig.serverPort
                + serverConfig.advertService;
            var result;
            xhr.onreadystatechange = function () { // Call a function when the state changes.
                alert("this.readyState=" + xhr.readyState + " xhr.status=" + xhr.status);
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                    // Request finished. Do processing here.
                    resolve({
                        returnedObj: xhr.response,
                        original: advertObject.original,
                        md5Index: localadvertObj.md5Index
                    });
                }
                if (xhr.status === 401) {
                    // Request finished. Do processing here.
                    alert("handle 401");
                    reject(xhr.response);
                }
            };

            addListeners(xhr);
            xhr.open("POST", url, true, sessionUsername, sessionPassword);
            //add headers
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("Authorization", "Basic " + btoa(sessionUsername + ":" + sessionPassword));
            xhr.withCredentials = true;
            xhr.send(JSON.stringify(localadvertObj));
        }
    );
}

function sendGetAnnotationRequest(advertObject) {
    return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            var url = serverConfig.serverProtocol + "://" + serverConfig.serverHost + ":" + serverConfig.serverPort
                + serverConfig.advertService;
            //+ "/" + advertObject.indexMd5;

            var result;
            xhr.onreadystatechange = function () { // Call a function when the state changes.
                alert("sendGetAnnotationRequest this.readyState=" + xhr.readyState + " xhr.status=" + xhr.status);
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                    // Request finished. Do processing here.
                    resolve(xhr.response);
                }
                if (xhr.status === 401) {
                    // Request finished. Do processing here.
                    alert("handle 401");
                    reject(xhr.response);
                }
            };
            addListeners(xhr);
            xhr.open("GET", url, true, sessionUsername, sessionPassword);
            //add headers
            xhr.setRequestHeader("Authorization", "Basic " + btoa(sessionUsername + ":" + sessionPassword));
            xhr.withCredentials = true;
            xhr.responseType = "json";
            xhr.send(JSON.stringify(advertObject));
        }
    );
}

function mainBrowserAction(tab, rightClick) {
    getImgDataUri().then((originalImageDataURI) => {
        //get actual rect
        //var rect = {top: 20, left: 20, width: 100, height: 120};
        // alert("mainBrowserAction " + rightClick.pageX + " " + rightClick.pageY + " " + rightClick.clientX + " " + rightClick.clientY);
        // var rect = {
        //     top: rightClick.clientY - 50,
        //     left: rightClick.clientX - 50, width: 100, height: 100
        // };
        var extra = "";
        if (rightClick != undefined) {
            extra = "rightClick.id=" + rightClick.id + " rightClick.tagName=" + rightClick.tagName;
            if (rightClick.rect != undefined) {
                extra +=
                    " rightClick.rect.top=" + rightClick.rect.top
                    + " rightClick.rect.left=" + rightClick.rect.left
                    + " rightClick.rect.width=" + rightClick.rect.width
                    + " rightClick.rect.height=" + rightClick.rect.height
                    + " rightClick.rect.offsetTop=" + rightClick.rect.offsetTop;

            }
        }
        //alert("mainBrowserAction rightClick=" + rightClick + " " + extra);
        var rect = rightClick.rect;
        chrome.tabs.sendMessage(tab.id,
            {text: 'crop_image', originalDataURI: originalImageDataURI, cropRectangle: rect},
            afterCrop)
    });
}

function addCommentForAd(pointClicked) {
    var extra = "";
    chrome.tabs.sendMessage(window.currentTab.id,
        {
            text: 'get_rightclick'
        },
        (obj) => {
            var extra = "";
            if (obj != undefined) {
                if (obj.rect != undefined) {
                    extra += "window.hoveredElement.rect.top=" + obj.rect.top
                        + " window.hoveredElement.rect.left=" + obj.rect.left
                        + " window.hoveredElement.rect.width=" + obj.rect.width
                        + " window.hoveredElement.rect.height=" + obj.rect.height
                        + " window.hoveredElement.rect.offsetTop=" + obj.rect.offsetTop;
                }
            }
            //alert("addCommentForAd get_obj.rightClick callback " + extra);

            mainBrowserAction(window.currentTab, obj);
        });
}

function findCommentsForAd() {
    return new Promise((resolve, reject) => {
        //alert("findCommentsForAd");
        var result = 1;
        if (result) {
            resolve(result);
        } else {
            reject("error occured");
        }
    });
}

function initializeContextMenus() {
    var contextActions = [
        {title: "", type: "separator"},
        {title: "FTI Poc", type: "normal"},
        //dont think this works
        {title: "Add comments for this advert", type: "normal", onclick: addCommentForAd},
        {title: "Find comments for this advert", type: "normal", onclick: findCommentsForAd}];

    //chrome.contextMenus.create(contextActions[0]);
    //var parent = chrome.contextMenus.create(contextActions[1]);
    add_menu = chrome.contextMenus.create(
        {title: "Add comments for this advert", type: "normal", contexts: ["all"], onclick: addCommentForAd});
    find_menu = chrome.contextMenus.create(
        {title: "Find comments for this advert", type: "normal", contexts: ["all"], onclick: findCommentsForAd});
    //alert("add_menu=" + add_menu + " find_menu =" + find_menu);
}

function globalContextMenuListener(info, tab) {
    //alert("globalContextMenuListener " + info + " " + tab + " add_menu=" + add_menu + " find_menu=" + find_menu);
    if (info != undefined) {
        // alert(
        //     " menuItemid=" + info.menuItemId
        //     + " mediaType=" + info.mediaType
        //     + " linkUrl=" + info.linkUrl
        //     + " srcUrl=" + info.srcUrl
        //     + " frameUrl=" + info.frameUrl
        //     + " frameId=" + info.frameId
        // );
    }
    if (tab != undefined) {
//        alert("tab.id=" + tab.id);
    }
}

chrome.runtime.onInstalled.addListener(function () {
    initializeContextMenus();
    chrome.contextMenus.onClicked.addListener(globalContextMenuListener);
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
    window.currentTab = {id: activeInfo.tabId};
    // alert("window.listenersInstalled=" + window.listenersInstalled + " activeInfo.tabId="
    //     + activeInfo.tabId + " window.currentTab.id=" + window.currentTab.id);
    if (window.listenersInstalled != activeInfo.tabId) {
        chrome.tabs.sendMessage(activeInfo.tabId,
            {
                text: 'install_listeners'
            },
            (x) => {
                //alert("sendMessage callback " + x);
            });
        chrome.tabs.sendMessage(window.listenersInstalled,
            {
                text: 'uninstall_listeners'
            },
            (x) => {
                //alert("uninstall sendMessage callback " + x);
            });
        window.listenersInstalled = activeInfo.tabId;
        //
    }
});
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    // alert("window.listenersInstalled=" + window.listenersInstalled + " tabId=" + tabId
    //     + " changeInfo.url=" + changeInfo.url
    //     + " window.currentTab.id=" + window.currentTab.id);
    //if (window.listenersInstalled != activeInfo.tabId) {
    chrome.tabs.sendMessage(tabId,
        {
            text: 'install_listeners'
        },
        (x) => {
            //alert("sendMessage callback " + x);


        });
    // chrome.tabs.sendMessage(window.listenersInstalled,
    //     {
    //         text: 'uninstall_listeners'
    //     },
    //     (x) => {
    //         alert("uninstall sendMessage callback " + x );
    //     });
    // window.listenersInstalled = activeInfo.tabId;
    //
    //}
});
