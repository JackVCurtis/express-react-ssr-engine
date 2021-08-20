# express-react-ssr-engine

## UNDER CONSTRUCTION

`express-react-ssr-engine` is a view engine for `express` with a built-in compilation and server-side-rendering capabilities for React. It offers an alternative approach to NextJS for enabling easy integration of isomorphic Javascript or Typescript with SSR and multiple React app entrypoints. The approach is intended to produce a flexible library that can be easily integrated into an existing `express` stack without configuring a build pipeline. It accomplishes this by compiling views at runtime during server startup, so be aware of the tradeoffs that decision represents - ensure that you have a proper CI pipeline in place to mitigate the risk of deploying a bad frontend build.

This library is a work in progress. Contributions and constructive criticism are welcome. Current priorities are:
1. Local development speed + experience
2. Hardening the production environment
3. Benchmarking - I have no idea how to do this properly, guidance here is especially welcome

## Basic Usage
Install peer dependencies:
```
npm i --save @babel/core @babel/preset-env @babel/preset-react @babel/preset-typescript @babel/types babel-loader file-loader react react-dom sass sass-loader
``` 
Note that because compilation is done at runtime, `webpack` packages are regular dependencies, not dev dependencies.

Install the library
```
npm i --save @jackvcurtis/express-react-ssr-engine
```

### Folder Structure

```
- path/to/server
    - /components   
        - /styles
            - non-entry-point-component.scss
        - non-entry-point-component.jsx
    - /views
        - /styles
            - entry-point-component.scss
        - /templates
            - layout.hbs
        - entry-point-component.jsx
    - server-entry-point.js
```

#### Views
`express-react-ssr-engine` expects your view directory to follow a specific structure.
Each file must also export a functional React component _by default_. Props are passed from the server to the view via the `res.render` method, like so:

```javascript
app.get('/', (req, res) => res.render( { props: { /* your props here */} } ))
```
 Every file in your view directory will be treated as an _entry point_ to a React app, and will be _independently compiled_. That means if you place your reusable components inside your view directory, they will be unnecessarily compiled - instead, place a `/components` directory at the same level as your view directory, and `import` them into your main views. Styles from these components currently have to be imported independently in the `/styles` directory within your view directory (see Styles section below).

#### Layout

Inside your view directory create a directory `/templates` and add a Handlebars file called `layout.hbs`. `express-react-ssr-engine` will look for this file and render it whenever a view is loaded, passing in five variables: `{{reactHtml}}`, `{{reactScriptPath}}`, `{{reactProps}}`, `{{stylePath}}` and `{{nodeEnv}}`. Additionally variables can be passed to `req.render` like so:

```javascript
app.get('/', (req, res) => res.render( { props: { /* your props here */} }, template: { /* your template variables here */} ))
```

Sample `layout.hbs`:

```handlebars
<!DOCTYPE html>
<html>
    <head>
        <link rel="stylesheet" type="text/css" href="{{stylePath}}">
        
        <script crossorigin src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
        <script crossorigin src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>
        <script src="{{reactScriptPath}}"></script>
    </head>
    <body>
        <div id="root">
            {{{reactHtml}}}
        </div>
        <script>
            ReactDOM.hydrate(React.createElement(App.default, {{{reactProps}}}), document.getElementById("root"))
        </script>
    </body>
</html>
```

#### Styles

Unlike single-page React apps built with `create-react-app`, `express-react-ssr-engine` does not support importing non-Javascript or Typescript files into your components. Instead `.scss` files are compiled independently and provided to `layout.hbs` throuh the `{{stylePath}}` variable. The engine assumes your view directory will contain a `/styles` directory that mirrors the structure of your view directory, including file names (but not extensions). It will then match the view file with the corresponding style file. Any non-stylesheet, non-JS/TS files can be served through `express.static`.

### Compile and Register

```javascript
const express = require('express')
const { ReactSSREngine } = require('@jackvcurtis/express-react-ssr-engine')

async function main() {
    const app = express()
    const engine = new ReactSSREngine(path.join(__dirname, 'path/to/your/views', { /* optional options object */ }))
    await engine.compile()
    engine.registerOn(app)
    app.get('/', (req, res) => res.render('viewname', { props: { foo: 'bar' }}))
    app.listen(3000)
}

main()
```

## Options
- `externals`:  Many popular frontend libraries provide CDN hosting. If you want to use the CDN version (which you should!), you need to register it in the `externals` option using the webpack `object` syntax: https://webpack.js.org/configuration/externals/#object (ignore the warning, `libraryType` is in fact `umd` under the hood). 
- `fileExtension`: Should be `js`, `ts`, `jsx`, or `tsx`. This tells the engine which file extension your view components use. For Typescript apps this will have to changed based on your environment (compiled vs. running with `ts-node` or `jest`). By default the engine will assume `tsx` if `ts-node` is in use and `js` otherwise.

More to come...

## Usage with Typescript
`tsconfig.json`:

```json
    {
    "compilerOptions": {
      "lib": ["es2020", "es6", "dom"],
      "module": "commonjs",
      "target": "es2019",
      "esModuleInterop": true,
      "outDir": "./build",
      "moduleResolution": "node",
      "jsx": "react-jsx",
      "baseUrl": ".",
    }
}
```
After compiling with `tsc`, _any non-Typescript files in your view directory must be copied over to your build directory._ That means you will have to copy over the `/styles` directory after compilation.

When running with `ts-node` or `jest`, you will have to ensure that the `fileExtension` option is set appropriately (e.g. `.tsx`). After compilation, ensure this option is set to `.js`.

## Usage with Jest

As jest needs to run in two environments (the DOM and the Node.js server), we need to use multiple config files. In your root directory, the default `jest.config.js` should look like this:

```javascript
module.exports = {
    "projects": ["<rootDir>/path/to/jest.dom.config.js", "<rootDir>/path/to/jest.node.config.js"],
}
```

And in the location specified in `jest.config.js`, place a config file for the DOM:

```javascript
module.exports = {
    name: "dom-tests",
    displayName: "DOM Tests",
    clearMocks: true,
    // Optional preset for Typescript
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    roots: [
        '<rootDir>/relative/path/to/views',
        '<rootDir>/relative/path/to/components'
    ],
}
```


And another for Node:

```javascript
module.exports = {
    name: "node-tests",
    displayName: "Node Tests",
    clearMocks: true,
    // Optional preset for Typescript
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: [
        "/dist/",
        "/build/",
         "/node_modules/", 
         "/views/",
         "/components/"
    ],
    roots: [
        '<rootDir>/relative/path/to/jest.config.js/'
    ],
}
```

Note that if `process.env.NODE_ENV == "test"`, `express-react-ssr-engine` will not compile to disk, instead using a mock file system via `memfs`. Jest will set this variable for you automatically.

## Usage with Throng

```typescript
const engine = new ReactSSREngine(path.join(__dirname, 'views'), { /* optional options object */ })

throng({
    master: async function() {
        await engine.compile()
    },
    worker: async function () {
        const app = express()
        engine.registerOn(app)
        await configureServer(app)
        app.listen(3000)
        console.log("Server listening on 3000")
    },
    count: THREAD_COUNT
})
```

