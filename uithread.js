
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
    var canvas_width = window.innerWidth;
    var canvas_height = window.innerHeight;
    var glyph_height = 20;
    var mainCanvas = document.createElement("canvas");
    var glyphCanvas = document.createElement('canvas');
    
    var dpr = 1;//getPixelRatio().devicePixelRatio;
    if (dpr != 1) {
        canvas_height *= dpr;
        canvas_width *= dpr;
        glyph_height *= dpr;
    }
    function resizeCanvas() {
        mainCanvas.width = window.innerWidth;
        mainCanvas.height = window.innerHeight;
    }
    //window.addEventListener('resize', resizeCanvas, false);
    //resizeCanvas();
    
    const glyph_width = glyph_height / 2;
    const glyph_char_height = glyph_height+'px';
    const default_foreground = 'gray';
    const default_background = 'black';
    const default_font = 'UbuntuMono';
    
    var maindiv = document.getElementById(div_id);
    var mainStyle = document.createElement("style");
    mainStyle.type = 'text/css';
    var mainCss = `@font-face {
        font-family: "UbuntuMono";
        src: url("fonts/UbuntuMono-Regular.ttf") format("opentype");
    }
    @font-face {
        font-family: "UbuntuMono";
        src: url("fonts/UbuntuMono-Bold.ttf") format("opentype");
        font-weight: bold;
    }
    html, body, div, canvas {
      width: 100%;
      height: 100%;
      margin: 0px;
      border: 0;
      overflow: hidden;
      display: block;
    }`;
    mainStyle.appendChild(document.createTextNode(mainCss));
    maindiv.appendChild(mainStyle);
    mainCanvas.width = canvas_width;
    mainCanvas.height = canvas_height;
    maindiv.appendChild(mainCanvas);
    glyphCanvas.width = glyph_width;
    glyphCanvas.height = glyph_height;
    var glyphCanvas_context = glyphCanvas.getContext('2d');
    glyphCanvas_context.scale(dpr, dpr);
    var mainCanvas_context = mainCanvas.getContext('2d');
    mainCanvas_context.scale(dpr, dpr);
    var mainForm = document.createElement("form");
    maindiv.appendChild(mainForm);
    var inputField = document.createElement("textarea");
    mainCanvas.setAttribute("style", `width:${ canvas_width }px;height:${ canvas_height }px`);
    inputField.setAttribute("style", 'position: absolute; left: 0; top: 0; width: 100%; height: 100%; z-index: 10000; border: 0; padding: 0; resize: none; color: white; font-family: UbuntuMono, Monaco, "Lucida Console", monospace; font-size: small; background: black; opacity: 0; line-height: 0; -webkit-appearance: textarea; -webkit-rtl-ordering: logical; flex-direction: column; cursor: text; white-space: pre-wrap; overflow-wrap: break-word; text-rendering: auto; letter-spacing: normal; word-spacing: normal; text-transform: none; text-indent: 0px; text-shadow: none; display: inline-block; text-align: start; margin: 0em; font: 400 13.3333px Arial; -webkit-writing-mode: horizontal-tb !important;');
    inputField.setAttribute("autocapitalize","off");
    inputField.setAttribute("autocomplete","off");
    inputField.setAttribute("spellcheck","false");
    inputField.setAttribute("autocorrect","off");
    inputField.setAttribute("autofocus","autofocus");
    inputField.addEventListener("focusout", function focusout(event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        inputField.focus();
    });
    mainForm.appendChild(inputField);
    
    var firstFontDraw = null;
    var font_loaded = false;
    var font = new FontFaceObserver(default_font);
    font.load().then(function () {
        font_loaded = true;
        if (firstFontDraw) firstFontDraw();
        console.log('Loaded font: '+default_font);
    }, function () {
        console.log('Error loading font: '+default_font);
    });
    
    var worker = new Worker("toplevel.js", {name:"bwave_"+canvas_id});
    
    var new_screen = {};
    var last_screen = new_screen;
    var received = 0;
    var drawn = 0;
    var pen_x = 0;
    var pen_y = 0;
    function animate() {
        if (new_screen !== last_screen) {
            last_screen = new_screen;
            drawn++;
            mainCanvas_context.putImageData(new ImageData(
                new Uint8ClampedArray(new_screen),
                    canvas_width, canvas_height), 0, 0);
        }
    }
    
    function draw_chars(output_str, x_pixels, y_pixels, fontColor, bgColor) {
        if (!font_loaded) {
            firstFontDraw = function() {
                draw_chars(output_str, x_pixels, y_pixels, fontColor, bgColor);
                firstFontDraw = null;
            };
            return;
        }
        var chars = Array.from(output_str);
        // TODO: handle combining characters
        for (var i = 0; i < chars.length; i++) {
            render_glyph([chars[i].codePointAt(0)], x_pixels + i*glyph_width, y_pixels, fontColor, bgColor);
        }
    }
    
    // TODO: use MRU cache if memory explodes
    var glyph_cache = {};
    /* array of codepoints. One base glyph plus any combining chars. */
    function render_glyph(codepoints, x_pixels, y_pixels, fontColor, bgColor) {
        if (x_pixels > mainCanvas.width - glyph_width
         || y_pixels > mainCanvas.height - glyph_height) {
            return;
            throw `Glyph draw coordinates out of range: {x_pixels}, {y_pixels}`;
        }
        
        const fontSpec = glyph_char_height+' '+default_font;
        fontColor = fontColor || default_foreground;
        bgColor = bgColor || default_background;
        // TODO: add ultra fast cache for codepoint < 256
        const cacheKey = codepoints.join(',')+','+fontSpec+','+fontColor+','+bgColor;
        var imageData = glyph_cache[cacheKey];
        if (!imageData) {
            var render_glyph = String.fromCodePoint.apply(null, codepoints);
            glyphCanvas_context.clearRect(0, 0, glyph_width, glyph_height);
            glyphCanvas_context.fillStyle = bgColor;
            glyphCanvas_context.fillRect(0, 0, glyph_width, glyph_height);
            glyphCanvas_context.fillStyle = fontColor;
            glyphCanvas_context.font = fontSpec;
            glyphCanvas_context.textBaseline = 'top';
            glyphCanvas_context.fillText(render_glyph, 0, 0);
            imageData = glyphCanvas_context.getImageData(0, 0, glyph_width, glyph_height);
            glyph_cache[cacheKey] = imageData;
        }
        mainCanvas_context.putImageData(imageData, x_pixels, y_pixels);
    }
    
    function setup_inputfield() {
        var presses = [];
        inputField.oninput=function(event) {
            var x = inputField.value;
            if (x && x.length && x.match(/\S/)) {
                worker.postMessage([x]);
                inputField.value = "";
                presses = [];
            }
        };
        function send_presses() {
            presses.forEach(x => {
                worker.postMessage([x]);
            });
            presses = [];
        }
        inputField.onkeydown=function(event) {
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
        inputField.focus();
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
            setup_inputfield();
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
        worker.postMessage([canvas_width, canvas_height, dpr]);
    };
};

})();

// https://gist.github.com/CezaryDanielNowak/9074032
const getPixelRatio = () => {
  const STEP = 0.05;
  const MAX = 5;
  const MIN = 0.5;
  const mediaQuery = (v) => `(-webkit-min-device-pixel-ratio: ${v}),
  (min--moz-device-pixel-ratio: ${v}),
  (min-resolution: ${v}dppx)`;

  // * 100 is added to each constants because of JS's float handling and
  // numbers such as `4.9-0.05 = 4.8500000000000005`
  let maximumMatchingSize;
  for (let i = MAX * 100; i >= MIN * 100; i -= STEP * 100) {
    if (window.matchMedia(mediaQuery(i / 100)).matches ) {
      maximumMatchingSize = i / 100;
      break;
    }
  }

  return {
    isZoomed: window.devicePixelRatio === undefined
      ? 'unknown'
      : parseFloat(window.devicePixelRatio) !== parseFloat(maximumMatchingSize),
    devicePixelRatio: window.devicePixelRatio,
    realPixelRatio: maximumMatchingSize,
  }
};

/* Font Face Observer v2.1.0 - © Bram Stein. License: BSD-3-Clause */(function(){function l(a,b){document.addEventListener?a.addEventListener("scroll",b,!1):a.attachEvent("scroll",b)}function m(a){document.body?a():document.addEventListener?document.addEventListener("DOMContentLoaded",function c(){document.removeEventListener("DOMContentLoaded",c);a()}):document.attachEvent("onreadystatechange",function k(){if("interactive"==document.readyState||"complete"==document.readyState)document.detachEvent("onreadystatechange",k),a()})};function t(a){this.a=document.createElement("div");this.a.setAttribute("aria-hidden","true");this.a.appendChild(document.createTextNode(a));this.b=document.createElement("span");this.c=document.createElement("span");this.h=document.createElement("span");this.f=document.createElement("span");this.g=-1;this.b.style.cssText="max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";this.c.style.cssText="max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";
this.f.style.cssText="max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";this.h.style.cssText="display:inline-block;width:200%;height:200%;font-size:16px;max-width:none;";this.b.appendChild(this.h);this.c.appendChild(this.f);this.a.appendChild(this.b);this.a.appendChild(this.c)}
function u(a,b){a.a.style.cssText="max-width:none;min-width:20px;min-height:20px;display:inline-block;overflow:hidden;position:absolute;width:auto;margin:0;padding:0;top:-999px;white-space:nowrap;font-synthesis:none;font:"+b+";"}function z(a){var b=a.a.offsetWidth,c=b+100;a.f.style.width=c+"px";a.c.scrollLeft=c;a.b.scrollLeft=a.b.scrollWidth+100;return a.g!==b?(a.g=b,!0):!1}function A(a,b){function c(){var a=k;z(a)&&a.a.parentNode&&b(a.g)}var k=a;l(a.b,c);l(a.c,c);z(a)};function B(a,b){var c=b||{};this.family=a;this.style=c.style||"normal";this.weight=c.weight||"normal";this.stretch=c.stretch||"normal"}var C=null,D=null,E=null,F=null;function G(){if(null===D)if(J()&&/Apple/.test(window.navigator.vendor)){var a=/AppleWebKit\/([0-9]+)(?:\.([0-9]+))(?:\.([0-9]+))/.exec(window.navigator.userAgent);D=!!a&&603>parseInt(a[1],10)}else D=!1;return D}function J(){null===F&&(F=!!document.fonts);return F}
function K(){if(null===E){var a=document.createElement("div");try{a.style.font="condensed 100px sans-serif"}catch(b){}E=""!==a.style.font}return E}function L(a,b){return[a.style,a.weight,K()?a.stretch:"","100px",b].join(" ")}
B.prototype.load=function(a,b){var c=this,k=a||"BESbswy",r=0,n=b||3E3,H=(new Date).getTime();return new Promise(function(a,b){if(J()&&!G()){var M=new Promise(function(a,b){function e(){(new Date).getTime()-H>=n?b(Error(""+n+"ms timeout exceeded")):document.fonts.load(L(c,'"'+c.family+'"'),k).then(function(c){1<=c.length?a():setTimeout(e,25)},b)}e()}),N=new Promise(function(a,c){r=setTimeout(function(){c(Error(""+n+"ms timeout exceeded"))},n)});Promise.race([N,M]).then(function(){clearTimeout(r);a(c)},
b)}else m(function(){function v(){var b;if(b=-1!=f&&-1!=g||-1!=f&&-1!=h||-1!=g&&-1!=h)(b=f!=g&&f!=h&&g!=h)||(null===C&&(b=/AppleWebKit\/([0-9]+)(?:\.([0-9]+))/.exec(window.navigator.userAgent),C=!!b&&(536>parseInt(b[1],10)||536===parseInt(b[1],10)&&11>=parseInt(b[2],10))),b=C&&(f==w&&g==w&&h==w||f==x&&g==x&&h==x||f==y&&g==y&&h==y)),b=!b;b&&(d.parentNode&&d.parentNode.removeChild(d),clearTimeout(r),a(c))}function I(){if((new Date).getTime()-H>=n)d.parentNode&&d.parentNode.removeChild(d),b(Error(""+
n+"ms timeout exceeded"));else{var a=document.hidden;if(!0===a||void 0===a)f=e.a.offsetWidth,g=p.a.offsetWidth,h=q.a.offsetWidth,v();r=setTimeout(I,50)}}var e=new t(k),p=new t(k),q=new t(k),f=-1,g=-1,h=-1,w=-1,x=-1,y=-1,d=document.createElement("div");d.dir="ltr";u(e,L(c,"sans-serif"));u(p,L(c,"serif"));u(q,L(c,"monospace"));d.appendChild(e.a);d.appendChild(p.a);d.appendChild(q.a);document.body.appendChild(d);w=e.a.offsetWidth;x=p.a.offsetWidth;y=q.a.offsetWidth;I();A(e,function(a){f=a;v()});u(e,
L(c,'"'+c.family+'",sans-serif'));A(p,function(a){g=a;v()});u(p,L(c,'"'+c.family+'",serif'));A(q,function(a){h=a;v()});u(q,L(c,'"'+c.family+'",monospace'))})})};"object"===typeof module?module.exports=B:(window.FontFaceObserver=B,window.FontFaceObserver.prototype.load=B.prototype.load);}());