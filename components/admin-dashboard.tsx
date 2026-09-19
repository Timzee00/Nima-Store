"use client";
import Image from"next/image";
import{AlertTriangle,ChevronLeft,ChevronRight,ImagePlus,LogOut,PackageSearch,PenLine,Plus,RefreshCw,Search,Trash2,X}from"lucide-react";
import{useEffect,useState}from"react";
import{ThemeToggle}from"./theme-toggle";
import{Order,Product}from"@/lib/store";
import{OrderReceiptTools}from"./order-receipt-tools";

const money=(n:number|string)=>"₦"+Number(n).toLocaleString();

export function AdminDashboard({initialProducts,initialProductTotal,initialOrders,initialOrderTotal,stats}:{initialProducts:Product[];initialProductTotal:number;initialOrders:Order[];initialOrderTotal:number;stats:{products:number;orders:number;sales:number;lowStock:number}}){
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
  }catch(e){if((e as any)?.name!=="AbortError")flash(e instanceof Error?e.message:"Could not load products.");}
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
  }catch(e){if((e as any)?.name!=="AbortError")flash(e instanceof Error?e.message:"Could not load orders.");}
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
  }catch(e){flash(e instanceof Error?e.message:"Could not load low-stock products.");}
  finally{setLowBusy(false);}
 }

 const productPages=Math.max(1,Math.ceil(productTotal/pageSize));
 const orderPages=Math.max(1,Math.ceil(orderTotal/orderPageSize));
 const lowPages=Math.max(1,Math.ceil(lowTotal/lowPageSize));

 return <div className="admin-shell">
  <div className="admin-top">
   <div><strong>NIMA.</strong><span className="admin-top-sub">Control room</span></div>
   <div className="admin-top-actions"><ThemeToggle/><button className="icon-btn admin-refresh" onClick={refresh} aria-label="Refresh dashboard"><RefreshCw size={17}/></button><a className="btn secondary admin-top-btn" href="/admin/support">Support</a><a className="btn secondary admin-top-btn" href="/" target="_blank">View store</a><button className="icon-btn admin-logout" onClick={async()=>{await fetch("/api/admin/logout",{method:"POST"});location.href="/admin/login"}} aria-label="Log out"><LogOut size={16}/></button></div>
  </div>

  <main className="admin-main">
   <div className="admin-heading"><div><div className="eyebrow">Store overview</div><h1>Run the shop.</h1><p>Manage inventory and orders without loading the whole database into the browser.</p></div></div>

   <div className="stats">
    <div className="stat"><span>Products</span><strong>{totals.products.toLocaleString()}</strong></div>
    <div className="stat"><span>Orders</span><strong>{totals.orders.toLocaleString()}</strong></div>
    <div className="stat"><span>Recorded sales</span><strong>{money(totals.sales)}</strong></div>
    <button className="stat stat-action low-stock-stat" onClick={openLowStock} aria-label={"View "+totals.lowStock+" low stock products"}><span>Low stock</span><strong>{totals.lowStock.toLocaleString()}</strong><small>View affected products</small></button>
   </div>

   <section className="admin-card admin-section">
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

   <section className="admin-card admin-section">
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
  <section><div className="eyebrow">Purchased items · {items.length}</div><div className="order-detail-items">{items.length?items.map((item,i)=><div className="order-detail-item" key={(item.productId||"item")+i}><div><strong>{item.name}</strong><span>Qty {item.quantity} · {money(item.price)} each</span></div><strong>{money(Number(item.price)*item.quantity)}</strong></div>):<div className="order-detail-empty">No item details were saved with this order.</div>}</div></section>
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
 const[busy,setBusy]=useState(false);
 const[error,setError]=useState("");

 function chooseFiles(list:FileList|null){
  if(!list)return;
  const next=Array.from(list).filter(f=>["image/jpeg","image/png","image/webp"].includes(f.type)&&f.size<=4*1024*1024);
  if(next.length!==Array.from(list).length){setError("Use JPG, PNG or WebP images up to 4 MB each.");return}
  if(images.length+files.length+next.length>6){setError("A product can have up to 6 images.");return}
  setFiles(cur=>[...cur,...next].slice(0,6-images.length));
 }
 function removeImage(index:number){setImages(cur=>cur.filter((_,i)=>i!==index))}
 function removeFile(index:number){setFiles(cur=>cur.filter((_,i)=>i!==index))}
 async function submit(e:React.FormEvent){
  e.preventDefault();setError("");
  const name=form.name.trim(),category=form.category.trim(),description=form.description.trim(),price=Number(form.price),stock=Number(form.stock);
  const sale=form.salePrice===""?null:Number(form.salePrice);
  if(name.length<2){setError("Product name must be at least 2 characters.");return}
  if(category.length<2){setError("Category must be at least 2 characters.");return}
  if(description.length<5){setError("Description must be at least 5 characters.");return}
  if(!Number.isFinite(price)||price<0){setError("Enter a valid product price.");return}
  if(form.salePrice!==""&&(!Number.isFinite(sale)||Number(sale)<0)){setError("Enter a valid sale price.");return}
  if(!Number.isInteger(stock)||stock<0){setError("Enter a valid whole-number stock quantity.");return}
  if(images.length+files.length<1){setError("Add at least one product image.");return}
  if(images.length+files.length>6){setError("A product can have up to 6 images.");return}
  setBusy(true);
  try{
   let allImages=[...images];
   if(files.length){
    const fd=new FormData();files.forEach(file=>fd.append("files",file));
    const u=await fetch("/api/admin/upload",{method:"POST",body:fd});const upload=await u.json();
    if(!u.ok)throw new Error(upload.error||"Image upload failed.");
    allImages=[...allImages,...(Array.isArray(upload.urls)?upload.urls:[upload.url]).filter(Boolean)];
   }
   const body={name,category,description,price,salePrice:form.salePrice===""?"":sale,stock,featured:form.featured,images:allImages};
   const r=await fetch("/api/admin/products",{method:existing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(existing?{...body,id:existing.id}:body)});
   const data=await r.json();
   if(!r.ok)throw new Error(data.error||"Could not save product.");
   onSaved(data);
  }catch(e){setError(e instanceof Error?e.message:"Could not save product.");}finally{setBusy(false);}
 }
 return <div style={{position:"fixed",inset:0,zIndex:110,background:"rgba(0,0,0,.38)",display:"grid",placeItems:"center",padding:18}}><div className="admin-card" style={{width:"min(720px,100%)",maxHeight:"92vh",overflow:"auto",position:"relative"}}><button className="icon-btn" style={{position:"absolute",right:14,top:14}} onClick={close} aria-label="Close"><X size={17}/></button><div className="eyebrow">Catalog</div><h2 style={{fontSize:32,letterSpacing:"-.05em"}}>{existing?"Edit the product.":"Add a product."}</h2><form className="form-grid" onSubmit={submit}><div className="field"><label>Name</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div><div className="field"><label>Category</label><input required value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></div><div className="field full"><label>Description</label><textarea required rows={4} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div><div className="field"><label>Price (₦)</label><input required type="number" min="0" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></div><div className="field"><label>Sale price (₦)</label><input type="number" min="0" value={form.salePrice} onChange={e=>setForm({...form,salePrice:e.target.value})}/></div><div className="field"><label>Stock</label><input required type="number" min="0" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></div><div className="field full"><label>Product images</label><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>chooseFiles(e.target.files)}/><span className="helper-text">Add up to 6 JPG, PNG or WebP images. The first image is the main storefront image.</span></div>{(images.length>0||files.length>0)&&<div className="field full"><div className="admin-image-grid">{images.map((img,i)=><div className="admin-image-item" key={img+i}><Image src={img} alt={"Product image "+(i+1)} fill sizes="110px" unoptimized style={{objectFit:"cover"}}/><button type="button" className="admin-image-remove" onClick={()=>removeImage(i)} aria-label={"Remove image "+(i+1)}><X size={13}/></button>{i===0&&<span className="admin-image-label">Main</span>}</div>)}{files.map((file,i)=><div className="admin-image-item file-preview" key={file.name+i}><div><ImagePlus size={22}/><span>{file.name}</span></div><button type="button" className="admin-image-remove" onClick={()=>removeFile(i)} aria-label={"Remove selected image "+(i+1)}><X size={13}/></button>{images.length===0&&i===0&&<span className="admin-image-label">Main</span>}</div>)}</div></div>}<div className="field full"><label>Image URLs (optional)</label><textarea rows={3} placeholder="Paste one image URL per line" onChange={e=>setImages(e.target.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,6-files.length))} value={images.join("\n")}/><span className="helper-text">If you use URLs, one per line. You can also upload files above.</span></div>{error&&<div className="field full"><div className="site-notice" role="alert"><div><strong>NIMA.</strong><span>{error}</span></div><button type="button" onClick={()=>setError("")} aria-label="Dismiss error"><X size={15}/></button></div></div>}<label className="full" style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}><input type="checkbox" checked={form.featured} onChange={e=>setForm({...form,featured:e.target.checked})}/> Feature this product</label><div className="full" style={{display:"flex",justifyContent:"end",gap:8}}><button type="button" className="btn secondary" onClick={close}>Cancel</button><button className="btn" disabled={busy}>{busy?"Saving...":existing?"Save changes":"Add product"}</button></div></form></div></div>
}
