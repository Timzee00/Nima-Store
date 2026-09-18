import Link from "next/link";
import { StoreHeader } from "@/components/store-header";

const items=[
  ["How do I place an order?","Add the products you want to your shopping bag, enter your name, phone number and delivery address, accept the privacy notice, then choose Order via WhatsApp. The site records the order request and prepares the WhatsApp message for NIMA."],
  ["What happens after I send the WhatsApp message?","The message contains your order reference and the details you entered. NIMA can then confirm availability, delivery arrangements and the next steps with you."],
  ["Can I change or cancel an order?","Contact NIMA as soon as possible with your order reference. Whether a change or cancellation is possible can depend on the order's current stage and applicable consumer rights."],
  ["How do I know whether a product is available?","Product stock shown on the site is the current catalogue value. Because stock can change quickly, the checkout also checks availability before creating the order."],
  ["How are payments handled?","The current site does not collect card details. It records the order request and opens WhatsApp for direct confirmation. NIMA will provide the applicable payment instructions during order handling."],
  ["What if I receive the wrong, damaged or incomplete order?","Contact NIMA with your order reference and describe the issue. The store's refund and returns policy explains the general complaint path, and applicable consumer rights still apply."],
  ["Do you deliver everywhere in Nigeria?","Delivery coverage and fees are confirmed by NIMA during order handling. The current checkout does not assume a single nationwide delivery price."],
  ["Why do you ask for my phone number and address?","They are needed to process the order, coordinate delivery and provide order support. The store's privacy policy explains how this information is handled."],
  ["Can I use the store without accepting optional preferences?","Yes. Essential-only privacy choice still allows the core shopping experience. Preference storage, including remembering your dark or light theme between visits, is enabled when you allow preferences."],
  ["Where can I read the store policies?","The footer and mobile menu link to the Privacy, Terms, Refund & Returns, Cookies & Storage and Accessibility pages."]
];

export default function FAQ(){
  return <><StoreHeader/><main className="container"><section className="section faq-page">
    <div className="eyebrow">Need to know</div><h1>Frequently asked questions.</h1>
    <p className="policy-lead">Straight answers about ordering, delivery, privacy and using the NIMA COLLECTION store.</p>
    <div className="faq-list">{items.map(([q,a])=><details className="faq-item" key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div>
    <div className="faq-help card"><div><div className="eyebrow">Still need help?</div><h2>Talk directly with NIMA.</h2><p>For a product question or order issue, use the contact page and the store's configured WhatsApp support.</p></div><Link className="btn" href="/contact">Contact NIMA</Link></div>
  </section></main></>
}
