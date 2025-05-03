// pages/_app.js
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { getSession } from "../lib/session";

function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

// We don't need to apply session middleware here
// The middleware should be applied in API routes and getServerSideProps
export default App;
