# Moki Client

Moki Client is a frontend application written in JavaScript using React. It is
designed to work with the Moki Server API to provide an intuitive user interface
for managing and monitoring IoT devices.

## Getting Started

To get started with Moki Client, follow these steps:

1. Install all required packages by running `npm install`.
2. Start the development server with `npm start`.

When running in development mode, the app uses the `proxy` setting in
`package.json` to redirect all API requests to the Moki Server running at
`http://localhost:5000/`.

Once the server is running, open [http://localhost:3000](http://localhost:3000)
in your browser to view the app.

Any changes you make to the code will automatically reload the app in your
browser. Any errors or warnings will be displayed in the console.

### Running Tests

You can run the test suite in interactive watch mode using the `npm test`
command. See the
[Create React App documentation](https://facebook.github.io/create-react-app/docs/running-tests)
for more information.

### Building for Production

To build the app for production, use the `npm run build` command. This will
generate a production-ready version of the app in the `build` folder, with all
assets correctly bundled and optimized for performance.

### Ejecting

If you are not satisfied with the build tool or configuration choices, you can
"eject" from Create React App at any time. This will remove the single build
dependency from your project and copy all the configuration files and transitive
dependencies (Webpack, Babel, ESLint, etc.) into your project.

This provides full control over the build process and configuration, but be
aware that it is a one-way operation and cannot be undone.

## Learn More

To learn more about React, check out the
[React documentation](https://reactjs.org/). For more information on Create
React App, see the
[Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).
