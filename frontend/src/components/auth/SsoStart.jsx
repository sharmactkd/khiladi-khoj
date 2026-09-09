import { ArrowRight, ShieldCheck, UserRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import khiladiShield from "../../assets/brand/khiladi-shield.png";
import { site } from "../../config/site";
import {
  authorizeProduct,
  getCurrentIdentity,
  signInWithGoogle,
} from "../../services/identityApi";
import { loadGoogleIdentity } from "../../services/googleIdentity";
import "./SsoStart.css";

const PRODUCT_CONFIG = Object.freeze({
  academy: {
    label: "KHILADI Academy Manager",
    redirectUri: "https://academy.khiladi-khoj.com/auth/sso/callback",
  },
  tournament: {
    label: "KHILADI Tournament Manager",
    redirectUri: "https://tournaments.khiladi-khoj.com/auth/sso/callback",
  },
});

const isPkceChallenge = (value) => /^[A-Za-z0-9_-]{43}$/.test(value || "");
const isValidState = (value) => typeof value === "string" && value.length >= 16 && value.length <= 512;

const readRequest = () => {
  const params = new URLSearchParams(window.location.search);
  const product = params.get("product") || "";
  const redirectUri = params.get("redirect_uri") || "";
  const codeChallenge = params.get("code_challenge") || "";
  const state = params.get("state") || "";
  const config = PRODUCT_CONFIG[product];
  const valid = Boolean(
    config &&
      redirectUri === config.redirectUri &&
      isPkceChallenge(codeChallenge) &&
      isValidState(state)
  );
  return { valid, product, redirectUri, codeChallenge, state, config };
};

export default function SsoStart() {
  const request = useMemo(() => readRequest(), []);
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(request.valid);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(request.valid ? "" : "This sign-in request is invalid or is not allowed.");
  const googleButtonRef = useRef(null);

  useEffect(() => {
    if (!request.valid) return undefined;
    let active = true;
    getCurrentIdentity()
      .then((data) => active && setUser(data.user))
      .catch((requestError) => {
        if (active && requestError.status !== 401) {
          setError("Your KHILADI sign-in status could not be checked. Please try again.");
        }
      })
      .finally(() => active && setChecking(false));
    return () => { active = false; };
  }, [request.valid]);

  const completeAuthorization = useCallback(async () => {
    if (!request.valid || working) return;
    setWorking(true);
    setError("");
    try {
      const data = await authorizeProduct(request);
      const target = new URL(data.redirectUrl);
      if (target.origin !== new URL(request.redirectUri).origin || target.pathname !== new URL(request.redirectUri).pathname) {
        throw new Error("The authorization response contained an invalid redirect.");
      }
      window.location.replace(target.toString());
    } catch (requestError) {
      setError(requestError.message || "The secure handoff could not be completed.");
      setWorking(false);
    }
  }, [request, working]);

  const handleGoogleCredential = useCallback(async ({ credential }) => {
    if (!credential) {
      setError("Google did not return a sign-in credential.");
      return;
    }
    setWorking(true);
    setError("");
    try {
      const data = await signInWithGoogle(credential);
      setUser(data.user);
    } catch (requestError) {
      setError(requestError.message || "Google Sign-In failed.");
    } finally {
      setWorking(false);
    }
  }, []);

  useEffect(() => {
    if (!request.valid || checking || user || !googleButtonRef.current) return undefined;
    let active = true;
    loadGoogleIdentity()
      .then((google) => {
        if (!active || !googleButtonRef.current) return;
        if (!site.googleClientId) throw new Error("Google Client ID is not configured.");
        google.accounts.id.initialize({ client_id: site.googleClientId, callback: handleGoogleCredential });
        googleButtonRef.current.replaceChildren();
        google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard", theme: "outline", size: "large", shape: "rectangular", width: 300,
        });
      })
      .catch((loadError) => active && setError(loadError.message));
    return () => { active = false; };
  }, [checking, handleGoogleCredential, request.valid, user]);

  return <main className="sso-page">
    <section className="sso-card" aria-labelledby="sso-title">
      <img className="sso-logo" src={khiladiShield} alt="" />
      <p className="sso-eyebrow">KHILADI Secure Sign-In</p>
      <h1 id="sso-title">Continue to {request.config?.label || "KHILADI"}</h1>
      <p className="sso-copy">Your password and permanent session token will never be placed in the browser URL.</p>

      {checking ? <p className="sso-status" role="status">Checking your secure session…</p> : null}

      {!checking && request.valid && !user ? <>
        <div className="sso-google-slot" ref={googleButtonRef} />
        <p className="sso-note"><ShieldCheck /> Sign in once with your central KHILADI account.</p>
      </> : null}

      {!checking && request.valid && user ? <>
        <div className="sso-user">
          {user.picture ? <img src={user.picture} alt="" referrerPolicy="no-referrer" /> : <UserRound />}
          <div><strong>{user.name}</strong><span>{user.email}</span></div>
        </div>
        <button className="sso-continue" type="button" onClick={completeAuthorization} disabled={working}>
          {working ? "Creating secure handoff…" : `Continue to ${request.config.label}`}
          {!working ? <ArrowRight /> : null}
        </button>
      </> : null}

      {error ? <p className="sso-error" role="alert">{error}</p> : null}
      <a className="sso-cancel" href="/">Cancel and return to KHILADI</a>
    </section>
  </main>;
}
