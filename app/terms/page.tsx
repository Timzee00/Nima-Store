import Link from "next/link";
export default function Terms(){
  return <main className="policy-page container"><div className="policy-top"><Link className="brand" href="/">NIMA.</Link><Link href="/shop">Back to shop</Link></div>
    <div className="eyebrow">Terms & conditions</div><h1>The rules for using the store.</h1>
    <p className="policy-lead">By using NIMA COLLECTION's website, you agree to use it lawfully and to provide accurate information when placing an order.</p>
    <Policy title="Products and prices"><p>Product descriptions, images, availability and prices are presented as accurately as practical. Stock can change, and an order request is not a final confirmation until NIMA confirms it.</p></Policy>
    <Policy title="Orders"><p>Submitting checkout details creates an order request. NIMA may contact you through the provided phone or WhatsApp channel to confirm availability, delivery and any final order details.</p></Policy>
    <Policy title="Customer information"><p>You are responsible for providing a reachable phone number and a delivery address that is sufficient for the requested delivery.</p></Policy>
    <Policy title="Website use"><p>Do not attempt to interfere with the store, bypass security controls, upload malicious content or misuse another person's information.</p></Policy>
    <Policy title="Changes"><p>NIMA may update products, prices, policies or website features as the business develops. The current website version and published policies apply to future orders.</p></Policy>
    <p className="policy-note">This is a general store terms template and should be reviewed for the business's exact legal and commercial requirements.</p>
  </main>;
}
function Policy({title,children}:{title:string;children:React.ReactNode}){return <section className="policy-section"><h2>{title}</h2>{children}</section>}
