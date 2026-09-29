import Image from"next/image";
import Link from"next/link";
type HomeCategory={category:string;count:number;image:string};
export function HomeCategoryGrid({categories}:{categories:HomeCategory[]}){
 if(!categories.length)return null;
 return <section className="home-category-section section"><div className="container"><div className="section-head"><div><div className="eyebrow">Explore the collection</div><h2>Shop by category.</h2></div><Link className="btn secondary" href="/shop">All categories</Link></div><div className="home-category-grid">{categories.map(item=><Link className="home-category-card" key={item.category} href={"/shop?category="+encodeURIComponent(item.category)}><div className="home-category-image">{item.image?<Image src={item.image} alt="" fill sizes="(max-width:680px) 50vw,(max-width:980px) 33vw,25vw" unoptimized style={{objectFit:"cover"}}/>:<span>{item.category}</span>}</div><div className="home-category-copy"><strong>{item.category}</strong><span>{item.count.toLocaleString()} {item.count===1?"piece":"pieces"}</span></div></Link>)}</div></div></section>;
}
