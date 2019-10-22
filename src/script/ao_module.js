/*
ArOZ Online Module API wrapper

This script is used for wrapping all the API that can be called by the ArOZ Online Module under VDI mode.
For faster development, please include this script into your module and call through this script.
Or otherwise, you can call directly to the ArOZ Online System via GET / POST request. 

<!> Warning! This script require jQuery to work. 
Although some functions might not require jquery, it is still recommended. You can include the jquery file from
AOR/script/jquery.min.js

Toby Chui @ IMUS Laboratory, All Right Reserved
*/

//Check if current module is called in Virtal Desktop Mode
var ao_module_virtualDesktop = !(!parent.isFunctionBar);

//Get the current windowID if in Virtual Desktop Mode, return false if VDI is not detected
var ao_module_windowID = false;
var ao_module_parentID = false;
var ao_module_callback = false;
if (ao_module_virtualDesktop)ao_module_windowID = $(window.frameElement).parent().attr("id");
if (ao_module_virtualDesktop)ao_module_parentID = $(window.frameElement).parent().find(".floatWindow").attr("puid");
if (ao_module_virtualDesktop)ao_module_callback = $(window.frameElement).parent().find(".floatWindow").attr("callback");
if (ao_module_virtualDesktop)ao_module_parentURL = $(window.frameElement).parent().find("iframe").attr("src");

//Set the current FloatWindow with specified icon
function ao_module_setWindowIcon(icon){
	if (ao_module_virtualDesktop){
		parent.setWindowIcon(ao_module_windowID + "",icon);
		return true;
	}
	return false;
}

//Set the current FloatWindow with specified title tag
function ao_module_setWindowTitle(title){
	if (ao_module_virtualDesktop){
		parent.changeWindowTitle(ao_module_windowID + "",title);
		return true;
	}
	return false;
}

//Set the current FloatWindow to GlassEffect Window (Cannot switch back to origianl mode)
function ao_module_setGlassEffectMode(){
	if (ao_module_virtualDesktop){
		parent.setGlassEffectMode(ao_module_windowID + "");
		return true;
	}
	return false;
}

//Set the current FloatWindow to Fixed Size Window (Non-resizable), default Resizable
function ao_module_setFixedWindowSize(){
	if (ao_module_virtualDesktop){
		parent.setWindowFixedSize(ao_module_windowID + "");
		return true;
	}
	return false;
}

//Set the current FloatWindow size (width, height)
//Cache: Should the function bar system cache the window size of this window so that the white preload window will not be shown
//Exact: Should the url be exact (including .php?...) or be not exact (Only remember url till .php script filename)
function ao_module_setWindowSize(w,h,cache=false,exact=false){
	if (ao_module_virtualDesktop){
		parent.setWindowPreferdSize(ao_module_windowID + "",w,h);
		if (cache){
			//Cache the window size for this base url and the white window will not be shown next time.
			parent.cacheWindowSize(ao_module_parentURL,w,h,exact);
		}
		return true;
	}
	return false;
}

//Close the current window
function ao_module_close(){
	if (ao_module_virtualDesktop){
		parent.closeWindow(ao_module_windowID);
		return true;
	}
	return false;
}

//Get the windows that is running the given module name and return an id list for floatWindow
function ao_module_getProcessID(modulename){
	if (ao_module_virtualDesktop){
		return parent.getWindowFromModule(modulename);
	}
	return false;
}

//Hide all control element of this float window.
function ao_module_hideAllControls(){
    if (ao_module_virtualDesktop){
        parent.hideAllControlElements(ao_module_windowID);
		return true;
	}
	return false;
}

//Crashed
function ao_module_declareCrash(crashmsg){
	return false;
}

//Open file selector 
/**
 * File Explorer powered by ArOZ Online File System
 * To pop up a file selector and return an object of files, you can call the following function with the given variable.
 * Usage: ao_module_openFileSelector({uid},{call back function name in String},{window Width},{windowHeight},{allowMultipleFiles},{selectMode});
 * For example, this is a function which FFmpeg Factory calls to the file selector
 * 
 * var uid = ao_module_utils.getRandomUID();
 * ao_module_openFileSelector(uid,"addFileFromSelector",undefined,undefined,true);
 * 
 * This will allow the file selector get files (as selectMode default value is "file") and allow multiple selections
 * The selectMode option provide modes for file / folder / mix, where mix means user can select both files and folders
 * The allowMultiple means if the user can select multiple files. True for allow and false for disallow multi selections.
 *
 * To catch the callback of the selector, you can put the following script into your callBack function (In this case, 'addFileFromSelector')
 * 
 * function addFileFromSelector(fileData){
 *  result = JSON.parse(fileData);
 *   for (var i=0; i < result.length; i++){
 *    var filename = result[i].filename;
 *    var filepath = result[i].filepath;
 *    //DO SOMETHING HERE
 *   }
 *  }
 * 
 * REMINDER
 * If you call this function in default mode, please use the "ao_module_openFileSelectorTab" and pass in the relative location of AOR (Root of ArOZ) as the first variable.
 * You will also need to handle the listen of change in the uid in localStorage for cross tab communication
 **/
 
function ao_module_openFileSelector(uid,callBackFunctionName, windowWidth = 1080, windowHeight = 645, allowMultiple = false, selectMode = "file"){
    //selectMode: file / folder / mix
    //allowMultiple: true / false
    if (allowMultiple){
        allowMultiple = "true";
    }else{
        allowMultiple = "false";
    }
    if (ao_module_virtualDesktop){
        //Launch inside VDI
        ao_module_newfw("SystemAOB/functions/file_system/fileSelector.php?allowMultiple=" + allowMultiple + "&selectMode=" + selectMode,"Starting file selector","spinner",uid,windowWidth,windowHeight,ao_module_getLeft() + 30,ao_module_getTop() + 30,undefined,undefined,ao_module_windowID,callBackFunctionName);
        return true;
    }else{
        return false;
    }
    
}

//Request file selection OUTSIDE OF VDI MODE (REQUIRE localStorage)
/**
This function can be used to call the file selector in non-VDI mode.
The following example shows the method of calling, similar to that in VDI mode.
Assume we have a module at AOR/Dummy/index.php, the script running in that module has an aor = ../

var uid = ao_module_utils.getRandomUID();
ao_module_openFileSelectorTab(uid,"../",true,"file",fileProcesser);

//fileProcessor will catch the file selection

function fileProcesser(fileData){
	result = JSON.parse(fileData);
		for (var i=0; i < result.length; i++){
		var filename = result[i].filename;
		var filepath = result[i].filepath;
		//DO SOMETHING HERE
   }
}

**/
var ao_module_fileSelectorCallBack,ao_module_fileSelectorWindowObject,ao_module_fileSelectorReplyObject,ao_module_fileSelectorFileAwait;
function ao_module_openFileSelectorTab(uid, aor,allowMultiple = false, selectMode = "file",callBack=console.log){
    //selectMode: file / folder / mix
    //allowMultiple: true / false
    if (allowMultiple){
        allowMultiple = "true";
    }else{
        allowMultiple = "false";
    }
    if (aor.slice(-1) != "/"){
        aor = aor + "/";
    }
	ao_module_fileSelectorReplyObject = uid;
	ao_module_fileSelectorCallBack = callBack;
    var windowObject = window.open(aor + "/SystemAOB/functions/file_system/fileSelector.php?allowMultiple=" + allowMultiple + "&selectMode=" + selectMode + "&puid=" + uid);
	ao_module_fileSelectorWindowObject = windowObject;
	ao_module_fileSelectorFileAwait = setInterval(ao_module_listenFileSelectionInput,5000);
    return windowObject;
}

//Cross-tab File Selector Listener for File Selector Callback purpose. This is not a usable function. Do not touch this function.
function ao_module_listenFileSelectionInput(){
	var ao_module_fileSelectorReturnedFiles = ao_module_readTmp(ao_module_fileSelectorReplyObject);
	if (ao_module_fileSelectorReturnedFiles == false && ao_module_fileSelectorReturnedFiles.length === undefined){

	}else{
		//File found! Closing all selection windows and load the files
		clearInterval(ao_module_fileSelectorFileAwait);
		if (ao_module_fileSelectorReturnedFiles.length == 0){
			//Cancel selection
			ao_module_fileSelectorCallBack(JSON.stringify([]));
		}else{
			ao_module_fileSelectorWindowObject.close();
			ao_module_removeTmp(ao_module_fileSelectorReplyObject);
			ao_module_fileSelectorReplyObject = undefined;
			ao_module_fileSelectorCallBack(JSON.stringify(ao_module_fileSelectorReturnedFiles));
		}
	}
}
//Open an ArOZ Online Path with the given targetPath from ArOZ Online Root
/**
For example, if you want to open the folder: 
"AOR/Audio/uploads/"
Then you can call this function as follow:
ao_module_openPath("Audio/uploads");
**/
function ao_module_openPath(targetPath, windowWidth = 1080, windowHeight = 580,posx = undefined,posy = undefined,resizable = true,glassEffect = true){
	if (ao_module_virtualDesktop){
	    var uid = Date.now();
		parent.newEmbededWindow("SystemAOB/functions/file_system/index.php?controlLv=2&subdir=" + targetPath, "Loading", "folder open outline",uid,windowWidth,windowHeight,posx,posy,resizable,glassEffect);
		return uid;
	}
	return false;
}

//Open an ArOZ Online File with the given targetPath and filename (display name) from ArOZ Online Root
/**
For example, if you want to open the file: 
"AOR/Desktop/files/admin/helloworld.txt"
Then you can call this function as follow:

ao_module_openFile("Desktop/files/admin/helloworld.txt","helloworld.txt");

The targetpath can be something different from the filename (display name). For example, an encoded file with path:
"Desktop/files/TC/inithe38090e5b08fe9878ee5b48ee4babae38091546f75686f754d4144202d20546f75686f752026204e69746f72692047657420446f776e2120282b6c797269632920e380904844e38091205b373230705d.mp4"
can be opened with filename 
"【小野崎人】TouhouMAD - Touhou %26 Nitori Get Down! (+lyric) 【HD】 [720p].mp4" with the following command:

ao_module_openFile("Desktop/files/TC/inithe38090e5b08fe9878ee5b48ee4babae38091546f75686f754d4144202d20546f75686f752026204e69746f72692047657420446f776e2120282b6c797269632920e380904844e38091205b373230705d.mp4","【小野崎人】TouhouMAD - Touhou %26 Nitori Get Down! (+lyric) 【HD】 [720p].mp4");

**/
function ao_module_openFile(targetPath,filename){
	if (ao_module_virtualDesktop){
		parent.newEmbededWindow("SystemAOB/functions/file_system/index.php?controlLv=2&mode=file&dir=" + targetPath + "&filename=" + filename, filename, "file outline","fileOpenMiddleWare",0,0,-10,-10);
		return true;
	}
	return false;
}


//Open a FloatWindow
/**
Example 1: opening the Memo index with the following code:
ao_module_newfw('Memo/index.php','Memo','sticky note outline','memoEmbedded',475,700);

Example 2: opening the Memo index with minimal parameter:
ao_module_newfw('Memo/index.php','Memo','sticky note outline','memoEmbedded');

Example 3: opening a sub-module and tell the sub-module the parent's window id that is not yourself:
ao_module_newfw('Memo/index.php','Memo','sticky note outline','memoEmbedded',undefined,undefined,undefined,undefined,undefined,undefined,"someoneElseUID");

Example 4: opening a sub-module and ask for a callback: (Default parentUID is set to this module's WindowID and hence, the call back will be called to this content window)
ao_module_newfw('Memo/index.php','Memo','sticky note outline','memoEmbedded',undefined,undefined,undefined,undefined,undefined,undefined,undefined,"callBackFunctionName");

Reminder:
- If you open multiple windows with the same UID, the previous one will be overwritten and reload to the latest page.
- windowname parameter must not contain chars that cannot be put inside an id field (e.g. "&", "." etc)
- For a list of icons, please reference https://tocas-ui.com/elements/icon/
**/
function ao_module_newfw(src,windowname,icon,uid,sizex = undefined,sizey = undefined,posx = undefined,posy = undefined,fixsize = undefined,glassEffect = undefined,parentUID=null, callbackFunct=null){
	if (parentUID === null){
		parentUID = ao_module_windowID;
	}
	if (ao_module_virtualDesktop){
		parent.newEmbededWindow(src,windowname,icon,uid,sizex,sizey,posx,posy,fixsize,glassEffect,parentUID,callbackFunct);
		return true;
	}
	return false;
}

//Launch a module using FloatWindow.php
//Pass in the module folder name as the input. Example: ao_module_launchModule("Audio");
//Please make sure the module support legacy FloatWindow.php launch method before calling.
function ao_module_launchModule(moduleName){
    if (ao_module_virtualDesktop){
        parent.LaunchFloatWindowFromModule(moduleName,true);
        return true;
    }else{
        return false;
    }
}

//Request fullscreen access from VDI module
function ao_module_fullScreen(){
	if (ao_module_virtualDesktop){
		parent.openFullscreen();
		return true;
	}
	return false;
}

//Get the basic information of the floatWindows (including the width, height, left and top value)
function ao_module_getWidth(){
	if (ao_module_virtualDesktop){
		return parent.document.getElementById(ao_module_windowID).offsetWidth;
	}else{
		return -1;
	}
}

function ao_module_getHeight(){
	if (ao_module_virtualDesktop){
		return parent.document.getElementById(ao_module_windowID).offsetHeight;
	}else{
		return -1;
	}
	
}

function ao_module_getLeft(){
	if (ao_module_virtualDesktop){
		return parent.document.getElementById(ao_module_windowID).getBoundingClientRect().left;
	}else{
		return -1;
	}
	
}

function ao_module_getTop(){
	if (ao_module_virtualDesktop){
		return parent.document.getElementById(ao_module_windowID).getBoundingClientRect().top;
	}else{
		return -1;
	}
}

//Showing msgbox at the notification side bar
/**
For example, the most basic use of this command will be: 
ao_module_msgbox("This is a demo message from the aroz online module.","Hello World");

You can add more object to the message including HTML tags in msg and title, and redirection path for opening the target etc.
If auto close = false, the side bar will not get hidden after 4 seconds.
**/
function ao_module_msgbox(warningMsg,title="",redirectpath="",autoclose=true){
	if (ao_module_virtualDesktop){
		parent.msgbox(warningMsg,title,redirectpath,autoclose);
		return true;
	}
	return false;
}

//Focus this floatWindow and bring it to the front
/**
This function bring the current floatWindow content to the front of all FloatWindows.
Please use this only in urgent / warning information. This might bring interuption to user's operation and making them unhappy :(
**/
function ao_module_focus(){
    if (ao_module_virtualDesktop){
	    parent.focusFloatWindow(ao_module_windowID);
	    return true;
    }else{
        return false;
    }
}


//Return the object in which the main interface iframe (The most backgound iframe. Mostly Desktop when you are using VDI mode. But you can change it if required).
function ao_module_callToInterface(){
	return parent.callToInterface();
}

//Cross iFrame communication pipeline
/**
This function can send data to parent callback function if necessary.
Data has to be an data object 
Given the following condition
parentID: test
callback: setBackgroundColor
with a function named setBackgroundColor(data) in the parent window (iframe)

Then you can use the following example to send data to the parent frame
Example: ao_module_parentCallback({color:"white"});

The returned value will be the data object in stringify JSON.
To get the original value of the data received by another window:

function setBackgroundColor(data){
	object = (JSON.parse(data));
	console.log(object.color);
}

Console output:
>>white

**/
function ao_module_parentCallback(data){
	if (ao_module_virtualDesktop && ao_module_parentID !== undefined && ao_module_callback !== undefined){
		data = JSON.stringify(data);
		var ao_module_parentTarget = parent.getWindowObjectFromID(ao_module_parentID);
		if (ao_module_parentTarget !== null){
			ao_module_parentTarget.eval(ao_module_callback + "('" + data + "')");
			return true;
		}else{
			return false;
		}
	}else{
	    return false;
	}
}


/**
REMINDER
When your module require save and loading data from localStorage, we recommend using the naming method as follow.
[ModuleName]_[Username]_[Properties].
For example, you are developing a new "MusicMixer" Module and want to store the "songList" properties for user "Admin". Then the recommended localStorage syntax will be:
MusicMixer_Admin_songList
Example:
ao_module_getStorage("MusicMixer","Admin","songList");
ao_module_saveStorage("MusicMixer","Admin","songList","{some JSON string here}");
**/
//Load something from localStorage with given tag
function ao_module_getStorage(moduleName,itemname){
    moduleName = moduleName.split("_").join("-");
    username = ao_module_utils.getUserName().split("_").join("-");
    itemname = itemname.split("_").join("-");
	return localStorage.getItem(moduleName + "_" + username + "_" + itemname);
}
//Save something into localStoarge with give tag and value
function ao_module_saveStorage(moduleName,itemname,value){
    moduleName = moduleName.split("_").join("-");
    username = ao_module_utils.getUserName().split("_").join("-");
    itemname = itemname.split("_").join("-");
	localStorage.setItem(moduleName + "_" + username + "_" + itemname, value);
	return true;
}
//Write something to tmp, which can be used as callback or anything that is not important
//The value can also be an object
function ao_module_writeTmp(uid,value){
    uid = "tmp_" + uid;
    localStorage.setItem(uid,JSON.stringify(value));
}

function ao_module_readTmp(uid){
    uid = "tmp_" + uid;
    var value = localStorage.getItem(uid);
    if (value == null || value == "null"){
        return false;   
    }
    return JSON.parse(value);
}

function ao_module_removeTmp(uid){
    uid = "tmp_" + uid;
    if (ao_module_readTmp(uid) == false){
       localStorage.removeItem(uid); 
    }
}

//Check if the storage exists on this browser or not
function ao_module_checkStorage(id){
	if (typeof(Storage) !== "undefined") {
		return true;
	} else {
		return false;
	}
}

/*
ArOZ Online Cluster Services Functions
These functions are desgined for powering the cluster services of the ArOZ Cluster System.

These 3 functions provide a GUI for user to select a desired parallel processing host / clusters.
To use this in Tab Mode (Non-VDI mode), use the ao_module_openClusterSelectorTab() function instead.
ao_module_openClusterSelector()

Example Usage: (Node Selection)
    function openClusterSelect(){
        var uid = ao_module_utils.getRandomUID();
        if (ao_module_virtualDesktop){
            ao_module_openClusterSelector(uid,"clusterProcess");
        }else{
            ao_module_openClusterSelectorTab(uid,"../",undefined,undefined,clusterProcess);
        }
        
    }
or (Disk Selection)
    function openClusterDriveSelect(){
        var uid = ao_module_utils.getRandomUID();
        if (ao_module_virtualDesktop){
            ao_module_openClusterSelector(uid,"diskProcess",undefined,undefined,undefined,"disk");
        }else{
            ao_module_openClusterSelectorTab(uid,"../",undefined,"disk",diskProcess);
        }
        
    }


Example return functions:

function diskProcess(diskInfo){
	result = JSON.parse(diskInfo);
	for (var i=0; i < result.length; i++){
		var diskID = result[i].diskID;
		//Do something here
   }
}

function clusterProcess(clusterData){
    $("#reply").html("");
	result = JSON.parse(clusterData);
		for (var i=0; i < result.length; i++){
		var clusterIP = result[i].hostIP;
		var clusterUUID = result[i].hostUUID;
		var online = result[i].hostOnline;
    	//Do something here
   }
}

*/
var ao_module_clusterSelectorCallBack,ao_module_clusterSelectorWindowObject,ao_module_clusterSelectorReplyObject,ao_module_clusterSelectorFileAwait;
function ao_module_openClusterSelector(uid,callBackFunctionName, windowWidth = 1080, windowHeight = 645, allowMultiple = false, selectMode = "node"){
    //selectMode: node / disk
    //allowMultiple: true / false
    if (allowMultiple){
        allowMultiple = "true";
    }else{
        allowMultiple = "false";
    }
    if (ao_module_virtualDesktop){
        //Launch inside VDI
        ao_module_newfw("SystemAOB/functions/cluster/clusterSelector.php?allowMultiple=" + allowMultiple + "&selectMode=" + selectMode,"Starting cluster selector","spinner",uid,windowWidth,windowHeight,ao_module_getLeft() + 30,ao_module_getTop() + 30,undefined,undefined,ao_module_windowID,callBackFunctionName);
        return true;
    }else{
        return false;
    }
}


function ao_module_openClusterSelectorTab(uid, aor,allowMultiple = false, selectMode = "node",callBack=console.log){
    //selectMode: node / disk
    //allowMultiple: true / false
    if (allowMultiple){
        allowMultiple = "true";
    }else{
        allowMultiple = "false";
    }
    if (aor.slice(-1) != "/"){
        aor = aor + "/";
    }
	ao_module_clusterSelectorReplyObject = uid;
	ao_module_clusterSelectorCallBack = callBack;
    var windowObject = window.open(aor + "/SystemAOB/functions/cluster/clusterSelector.php?allowMultiple=" + allowMultiple + "&selectMode=" + selectMode + "&puid=" + uid);
	ao_module_clusterSelectorWindowObject = windowObject;
	ao_module_clusterSelectorFileAwait = setInterval(ao_module_listenClusterSelectionInput,5000);
    return windowObject;
}

//Cross-tab File Selector Listener for File Selector Callback purpose. This is not a usable function. Do not touch this function.
function ao_module_listenClusterSelectionInput(){
	var ao_module_clusterSelectorReturnedFiles = ao_module_readTmp(ao_module_clusterSelectorReplyObject);
	if (ao_module_clusterSelectorReturnedFiles == false && ao_module_clusterSelectorReturnedFiles.length === undefined){

	}else{
		//File found! Closing all selection windows and load the files
		clearInterval(ao_module_clusterSelectorFileAwait);
		if (ao_module_clusterSelectorReturnedFiles.length == 0){
			//Cancel selection
			ao_module_clusterSelectorCallBack(JSON.stringify([]));
		}else{
			ao_module_clusterSelectorWindowObject.close();
			ao_module_removeTmp(ao_module_clusterSelectorReplyObject);
			ao_module_clusterSelectorReplyObject = undefined;
			ao_module_clusterSelectorCallBack(JSON.stringify(ao_module_clusterSelectorReturnedFiles));
		}
	}
}


/*
ArOZ Online Module Input Method Editor / Extension
These functions for designed for custom input method.
Please refer to the implementation comments listed below.
*/
class ao_module_inputs{

    //Define this module window as an Input Method
    /*
    //The following function should be defined at the first line of Javascript of your input method for handling the key events
    //THESE SECTIONS OF CODE ARE FOR WEBAPP THAT IS DESIGNED TO BE A INPUT METHOD ONLY
	
    ao_module_inputs.defineInputMethod(function(e) {
        //Your code here, e is the event handler which should be passed through to this iframe by the typing target window
    });
    
    //You can also undefined the Input Method (Optional) on beforeUnload
    
    ao_module_inputs.undefineInputMethod();
    */
    
    static defineInputMethod(keyHandlerFunct){
        parent.window.inputMethod = ao_module_windowID;
        window.keyHandler = keyHandlerFunct;
    }
    
    //Undefined this module window as an Input Method
    static undefineInputMethod(){
         parent.window.inputMethod = undefined;
         window.keyHandler = undefined;
    }
    
    //Allow module to hook functions from local script to stdIn for Input Method bypass
    /*
    //THESE SECTION OF CODE IS DESIGN FOR MODULE THAT RECEIVE INPUT FROM INPUT METHODS
    //Assume you have an input field that is going to filled in by string returned by the input method. 
    //Then, you can first hook the StdIn of your WebAPP as follow.
    
    ao_module_inputs.hookStdIn(function(text){
        //text variable is the string that the user typed via the IME
        $("#input").append(text);
    });
    
    //Next, you need to hand the key input event to the input method.
    document.addEventListener("keydown", ao_module_inputs.hookKeyHandler, false);
    
    */
     
    static hookStdIn(localFunction){
        //Check if any input method is hooked. If yes, allow hooking 
        if (parent.window.inputMethod != undefined){
            window.stdIn = localFunction;
        }else{
            return false;
        }
    }
    
    //Do not include the following function into your code. This is used for callback purpose only.
    static hookKeyHandler(event){
        if (parent.window.inputMethod != undefined){
            var InputMethod = parent.window.document.getElementById(parent.window.inputMethod);
            if ($(InputMethod).length == 0){
                //Input method no longer exists
                return false;
            }
            $(InputMethod).find("iframe")[0].contentWindow.keyHandler(event);
        }else{
            return false;
        }
        
    }
    
    //Sent output text to the current focused Windows
    /*
    //This function send text (or character) to the focused windows's hookStdIn defined function
    //THIS FUNCTION IS FOR WEBAPP THAT IS DESIGNED FOR BEING AN INPUT METHOD ONLY
	
    ao_module_inputs.stdOut(text);
    
    */
    static stdOut(text){
        var targetWindow = parent.focusedWindow;
        if ($(targetWindow).parent().attr("id") == ao_module_windowID){
            //This is this windows. Ignore the StdOut
            return;
        }
        targetWindow = $(targetWindow).parent().find("iframe")[0];
        if (targetWindow.contentWindow != null && typeof targetWindow.contentWindow.stdIn != undefined && targetWindow.contentWindow.stdIn != undefined){
            //This module allow stdIn Hooking, send it text!
            targetWindow.contentWindow.stdIn(text);
        }else{
            //This module do not allow hooking to input methods
            return false;
        }
    }
    
}

/**
ArOZ Online Module Functions for WebSocket Communication
The default port for ArOZ Online Websocket Server is 65530.
This function is not usable if you don't have a valid websocket setup.

**/

class ao_module_ws{
    constructor(webSocketLocation) {
        if (webSocketLocation == undefined){
            return false;
        }
        this.webSocketLocation = webSocketLocation;
        return true;
    }
    
    init(){
        this.websocket = new WebSocket(this.webSocketLocation);
		this.websocket.onopen = this.onOpen;
		this.websocket.onclose = this.onClose;
		this.websocket.onerror = this.onError;
		this.websocket.onmessage = this.onMessage;
        return this.websocket;
    }
	
	onOpen(evt){
		console.log(evt.data);
	}
	
	onClose(evt){
		console.log("DISCONNECTED");
		return true;
	}

	onMessage(evt){
		console.log(evt.data);
	}

	onError(evt){
		console.log(evt.data);
	}

	sendText(message){
		this.websocket.send(message);
		return true;
	}
	
	disconnect(){
		this.websocket.close();
		return this.websocket.readyState;
	}
	
	get ws(){
		return this.websocket;
	}
	
    get location(){
        return this.webSocketLocation;
    }
    
    get connected(){
        return this.websocket.readyState;
    }
    
}

/**
ArOZ Online Module Utils for quick deploy of ArOZ Online WebApps

ao_module_utils.objectToAttr(object); //object to DOM attr
ao_module_utils.attrToObject(attr); //DOM attr to Object
ao_module_utils.getRandomUID(); //Get random UUID from timestamp
ao_module_utils.getIconFromExt(ext); //Get icon tag from file extension
 **/
class ao_module_utils{
    
    //Two simple functions for converting any Javascript object into string that can be put into the attr value of an DOM object
    static objectToAttr(object){
       return encodeURIComponent(JSON.stringify(object));
    }
    
    static attrToObject(attr){
        return JSON.parse(decodeURIComponent(attr));
    }
    
    //Get the current username from localStorage
    //Warning! This value might not be accurate as the user might change this by themself. If you want to ensure their username, use PHP $_SESSION['login'] instead.
    static getUserName(){
        return localStorage.getItem("ArOZusername");
    }
    
    //Get a random id for a new floatWindow, use with var uid = ao_module_utils.getRandomUID();
    static getRandomUID(){
        return new Date().getTime();
    }
    
    //Get the icon of a file with given extension (ext), use with ao_module_utils.getIconFromExt("ext");
    static getIconFromExt(ext){
        var ext = ext.toLowerCase().trim();
        var iconList={
        md:"file text outline",
        txt:"file text outline",
        pdf:"file pdf outline",
        doc:"file word outline",
        docx:"file word outline",
        odt:"file word outline",
        xlsx:"file excel outline",
        ods:"file excel outline",
        ppt:"file powerpoint outline",
        pptx:"file powerpoint outline",
        odp:"file powerpoint outline",
        jpg:"file image outline",
        png:"file image outline",
        jpeg:"file image outline",
        gif:"file image outline",
        odg:"file image outline",
        psd:"file image outline",
        zip:"file archive outline",
        '7z':"file archive outline",
        rar:"file archive outline",
        tar:"file archive outline",
        mp3:"file audio outline",
        m4a:"file audio outline",
        flac:"file audio outline",
        wav:"file audio outline",
        aac:"file audio outline",
        mp4:"file video outline",
        webm:"file video outline",
        php:"file code outline",
		html:"file code outline",
		htm:"file code outline",
        js:"file code outline",
        css:"file code outline",
        xml:"file code outline",
        json:"file code outline",
        csv:"file code outline",
        odf:"file code outline",
        bmp:"file image outline",
        rtf:"file text outline",
        wmv:"file video outline",
        mkv:"file video outline",
        ogg:"file audio outline",
        stl:"cube",
        obj:"cube",
        "3ds":"cube",
        fbx:"cube",
        collada:"cube",
        step:"cube",
        iges:"cube",
		gcode:"cube",
        shortcut:"external square",
		opus:"file audio outline"
        };
        var icon = "";
        if (ext == ""){
            icon = "folder outline";
        }else{
            icon = iconList[ext];
            if (icon == undefined){
                icon = "file outline"
            }
        }
        return icon;
    }
}

class ao_module_codec{
	//Decode umfilename into standard filename in utf-8, which umfilename usually start with "inith"
	//Example: ao_module_codec.decodeUmFilename(umfilename_here);
    static decodeUmFilename(umfilename){
		if (umfilename.includes("inith")){
			var data = umfilename.split(".");
			if (data.length == 1){
				//This is a filename without extension
				data = data[0].replace("inith","");
				var decodedname = ao_module_codec.decode_utf8(ao_module_codec.hex2bin(data));
				if (decodedname != "false"){
					//This is a umfilename
					return decodedname;
				}else{
					//This is not a umfilename
					return umfilename;
				}
			}else{
				//This is a filename with extension
				var extension = data.pop();
				var filename = data[0];
				filename = filename.replace("inith",""); //Javascript replace only remove the first instances (i.e. the first inith in filename)
				var decodedname = ao_module_codec.decode_utf8(ao_module_codec.hex2bin(filename));
				if (decodedname != "false"){
					//This is a umfilename
					return decodedname + "." + extension;
				}else{
					//This is not a umfilename
					return umfilename;
				}
			}
			
		}else{
			//This is not umfilename as it doesn't have the inith prefix
			return umfilename;
		}
	}
	//Decode hexFoldername into standard foldername in utf-8, return the original name if it is not a hex foldername
	//Example: ao_module_codec.decodeHexFoldername(hexFolderName_here);
	static decodeHexFoldername(folderName){
	    var decodedFoldername = ao_module_codec.decode_utf8(ao_module_codec.hex2bin(folderName));
		if (decodedFoldername == "false"){
			//This is not a hex encoded foldername
			decodedFoldername = folderName;
		}else{
			//This is a hex encoded foldername
			decodedFoldername = "*" + decodedFoldername;
		}
		return decodedFoldername;
	}
    
    static hex2bin(s){
      var ret = []
      var i = 0
      var l
      s += ''
      for (l = s.length; i < l; i += 2) {
        var c = parseInt(s.substr(i, 1), 16)
        var k = parseInt(s.substr(i + 1, 1), 16)
        if (isNaN(c) || isNaN(k)) return false
        ret.push((c << 4) | k)
      }
    
      return String.fromCharCode.apply(String, ret)
    }
    
    static decode_utf8(s) {
      return decodeURIComponent(escape(s));
    }
}


/**
Screenshot related functions
This function make use of the html2canvas JavaScript library. For license and author, please refer to the html2canvas.js head section.

target value are used to defined the operation after the screenshot.
default / newWindow --> Open screenshot in new window
dataurl --> return data url of the image as string
canvas --> return the canvas object
**/
//Updates Removed Screenshot feature due to waste of resources
/**
//Take a screenshot from module body
function ao_html2canvas_screenshot(target="newWindow",callback){
	if (typeof html2canvas != undefined){
		html2canvas(document.body).then(function(canvas) {
			if (target == "newWindow"){
				window.open(canvas.toDataURL("image/png"), '_blank');
				return true;
			}else if (target == "dataurl"){
				callback(canvas.toDataURL("image/png"));
			}else if (target == "canvas"){
				callback(canvas);
			}else{
				window.open(canvas.toDataURL("image/png"), '_blank');
				return true;
			}
		});
	}else{
		return false;
	}
}

function ao_html2canvas_getPreview(w,h){
	if (typeof html2canvas != undefined){
		html2canvas(document.body,{width: w,height: h}).then(function(canvas) {
			parent.updatePreview(canvas);
		});
	}else{
		return false;
	}
}
**/

