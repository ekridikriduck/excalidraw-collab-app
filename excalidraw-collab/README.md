# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

## Running the app locally
Make sure to add env variables in a .env.local file in the root of the project. The variables are:
- REACT_APP_SOCKET_BACKEND_URL: The url of the socket backend
- REACT_APP_WC_PROJECT_ID: The project id of the webchat project

Intall dependencies with `yarn` and run the app with `yarn start`.

Make sure that the collab server is running on port `8080`

