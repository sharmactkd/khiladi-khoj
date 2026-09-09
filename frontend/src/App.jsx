import { ArrowRight, BarChart3, CalendarCheck2, Cloud, CreditCard, Menu, Network, Settings2, ShieldCheck, Sparkles, Trophy, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { site } from "./config/site";
import khiladiShield from "./assets/brand/khiladi-shield.png";
import "./App.css";
import "./ProductBackgrounds.css";
import IdentityMenu from "./components/auth/IdentityMenu";
import SsoStart from "./components/auth/SsoStart";

const products = [
  { id:"academy", number:"01", label:"Academy operations", title:"KHILADI Academy Manager", icon:Users, url:site.academyUrl, description:"Students, attendance, fees, batches and memberships—managed beautifully in one secure workspace.", features:[[Users,"Student records"],[CalendarCheck2,"Smart attendance"],[CreditCard,"Fees & memberships"],[BarChart3,"Reports & insights"]] },
  { id:"tournament", number:"02", label:"Event & competition", title:"KHILADI Tournament Manager", icon:Trophy, url:site.tournamentUrl, description:"Create tournaments, manage entries, build brackets and publish results with complete control.", features:[[Settings2,"Tournament setup"],[Users,"Entries & teams"],[Network,"Brackets & tie sheets"],[Trophy,"Results & awards"]] },
];

function Brand() {
  return <a className="brand" href="#top" aria-label="KHILADI home"><img className="brand-logo" src={khiladiShield} alt=""/><span><strong>KHILADI</strong><small>Sports Management Ecosystem</small></span></a>;
}

function Header() {
  const [open,setOpen]=useState(false);
  useEffect(()=>{const close=(event)=>event.key==="Escape"&&setOpen(false);window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close)},[]);
  return <header className="header"><div className="container header-inner"><Brand/><button className="menu" onClick={()=>setOpen(!open)} aria-expanded={open} aria-controls="nav" aria-label={open?"Close menu":"Open menu"}>{open?<X/>:<Menu/>}</button><nav id="nav" className={open?"nav open":"nav"} aria-label="Primary"><a href="#platform" onClick={()=>setOpen(false)}>Platform</a><a href="#solutions" onClick={()=>setOpen(false)}>Solutions</a><a href="#academy" onClick={()=>setOpen(false)}>For Academies</a><a href="#tournament" onClick={()=>setOpen(false)}>For Organizers</a><IdentityMenu onNavigate={()=>setOpen(false)}/><a className="nav-cta" href="#solutions" onClick={()=>setOpen(false)}>Explore products</a></nav></div></header>;
}

function Hero() {
  return <section className="hero" id="platform"><div className="hero-bg"/><div className="container hero-inner"><div className="hero-copy"><p className="eyebrow">The future of martial arts management</p><h1>One platform.<br/><span>Every arena.</span></h1><p className="lead">Manage academies, run tournaments and connect your martial arts community through one powerful KHILADI ecosystem.</p><div className="actions"><a className="button primary" href="#solutions">Explore KHILADI <ArrowRight/></a><a className="button ghost" href="#solutions">View solutions</a></div><ul className="trust"><li><ShieldCheck/>Secure by design</li><li><Cloud/>Cloud-powered</li><li><Sparkles/>Built for martial arts</li></ul></div></div></section>;
}

function ProductCard({product}) {
  const MainIcon=product.icon;
  return <article className={`product ${product.id}`} id={product.id}><p className="product-label">{product.number} / {product.label}</p><div className="product-title"><span><MainIcon/></span><div><h2>{product.title}</h2><p>{product.description}</p></div></div><ul className="features">{product.features.map(([Icon,label])=><li key={label}><Icon/><span>{label}</span></li>)}</ul><a className="product-button" href={product.url}>{`Open ${product.title.replace("KHILADI ","")}`}<ArrowRight/></a></article>;
}

function App() {
  if (window.location.pathname === "/sso/start") return <SsoStart/>;
  return <><Helmet><title>KHILADI | Sports Management Ecosystem</title><meta name="description" content="Professional academy and tournament management tools for the martial arts community."/><meta name="theme-color" content="#050b16"/></Helmet><a className="skip" href="#main">Skip to content</a><Header/><main id="main"><Hero/><section className="products" id="solutions"><div className="container"><div className="section-title"><p>Purpose-built solutions</p><h2>Choose your arena</h2><span>Two focused products. One consistent KHILADI experience.</span></div><div className="product-grid">{products.map(product=><ProductCard key={product.id} product={product}/>)}</div></div></section><section className="benefits"><div className="container"><h2>Everything martial arts needs. <span>Finally connected.</span></h2><div className="benefit-grid"><article><ShieldCheck/><div><h3>Secure by design</h3><p>Privacy and modern safeguards at the core.</p></div></article><article><Cloud/><div><h3>Cloud-powered</h3><p>Access professional tools wherever you work.</p></div></article><article><Sparkles/><div><h3>Consistent experience</h3><p>One premium ecosystem across products.</p></div></article><article><BarChart3/><div><h3>Built to scale</h3><p>From local academies to major events.</p></div></article></div></div></section></main><footer><div className="container footer-inner"><Brand/><p>Stronger athletes. Smarter academies. Better tournaments.</p><small>© {new Date().getFullYear()} KHILADI</small></div></footer></>;
}

export default App;
