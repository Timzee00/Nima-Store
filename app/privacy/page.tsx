import Link from "next/link";
export default function Privacy(){
  return <><main className="policy-page container"><div className="policy-top"><Link className="brand" href="/">NIMA.</Link><Link href="/shop">Back to shop</Link></div>
    <div className="eyebrow">Privacy policy</div><h1>How NIMA handles your information.</h1>
    <p className="policy-lead">This policy explains the information NIMA COLLECTION may receive when you browse the store, contact us or place an order.</p>
    <Policy title="Information you provide"><p>At checkout, NIMA may receive your name, phone number, delivery address, order items and any note you choose to provide. We use this information for order processing, delivery coordination and customer support.</p></Policy>
    <Policy title="Why we process it"><p>Information should be collected for clear, legitimate purposes and limited to what is necessary for those purposes. Order information may also need to be retained where required for accounting, dispute handling or another legal obligation.</p></Policy>
    <Policy title="Payment and WhatsApp"><p>The current checkout flow records the order and then prepares a WhatsApp message to the store's configured number. Do not include passwords, card PINs or other sensitive credentials in an order note.</p></Policy>
    <Policy title="Browser storage"><p>The store uses local browser storage for the shopping bag and privacy-choice preference. The admin area uses an essential HTTP-only session cookie for staff authentication.</p></Policy>
    <Policy title="Sharing"><p>Order details may be shared with people or service providers involved in fulfilling an order, such as delivery support, only as needed for the relevant purpose. NIMA does not sell customer information.</p></Policy>
    <Policy title="Your privacy rights"><p>Subject to applicable law and its conditions, you may have rights to be informed about processing, access your data, request correction or erasure, object to or restrict certain processing, request portability, withdraw consent where consent is the lawful basis, and complain to the relevant supervisory authority.</p></Policy>
    <Policy title="Privacy requests and complaints"><p>Contact NIMA through the published support channel with your order reference and the privacy request you are making. NIMA should verify the request where necessary and respond in line with applicable requirements.</p></Policy>
    <Policy title="Updates"><p>This policy may be updated when the store's data practices change. The current version will be posted on this page.</p></Policy>
    <p className="policy-note">This page is designed around the store's currently implemented data flow and general Nigerian data-protection principles. It is not legal advice and should be reviewed against the business's exact processing activities before launch.</p>
  </main></>;
}
function Policy({title,children}:{title:string;children:React.ReactNode}){return <section className="policy-section"><h2>{title}</h2>{children}</section>}
