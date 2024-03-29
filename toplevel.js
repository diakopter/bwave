
(function(global) {

var next_pid = 0;
var run_queue = [];
var invoke_depth = 0;
var modules = {};
var Aeneas_wasm; // cache specially

function VProcess(_vfs, _vdisplay) {
    // manages "process" invocation state

    var pid = next_pid++;
    var next_fd = 3;
    var mem;
    var entry;
    var fs = _vfs;
    var fh;
    var fhs = {};
    var instance;
    var invoke_args = [];
    var show_trace = 0;
    var stdout_hook = console.log;
    var stderr_hook = console.log;
    var vdisplay = _vdisplay;
    
    this.exitCode = 0;

    function trace(msg) {
        if (show_trace) console.log(`PID:${pid}: ${msg}`);
    }

    // TODO: use cached .buffer/views only if mem has not grown.
    function mem_ref(index, length) {
        return new Uint8ClampedArray(mem.buffer, index, length);
    }

    function ascii2ab(str) {
      var buf = new ArrayBuffer(str.length);
      var bufView = new Uint8ClampedArray(buf);
      for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
      }
      return buf;
    }

    function bwave_read_string(idx, length) {
        var uint8 = mem_ref(idx, length);
        return String.fromCharCode(...uint8);
    }

    function bwave_arg_len(idx) {
        if (idx < 0 || idx >= invoke_args.length)
            throw "Invalid invocation arg index";
        return invoke_args[idx].length;
    }

    function bwave_arg_copy(idx, ptr, len) {
        if (idx < 0 || idx >= invoke_args.length)
            throw "Invalid invocation arg index";
        if (len < 0 || len > invoke_args[idx].length)
            throw "Invalid arg length";
        var uint8 = mem_ref(ptr, len);
        for (var i = 0; i < len; i++) {
            var charCode = invoke_args[idx].charCodeAt(i);
            if (charCode > 255)
                throw "Not yet implemented: non-ascii command-line args";
            uint8[i] = charCode;
        }
    }
    
    var event_queue = [];
    var event_count_committed = 0;
    function bwave_event_len(idx) {
        if (idx < 0 || idx >= event_count_committed)
            throw "Invalid event index";
        return event_queue[idx].length;
    }

    function bwave_event_copy(idx, ptr, len) {
        if (idx < 0 || idx >= event_count_committed)
            throw "Invalid event_queue index";
        if (len < 0 || len > event_queue[idx].length)
            throw "Invalid event length";
        var uint8 = mem_ref(ptr, len);
        for (var i = 0; i < len; i++) {
            var charCode = event_queue[idx].charCodeAt(i);
            if (charCode > 255)
                throw "Not yet implemented: non-ascii event string chars";
            uint8[i] = charCode;
        }
        if (idx == event_count_committed-1) {
            while(--event_count_committed >= 0)
                event_queue.shift();
        }
    }

    function ab_append(ab1, ab2) {
        var newBuffer = new ArrayBuffer(ab1.byteLength + ab2.byteLength);
        var newView = new Uint8Array(newBuffer);
        newView.set(new Uint8Array(ab1), 0);
        newView.set(new Uint8Array(ab2), ab1.byteLength);
        return newBuffer;
    }

    function make_fh(fd) {
        var fh = { fd: fd };
        if (fd == 0) {
            fh.fname = "STDIN";
            fh.read = function(fh, len) {
                if (fh.off + len > fh.data.byteLength)
                    throw "Cannot read past EOF";
                var data = new Uint8Array(fh.data, off, len);
                off += len;
                return data;
            };
            fh.write = function(fh, data) {
                throw "Cannot write to STDIN";
            };
            fh.close = function(fh) {};
            fh.off = 0;
            fh.data = new ArrayBuffer(0);
        } else if (fd == 1) {
            fh.fname = "STDOUT";
            fh.read = function(fh, fd, len) {
                throw "Cannot read from STDOUT";
            };
            fh.write = function(fh, data) {
                fh.data = ab_append(fh.data, data);
                stdout_hook(String.fromCharCode(...data));
            };
            fh.close = function(fh) {};
            fh.data = new ArrayBuffer(0);
        } else if (fd == 2) {
            fh.fname = "STDERR";
            fh.read = function(fh, idx, len) {
                throw "Cannot read from STDERR";
            };
            fh.write = function(fh, data) {
                fh.data = ab_append(fh.data, data);
                stderr_hook(String.fromCharCode(...data));
            };
            fh.close = function(fh) {};
            fh.data = new ArrayBuffer(0);
        } else {
            fs.make_fh(fd, fh, fhs);
        }
        return fh;
    }

    function get_fh(fd) {
        var fh;
        if (fd < 0 || (fd > 2 && !(fd in fhs)))
            throw `Invalid file descriptor ${ fd }`;
        if (fd < 3) {
            fh = fhs[fd] || (fhs[fd] = make_fh(fd));
        } else {
            fh = fhs[fd];
        }
        return fh;
    }

    // length in bytes.
    function bwave_fs_size(ptr, len) {
        const fname = bwave_read_string(ptr, len);
        if (!(fname in fs._vfs()))
            return -1;
        return fs._vfs()[fname].byteLength;
    }

    function bwave_fs_chmod() {
        trace("Not yet implemented: bwave_fs_chmod");
    }
    function bwave_fs_open(ptr, len, mode) {
        //TODO: enforce mode?
        const fname = bwave_read_string(ptr, len);
        var fh = make_fh(next_fd++);
        fh.fname = fname;
        fs.touch(fname);
        fhs[fh.fd] = fh;
        return fh.fd;
    }
    function bwave_fs_read(fd, ptr, len) {
        var fh = get_fh(fd);
        var uint8 = mem_ref(ptr, len);
        var data = fh.read(fh, len);
        trace(`bwave_fs_read ${ len } bytes from ${ fh.fname }: ${ String.fromCharCode(...data) }`);
        if (!data) return -1;
        uint8.set(data, 0, len);
        return len;
    }
    function bwave_fs_write(fd, ptr, len) {
        const data = mem_ref(ptr, len);
        var fh = get_fh(fd);
        fh.write(fh, data, len);
    }
    function bwave_fs_avail() {
        trace("Not yet implemented: bwave_fs_avail");
    }
    function bwave_fs_close(fd) {
        var fh = get_fh(fd);
        fh.close(fh);
    }
    function hrtime() {
        var clocktime = performance.now()*1e-3;
        var seconds = Math.floor(clocktime);
        var nanoseconds = Math.floor((clocktime%1)*1e9);
        return [seconds,nanoseconds];
    }
    
    function bwave_ticks_ms() {
        var timeval = hrtime();
        return Math.floor(timeval[0] * 1e3 + timeval[1] / 1e6);
    }
    function bwave_ticks_us() {
        return Math.floor(timeval[0] * 1e6 + timeval[1] / 1e3);
    }
    function bwave_ticks_ns() {
        return Math.floor(timeval[0] * 1e9 + timeval[1]);
    }
    function bwave_throw_ex(msg) {
        throw msg;
    }
    function bwave_display_height() {
        return vdisplay.height();
    }
    function bwave_display_width() {
        return vdisplay.width();
    }
    function bwave_display_clear() {
        vdisplay.clear();
    }
    function bwave_mono_glyph(col, row, ascii) {
        return vdisplay.mono_glyph(col, row, ascii);
    }
    
    const wasm_imports = {
        bwave: {
            arg_len:  bwave_arg_len,
            arg_copy: bwave_arg_copy,
            event_len:  bwave_event_len,
            event_copy: bwave_event_copy,
            fs_size:  bwave_fs_size,
            fs_chmod: bwave_fs_chmod,
            fs_open:  bwave_fs_open,
            fs_read:  bwave_fs_read,
            fs_write: bwave_fs_write,
            fs_avail: bwave_fs_avail,
            fs_close: bwave_fs_close,
            ticks_ms: bwave_ticks_ms,
            ticks_us: bwave_ticks_us,
            ticks_ns: bwave_ticks_ns,
            throw_ex: bwave_throw_ex,
            display_height: bwave_display_height,
            display_width: bwave_display_width,
            display_clear: bwave_display_clear,
            mono_glyph: bwave_mono_glyph
        }
    };

    function runtime_exec(executable, args, cb, fn) {
        var parent = this;
        run_queue.push(fn || function() {
            invoke_depth++;
            bwave_invoke(executable, args, parent, cb);
        });
    }

    this.invoke = function(ascii, cb) {
        var args = ascii.match(/\S+/g);
        if (args && args.length && args[0].length) {
            var executable = args.shift();
            runtime_exec(executable, args, function handle_exception(exitCode, ex) {
                if (ex) console.log("\x1b[1mInternal Error:\x1b[0m "+ex+"\n");
                if (exitCode) console.log("\x1b[1m Exit code: "+exitCode+"\x1b[0m ");
                if (cb) cb(exitCode, ex);
                if (pid == 0) {
                    global.postMessage([0,exitCode, ex]);
                }
            });
        } else {
            if (cb) cb();
        }
    }
    
    async function bwave_invoke(fname, args, parent, cb) {
        var wasm;
        var exitCode;
        var ex = null;
        var module;
        invoke_args = args;
        var arg_count = args.length;
        for (var i = 0; i < args.length; i++)
            args[i] = args[i].toString();
        if (!Aeneas_wasm) {
            var response = await fetch('Aeneas.wasm');
            Aeneas_wasm = await response.arrayBuffer();
        }
        if (!fname.endsWith(".wasm"))
            fname += ".wasm";
        try {
            trace(`bwave_invoke ${ fname } with ${ arg_count } args\n`);
            if (fname == "Aeneas.wasm") {
                wasm = Aeneas_wasm;
            } else if (fname in fs._vfs()) {
                wasm = fs._vfs()[fname];
            } else {
                throw `could not find wasm for ${ fname }`;
            }
            module = modules[fname] || (modules[fname] = await WebAssembly.compile(wasm));
            instance = await WebAssembly.instantiate(module, wasm_imports);
            mem = instance.exports.mem;
            console.log(`bwave_invoke ${ fname } with ${ arg_count } args\n`);
            entry = instance.exports.entry;
            if ("reenter" in instance.exports)
                global.postMessage([2]);
            exitCode = entry(arg_count);
        } catch(e) {
            ex = e;
        } finally {
            invoke_depth--;
            if (cb) cb(exitCode, ex)
        }
        trace(`bwave_invoke exit code: ${ exitCode }`);
    };

    if (pid == 0) {
        setInterval(function run_loop() {
            if (run_queue.length && !invoke_depth)
                run_queue.shift()();
        }, 50);
    }
    
    this.get_message_handler = function() {
        var proc = this;
        return function(event) {
            event_queue.push(event.data[0]);
            setTimeout(function() {
                event_count_committed = event_queue.length;
                instance.exports.reenter(event_count_committed);
            }, 0);
        };
    };
}


global.vprocess_init = function(vfs, vdisplay) {
    return new VProcess(vfs, vdisplay);
};

})(self);


(function(global) {

function VDisplay(dpr, os_canvas) {
    
    var width = os_canvas.width;
    var height = os_canvas.height;
    var os_context = os_canvas.getContext('2d');
    
    var glyph_height = 30;
    glyph_height = Math.ceil(glyph_height * dpr);
    const glyph_width = Math.floor(glyph_height / 2);
    const glyph_char_height = glyph_height+'px';
    const default_foreground = 'gray';
    const default_background = 'black';
    const default_font = 'UbuntuMono';
    var glyphCanvas = new OffscreenCanvas(glyph_width, glyph_height);
    var glyphCanvas_context = glyphCanvas.getContext('2d');
    //glyphCanvas_context.scale(dpr, dpr);
    
    this.resize = function(height_new, width_new) {
        throw "Not yet implemented: vdisplay.resize"
    };
    
    this.height = function() {
        return height;
    };
    
    this.width = function() {
        return width;
    };
    
    this.drawRaw = function() {
        var clone = buf.slice(0);
    //    context.putImageData(new ImageData(clone, width, height), 0, 0);
        global.postMessage([1, clone]);
    };
    
    this.clear = function() {
        os_context.fillStyle = 'black';
        os_context.fillRect(0, 0, width, height);
        os_context.closePath();
        os_context.fill();
        os_context.beginPath();
    };
    
    this.mono_glyph = function(col, row, ascii) {
        render_glyph([ascii], col*glyph_width, row*glyph_height);
    };
    
    function draw_chars(output_str, x_pixels, y_pixels, fontColor, bgColor) {
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
        const fontSpec = glyph_char_height+' '+default_font;
        fontColor = fontColor || default_foreground;
        bgColor = bgColor || default_background;
        // TODO: add ultra fast cache for codepoint < 256
        const cacheKey = codepoints.join(',')+','+fontSpec+','+fontColor+','+bgColor;
        var imageData = glyph_cache[cacheKey];
        if (!imageData) {
            var glyph_string = String.fromCodePoint.apply(null, codepoints);
            //glyphCanvas_context.clearRect(0, 0, glyph_width, glyph_height);
            glyphCanvas_context.fillStyle = bgColor;
            glyphCanvas_context.fillRect(0, 0, glyph_width, glyph_height);
            glyphCanvas_context.fillStyle = fontColor;
            glyphCanvas_context.font = fontSpec;
            glyphCanvas_context.textBaseline = 'top';
            glyphCanvas_context.fillText(glyph_string, 0, 0);
            imageData = glyphCanvas_context.getImageData(0, 0, glyph_width, glyph_height);
            glyph_cache[cacheKey] = imageData;
        }
        os_context.putImageData(imageData, x_pixels, y_pixels);
    }
    
    function display_init() {
        if (!global.fonts_loaded()) {
            setTimeout(display_init, 10);
            return;
        }
        
        // setup refresh
        const rAF = global.requestAnimationFrame;
        (function repaint() { rAF(repaint); })();
    }
}

global.fonts_loaded = function() {
    return global.fonts.status === "loaded" ? true : false
};
var mono_reg = new FontFace('UbuntuMono', 'url(fonts/UbuntuMono-Regular.ttf)');
mono_reg.load();
var mono_bold = new FontFace('UbuntuMono', 'url(fonts/UbuntuMono-Bold.ttf)',
    { weight: 'bold' });
mono_bold.load();
global.fonts.add(mono_reg);
global.fonts.add(mono_bold);
global.fonts.onloadingerror = function(err) {
    console.log(err);
};

global.vdisplay_bind = function(dpr, os_canvas) {
    return new VDisplay(dpr, os_canvas);
};

})(self);
(function(global) {

function vFS(inherit) {
    var fs = inherit ? inherit._vfs() : make_stub();
    
    this.make_fh = function(fd, fh, fhs) {
        fh.read = function(fh, len) {
            if (fh.off + len > fs[fh.fname].byteLength)
                throw "Cannot read past EOF";
            var data = new Uint8Array(fs[fh.fname], fh.off, len);
            fh.off += len;
            return data;
        };
        fh.write = function(fh, data) {
            fs[fh.fname] = ab_append(fs[fh.fname], data);
        };
        fh.close = function(fh) {
            delete fhs[fh.fd];
        };
        fh.off = 0;
    };
    
    this.touch = function(fname) {
        if (!(fname in fs))
            fs[fname] = new ArrayBuffer(0);
    };
    
    this._vfs = function() {
        return fs;
    }
}

global.vfs_mem_make = function() {
    return new vFS();
}

function ab_append(ab1, ab2) {
    var newBuffer = new ArrayBuffer(ab1.byteLength + ab2.byteLength);
    var newView = new Uint8Array(newBuffer);
    newView.set(new Uint8Array(ab1), 0);
    newView.set(new Uint8Array(ab2), ab1.byteLength);
    return newBuffer;
}

function ascii2ab(str) {
  var buf = new ArrayBuffer(str.length);
  var bufView = new Uint8ClampedArray(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function make_stub() {
    return {
        "System.v3": ascii2ab(Systemv3),
        "RiRuntime.v3": ascii2ab(RiRuntimev3),
        "bwave.v3": ascii2ab(bwavev3)
    };
}

//============================================================================
//============================================================================
// temporary initial stub system..

const Systemv3 =
`// Copyright 2019 Google Inc. All rights reserved.
// See LICENSE for details of Apache 2.0 license.

def STDIN  = 0;
def STDOUT = 1;
def STDERR = 2;

// The "System" component for the Wasm/JS target.
component System {
	// change the permissions of a file
	def chmod(path: string, mode: int) {
		var p = toPath(path);
		bwave.fs_chmod(p.0, p.1, mode);
	}
	// open a file
	def fileOpen(path: string, read: bool) -> int {
		var p = toPath(path);
		return bwave.fs_open(p.0, p.1, if(read, 0, 1));
	}
	// close a file
	def fileClose(fd: int) {
		bwave.fs_close(fd);
	}
	// read a single byte from a file
	def fileRead(fd: int) -> int {
		var buf = Pointer.atContents(iobuf);
		var result = bwave.fs_read(fd, buf, 1);
		return if(result == 1, iobuf[0], -1);
	}
	// write some bytes to the file
	def fileWriteK(fd: int, data: Array<byte>, offset: int, len: int) {
		boundsCheck(data, offset, len);
		var buf = Pointer.atContents(data) + offset;
		bwave.fs_write(fd, buf, len);
	}
	// read some bytes from the file
	def fileReadK(fd: int, data: Array<byte>, offset: int, len: int) -> int {
		boundsCheck(data, offset, len);
		var buf = Pointer.atContents(data) + offset;
		var result = bwave.fs_read(fd, buf, len);
		return result;
	}
	// calculate bytes remaining to be read from file
	def fileLeft(fd: int) -> int {
		return bwave.fs_avail(fd);
	}
	// load a file into a byte array
	def fileLoad(path: string) -> Array<byte> {
		var p = toPath(path);
		var len = bwave.fs_size(p.0, p.1);
		if (len < 0) return null;
		var fd = bwave.fs_open(p.0, p.1, 0);
		if (fd < 0) return null;
		var buf = Array<byte>.new(len);
		bwave.fs_read(fd, Pointer.atContents(buf), len);
		bwave.fs_close(fd);
		return buf;
	}
	// print a character to standard out
	def putc(ch: byte) {
		iobuf[0] = ch;
		bwave.fs_write(STDOUT, Pointer.atContents(iobuf), 1);
	}
	// print an integer (in decimal) to standard out
	def puti(val: int) {
		var i = val;
		if (i == 0) {
			putc('0');
			return;
		}
		var negative = true;
		if (i > 0) {
			negative = false;
			i = 0 - i;
		}
		var pos = iobuf.length;
		while (i != 0) { // XXX: use pointer loop instead?
			var digit = byte.!('0' - i % 10);
			iobuf[--pos] = digit;
			i = i / 10;
		}
		if (negative) iobuf[--pos] = '-';
		bwave.fs_write(STDOUT, Pointer.atContents(iobuf) + pos, iobuf.length - pos);
	}
	// print a string (as bytes) to standard out
	def puts(str: string) {
		bwave.fs_write(STDOUT, Pointer.atContents(str), str.length);
	}
	// prints a newline character to standard out
	def ln() {
		putc('\\n');
	}
	// output an error, stacktrace, and exit
	def error(ex: string, msg: string) {
		def s = Pointer.atContents(ex), s_len = ex.length;
		def m = if(msg != null, Pointer.atContents(msg));
		def m_len = if (msg != null, msg.length);
		bwave.throw_ex(s, s_len, m, m_len);
	}
	// get ticks in milliseconds
	def ticksMs() -> int {
		return bwave.ticks_ms();
	}
	// get ticks in microseconds
	def ticksUs() -> int {
		return bwave.ticks_us();
	}
	// get ticks in nanoseconds
	def ticksNs() -> int {
		return bwave.ticks_ns();
	}

	// @thread-local @lazy buffer for write integers and chars to System.out
	private def iobuf = Array<byte>.new(16);

	private def BCE = "BoundsCheckException";
	private def EMPTY = "";
	private def boundsCheck<T>(array: Array<T>, start: int, len: int) {
		if (start < 0) System.error(BCE, EMPTY);
		if (start > array.length) System.error(BCE, EMPTY);
		var end = u32.!(start) + u32.!(len);
		if (end > u32.!(array.length)) System.error(BCE, EMPTY);
	}
	private def toPath(path: string) -> (Pointer, int) {
		return (Pointer.atContents(path), path.length);
	}
}
`;

const RiRuntimev3 =
`// Copyright 2019 Google Inc. All rights reserved.
// See LICENSE for details of Apache 2.0 license.

component RiRuntime {
	// Called from the exported, generated "entry" stub and used to
	// construct the arguments to pass to main.
	def init(argc: int) -> Array<string> {
		var args = Array<string>.new(argc);
		for (i < argc) {
			var len = bwave.arg_len(i);
			var str = Array<byte>.new(len);
			bwave.arg_copy(i, Pointer.atContents(str), len);
			args[i] = str;
		}
		return args;
	}
	// Called from the generated allocation stub upon allocation failure.
	def gc(size: int) -> Pointer {
		System.error("HeapOverflow", "no garbage collector installed");
		return Pointer.NULL; // unreachable
	}
}
`;

const bwavev3 =
`// Copyright 2019 Google Inc. All rights reserved.
// See LICENSE for details of Apache 2.0 license.

// imported from (b)rowser (W)eb(A)ssembly (V)irgil (E)xecutor
import component bwave {
	def arg_len(arg: int) -> int;
	def arg_copy(arg: int, buf: Pointer, buf_len: int) -> int;
	def event_len(event: int) -> int;
	def event_copy(event: int, buf: Pointer, buf_len: int) -> int;

	def fs_size(path: Pointer, path_len: int) -> int;
	def fs_chmod(path: Pointer, path_len: int, perm: int) -> int;
	def fs_open(path: Pointer, path_len: int, mode: int) -> int;
    // can only read from last offset
	def fs_read(fd: int, buf: Pointer, buf_len: int) -> int;
    // can only append
	def fs_write(fd: int, buf: Pointer, buf_len: int) -> int;
	def fs_avail(fd: int) -> int;
	def fs_close(fd: int);

	def ticks_ms() -> int;
	def ticks_us() -> int;
	def ticks_ns() -> int;

	def throw_ex(ex: Pointer, ex_len: int, msg: Pointer, msg_len: int);
    
    def display_height() -> int;
    def display_width() -> int;
    def display_clear();
    
    def mono_glyph(col: int, row: int, ascii: int);
}
`;

})(self);

(function(global) {
const terminal = {};
// = terminal_init("\x1b[0mvirgil\x1b[1m#\x1b[0m ");
/*
runtime_init(function stdout_cb(ascii) {
    terminal.write(ascii);
}, function stderr_cb(ascii) {
    terminal.write(ascii);
});

terminal_command();
*/


function ascii2ab(str) {
  var buf = new ArrayBuffer(str.length);
  var bufView = new Uint8ClampedArray(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

onmessage = function handle_first_message(evt) {
    var vdisplay = vdisplay_bind(evt.data[0], evt.data[1], evt.data[2], evt.data[3]);
    var vfs = vfs_mem_make();
    var vprocess_toplevel = vprocess_init(vfs, vdisplay);
    
    vfs._vfs()["VTerm.v3"] = ascii2ab(vtermv3);
    vfs._vfs()["CommandShell.v3"] = ascii2ab(CommandShellv3);
    
    onmessage = vprocess_toplevel.get_message_handler();
    setTimeout(function engine_init() {
        if (!global.fonts_loaded()) {
            setTimeout(engine_init, 10);
            return;
        }
        vprocess_toplevel.invoke("Aeneas -compile -target=wasm -heap-size=50m CommandShell.v3 System.v3 RiRuntime.v3 bwave.v3 VTerm.v3");
        vprocess_toplevel.invoke("CommandShell", function() {
            console.log("root process completed startup.");
        });
    }, 0);
}

const vtermv3 = `
class VTerm {
    private def char_width = 15;
    private def char_height = 30;
    var cols: int;
    var rows: int;
    
    new(width: int, height: int) {
        cols = width / char_width;
        rows = height / char_height;
        bwave.display_clear();
    }
    
    def write(col: int, row: int, ascii: byte) {
        bwave.mono_glyph(col, row, ascii);
    }
}

`;
const CommandShellv3 =
`
def cmd_max_len = 1000;
var cur_x: int = 0;
var cur_y: int = 0;
def cmd_buf = Array<byte>.new(cmd_max_len);
var cmd_insp = 0; // insertion point
var cmd_len = 0;
var cmd_row = 0; // first row of cmd
var prompt = "bwave: ";
var vterm: VTerm;

def main(args: Array<string>) -> int {
    vterm = VTerm.new(bwave.display_width(), bwave.display_height());
    var i = 0;
    for (c in prompt) vterm.write(i++, 0, c);
    cur_x += prompt.length;
    
    return 0;
}

def cmd_append(c: byte) {
    if (cmd_len == cmd_max_len)
        return;
    cmd_buf[cmd_len++] = c;
    cmd_insp = cmd_len;
    vterm.write(cur_x, cur_y, c);
    if (++cur_x == vterm.cols) {
        cur_x = 0;
        cur_y++;
        if (cur_y == vterm.rows)
            return;
    }
}

def cmd_bkspc() {
    if (cmd_len == 0)
        return;
    cmd_buf[--cmd_len] = ' ';
    if (cur_x == 0) {
        cur_x = vterm.cols - 1;
        cur_y--;
    } else {
        cur_x--;
    }
    vterm.write(cur_x, cur_y, ' ');
}

def Strings_equal(arr1: string, arr2: string) -> bool {
    if (arr1 == arr2) return true;
    if (arr1.length != arr2.length) return false;
    for (i < arr1.length) {
        if (arr1[i] != arr2[i]) return false;
    }
    return true;
}

def get_events(argc: int) -> Array<string> {
    var args = Array<string>.new(argc);
    for (i < argc) {
        var len = bwave.event_len(i);
        var str = Array<byte>.new(len);
        bwave.event_copy(i, Pointer.atContents(str), len);
        args[i] = str;
    }
    return args;
}

// bwave.event_copy(bwave.event_len-1) destructively consumes count events
export def reenter(event_count: int) {
    var events = get_events(event_count);
    for (str in events) {
        System.puts("Got event string: ");
        System.puts(str);
        if (str.length == 1)
            cmd_append(str[0]);
        else {
            if (Strings_equal(str, "Backspace")) {
                cmd_bkspc();
            } else if (Strings_equal(str, "Space")) {
                cmd_append(' ');
            }
        }
    }
}
`;

//run_cmd("Aeneas -compile -target=wasm foo.v3 System.v3 RiRuntime.v3 bwave.v3",
//function() { runtime_exec(null, null, null, function() { run_cmd("foo"); }) });

})(self);