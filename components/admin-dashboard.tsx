"use client";
import Image from"next/image";
import{upload}from"@vercel/blob/client";
import{AlertTriangle,ChevronLeft,ChevronRight,ImagePlus,LogOut,PackageSearch,PenLine,Plus,RefreshCw,Search,Trash2,X}from"lucide-react";
import{useEffect,useState}from"react";
import{ThemeToggle}from"./theme-toggle";
import{ProductVariantsEditor,VariantDraft}from"./product-variants-editor";
import{AdminNavigation}from"./admin-navigation";
import{Order,Product}from"@/lib/store";
import{requestJson,userMessage}from"@/lib/client-request";
import{OrderReceiptTools}from"./order-receipt-tools";

const money=(n:number|string)=>"₦"+Number(n).toLocaleString();

export function AdminDashboard({initialProducts,initialProductTotal,initialOrders,initialOrderTotal,stats,categorySuggestions}:{initialProducts:Product[];initialProductTotal:number;initialOrders:Order[];initialOrderTotal:number;stats:{products:number;orders:number;sales:number;lowStock:number};categorySuggestions:{labels:string[];products:number}[]}){
 const[products,setProducts]=useState(initialProducts),[productTotal,setProductTotal]=useState(initialProductTotal),[productPage,setProductPage]=useState(1),[productSearch,setProductSearch]=useState(""),[productBusy,setProductBusy]=useState(false);
 const[orders,setOrders]=useState(initialOrders),[orderTotal,setOrderTotal]=useState(initialOrderTotal),[orderPage,setOrderPage]=useState(1),[orderSearch,setOrderSearch]=useState(""),[orderStatus,setOrderStatus]=useState(""),[orderBusy,setOrderBusy]=useState(false);
 const[totals,setTotals]=useState(stats),[modal,setModal]=useState<Product|null|false>(false),[selectedOrder,setSelectedOrder]=useState<Order|null>(null),[lowOpen,setLowOpen]=useState(false),[lowProducts,setLowProducts]=useState<Product[]>([]),[lowPage,setLowPage]=useState(1),[lowTotal,setLowTotal]=useState(0),[lowBusy,setLowBusy]=useState(false),[toast,setToast]=useState("");

 const pageSize=24,orderPageSize=20,lowPageSize=20;
 const flash=(x:string)=>{setToast(x);window.setTimeout(()=>setToast(""),2400)};

 async function loadProducts(page=productPage,search=productSearch,signal?:AbortSignal){
  setProductBusy(true);
  try{
   const q=new URLSearchParams({page:String(page),limit:String(pageSize),search});
   const r=await fetch("/api/admin/products?"+q.toString(),{cache:"no-store",signal});
   const d=await r.json();
   if(!r.ok)throw new Error(d.error||"Could not load products.");
   setProducts(Array.isArray(d.products)?d.products:[]);setProductTotal(Number(d.total||0));
  }catch(e){if((e as any)?.name!=="AbortError")flash(userMessage(e,"Could not load products."));}
  finally{if(!signal?.aborted)setProductBusy(false);}
 }

 async function loadOrders(page=orderPage,search=orderSearch,status=orderStatus,signal?:AbortSignal){
  setOrderBusy(true);
  try{
   const q=new URLSearchParams({page:String(page),limit:String(orderPageSize),search,status});
   const r=await fetch("/api/admin/orders?"+q.toString(),{cache:"no-store",signal});
   const d=await r.json();
   if(!r.ok)throw new Error(d.error||"Could not load orders.");
   setOrders(Array.isArray(d.orders)?d.orders:[]);setOrderTotal(Number(d.total||0));
   setSelectedOrder(current=>current?d.orders.find((x:Order)=>x.id===current.id)||current:null);
  }catch(e){if((e as any)?.name!=="AbortError")flash(userMessage(e,"Could not load orders."));}
  finally{if(!signal?.aborted)setOrderBusy(false);}
 }

 useEffect(()=>{
  const controller=new AbortController();
  const timer=window.setTimeout(()=>loadProducts(productPage,productSearch,controller.signal),280);
  return()=>{window.clearTimeout(timer);controller.abort()};
 },[productPage,productSearch]);

 useEffect(()=>{
  const controller=new AbortController();
  const timer=window.setTimeout(()=>loadOrders(orderPage,orderSearch,orderStatus,controller.signal),220);
  return()=>{window.clearTimeout(timer);controller.abort()};
 },[orderPage,orderSearch,orderStatus]);

 useEffect(()=>{
  const timer=window.setInterval(()=>loadOrders(orderPage,orderSearch,orderStatus),30000);
  return()=>window.clearInterval(timer);
 },[orderPage,orderSearch,orderStatus]);

 async function refresh(){
  await Promise.all([loadProducts(productPage,productSearch),loadOrders(orderPage,orderSearch,orderStatus)]);
  flash("Dashboard refreshed.");
 }

 async function remove(id:string){
  const p=products.find(x=>x.id===id);
  if(!confirm("Archive this product? It will disappear from the storefront."))return;
  const r=await fetch("/api/admin/products?id="+encodeURIComponent(id),{method:"DELETE"});
  if(!r.ok){flash("Could not archive the product.");return}
  setTotals(cur=>({...cur,lowStock:Math.max(0,cur.lowStock-((p?.stock??6)<=5?1:0))}));
  await loadProducts(productPage,productSearch);
  flash("Product archived.");
 }

 async function changeStatus(id:string,value:string){
  const r=await fetch("/api/admin/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status:value})});
  if(!r.ok){flash("Could not update that order.");return}
  setOrders(cur=>cur.map(o=>o.id===id?{...o,status:value}:o));
  setSelectedOrder(cur=>cur?.id===id?{...cur,status:value}:cur);
  flash("Order updated.");
 }

 async function openLowStock(){
  setLowOpen(true);setLowPage(1);await loadLowStock(1);
 }

 async function loadLowStock(page:number){
  setLowBusy(true);
  try{
   const r=await fetch("/api/admin/products?lowStock=true&page="+page+"&limit="+lowPageSize,{cache:"no-store"});
   const d=await r.json();
   if(!r.ok)throw new Error(d.error||"Could not load low-stock products.");
   setLowProducts(Array.isArray(d.products)?d.products:[]);setLowTotal(Number(d.total||0));
  }catch(e){flash(userMessage(e,"Could not load low-stock products."));}
  finally{setLowBusy(false);}
 }

 const productPages=Math.max(1,Math.ceil(productTotal/pageSize));
 const orderPages=Math.max(1,Math.ceil(orderTotal/orderPageSize));
 const lowPages=Math.max(1,Math.ceil(lowTotal/lowPageSize));

 return <div className="admin-shell">
  <AdminNavigation/>
  <div className="admin-top">
   <div><strong>NIMA.</strong><span className="admin-top-sub">Control room</span></div>
   <div className="admin-top-actions"><ThemeToggle/><button className="icon-btn admin-refresh" onClick={refresh} aria-label="Refresh dashboard"><RefreshCw size={17}/></button><button className="icon-btn admin-logout" onClick={async()=>{await fetch("/api/admin/logout",{method:"POST"});location.href="/admin/login"}} aria-label="Log out"><LogOut size={16}/></button></div>
  </div>

  <main className="admin-main">
   <div className="admin-heading"><div><div className="eyebrow">Store overview</div><h1>Run the shop.</h1><p>Manage inventory and orders without loading the whole database into the browser.</p></div></div>

   <div className="stats">
    <div className="stat"><span>Products</span><strong>{totals.products.toLocaleString()}</strong></div>
    <div className="stat"><span>Orders</span><strong>{totals.orders.toLocaleString()}</strong></div>
    <div className="stat"><span>Recorded sales</span><strong>{money(totals.sales)}</strong></div>
    <button id="low-stock" className="stat stat-action low-stock-stat" onClick={openLowStock} aria-label={"View "+totals.lowStock+" low stock products"}><span>Low stock</span><strong>{totals.lowStock.toLocaleString()}</strong><small>View affected products</small></button>
   </div>
   {categorySuggestions.length>0&&<section className="admin-card admin-suggestions"><div className="admin-suggestion-head"><div><div className="eyebrow">Smart housekeeping</div><h2>Catalog suggestions</h2><p>Some category labels look like the same category after normalizing case and punctuation. Review before merging; nothing is changed automatically.</p></div><a className="btn secondary" href="#inventory">Review inventory</a></div><div className="admin-suggestion-list">{categorySuggestions.map(group=><div className="admin-suggestion-row" key={group.labels.join("|")}><div><strong>{group.labels.join(" / ")}</strong><span>{group.products.toLocaleString()} active products across these labels</span></div><a className="pill" href={"/shop?category="+encodeURIComponent(group.labels[0])} target="_blank" rel="noreferrer">View one label</a></div>)}</div></section>}

   <section id="inventory" className="admin-card admin-section">
    <div className="admin-section-head">
     <div><div className="eyebrow">Catalog</div><h2>Inventory</h2><p>{productTotal.toLocaleString()} matching products loaded {productSearch?"for this search":"in this view"} — only one page is held in memory.</p></div>
     <button className="btn" onClick={()=>setModal(null)}><Plus size={16}/> Add product</button>
    </div>
    <div className="admin-toolbar">
     <label className="admin-search"><Search size={17}/><input value={productSearch} onChange={e=>{setProductSearch(e.target.value);setProductPage(1)}} placeholder="Search products, categories or names..." aria-label="Search products"/></label>
     {productBusy&&<span className="admin-loading">Searching...</span>}
    </div>

    <div className="desktop-only-admin">
     <div className="table-wrap"><table className="table admin-data-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>
      {products.map((product) => (
        <tr key={product.id}>
          <td>
            <div className="admin-product-cell">
              <div className="admin-list-thumb">
                {product.images[0] && (
                  <Image
                    src={product.images[0]}
                    alt=""
                    fill
                    sizes="46px"
                    unoptimized
                    style={{ objectFit: "cover" }}
                  />
                )}
              </div>
              <div>
                <strong>{product.name}</strong>
                <span>
                  {product.images.length} image{product.images.length === 1 ? "" : "s"} ·{" "}
                  {product.active ? "Live" : "Archived"}
                </span>
              </div>
            </div>
          </td>
          <td>{product.category}</td>
          <td>{money(product.salePrice ?? product.price)}</td>
          <td>
            <span className={product.stock <= 5 ? "stock-warning" : ""}>
              {product.stock.toLocaleString()}
            </span>
          </td>
          <td>
            <div className="admin-row-actions">
              <button
                className="icon-btn"
                onClick={() => setModal(product)}
                aria-label={"Edit " + product.name}
              >
                <PenLine size={14} />
              </button>
              <button
                className="icon-btn"
                onClick={() => remove(product.id)}
                aria-label={"Archive " + product.name}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </td>
        </tr>
      ))}
      {!products.length&&!productBusy&&<tr><td colSpan={5}><div className="admin-empty"><PackageSearch size={24}/><strong>No products found</strong><span>Try a different search.</span></div></td></tr>}
     </tbody></table></div>
    </div>

    <div className="mobile-only-admin">
     <div className="admin-mobile-list">{products.map(p=><article className="admin-mobile-card" key={p.id}><div className="admin-mobile-card-main"><div className="admin-list-thumb mobile-thumb">{p.images[0]&&<Image src={p.images[0]} alt="" fill sizes="62px" unoptimized style={{objectFit:"cover"}}/>}</div><div className="admin-mobile-copy"><strong>{p.name}</strong><span>{p.category} · {money(p.salePrice??p.price)}</span><span className={p.stock<=5?"stock-warning":""}>Stock: {p.stock.toLocaleString()}</span></div></div><div className="admin-mobile-actions"><button className="btn secondary" onClick={()=>setModal(p)}><PenLine size={14}/> Edit</button><button className="icon-btn" onClick={()=>remove(p.id)} aria-label={"Archive "+p.name}><Trash2 size={14}/></button></div></article>)}
      {!products.length&&!productBusy&&<div className="admin-empty"><PackageSearch size={24}/><strong>No products found</strong><span>Try a different search.</span></div>}
     </div>
    </div>

    <Pagination page={productPage} pages={productPages} onPrev={()=>setProductPage(p=>Math.max(1,p-1))} onNext={()=>setProductPage(p=>Math.min(productPages,p+1))} label={"Products · page "+productPage+" of "+productPages}/>
   </section>

   <section id="orders" className="admin-card admin-section">
    <div className="admin-section-head">
     <div><div className="eyebrow">Sales</div><h2>Orders</h2><p>{orderTotal.toLocaleString()} matching orders — the browser only loads {orderPageSize} at a time.</p></div>
    </div>
    <div className="admin-toolbar order-toolbar">
     <label className="admin-search"><Search size={17}/><input value={orderSearch} onChange={e=>{setOrderSearch(e.target.value);setOrderPage(1)}} placeholder="Search order reference, customer or phone..." aria-label="Search orders"/></label>
     <label className="admin-filter"><span>Status</span><select value={orderStatus} onChange={e=>{setOrderStatus(e.target.value);setOrderPage(1)}}><option value="">All orders</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="fulfilled">Fulfilled</option><option value="cancelled">Cancelled</option></select></label>
     {orderBusy&&<span className="admin-loading">Loading...</span>}
    </div>

    <div className="desktop-only-admin">
     <div className="table-wrap"><table className="table admin-data-table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>
      {orders.map(o=><tr key={o.id}><td><button type="button" className="order-ref-btn" onClick={()=>setSelectedOrder(o)}>{o.orderNumber}</button><span className="admin-cell-sub">{new Date(o.createdAt).toLocaleString()}</span></td><td><strong>{o.customerName}</strong><span className="admin-cell-sub">{o.phone}</span></td><td><div className="admin-order-items">{o.items.slice(0,2).map((item,i)=><span key={(item.productId||"item")+i}>{item.quantity} × {item.name}</span>)}{o.items.length>2&&<span>+ {o.items.length-2} more</span>}</div></td><td><strong>{money(o.total)}</strong><span className="admin-cell-sub">Subtotal {money(o.subtotal)}</span></td><td><select className="status" value={o.status} onClick={e=>e.stopPropagation()} onChange={e=>changeStatus(o.id,e.target.value)} aria-label={"Status for "+o.orderNumber}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="fulfilled">Fulfilled</option><option value="cancelled">Cancelled</option></select><button type="button" className="order-view-btn" onClick={()=>setSelectedOrder(o)}>View complete order</button></td></tr>)}
      {!orders.length&&!orderBusy&&<tr><td colSpan={5}><div className="admin-empty"><PackageSearch size={24}/><strong>No orders found</strong><span>Try a different search or status.</span></div></td></tr>}
     </tbody></table></div>
    </div>

    <div className="mobile-only-admin">
     <div className="admin-mobile-list">{orders.map(o=><article className="admin-mobile-card order-mobile-card" key={o.id} onClick={()=>setSelectedOrder(o)}><div className="mobile-order-top"><div><button type="button" className="order-ref-btn" onClick={e=>{e.stopPropagation();setSelectedOrder(o)}}>{o.orderNumber}</button><span className="admin-cell-sub">{new Date(o.createdAt).toLocaleString()}</span></div><span className={"order-status order-status-"+o.status}>{o.status.replace("_"," ")}</span></div><div className="mobile-order-customer"><strong>{o.customerName}</strong><span>{o.phone}</span></div><div className="mobile-order-items">{o.items.slice(0,3).map((item,i)=><span key={(item.productId||"item")+i}>{item.quantity} × {item.name}</span>)}{o.items.length>3&&<span>+ {o.items.length-3} more</span>}</div><div className="mobile-order-bottom"><strong>{money(o.total)}</strong><span>Tap to view complete order</span></div></article>)}
      {!orders.length&&!orderBusy&&<div className="admin-empty"><PackageSearch size={24}/><strong>No orders found</strong><span>Try a different search or status.</span></div>}
     </div>
    </div>

    <Pagination page={orderPage} pages={orderPages} onPrev={()=>setOrderPage(p=>Math.max(1,p-1))} onNext={()=>setOrderPage(p=>Math.min(orderPages,p+1))} label={"Orders · page "+orderPage+" of "+orderPages}/>
   </section>
  </main>

  {modal!==false&&<ProductModal existing={modal||undefined} close={()=>setModal(false)} onSaved={async p=>{setModal(false);if(modal){setProducts(cur=>cur.map(x=>x.id===p.id?p:x));flash("Product updated.");}else{setTotals(cur=>({...cur,products:cur.products+1}));setProductPage(1);await loadProducts(1,productSearch);flash("Product added.");}}}/>}
  {selectedOrder&&<OrderDetail order={selectedOrder} close={()=>setSelectedOrder(null)} onStatusChange={value=>changeStatus(selectedOrder.id,value)}/>}
  {lowOpen&&<LowStockModal page={lowPage} pages={lowPages} products={lowProducts} total={lowTotal} busy={lowBusy} onClose={()=>setLowOpen(false)} onPrev={()=>{const p=Math.max(1,lowPage-1);setLowPage(p);loadLowStock(p)}} onNext={()=>{const p=Math.min(lowPages,lowPage+1);setLowPage(p);loadLowStock(p)}} onEdit={p=>{setLowOpen(false);setModal(p)}}/>}
  <div className={"toast "+(toast?"show":"")}>{toast}</div>
 </div>;
}

function Pagination({page,pages,onPrev,onNext,label}:{page:number;pages:number;onPrev:()=>void;onNext:()=>void;label:string}){
 return <div className="admin-pagination"><span>{label}</span><div><button className="icon-btn" onClick={onPrev} disabled={page<=1} aria-label="Previous page"><ChevronLeft size={16}/></button><button className="icon-btn" onClick={onNext} disabled={page>=pages} aria-label="Next page"><ChevronRight size={16}/></button></div></div>;
}

function LowStockModal({page,pages,products,total,busy,onClose,onPrev,onNext,onEdit}:{page:number;pages:number;products:Product[];total:number;busy:boolean;onClose:()=>void;onPrev:()=>void;onNext:()=>void;onEdit:(p:Product)=>void}){
 return <div className="admin-modal-overlay" onMouseDown={onClose}><div className="admin-modal-card low-stock-modal" role="dialog" aria-modal="true" aria-label="Low stock products" onMouseDown={e=>e.stopPropagation()}><div className="admin-modal-head"><div><div className="eyebrow">Inventory alert</div><h2>Low stock products.</h2><p>{total.toLocaleString()} active products are at or below 5 units.</p></div><button className="icon-btn" onClick={onClose} aria-label="Close low stock list"><X size={17}/></button></div><div className="low-stock-list">{products.map(p=><div className="low-stock-row" key={p.id}><div className="admin-list-thumb">{p.images[0]&&<Image src={p.images[0]} alt="" fill sizes="44px" unoptimized style={{objectFit:"cover"}}/>}</div><div><strong>{p.name}</strong><span>{p.category}</span></div><div className="low-stock-value">{p.stock.toLocaleString()} left</div><button className="btn secondary" onClick={()=>onEdit(p)}><PenLine size={14}/> Edit</button></div>)}{!products.length&&!busy&&<div className="admin-empty"><AlertTriangle size={23}/><strong>No low-stock products</strong></div>}{busy&&<div className="admin-loading-block">Loading...</div>}</div><Pagination page={page} pages={pages} onPrev={onPrev} onNext={onNext} label={"Low stock · page "+page+" of "+pages}/></div></div>;
}

function OrderDetail({order,close,onStatusChange}:{order:Order;close:()=>void;onStatusChange:(value:string)=>void}){
 const items=Array.isArray(order.items)?order.items:[];
 return <div className="admin-modal-overlay" onMouseDown={close}><div className="admin-modal-card order-detail-card" role="dialog" aria-modal="true" aria-label={"Complete order "+order.orderNumber} onMouseDown={e=>e.stopPropagation()}>
  <div className="admin-modal-head"><div><div className="eyebrow">Complete order</div><h2>{order.orderNumber}</h2><p>{new Date(order.createdAt).toLocaleString()}</p></div><button className="icon-btn" onClick={close} aria-label="Close order details"><X size={17}/></button></div>
  <div className="order-detail-status"><span className={"order-status order-status-"+order.status}>{order.status.replace("_"," ")}</span><label>Status<select className="status" value={order.status} onChange={e=>onStatusChange(e.target.value)}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="fulfilled">Fulfilled</option><option value="cancelled">Cancelled</option></select></label></div>
  <div className="order-detail-grid"><section><div className="eyebrow">Customer</div><strong>{order.customerName}</strong><div>{order.phone}</div></section><section><div className="eyebrow">Delivery</div><div>{order.deliveryAddress}</div></section></div>
  <section><div className="eyebrow">Purchased items · {items.length}</div><div className="order-detail-items">{items.length?items.map((item,i)=><div className="order-detail-item" key={(item.productId||"item")+i}><div><strong>{item.name}</strong><span>Qty {item.quantity} · {money(item.price)} each{item.options&&" · "+Object.entries(item.options).map(([name,value])=>name+": "+value).join(" · ")}</span></div><strong>{money(Number(item.price)*item.quantity)}</strong></div>):<div className="order-detail-empty">No item details were saved with this order.</div>}</div></section>
  <div className="order-detail-total"><span>Subtotal</span><strong>{money(order.subtotal)}</strong></div><div className="order-detail-total"><span>Delivery fee</span><strong>{money(order.deliveryFee)}</strong></div><div className="order-detail-total order-detail-grand"><span>Total</span><strong>{money(order.total)}</strong></div>
  {order.note&&<div className="order-detail-note"><div className="eyebrow">Customer note</div><p>{order.note}</p></div>}
  <OrderReceiptTools order={order}/>
  <div className="order-detail-actions"><button className="btn secondary" onClick={close}>Close</button></div>
 </div></div>;
}

function ProductModal({existing,close,onSaved}:{existing?:Product;close:()=>void;onSaved:(p:Product)=>void}){
 const[form,setForm]=useState({name:existing?.name??"",category:existing?.category??"Slippers",description:existing?.description??"",price:existing?.price??"",salePrice:existing?.salePrice??"",stock:String(existing?.stock??0),featured:existing?.featured??false});
 const[images,setImages]=useState<string[]>(existing?.images??[]);
 const[files,setFiles]=useState<File[]>([]);
 const[variants,setVariants]=useState<VariantDraft[]>((existing?.variants||[]).map(v=>({id:v.id,options:v.options,price:Number(v.price),stock:v.stock,sku:v.sku||""})));
 const[variantsEnabled,setVariantsEnabled]=useState(!!(existing?.variants||[]).length);
 const[busy,setBusy]=useState(false),[error,setError]=useState("");
 const[uploadProgress,setUploadProgress]=useState<{current:number;total:number;percentage:number;phase:"checking"|"uploading"}|null>(null);
 function chooseFiles(list:FileList|null){
  if(!list)return;
  const picked=Array.from(list),valid=picked.filter(file=>["image/jpeg","image/png","image/webp"].includes(file.type)&&file.size<=4*1024*1024);
  if(valid.length!==picked.length){setError("Use JPG, PNG or WebP images up to 4 MB each.");return}
  if(images.length+files.length+valid.length>6){setError("A product can have up to 6 images.");return}
  setFiles(current=>[...current,...valid].slice(0,6-images.length));
 }
 function removeImage(index:number){setImages(current=>current.filter((_,i)=>i!==index))}
 function removeFile(index:number){setFiles(current=>current.filter((_,i)=>i!==index))}
 async function submit(event:React.FormEvent){
  event.preventDefault();setError("");
  const name=form.name.trim(),category=form.category.trim(),description=form.description.trim(),price=Number(form.price),stock=Number(form.stock),sale=form.salePrice===""?null:Number(form.salePrice);
  if(name.length<2){setError("Product name must be at least 2 characters.");return}
  if(category.length<2){setError("Category must be at least 2 characters.");return}
  if(description.length<5){setError("Description must be at least 5 characters.");return}
  if(!Number.isFinite(price)||price<0){setError("Price must be a valid amount of ₦0 or more.");return}
  if(form.salePrice!==""&&(!Number.isFinite(sale)||Number(sale)<0)){setError("Sale price must be a valid amount of ₦0 or more.");return}
  if(form.salePrice!==""&&Number(sale)>price){setError("Sale price cannot be higher than the regular price.");return}
  if(!Number.isInteger(stock)||stock<0){setError("Stock must be a whole number of 0 or more.");return}
  if(images.length+files.length<1){setError("Add at least one product image before saving.");return}
  if(files.some(file=>file.size===0)){setError("One of the selected images is empty. Remove it and choose the image again.");return}
  if(variantsEnabled&&variants.length===0){setError("Generate the option combinations before saving the product.");return}
  if(variantsEnabled&&variants.some(v=>!Number.isFinite(Number(v.price))||Number(v.price)<0||!Number.isInteger(Number(v.stock))||Number(v.stock)<0)){setError("Every option combination needs a valid price and whole-number stock quantity.");return}
  setBusy(true);
  try{
   let allImages=[...images];
   if(files.length){
    setUploadProgress({current:0,total:files.length,percentage:0,phase:"checking"});
    await requestJson<{ok:boolean}>("/api/admin/upload",{method:"GET"},{timeoutMs:12000,fallback:"Image storage could not be reached."});
    for(let index=0;index<files.length;index++){
     const file=files[index];
     const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"-")||"product-image";
     const controller=new AbortController();
     let lastLoaded=0,lastMovement=Date.now(),stalled=false;
     const stallTimer=window.setInterval(()=>{
      if(Date.now()-lastMovement>60000){stalled=true;controller.abort()}
     },5000);
     try{
      setUploadProgress({current:index+1,total:files.length,percentage:0,phase:"uploading"});
      const blob=await upload("nima/products/"+Date.now()+"-"+safe,file,{
       access:"public",
       handleUploadUrl:"/api/admin/upload",
       abortSignal:controller.signal,
       onUploadProgress:({loaded,percentage})=>{
        if(loaded>lastLoaded){lastLoaded=loaded;lastMovement=Date.now()}
        setUploadProgress({current:index+1,total:files.length,percentage:Math.max(0,Math.min(100,Math.round(percentage))),phase:"uploading"})
       }
      });
      allImages.push(blob.url);
     }catch(cause){
      if(stalled)throw new Error("Image "+(index+1)+" stopped making progress for 60 seconds. Check your connection and try again.");
      throw cause;
     }finally{window.clearInterval(stallTimer)}
    }
    setUploadProgress(null);
   }
   const payload={name,category,description,price,salePrice:form.salePrice===""?"":sale,stock,featured:form.featured,images:allImages,variants:variantsEnabled?variants:[]};
   const saved=await requestJson<Product>("/api/admin/products",{method:existing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(existing?{...payload,id:existing.id}:payload)},{timeoutMs:20000,fallback:existing?"Could not update product.":"Could not add product."});
   onSaved(saved);
  }catch(cause){setError(userMessage(cause,existing?"Could not update product. Please try again.":"Could not add product. Please try again."));}finally{setUploadProgress(null);setBusy(false);}
 }
 return <div className="admin-modal-overlay" onMouseDown={close}><div className="admin-modal-card product-modal-card" role="dialog" aria-modal="true" aria-label={existing?"Edit product":"Add product"} onMouseDown={event=>event.stopPropagation()}>
  <button className="icon-btn" onClick={close} aria-label="Close"><X size={17}/></button>
  <div className="eyebrow">Catalog</div><h2>{existing?"Edit the product.":"Add a product."}</h2>
  <form className="form-grid" onSubmit={submit}>
   <div className="field"><label>Name</label><input required value={form.name} onChange={event=>setForm({...form,name:event.target.value})}/></div>
   <div className="field"><label>Category</label><input required value={form.category} onChange={event=>setForm({...form,category:event.target.value})}/></div>
   <div className="field full"><label>Description</label><textarea required rows={4} value={form.description} onChange={event=>setForm({...form,description:event.target.value})}/></div>
   <div className="field"><label>Price (₦)</label><input required type="number" min="0" value={form.price} onChange={event=>setForm({...form,price:event.target.value})}/></div>
   <div className="field"><label>Sale price (₦)</label><input type="number" min="0" value={form.salePrice} onChange={event=>setForm({...form,salePrice:event.target.value})}/></div>
   <div className="field"><label>Stock {variantsEnabled&&<span className="muted-inline">calculated from options</span>}</label><input required type="number" min="0" value={form.stock} disabled={variantsEnabled} onChange={event=>setForm({...form,stock:event.target.value})}/></div>
   <div className="field full"><label>Product images</label><input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={event=>chooseFiles(event.target.files)}/><span className="helper-text">Up to 6 JPG, PNG or WebP images, 4 MB each. Images upload directly and the first image is the main storefront image.</span></div>
   {(images.length>0||files.length>0)&&<div className="field full"><div className="admin-image-grid">{images.map((image,index)=><div className="admin-image-item" key={image+index}><Image src={image} alt={"Product image "+(index+1)} fill sizes="110px" unoptimized style={{objectFit:"cover"}}/><button type="button" className="admin-image-remove" onClick={()=>removeImage(index)} aria-label={"Remove image "+(index+1)}><X size={13}/></button>{index===0&&<span className="admin-image-label">Main</span>}</div>)}{files.map((file,index)=><div className="admin-image-item file-preview" key={file.name+index}><div><ImagePlus size={22}/><span>{file.name}</span></div><button type="button" className="admin-image-remove" onClick={()=>removeFile(index)} aria-label={"Remove selected image "+(index+1)}><X size={13}/></button>{images.length===0&&index===0&&<span className="admin-image-label">Main</span>}</div>)}</div></div>}
   <div className="field full"><label>Image URLs (optional)</label><textarea rows={3} placeholder="Paste one image URL per line" value={images.join("\n")} onChange={event=>setImages(event.target.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,6-files.length))}/></div>
   <div className="field full"><ProductVariantsEditor enabled={variantsEnabled} onEnabledChange={setVariantsEnabled} value={variants} onChange={setVariants} basePrice={Number(form.price)||0}/></div>
   {uploadProgress&&<div className="field full"><div className="upload-progress-card" role="status" aria-live="polite"><div className="upload-progress-head"><span>{uploadProgress.phase==="checking"?"Preparing secure image upload…":"Uploading image "+uploadProgress.current+" of "+uploadProgress.total}</span><strong>{uploadProgress.phase==="checking"?"Checking":uploadProgress.percentage+"%"}</strong></div><div className="upload-progress-track" aria-hidden="true"><span style={{width:(uploadProgress.phase==="checking"?8:uploadProgress.percentage)+"%"}}/></div><small>{uploadProgress.phase==="checking"?"Checking your session and image storage connection.":"Keep this page open while the image uploads. If progress stops for 60 seconds, NIMA will stop and show an error instead of loading forever."}</small></div></div>}
   {error&&<div className="field full"><div className="site-notice" role="alert"><div><strong>NIMA.</strong><span>{error}</span></div><button type="button" onClick={()=>setError("")} aria-label="Dismiss error"><X size={15}/></button></div></div>}
   <label className="full" style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}><input type="checkbox" checked={form.featured} onChange={event=>setForm({...form,featured:event.target.checked})}/> Feature this product</label>
   <div className="full product-modal-actions"><button type="button" className="btn secondary" onClick={close} disabled={busy}>Cancel</button><button className="btn" disabled={busy}>{uploadProgress?(uploadProgress.phase==="checking"?"Preparing upload…":"Uploading "+uploadProgress.percentage+"%"):busy?"Saving...":existing?"Save changes":"Add product"}</button></div>
  </form>
 </div></div>;
}
