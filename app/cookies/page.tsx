import Link from "next/link";
export default function Cookies(){
  return <main className="policy-page container"><div className="policy-top"><Link className="brand" href="/">NIMA.</Link><Link href="/shop">Back to shop</Link></div>
    <div className="eyebrow">Cookies & browser storage</div><h1>What the store saves in your browser.</h1>
    <p className="policy-lead">The storefront is designed to work without advertising or social-media tracking embedded in the shopping experience.</p>
    <Policy title="Essential storage"><p>The shopping bag is kept in local browser storage so selected products remain available as you move around the site. A privacy-choice value is also stored locally after you choose a preference.</p></Policy>
    <Policy title="Admin session"><p>Authorized staff use an essential HTTP-only session cookie when signed in to the admin area. It is used for authentication rather than advertising.</p></Policy>
    <Policy title="Analytics and marketing"><p>No optional analytics or advertising technology is required for the core shopping experience. If optional tracking is added later, this policy and the privacy choice interface should be updated before it is enabled.</p></Policy>
    <p className="policy-note">The current page describes the site's implemented storage behavior; future integrations should be reviewed and documented before release.</p>
  </main>;
}
function Policy({title,children}:{title:string;children:React.ReactNode}){return <section className="policy-section"><h2>{title}</h2>{children}</section>}
