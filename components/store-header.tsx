"use client";
import Link from "next/link";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useEffect, useState } from "react";
import { useCart } from "./cart";

export function StoreHeader() {
  const { count, open } = useCart();
  const [open,setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open]);

  return <>
    <header className="site-header">
      <div className="container nav">
        <Link className="brand" href="/" onClick={()=>setOpen(false)}>NIMA.</Link>

        <nav className="nav-links" aria-label="Primary navigation">
          <Link href="/shop">Shop</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link><Link href="/faq">FAQ</Link>
        </nav>

        <div className="nav-actions"><ThemeToggle />
          <Link className="icon-btn desktop-only" href="/shop" aria-label="Search products">
            <Search size={18}/>
          </Link>
          <button className="icon-btn" onClick={open} aria-label={count ? `Open shopping bag with ${count} items` : "Open shopping bag"}>
            <ShoppingBag size={18}/>
            {count>0&&<span className="cart-count" aria-hidden="true">{count}</span>}
          </Link>
          <button className="icon-btn menu-trigger" onClick={()=>setOpen(true)} aria-label="Open menu" aria-expanded={open}>
            <Menu size={19}/>
          </button>
        </div>
      </div>
    </header>

    <div className={"mobile-menu-wrap "+(open?"open":"")} aria-hidden={!open}>
      <button className="mobile-menu-backdrop" aria-label="Close menu" onClick={()=>setOpen(false)}/>
      <aside className="mobile-menu" aria-label="Menu">
        <div className="mobile-menu-head">
          <Link className="brand" href="/" onClick={()=>setOpen(false)}>NIMA.</Link>
          <button className="icon-btn" onClick={()=>setOpen(false)} aria-label="Close menu"><X size={19}/></button>
        </div>

        <div className="mobile-menu-links">
          <div className="eyebrow">Store</div>
          <Link href="/shop" onClick={()=>setOpen(false)}>Shop all</Link>
          <Link href="/about" onClick={()=>setOpen(false)}>About NIMA</Link>
          <Link href="/contact" onClick={()=>setOpen(false)}>Contact & support</Link>
          <Link href="/cart" onClick={()=>setOpen(false)}>Shopping bag {count>0&&`(${count})`}</Link><div className="menu-theme-row"><span>Theme</span><ThemeToggle /></div>

          <div className="eyebrow menu-rule">Policies</div>
          <Link href="/privacy" onClick={()=>setOpen(false)}>Privacy policy</Link>
          <Link href="/terms" onClick={()=>setOpen(false)}>Terms & conditions</Link>
          <Link href="/refund-policy" onClick={()=>setOpen(false)}>Refund & returns</Link>
          <Link href="/cookies" onClick={()=>setOpen(false)}>Cookies & storage</Link>
          <Link href="/accessibility" onClick={()=>setOpen(false)}>Accessibility</Link>
        </div>

        <div className="mobile-menu-foot">
          <span>© {new Date().getFullYear()} NIMA COLLECTION</span>
          <Link href="/admin/login" onClick={()=>setOpen(false)}>Staff sign in</Link>
        </div>
      </aside>
    </div>
  </>;
}
