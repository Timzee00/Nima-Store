import Link from "next/link";
export default function RefundPolicy(){
  return <main className="policy-page container"><div className="policy-top"><Link className="brand" href="/">NIMA.</Link><Link href="/shop">Back to shop</Link></div>
    <div className="eyebrow">Refund & returns</div><h1>When an order needs to be corrected.</h1>
    <p className="policy-lead">NIMA wants customers to receive what they ordered and to have a clear path when something goes wrong.</p>
    <Policy title="Before delivery"><p>If an order needs to be changed or cancelled, contact NIMA as soon as possible with your order reference. Changes depend on whether the order has already been confirmed or prepared.</p></Policy>
    <Policy title="Damaged, incorrect or missing items"><p>Contact NIMA with your order reference and a clear description of the issue. NIMA can then review the order and decide the appropriate correction, replacement or refund based on the circumstances.</p></Policy>
    <Policy title="Refund method"><p>Where a refund is approved, NIMA will agree the practical refund method with the customer. Processing time can depend on the payment or transfer method used.</p></Policy>
    <Policy title="Personal-use items"><p>For hygiene-sensitive products, including skincare and masks, returns may be subject to additional conditions where the item has been opened or used.</p></Policy>
    <p className="policy-note">The store owner should replace this template with exact return windows, exclusions and statutory rights applicable to the business before publishing.</p>
  </main>;
}
function Policy({title,children}:{title:string;children:React.ReactNode}){return <section className="policy-section"><h2>{title}</h2>{children}</section>}
