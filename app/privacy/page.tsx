import Link from "next/link";
export default function Privacy(){
  return <><main className="policy-page container"><div className="policy-top"><Link className="brand" href="/">NIMA.</Link><Link href="/shop">Back to shop</Link></div>
    <div className="eyebrow">Privacy policy</div><h1>How NIMA handles your information.</h1>
    <p className="policy-lead">This policy explains the information NIMA COLLECTION may receive when you browse the store, contact us or place an order.</p>
    <Policy title="Information you provide"><p>At checkout, NIMA may receive your name, phone number, delivery address, order items and any note you choose to provide. We use this information to process orders, arrange delivery and provide customer support.</p></Policy>
    <Policy title="Payment information"><p>The current checkout flow sends the order request through WhatsApp after the order is recorded. Do not send passwords, PINs or other sensitive credentials in an order note.</p></Policy>
    <Policy title="Browser storage"><p>The store uses local browser storage to keep your shopping bag between page visits and to remember your privacy choice. The admin area uses an essential secure session cookie for staff authentication.</p></Policy>
    <Policy title="Sharing"><p>Order details may be shared with people or service providers involved in fulfilling the order, such as delivery support, only as needed to complete the request. NIMA does not sell customer information.</p></Policy>
    <Policy title="Retention and requests"><p>NIMA should retain customer information only for as long as reasonably needed for order handling, support, accounting and legal obligations. For privacy questions or deletion requests, contact NIMA through the published support channel.</p></Policy>
    <Policy title="Updates"><p>This policy may be updated when the store's data practices change. The current version will be posted on this page.</p></Policy>
    <p className="policy-note">This is a store policy template and should be reviewed against the business's actual practices before launch.</p>
  </main></>;
}
function Policy({title,children}:{title:string;children:React.ReactNode}){return <section className="policy-section"><h2>{title}</h2>{children}</section>}
