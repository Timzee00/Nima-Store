import Link from "next/link";
export default function RefundPolicy(){
  return <main className="policy-page container"><div className="policy-top"><Link className="brand" href="/">NIMA.</Link><Link href="/shop">Back to shop</Link></div>
    <div className="eyebrow">Refund & returns</div><h1>When an order needs to be corrected.</h1>
    <p className="policy-lead">NIMA wants customers to receive what they ordered and to have a clear path when something goes wrong.</p>
    <Policy title="Before delivery"><p>If an order needs to be changed or cancelled, contact NIMA as soon as possible with your order reference. Changes depend on the order's current stage and any rights that apply to the transaction.</p></Policy>
    <Policy title="Incorrect, defective or missing items"><p>Contact NIMA with your order reference and a clear description of the issue. NIMA will review the order and arrange the appropriate remedy where applicable, which may include correction, replacement or refund.</p></Policy>
    <Policy title="Refunds and returns"><p>This policy does not remove any consumer rights that apply under Nigerian law. NIMA should provide clear information about material restrictions, return conditions and any reasonable cancellation or refund charges before completing a transaction.</p></Policy>
    <Policy title="Hygiene-sensitive products"><p>For hygiene-sensitive products, including skincare and masks, return conditions may differ where an item has been opened or used, subject to applicable consumer rights.</p></Policy>
    <Policy title="Complaints"><p>For an order complaint, contact NIMA through the published support channel with your order reference. The support route should be kept easy to find and used for prompt complaint handling.</p></Policy>
    <p className="policy-note">The store owner should replace this template with exact return windows, exclusions, delivery terms and complaint response targets after reviewing the business's actual practices and applicable law.</p>
  </main>;
}
function Policy({title,children}:{title:string;children:React.ReactNode}){return <section className="policy-section"><h2>{title}</h2>{children}</section>}
