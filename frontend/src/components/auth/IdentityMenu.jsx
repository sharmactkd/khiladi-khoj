import { LogIn, LogOut, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { site } from "../../config/site";
import { getCurrentIdentity, logoutIdentity, signInWithGoogle } from "../../services/identityApi";
import { loadGoogleIdentity } from "../../services/googleIdentity";
import "./IdentityMenu.css";

export default function IdentityMenu({ onNavigate }) {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const googleButtonRef = useRef(null);

  useEffect(() => {
    let active = true;
    getCurrentIdentity()
      .then((data) => active && setUser(data.user))
      .catch((requestError) => {
        if (active && requestError.status !== 401) setError("Sign-in status could not be checked.");
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const handleGoogleCredential = useCallback(async ({ credential }) => {
    setLoading(true);
    setError("");
    try {
      const data = await signInWithGoogle(credential);
      setUser(data.user);
      setOpen(false);
      onNavigate?.();
    } catch (requestError) {
      setError(requestError.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  }, [onNavigate]);

  useEffect(() => {
    if (!open || user || !googleButtonRef.current) return undefined;
    let active = true;
    setError("");
    loadGoogleIdentity()
      .then((google) => {
        if (!active || !googleButtonRef.current) return;
        if (!site.googleClientId) throw new Error("Google Client ID is not configured");
        google.accounts.id.initialize({ client_id: site.googleClientId, callback: handleGoogleCredential });
        googleButtonRef.current.replaceChildren();
        google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard", theme: "outline", size: "large", shape: "rectangular", width: 250,
        });
      })
      .catch((loadError) => active && setError(loadError.message));
    return () => { active = false; };
  }, [handleGoogleCredential, open, user]);

  const handleLogout = async () => {
    setLoading(true);
    setError("");
    try {
      await logoutIdentity();
      window.google?.accounts?.id?.disableAutoSelect();
      setUser(null);
      setOpen(false);
    } catch (requestError) {
      setError(requestError.message || "Logout failed.");
    } finally {
      setLoading(false);
    }
  };

  return <div className="identity-menu">
    <button className="identity-trigger" type="button" disabled={loading} onClick={() => setOpen((value) => !value)} aria-expanded={open}>
      {user?.picture ? <img src={user.picture} alt="" referrerPolicy="no-referrer"/> : user ? <UserRound/> : <LogIn/>}
      <span>{loading ? "Checking…" : user?.name || "Sign in"}</span>
    </button>
    {open && <div className="identity-panel" role="dialog" aria-label="KHILADI account">
      <button className="identity-close" type="button" onClick={() => setOpen(false)} aria-label="Close"><X/></button>
      {user ? <>
        <div className="identity-profile">
          {user.picture ? <img src={user.picture} alt="" referrerPolicy="no-referrer"/> : <UserRound/>}
          <div><strong>{user.name}</strong><span>{user.email}</span></div>
        </div>
        <button className="identity-logout" type="button" onClick={handleLogout} disabled={loading}><LogOut/>Sign out</button>
      </> : <>
        <strong className="identity-title">Sign in to KHILADI</strong>
        <p className="identity-copy">One secure account for your KHILADI products.</p>
        <div className="google-signin-slot" ref={googleButtonRef}/>
      </>}
      {error && <p className="identity-error" role="alert">{error}</p>}
    </div>}
  </div>;
}
