"use client";
import{Check,ChevronDown,ShoppingBag}from"lucide-react";
import{useMemo,useState}from"react";
import{Product}from"@/lib/store";
import{useCart}from"./cart";

type Selection=Record<string,string>;
function groupsFor(product:Product){
 const map=new Map<string,string[]>();
 for(const variant of product.variants||[])for(const[name,value]of Object.entries(variant.options||{})){
  const key=name.trim();if(!key)continue;
  const values=map.get(key)||[];if(!values.includes(value))values.push(value);map.set(key,values);
 }
 return [...map.entries()];
}
function matches(variant:NonNullable<Product["variants"]>[number],selection:Selection,ignore?:string){return Object.entries(selection).every(([name,value])=>name===ignore||variant.options[name]===value)}

export function ProductPurchasePanel({product}:{product:Product}){
 const{add}=useCart(),variants=product.variants||[],groups=useMemo(()=>groupsFor(product),[product]),[selection,setSelection]=useState<Selection>({});
 const isVariant=variants.length>0;
 const selected=variants.find(v=>groups.length===Object.keys(selection).length&&groups.every(([name])=>selection[name])&&matches(v,selection));
 const price=Number(selected?.price??product.salePrice??product.price),stock=selected?selected.stock:product.stock;

 function available(name:string,value:string){return !isVariant||variants.some(v=>v.stock>0&&v.options[name]===value&&matches(v,selection,name))}
 function choose(name:string,value:string){setSelection(current=>{const next={...current,[name]:value};for(const[group]of groups){if(group===name)continue;const old=next[group];if(old&&!variants.some(v=>v.stock>0&&v.options[group]===old&&matches(v,next,group)))delete next[group]}return next})}
 function addToBag(){
  if(isVariant&&!selected)return;if(stock<1)return;
  add({productId:product.id,name:product.name,price,image:product.images[0]||"https://placehold.co/900x1125/F0ECE5/171513?text=NIMA",variantId:selected?.id,options:selected?.options});
 }

 return <div className="purchase-panel">
  <div className="purchase-price-row"><div className="purchase-price">{isVariant?"From ":""}₦{price.toLocaleString()}</div>{!selected&&product.salePrice&&<span className="old purchase-old">₦{Number(product.price).toLocaleString()}</span>}</div>
  {isVariant&&<div className="product-options">{groups.map(([name,values])=>{
   const isColor=name.toLowerCase().includes("color");
   return <fieldset className="product-option-group" key={name}><legend>{name}{selection[name]&&<span>{selection[name]}</span>}</legend>
    {isColor?<div className="color-radio-list" role="radiogroup" aria-label={name}>{values.map(value=><label className={"color-radio "+(selection[name]===value?"selected ":"")+(available(name,value)?"":" disabled")} key={value}>
     <input type="radio" name={"variant-"+product.id+"-"+name} value={value} checked={selection[name]===value} disabled={!available(name,value)} onChange={()=>choose(name,value)}/>
     <span className="radio-mark" aria-hidden="true">{selection[name]===value?<Check size={12}/>:null}</span><span>{value}</span>
    </label>)}</div>
    :values.length<=12?<div className="size-button-list" role="radiogroup" aria-label={name}>{values.map(value=><button type="button" className={"size-choice "+(selection[name]===value?"selected ":"")+(available(name,value)?"":" disabled")} disabled={!available(name,value)} aria-pressed={selection[name]===value} onClick={()=>choose(name,value)} key={value}>{value}</button>)}</div>
    :<label className="product-select-wrap"><span className="sr-only">{name}</span><select value={selection[name]||""} onChange={event=>{if(event.target.value)choose(name,event.target.value)}} aria-label={"Choose "+name}>
      <option value="">Choose {name.toLowerCase()}</option>{values.map(value=><option key={value} value={value} disabled={!available(name,value)}>{value}{!available(name,value)?" — unavailable":""}</option>)}
    </select><ChevronDown size={16} aria-hidden="true"/></label>}
   </fieldset>
  })}</div>}
  <div className={"availability purchase-availability "+(stock<1?"sold-out":"")}>{selected?stock.toLocaleString()+" available":isVariant?"Choose an available option":stock>0?stock.toLocaleString()+" available":"Currently unavailable"}</div>
  <button className="btn purchase-button" disabled={stock<1||isVariant&&!selected} onClick={addToBag}><ShoppingBag size={17}/>{isVariant&&!selected?"Choose options":stock<1?"Out of stock":"Add to bag"}</button>
  {selected&&<div className="selection-confirmation"><Check size={14}/>{Object.entries(selected.options).map(([name,value])=>name+": "+value).join(" · ")}</div>}
 </div>;
}
export{ProductPurchasePanel as AddToCartButton};
