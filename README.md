
# QRSCRIPT (Quick response script)

This future library will be able to transform html, css and javascript in QRCODE, this QRCODE will be possible readed by app, and execute your web page without internet, in other words, download of app without internet, this apparently is not a very until, but look the use cases: 

Just point the camera and:
1 - lightweight games can be read and played anywhere in the world.
2 - I can load supermarket promotions without the need for a flyer, with just a qrcode.
3 - I can load a restaurant menu in the user smartphone.
4 - I can load a small video tutorial without internet.

These are only some use cases I can think of, but it's possible to go further.

To run just access a folder application and run the command with nodemon
### <code>nodemon index.ts qrs ['build | 'init']</code>

## INIT
- <code>[init]</code> Create an file with the configurations to minification of code.

### EXAMPLE: <code>nodemon index.ts qrs init</code>

## BUILD
- <code>[build]</code> Minimizes the code (HTML, CSS, JS) according to the settings applieds on the file <b>qrs_config.json</b>, before minifying the code, recode and compress, and generates an list of qrcode, paging your code in images.

### EXAMPLE: <code>nodemon index.ts qrs build</code>

In the application, the process of joining the qr code, unpacking and executing the pure code is done. For this it is necessary that the user reads more than one qrcode in some cases.
