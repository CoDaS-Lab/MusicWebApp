# MusicWebApp

The development of this project is supported by grant NSF-1549981

The Web application of the music player is hosted independently from the backend API.
The application is developed using HTML, CSS and JavaScript using ExpressJS as web framework.

The web application uses the API url stored in `route` variable inside `/public/js/exp.js` file.
The dependencies for the application can be found in `package.json`.

### Start the server
To run on a local machine replace `process.env.PORT` and `process.env.IP` with local port and IP address values inside `app.js` file. The server can be started by running `app.js` using NodeJS.
