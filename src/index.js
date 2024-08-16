const { app, BrowserWindow, screen } = require('electron')
const ref = require('ref-napi')
const Struct = require('ref-struct-di')(ref)
const koffi = require('koffi')

// app.disableHardwareAcceleration()

// Load user32.dll library that we are gonna use modify app windows with Windows API.
const user32 = koffi.load('user32.dll')

/*
Load SetWindowsPos function from the previously loaded user32.dll library.

Loaded function:
bool SetWindowsPos(HWND hWnd, HWND hWndInsertAfter, int X, int Y, int cx, int cy, UINT uFlags)

https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwindowpos
*/
const SetWindowPos = user32.func('__stdcall', 'SetWindowPos', 'bool', ['int32', 'int32', 'int32', 'int32', 'int32', 'int32', 'uint32'])

// BrowserWindow
let win

// This is used to place window at the bottom of the Z-order.
const HWND_BOTTOM = 1

/*
Message about window whose size, position or Z-order is about to change.

https://learn.microsoft.com/en-us/windows/win32/winmsg/wm-windowposchanging
*/
const WM_WINDOWPOSCHANGING = 0x0046

/*
Flags used for SetWindowPos function.
https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwindowpos

NOSIZE: Prevents resizing of the window.
NOMOVE: Prevents window moving.
NOACTIVE: Doesn't activate window.
NOZORDER: Retain current Z-order. 
*/
const SetWindowPos_Flags = {
    NOSIZE: 0x0001,
    NOMOVE: 0x0002, 
    NOZORDER: 0x0004,
    NOACTIVATE: 0x0010
}

/*
Define struct that represents WINDOWPOS struct in Windows API.
Window handle, Z-order, X-position, Y-position, Width, Height, Flags[].

https://learn.microsoft.com/en-us/windows/win32/api/winuser/ns-winuser-windowpos
*/
const WINDOWPOS = Struct({
    hwndInsertAfter: ref.types.int32,
    hwnd: ref.types.int32,
    x: ref.types.int32,
    y: ref.types.int32,
    cx: ref.types.int32,
    cy: ref.types.int32,
    flags: ref.types.uint32,
})


// Create app window.
function createAppWindow() {

    // Get all the monitors.
    const monitors = screen.getAllDisplays()

    // Find specific monitor where we want the wallpaper.
    const secondaryMonitor = monitors.find((display) => {
        // Look for vertical monitor.
        return display.bounds.height == 1920 && display.bounds.width == 1080
    })

    // If monitor found, open the window on that monitor by setting window x and y position.
    // frame: false --> Hide window menu and borders.
    if(secondaryMonitor) {
        win = new BrowserWindow({
            x: secondaryMonitor.bounds.x,
            y: secondaryMonitor.bounds.y,
            frame: false
        })
    }

    // Window ignores all the mouse events, so we can interact normally with windows right click menu.
    win.setIgnoreMouseEvents(true)

    // Set window to not show on taskbar.
    win.setSkipTaskbar(true)
    
    // Maximize the window.
    win.maximize()
    
    // Load html file.
    win.loadFile('src/index.html')

    // Get the handle of the app window.
    let handle = win.getNativeWindowHandle()    // Type: Buffer

    // Get handle buffer as a number.
    handle = ref.types.int64.get(handle, 0)     // Type: Int

    /*
    Send app window to the back of the Z-order and set NOMOVE, NOSIZE and NOACTIVATE flags.
    
    Parameters: Window handle, Z-order, X-position, Y-position, Width, Height, Flags[].
    */
    SetWindowPos(handle, HWND_BOTTOM, 0, 0, 100, 100, SetWindowPos_Flags.NOMOVE | SetWindowPos_Flags.NOSIZE | SetWindowPos_Flags.NOACTIVATE)
}


/*
Add hook to a window.
*/
function AddHook(window, disableZIndexChanging = false) {

    /*
    Hooks a windows message. The callback is called when the message is received in the WndProc.
    https://github.com/electron/electron/blob/20-x-y/docs/api/browser-window.md

    win.hookWindowMessage(message, callback)
    message Integer
    callback Function
        wParam any - The wParam provided to the WndProc
        lParam any - The lParam provided to the WndProc

    
    WM_WINDOWPOSCHANGING message
    https://learn.microsoft.com/en-us/windows/win32/winmsg/wm-windowposchanging

    Sent to a window whose size, position, or place in the Z order is about to change as a result of a call to the SetWindowPos function or another window-management function.
    wParam - This parameter is not used.
    lParam - A pointer to a WINDOWPOS structure that contains information about the window's new size and position.
    */
    window.hookWindowMessage(WM_WINDOWPOSCHANGING, (wParam, IParam) => {

        // Allocate 8-byte buffer.
        let IParam2 = Buffer.alloc(8)

        // Clone the WINDOWPOS struct type to IParam2 buffer we created.
        IParam2['type'] = ref.refType(WINDOWPOS)

        // Copy IParam content to IParam2, which we will be modifying.
        IParam.copy(IParam2)

        // Dereference IParam2 pointer to buffer of our WINDOSPOS struct.
        let structDataBuffer = IParam2['deref']()

        // Convert the buffer to JavaScript object that represents the WINDOWSPOS struct.
        let windowPos = structDataBuffer['deref']()

        if(disableZIndexChanging) {
            // Add NOZORDER flag to already existing flags in windowPos.
            let newFlags = windowPos.flags | SetWindowPos_Flags.NOZORDER

            // Write the modified flags to the struct buffer in the 6th place which is the flags.
            structDataBuffer.writeUint32LE(newFlags, 6)
        }
    })
}


// Wait for app to be ready.
app.whenReady().then(() => {

    // Create wallpaper window.
    createAppWindow()

    // Add hook 
    AddHook(win, true)
})
