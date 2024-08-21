# Earth wallpaper  

Show animated image of earth as a wallpaper.

## Requirements  

At the time latest LTS Node.js is v20.16.0 and npm 10.8.1.  

`npm list`  
├── electron@20.0.0  
├── koffi@2.9.0  
├── moment@2.30.1  
├── ref-napi@3.0.3  
└── ref-struct-di@1.1.1  

## NVM - Node Version Manager  
For convenience purposes install NVM for windows from https://github.com/coreybutler/nvm-windows  

## NodeJS  
NodeJS is required for electron.  
https://nodejs.org/en  

## Electron  
https://www.electronjs.org/docs/latest/  

Electron is used to creare chromium based browser window that shows our desired wallpaper.  

Note: We must use electron version 20.0.0, because otherwise ref-napi would throw "Error in native callback", which gets fixed with older Electron version. Ref: stackoverflow.com/questions/75668307/error-in-native-callback-using-ffi-napi-in-electron-and-electron-builder  

### Installation  
```
npm install electron@20.0.0
```  

## Koffi  
https://koffi.dev/  

Koffi is C FFI (Foreign-Function Interface) module for Node.js  
Using Koffi we can access user32.dll and use Windows API to modify the app window.  

### Installation  
```
npm install koffi
```

## ref-napi  

https://github.com/node-ffi-napi/ref-napi  

With ref-napi we can turn buffers into "pointers".  

### Installation  
```
npm install ref-napi
```

## ref-struct-di  

https://github.com/node-ffi-napi/ref-struct-di  

This let's us do "struct" implementation on top of Node.js buffers.  

### Installation  
```
npm install ref-struct-di
```

## Moment.js  

https://momentjs.com/  

For date and time parsing and formating.  

```
npm install moment --save  
```


After some research I came to the conclusion that using JS (Node.js) for the scheduled checking of images and it's handling wasn't the best option, since it would be more heavy task's which isn't suitable for JS. I decided to look if I can do all the more demanding work (Scheduled web requests, image saving and editing) in C and use Koffi utilize it.

This seemed possible after doing some testing.

test.h  
```c
#ifndef TEST_H
#define TEST_H

int test_sum(int a, int b);

#endif
```

test.c  
```c
#include "test.h"

int test_sum(int a, int b) {
    return a + b;
}
```

Compiled into shared library.
```
gcc -shared -Os -s -o test.dll test.c

-shared: This flag tells the compiler to create a shared library rather than a standard executable. On Windows, this results in a .dll file.
-Os: This flag optimizes the code for size, making the output file smaller.
-s: This flag strips the symbol table and relocation information from the final executable, which reduces its size.
-o test.dll: This specifies the output file name.
```

This was added to original index.js.  
```js
const test = koffi.load('../Backend/test.dll')
const test_func = test.func('int test_sum(int a, int b)')

let test_ret = test_func(2, 4)
console.log(test_ret)
```

This returned 6.  


To get libcurl work on Windows/VS Code...

1. Download pre-build windows version of libcurl. https://curl.se/download.html#Win64  
2. Extract to folder. (Earth-Wallpaper/Backend)
3. Include in code. #include <curl/curl.h>
4. Set include and library paths in compile.  
```gcc
gcc -o myprogram test.c -I libcurl\include -L libcurl\lib -lcurl
```  
NOTE: Add folder containing headers in to the "Include path" settings in VS Code. (Ctrl+Shift+P (or View -> Command Palette) -> "C/C++: Edit Configurations (UI) -> "Include path" -> "Backend/libcurl/** )  

This would compile, but running the program in VS Code/terminal would not produce any signs of life and seemed to have crashed without any errors or give exception "Exception has occurred: Error: Failed to load shared library: The specified module could not be found.". After I tried launching the program by double-clicking the .exe from file explorer, I got error "The Code execution cannot proceed because libcurl-x64.dll was not found.". After reading https://stackoverflow.com/questions/47278354/libcurl-x64-dll-was-not-found I tried copying libcurl/bin/libcurl-x64.dll to same folder where the .exe file was, the program started working.  

Next problem happened when performing web request using curl_easy_perform(). When requesting HTTP site program worked, but using HTTPS gave error "SSL peer certificate or SSH remote key was not OK". 

```c
// Succesful.
curl_easy_setopt(curl, CURLOPT_URL, "http://example.com");
// Request fails and gives error.
curl_easy_setopt(curl, CURLOPT_URL, "https://example.com");
```

This seemed like certificate problem, which was fixed by following steps:
1. Download cacert.pem from https://curl.se/docs/caextract.html  
2. Add following line in code to use the cert `curl_easy_setopt(curl, CURLOPT_CAINFO, "libcurl/bin/cacert.pem");`  

After this requesting HTTPS sites was possible.

For final shared library I used command: `gcc -shared -Os -s -o web.dll web.c -I libcurl\include -L libcurl\lib -lcurl`  



For debugging C file, edit .vscode/tasks.json.
```
        {
            "type": "cppbuild",
            "label": "C/C++: gcc.exe build active file",
            "command": "C:\\msys64\\ucrt64\\bin\\gcc.exe",
            "args": [
                "-fdiagnostics-color=always",
                "-g",
                "${file}",
                "-o",
                "${fileDirname}\\${fileBasenameNoExtension}.exe",
                "-I.\\libcurl\\include",
                "-L.\\libcurl\\lib",
                "-lcurl"
            ],
            "options": {
                "cwd": "${fileDirname}"
            },
            "problemMatcher": [
                "$gcc"
            ],
            "group": {
                "kind": "build",
                "isDefault": true
            },
            "detail": "Task generated by Debugger."
        }
```

Uncomment or add int main(void) to the file.
Build and run the C-file. This will create .exe in the folder.