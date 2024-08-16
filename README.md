# Earth wallpaper  

Show animated image of earth as a wallpaper.

## Requirements  

At the time latest LTS Node.js is v20.16.0 and npm 10.8.1.  

`npm list`  
├── electron@20.0.0  
├── koffi@2.9.0  
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


