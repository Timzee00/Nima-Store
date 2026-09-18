import Link from "next/link";import { PrivacySettings } from "@/components/privacy-settings";
export default function Cookies(){
  return <main className="policy-page container"><div className="policy-top"><Link className="brand" href="/">NIMA.</Link><Link href="/shop">Back to shop</Link></div>
    <div className="eyebrow">Cookies & browser storage</div><h1>What the store saves in your browser.</h1>
    <p className="policy-lead">NIMA uses browser storage only for core store functions and, when you allow preferences, to remember your chosen theme.</p>
    <Policy title="Essential storage"><p>The shopping bag is kept in local browser storage so selected products remain available as you move around the site. Your privacy choice is stored in a consent cookie so the banner does not keep asking after you have made a choice.</p></Policy>
    <Policy title="Theme preference"><p>Dark or light theme can be changed at any time. When you choose Allow preferences in the privacy banner, the selected theme is remembered between visits. With Essential only, the theme can still be changed for the current visit, but the preference is not retained as a persistent preference.</p></Policy>
    <Policy title="Admin session"><p>Authorized staff use an essential HTTP-only session cookie when signed in to the admin area. It is used for authentication rather than advertising.</p></Policy>
    <Policy title="Analytics and marketing"><p>No optional analytics, advertising pixels or social-media tracking technology is enabled by the current storefront implementation. Any future optional tracking should be documented and gated behind an appropriate privacy choice before activation.</p></Policy>
    <div className="policy-action card"><div><div className="eyebrow">Change your choice</div><h2>Manage privacy settings.</h2><p>Reset your choice to reopen the privacy banner and choose Essential only or Allow preferences again.</p></div><PrivacySettings/></div>
  </main>;
}
function Policy({title,children}:{title:string;children:React.ReactNode}){return <section className="policy-section"><h2>{title}</h2>{children}</section>}
