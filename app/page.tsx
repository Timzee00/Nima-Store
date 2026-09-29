export const dynamic = "force-dynamic";

import { ScrollHero } from "@/components/scroll-hero";
import { StoreHeader } from "@/components/store-header";
import { HomeProductGrid } from "@/components/home-product-grid";
import { HomeHighlights } from "@/components/home-highlights";
import { HomeCategoryGrid } from "@/components/home-category-grid";
import { HomeGallery } from "@/components/home-gallery";
import {
  getHomepageProducts,
  getHomepageFeaturedProducts,
  getHomepageCategories,
  getHomepageGalleryImages,
} from "@/lib/store";

export default async function Home() {
  const [latest, featured, categories, gallery] = await Promise.all([
    getHomepageProducts(16),
    getHomepageFeaturedProducts(8),
    getHomepageCategories(6),
    getHomepageGalleryImages(24),
  ]);

  const grid = [];
  const seen = new Set<string>();

  for (const product of latest) {
    if (grid.length >= 8) break;
    grid.push(product);
    seen.add(product.id);
  }

  const picks = featured
    .filter((product) => !seen.has(product.id))
    .slice(0, 8);

  const carousel =
    picks.length >= 4
      ? picks
      : latest.filter((product) => !seen.has(product.id)).slice(0, 8);

  return (
    <>
      <StoreHeader />

      <main>
        <ScrollHero />

        <HomeProductGrid
          products={grid}
          eyebrow="New in"
          title="See what’s here."
          description="A quick look at the latest pieces without making you dig through the full catalogue."
        />

        <HomeHighlights products={carousel} />

        <HomeCategoryGrid categories={categories} />

        <HomeGallery images={gallery} />

        <div className="marquee">
          <div className="marquee-track">
            {Array.from({ length: 2 }).flatMap((_, index) =>
              ["NIMA COLLECTION", "NEW IN", "EVERYDAY PIECES", "CURATED IN NIGERIA"].map(
                (label) => <span key={index + label}>{label}</span>
              )
            )}
          </div>
        </div>

        <section id="story" className="section">
          <div className="container">
            <div className="story-band card">
              <div>
                <div className="eyebrow">The NIMA edit</div>
                <h3>Useful, playful and easy to love.</h3>
              </div>
              <div>
                <p>
                  From slippers and tote bags to lamps, lights, tripods,
                  microphones, masks, skincare and accessories, NIMA is built
                  around little upgrades you can actually use.
                </p>
                <a className="btn" href="/shop">
                  Browse the full collection
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="footer" className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="brand">NIMA.</div>
              <p>A modern mini-store for useful, playful and giftable everyday pieces.</p>
              <p className="footer-detail">
                <strong>NIMA COLLECTION</strong>
                <br />
                Online store serving customers in Nigeria.
              </p>
            </div>

            <div>
              <h4>Shop</h4>
              <a href="/shop">All products</a>
              <br />
              <a href="/about">About NIMA</a>
              <br />
              <a href="/contact">Contact & support</a>
              <br />
              <a href="/orders">Order history</a>
              <br />
              <a href="/faq">FAQ</a>
            </div>

            <div>
              <h4>Policies</h4>
              <a href="/privacy">Privacy policy</a>
              <br />
              <a href="/terms">Terms & conditions</a>
              <br />
              <a href="/refund-policy">Refund & returns</a>
              <br />
              <a href="/cookies">Cookies & storage</a>
            </div>

            <div>
              <h4>Accessibility</h4>
              <a href="/accessibility">Accessibility statement</a>
              <br />
              <p>
                Product and checkout controls are designed to work across mobile
                and desktop layouts.
              </p>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} NIMA COLLECTION</span>
            <span>WhatsApp ordering • Secure staff area • Privacy-first storefront</span>
          </div>
        </div>
      </footer>
    </>
  );
}
