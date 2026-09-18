import Link from "next/link";
export default function Accessibility(){
  return <main className="policy-page container"><div className="policy-top"><Link className="brand" href="/">NIMA.</Link><Link href="/shop">Back to shop</Link></div>
    <div className="eyebrow">Accessibility</div><h1>The store should be usable by more people.</h1>
    <p className="policy-lead">NIMA is built with readable contrast, labeled controls, keyboard-friendly forms, descriptive product image text and responsive layouts in mind.</p>
    <Policy title="Current accessibility measures"><p>Interactive controls have accessible labels, forms use visible labels, product images use descriptive alternative text, and the menu and dialogs are designed to be operable without a mouse.</p></Policy>
    <Policy title="Feedback"><p>Accessibility issues can be reported through the NIMA contact page. Include the page, device or browser and the part of the experience that caused difficulty.</p></Policy>
    <Policy title="Ongoing improvements"><p>Accessibility is treated as an ongoing quality check rather than a one-time feature. New pages, products, embeds and third-party services should be reviewed before release.</p></Policy>
  </main>;
}
function Policy({title,children}:{title:string;children:React.ReactNode}){return <section className="policy-section"><h2>{title}</h2>{children}</section>}
