"use client";
import Link from "next/link";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useEffect, useState } from "react";
import { useCart } from "./cart";

export function StoreHeader() {
  const { count, open:openCart } = useCart();
  const [menuOpen,setMenuOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [menuOpen]);

  return <>
    <header className="site-header">
      <div className="container nav">
        <Link className="brand" href="/" onClick={()=>setMenuOpen(false)}>NIMA.</Link>

        <nav className="nav-links" aria-label="Primary navigation">
          <Link href="/shop">Shop</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link><Link href="/faq">FAQ</Link>
        </nav>

        <div className="nav-actions"><ThemeToggle />
          <Link className="icon-btn desktop-only" href="/shop" aria-label="Search products">
            <Search size={18}/>
          </Link>
          <button className="icon-btn" onClick={openCart} aria-label={count ? `Open shopping bag with ${count} items` : "Open shopping bag"}>
            <ShoppingBag size={18}/>
            {count>0&&<span className="cart-count" aria-hidden="true">{count}</span>}
          </Link>
          <button className="icon-btn menu-trigger" onClick={()=>setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}>
            <Menu size={19}/>
          </button>
        </div>
      </div>
    </header>

    <div className={"mobile-menu-wrap "+(menuOpen?"open":"")} aria-hidden={!menuOpen}>
      <button className="mobile-menu-backdrop" aria-label="Close menu" onClick={()=>setMenuOpen(false)}/>
      <aside className="mobile-menu" aria-label="Menu">
        <div className="mobile-menu-head">
          <Link className="brand" href="/" onClick={()=>setMenuOpen(false)}>NIMA.</Link>
          <button className="icon-btn" onClick={()=>setMenuOpen(false)} aria-label="Close menu"><X size={19}/></button>
        </div>

        <div className="mobile-menu-links">
          <div className="eyebrow">Store</div>
          <Link href="/shop" onClick={()=>setMenuOpen(false)}>Shop all</Link>
          <Link href="/about" onClick={()=>setMenuOpen(false)}>About NIMA</Link>
          <Link href="/contact" onClick={()=>setMenuOpen(false)}>Contact & support</Link>
          <Link href="/cart" onClick={()=>setMenuOpen(false)}>Shopping bag {count>0&&`(${count})`}</Link><div className="menu-theme-row"><span>Theme</span><ThemeToggle /></div>

          <div className="eyebrow menu-rule">Policies</div>
          <Link href="/privacy" onClick={()=>setMenuOpen(false)}>Privacy policy</Link>
          <Link href="/terms" onClick={()=>setMenuOpen(false)}>Terms & conditions</Link>
          <Link href="/refund-policy" onClick={()=>setMenuOpen(false)}>Refund & returns</Link>
          <Link href="/cookies" onClick={()=>setMenuOpen(false)}>Cookies & storage</Link>
          <Link href="/accessibility" onClick={()=>setMenuOpen(false)}>Accessibility</Link>
        </div>

        <div className="mobile-menu-foot">
          <span>© {new Date().getFullYear()} NIMA COLLECTION</span>
          <Link href="/admin/login" onClick={()=>setMenuOpen(false)}>Staff sign in</Link>
        </div>
      </aside>
    </div>
  </>;
}
