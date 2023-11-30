# Framework Laptop 16 LED Matrix Input Module Control

[View it in your browser.](https://ledmatrix.frame.work)

This little web app can directly connect to the Framework Laptop 16 LED matrix
Input Module. You need to be running a browser based on Chrome (Edge, Chromium,
Opera, etc.).

To start, simply open `index.html`. There is no server to run. If you want, you
can boot a simple web server with Python: `python3 -m http.server`

Use the "Connect Left" and "Connect Right" buttons to connect to each
respective Input Module. Draw on each input browser in your browser, and it
will automatically update the LED matrix.

Click and drag to draw, CTRL + click to erase.

Brightness can also be adjusted using the slider.

## More Information

- [Framework Laptop 16](https://frame.work/products/laptop16-diy-amd-7040)
- [LED Matrix Firmware](https://github.com/FrameworkComputer/inputmodule-rs)
- [LED Matrix Hardware](https://github.com/FrameworkComputer/inputmodules)

## Dot Matrix Tool

This repository is based on code from https://github.com/stefangordon/dotmatrixtool.
See also http://dotmatrixtool.com

## Hosting

The application is hosted on Cloudflare Pages and automatically deployed to
production when code is pushed to the `usbserial` branch and to preview
application when a pull request is opened.

## Contributing

Contributions are welcome. Submit pull requests to the `usbserial` branch.

When preparing your pull request, please be sure:

1. the tool still works with connected LED Matrix Input Modules
2. the HTML is still valid (Node.js installation required): `make validate`
