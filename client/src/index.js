import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./components/App";

// Import Firebase and FirebaseContext from your Firebase folder
import Firebase, { FirebaseContext } from "./components/Firebase"; // Adjust path if necessary

import * as serviceWorker from "./serviceWorker";

const firebase = new Firebase();

ReactDOM.render(
  <FirebaseContext.Provider value={firebase}>
    <App />
  </FirebaseContext.Provider>,
  document.getElementById("root")
);

serviceWorker.unregister();