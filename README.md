ppsspp-debugger
===============

A debugger UI for PPSSPP written in React.


Release
-------

Recent builds are published here:

http://ppsspp-debugger.unknownbrackets.org/


Contributing
------------

Contributions welcome.  New features, bug fixes, anything good for debugging.

### Getting started

First make sure to install [Node.js](https://nodejs.org/) (LTS is fine) and [Yarn](https://yarnpkg.com/).

```sh
git clone https://github.com/unknownbrackets/ppsspp-debugger.git
yarn # or npm install
yarn start
```

This will automatically open a browser with the development version of the app.

### Debugging and editing

Change files in src/, and the app will automatically reload.

Many IDEs work well, including Visual Studio 2017 and vim.  The app runs in
browser, so use the browser's debugger (IDE debuggers are for server-side.)

Note that components aren't re-rendered unless their props or state change.
These are shallow compares, so use `{ ...old, new: 1 }` to update objects.

### Building

```sh
yarn build
```

This will create a `build` directory with files ready for everyday use.

### What's this crazy syntax?

This app uses modern JavaScript syntax + JSX extensions.

 * [Simple React tutorial](https://reactjs.org/tutorial/tutorial.html)
 * [Intro to JSX](https://reactjs.org/docs/introducing-jsx.html)
 * [JavaScript versions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/New_in_JavaScript)
 * [Equality in JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness)


 Features
 --------

  * Connects to local or remote PPSSPPs (as long as not on HTTPS)
  * Supports PPSSPP on desktop, mobile, and consoles
  * CPU debugger with breakpoints
  * Keyboard shortcuts


Credits and Licensing
---------------------

ppsspp-debugger is based upon the old Windows debugger in PPSSPP, especially
thanks to:

 * @hrydgard
 * @Kingcom
 * All contributors to PPSSPP

This code is licensed under GPL 3.0 or later.


Interested in PPSSPP's API?
---------------------------

This debugger uses PPSSPP's WebSocket API, but it can be used by other apps
and tools - complex or simple.  For API issues and questions, check the
[PPSSPP repo](https://github.com/hrydgard/ppsspp).
