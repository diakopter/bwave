
BWaveUI = (function() {


const cmdKeysArray = [
'ArrowDown', 'Unidentified', 'Backspace', 'Tab', 'Enter', 'Escape', 
'Delete', 'Dead', 'HangulMode', 'Alt', 'AltGraph', 'CapsLock', 
'Control', 'Fn', 'FnLock', 'Meta', 'NumLock', 'ScrollLock', 'Shift', 
'Symbol', 'SymbolLock', 'Hyper', 'Super', 'Enter', 'Tab', 'ArrowDown', 
'ArrowLeft', 'ArrowRight', 'ArrowUp', 'End', 'Home', 'GoHome', 
'PageDown', 'PageUp', 'Backspace', 'Clear', 'Copy', 'CrSel', 'Cut', 
'Delete', 'EraseEof', 'ExSel', 'Insert', 'Paste', 'Redo', 'Undo', 
'Accept', 'Again', 'Attn', 'Cancel', 'ContextMenu', 'Escape', 'Execute', 
'Find', 'Help', 'Pause', 'MediaPause', 'Play', 'MediaPlay', 'Props', 
'Select', 'ZoomIn', 'ZoomOut', 'BrightnessDown', 'BrightnessUp', 
'Eject', 'LogOff', 'Power', 'PowerOff', 'PrintScreen', 'Hibernate', 
'Standby', 'WakeUp', 'AllCandidates', 'Alphanumeric', 'CodeInput', 
'Compose', 'Convert', 'Dead', 'FinalMode', 'GroupFirst', 'GroupLast', 
'GroupNext', 'GroupPrevious', 'ModeChange', 'NextCandidate', 
'NonConvert', 'PreviousCandidate', 'Process', 'SingleCandidate', 
'HangulMode', 'HanjaMode', 'JunjaMode', 'Eisu', 'Hankaku', 'Hiragana', 
'HiraganaKatakana', 'KanaMode', 'KanjiMode', 'Katakana', 'Romaji', 
'Zenkaku', 'ZenkakuHankaku', 'F24', 'Soft8', 'F1', 'F2', 'F3', 'F4', 
'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'Soft1', 'Soft2', 
'Soft3', 'Soft4', 'ChannelDown', 'ChannelUp', 'Close', 'MailForward', 
'MailReply', 'MailSend', 'MediaClose', 'MediaFastForward', 'MediaPause', 
'Pause', 'MediaPlay', 'MediaPlayPause', 'MediaRecord', 'MediaRewind', 
'MediaStop', 'MediaTrackNext', 'MediaTrackPrevious', 'New', 'Open', 
'Print', 'Save', 'SpellCheck', 'Key11', 'Key12', 'AudioBalanceLeft', 
'AudioBalanceRight', 'AudioBassBoostDown', 'AudioBassBoostToggle', 
'AudioBassBoostUp', 'AudioFaderFront', 'AudioFaderRear', 
'AudioSurroundModeNext', 'AudioTrebleDown', 'AudioTrebleUp', 
'AudioVolumeDown', 'AudioVolumeUp', 'AudioVolumeMute', 
'MicrophoneToggle', 'MicrophoneVolumeDown', 'MicrophoneVolumeUp', 
'MicrophoneVolumeMute', 'SpeechCorrectionList', 'SpeechInputToggle', 
'LaunchApplication1', 'LaunchApplication2', 'LaunchCalendar', 
'LaunchContacts', 'LaunchMail', 'LaunchMediaPlayer', 
'LaunchMusicPlayer', 'LaunchPhone', 'LaunchScreenSaver', 
'LaunchSpreadsheet', 'LaunchWebBrowser', 'LaunchWebCam', 
'LaunchWordProcessor', 'BrowserBack', 'BrowserFavorites', 
'BrowserForward', 'BrowserHome', 'BrowserRefresh', 'BrowserSearch', 
'BrowserStop', 'AppSwitch', 'Call', 'Camera', 'CameraFocus', 'EndCall', 
'GoBack', 'GoHome', 'HeadsetHook', 'LastNumberRedial', 'Notification', 
'MannerMode', 'VoiceDial', 'TV', 'TV3DMode', 'TVAntennaCable', 
'TVAudioDescription', 'TVAudioDescriptionMixDown', 
'TVAudioDescriptionMixUp', 'TVContentsMenu', 'TVDataService', 'TVInput', 
'TVInputComponent1', 'TVInputComponent2', 'TVInputComposite1', 
'TVInputComposite2', 'TVInputHDMI1', 'TVInputHDMI2', 'TVInputHDMI3', 
'TVInputHDMI4', 'TVInputVGA1', 'TVMediaContext', 'TVNetwork', 
'TVNumberEntry', 'TVPower', 'TVRadioService', 'TVSatellite', 
'TVSatelliteBS', 'TVSatelliteCS', 'TVSatelliteToggle', 
'TVTerrestrialAnalog', 'TVTerrestrialDigital', 'TVTimer', 'AVRInput', 
'AVRPower', 'ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 
'ColorF3Blue', 'ColorF4Grey', 'ColorF5Brown', 'ClosedCaptionToggle', 
'Dimmer', 'DisplaySwap', 'DVR', 'Exit', 'FavoriteClear0', 
'FavoriteClear1', 'FavoriteClear2', 'FavoriteClear3', 'FavoriteRecall0', 
'FavoriteRecall1', 'FavoriteRecall2', 'FavoriteRecall3', 
'FavoriteStore0', 'FavoriteStore1', 'FavoriteStore2', 'FavoriteStore3', 
'Guide', 'GuideNextDay', 'GuidePreviousDay', 'Info', 'InstantReplay', 
'Link', 'ListProgram', 'LiveContent', 'Lock', 'MediaApps', 
'ContextMenu', 'MediaAudioTrack', 'MediaLast', 'MediaSkipBackward', 
'MediaSkipForward', 'MediaStepBackward', 'MediaStepForward', 
'MediaTopMenu', 'NavigateIn', 'NavigateNext', 'NavigateOut', 
'NavigatePrevious', 'NextFavoriteChannel', 'NextUserProfile', 
'OnDemand', 'Pairing', 'PinPDown', 'PinPMove', 'PinPToggle', 'PinPUp', 
'PlaySpeedDown', 'PlaySpeedReset', 'PlaySpeedUp', 'RandomToggle', 
'RcLowBattery', 'RecordSpeedNext', 'RfBypass', 'ScanChannelsToggle', 
'ScreenModeNext', 'Settings', 'SplitScreenToggle', 'STBInput', 
'STBPower', 'Subtitle', 'Teletext', 'VideoModeNext', 'Wink', 
'ZoomToggle', 'AudioVolumeDown', 'AudioVolumeUp', 'AudioVolumeMute', 
'BrowserBack', 'BrowserForward', 'ChannelDown', 'ChannelUp', 
'ContextMenu', 'Eject', 'End', 'Enter', 'Home', 'MediaFastForward', 
'MediaPlay', 'MediaPlayPause', 'MediaRecord', 'MediaRewind', 
'MediaStop', 'MediaNextTrack', 'MediaPause', 'MediaPreviousTrack', 
'Power', 'Space' ];
var cmdKeys = {};
cmdKeysArray.forEach(x=>cmdKeys[x]=1);
var modifierKeys = { Control:1, Shift:1, Alt:1, Meta:1 };

return function BWaveUI(div_id) {
    var textarea_id = div_id + '_textarea';
    var canvas_id = div_id + '_canvas';
    var canvas_height = 600;
    var canvas_width = 800;
    
    var maindiv = document.getElementById(div_id);
    var mainCanvas = document.createElement("canvas");
    maindiv.appendChild(mainCanvas);
    var mainCanvas_context = mainCanvas.getContext('2d');
    var mainForm = document.createElement("form");
    maindiv.appendChild(mainForm);
    var mainStyle = document.createElement("style");
    mainStyle.type = 'text/css';
    var mainCss = `@font-face {
        font-family: "UbuntuMono";
        src:url("fonts/UbuntuMono.otf") format("opentype");
    }`;
    mainStyle.appendChild(document.createTextNode(mainCss));
    maindiv.appendChild(mainStyle);
    var textarea = document.createElement("textarea");
    mainCanvas.setAttribute("style", `width:${ canvas_width }px;height:${ canvas_height }px`);
    textarea.setAttribute("style", 'position: absolute; left: 0; top: 0; width: 100%; height: 100%; z-index: 10000; border: 0; padding: 0; resize: none; color: white; font-family: Monaco, "Lucida Console", monospace; font-size: small; background: black; opacity: 0; line-height: 0; -webkit-appearance: textarea; -webkit-rtl-ordering: logical; flex-direction: column; cursor: text; white-space: pre-wrap; overflow-wrap: break-word; text-rendering: auto; letter-spacing: normal; word-spacing: normal; text-transform: none; text-indent: 0px; text-shadow: none; display: inline-block; text-align: start; margin: 0em; font: 400 13.3333px Arial; -webkit-writing-mode: horizontal-tb !important;');
    textarea.setAttribute("autocapitalize","off");
    textarea.setAttribute("autocomplete","off");
    textarea.setAttribute("spellcheck","false");
    textarea.setAttribute("autocorrect","off");
    textarea.setAttribute("autofocus","autofocus");
    textarea.addEventListener("focusout", function(event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        textarea.focus();
    });
    mainForm.appendChild(textarea);
    
    var worker = new Worker("toplevel.js", {name:"bwave_"+canvas_id});
    
    var new_screen = {};
    var last_screen = new_screen;
    var received = 0;
    var drawn = 0;
    function animate() {
        if (new_screen !== last_screen) {
            last_screen = new_screen;
            drawn++;
            mainCanvas_context.putImageData(new ImageData(
                new Uint8ClampedArray(new_screen),
                    canvas_width, canvas_height), 0, 0);
        }
    }
    
    function setup_textarea() {
        var presses = [];
        textarea.oninput=function(event) {
            var x = textarea.value;
            if (x && x.length && x.match(/\S/)) {
                worker.postMessage([x]);
                textarea.value = "";
                presses = [];
            }
        };
        function send_presses() {
            presses.forEach(x => {
                worker.postMessage([x]);
            });
            presses = [];
        }
        textarea.onkeydown=function(event) {
            if (!event.isComposing && event.keyCode != 229 && !(event.key in modifierKeys)) {
                var x = "";
                if (event.ctrlKey) x += "Ctrl+";
                if (event.altKey) x += "Alt+";
                if (event.metaKey) x += "Meta+";
                var keyName = event.key;
                if (event.key.match(/^\s+$/) || event.key==="Unidentified") {
                    keyName = event.code;
                }
                if (event.shiftKey && keyName in cmdKeys) x += "Shift+";
                x += keyName;
                presses.push(x);
                setTimeout(send_presses, 0);
            }
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        };
        textarea.focus();
    }
    
    worker.onmessage = function(evt) {
        var code = 0+evt.data[0];
        switch(code) {
        case 0: // toplevel exited
            var exitCode = evt.data[1];
            console.log(`Received ${ received } frames; drew ${ drawn } frames`);
            return;
        case 1: // sending canvas frame
            received++;
            new_screen = evt.data[1];
            return;
        case 2: // register browser input hooks
            setup_textarea();
            return;
        case 3: // register browser output hook
            var fps = evt.data[1] || 60;
            setInterval(animate, 1000/fps);
            return;
        case 4: // resize canvas
            throw "not yet implemented: bwaveui_resize";
        default:
            throw "invalid message code: "+code;
        }
    };
    
    this.run = function() {
        worker.postMessage(['init']);
    };
};

})();