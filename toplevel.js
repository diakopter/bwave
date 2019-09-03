
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

    // can used cached .buffer/views only if mem has not grown.
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
    const RGBA_bytes = 4;
	//var wait = ms => new Promise((r, j)=>setTimeout(r, ms));
    function bwave_display_draw(ptr) {
        var result = vdisplay.draw(mem_ref(ptr, RGBA_bytes * vdisplay.height() * vdisplay.width()));
    }
    function bwave_mono_glyph() {
        return vdisplay.mono_glyph();
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
            display_draw: bwave_display_draw,
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
                event_count_committed = event_queue.length
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

function VDisplay() {
    
    var height = 600;
    var width = 800;
    var need_init = true;
    //var context = canvas.getContext('2d');
    
    this.resize = function(height_new, width_new) {
        throw "Not yet implemented: vdisplay.resize"
    };
    
    this.height = function() {
        return height;
    };
    
    this.width = function() {
        return width;
    };
    
    this.draw = function(buf) {
        if (need_init) {
            global.postMessage([3, 60]);
            need_init = false;
        }
        var clone = buf.slice(0);
    //    context.putImageData(new ImageData(clone, width, height), 0, 0);
        global.postMessage([1, clone]);
    };
    
    this.mono_glyph = function() {
        throw "Not yet implemented: vdisplay.mono_glyph"
    };
}

global.vdisplay_bind = function() {
    return new VDisplay();
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
    
    // get device pixels
    def display_height() -> int;
    def display_width() -> int;
    
    def display_draw(buf: Pointer);
    
    def mono_glyph(rgba_foreground: int, rgba_background: int, unicode: int, buf: Pointer);
}
`;

})(self);

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
    var vdisplay = vdisplay_bind(evt.data[0]);
    var cb = evt.data[1];
    var vfs = vfs_mem_make();
    var vprocess_toplevel = vprocess_init(vfs, vdisplay);
    
    vfs._vfs()["VTerm.v3"] = ascii2ab(vtermv3);
    vfs._vfs()["foo.v3"] = ascii2ab(foov3);
    
    onmessage = vprocess_toplevel.get_message_handler();
    setTimeout(function() {
        vprocess_toplevel.invoke("Aeneas -compile -target=wasm -heap-size=500m foo.v3 System.v3 RiRuntime.v3 bwave.v3 VTerm.v3");
        vprocess_toplevel.invoke("foo", cb);
    }, 0);
}

const vtermv3 = `
class VTerm(height: int, width: int) {
    private var backing = Array<byte>.new(4 * height * width);
    def draw() {
        bwave.display_draw(Pointer.atContents(backing));
    }
    def fill(r: byte, g: byte, b: byte, a: byte) {
        for (i < height) {
            for (j < width) {
                backing[4*(i*width+j)+0] = r;
                backing[4*(i*width+j)+1] = g;
                backing[4*(i*width+j)+2] = b;
                backing[4*(i*width+j)+3] = a;
            }
        }
    }
}

`;
const foov3 =
`

def main(args: Array<string>) -> int {
    var vterm = VTerm.new(bwave.display_height(), bwave.display_width());
	System.puts("Hello world!\\n");
    var step = 50;
    for (i=0;i < 256;i=i+step)
    for (j=0;j < 256;j=j+step)
    for (k=0;k < 256;k=k+step) {
    vterm.fill(byte.!(i), byte.!(j), byte.!(k), byte.!(255));
    vterm.draw();
    }
    return 0;
}

def get_events(argc: int) -> Array<string> {
    var args = Array<string>.new(argc);
    /*if (argc > 1) {
        System.puts("got more than 1 arg: ");
        System.puti(argc);
    }*/
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
    }
}
`;

//run_cmd("Aeneas -compile -target=wasm foo.v3 System.v3 RiRuntime.v3 bwave.v3",
//function() { runtime_exec(null, null, null, function() { run_cmd("foo"); }) });

