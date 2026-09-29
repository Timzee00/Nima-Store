"use client";
import{RefreshCw}from"lucide-react";
import{useMemo,useState}from"react";

export type VariantDraft={id?:string;options:Record<string,string>;price:number;stock:number;sku:string};

function values(text:string){return [...new Set(text.split(/[\n,]/).map(x=>x.trim()).filter(Boolean))]}
function optionKey(options:Record<string,string>){return Object.keys(options).sort().map(name=>name.toLowerCase()+"="+options[name].trim().toLowerCase()).join("|")}
function infer(value:VariantDraft[]){
 const names=[...new Set(value.flatMap(v=>Object.keys(v.options||{})))];
 const size=names.find(name=>name.toLowerCase().includes("size"));
 const color=names.find(name=>name.toLowerCase().includes("color"));
 const ordered=[...(size?[size]:[]),...(color&&color!==size?[color]:[]),...names.filter(name=>name!==size&&name!==color)];
 return [0,1].map(i=>({name:ordered[i]||(i===0?"Size":"Color"),values:ordered[i]?[...new Set(value.map(v=>v.options[ordered[i]]).filter(Boolean))]:[]}));
}

export function ProductVariantsEditor({enabled,onEnabledChange,value,onChange,basePrice}:{enabled:boolean;onEnabledChange:(enabled:boolean)=>void;value:VariantDraft[];onChange:(value:VariantDraft[])=>void;basePrice:number}){
 const initial=useMemo(()=>infer(value),[]);
 const[groupOneName,setGroupOneName]=useState(initial[0].name),[groupOneValues,setGroupOneValues]=useState(initial[0].values.join("\n"));
 const[groupTwoName,setGroupTwoName]=useState(initial[1].name),[groupTwoValues,setGroupTwoValues]=useState(initial[1].values.join("\n"));
 const[error,setError]=useState("");

 function generate(){
  setError("");
  const groups=[{name:groupOneName.trim()||"Size",values:values(groupOneValues)},{name:groupTwoName.trim()||"Color",values:values(groupTwoValues)}].filter(group=>group.values.length);
  if(!groups.length){setError("Add at least one option name and value.");return}
  if(new Set(groups.map(group=>group.name.toLowerCase())).size!==groups.length){setError("Option names must be different.");return}
  const combinations:Record<string,string>[]=[{}];
  for(const group of groups){
   const next:Record<string,string>[]=[];
   for(const combination of combinations)for(const value of group.values)next.push({...combination,[group.name]:value});
   if(next.length>200){setError("This product would create more than 200 combinations. Reduce the option values.");return}
   combinations.splice(0,combinations.length,...next);
  }
  const existing=new Map(value.map(v=>[optionKey(v.options),v]));
  onChange(combinations.map(options=>{const previous=existing.get(optionKey(options));return{id:previous?.id,options,price:previous?.price??basePrice,stock:previous?.stock??0,sku:previous?.sku??""}}));
 }

 return <div className="variant-editor">
  <label className="variant-toggle"><input type="checkbox" checked={enabled} onChange={event=>{if(event.target.checked)onEnabledChange(true);else{onEnabledChange(false);onChange([])}}}/><span><strong>Customers choose options for this product</strong><small>Optional. Use size, color, or another simple option. Products without options keep the normal buying flow.</small></span></label>
  {enabled&&<>
   <div className="variant-editor-grid">
    <div className="field"><label>Option 1 name</label><input value={groupOneName} onChange={event=>setGroupOneName(event.target.value)} placeholder="Size"/><textarea rows={5} value={groupOneValues} onChange={event=>setGroupOneValues(event.target.value)} placeholder={"8\n9\n10\n11"}/><span className="helper-text">Enter all values, one per line or separated by commas.</span></div>
    <div className="field"><label>Option 2 name <span className="muted-inline">optional</span></label><input value={groupTwoName} onChange={event=>setGroupTwoName(event.target.value)} placeholder="Color"/><textarea rows={5} value={groupTwoValues} onChange={event=>setGroupTwoValues(event.target.value)} placeholder={"Black\nWhite\nPink"}/><span className="helper-text">Leave values empty when this product only needs one option group.</span></div>
   </div>
   <div className="variant-generate-row"><button type="button" className="btn secondary" onClick={generate}><RefreshCw size={15}/> Generate combinations</button><span>Up to 200 combinations per product.</span></div>
   {error&&<div className="site-notice" role="alert"><div><strong>NIMA.</strong><span>{error}</span></div></div>}
   {value.length>0&&<div className="variant-table-wrap"><table className="table variant-table"><thead><tr><th>Options</th><th>Price</th><th>Stock</th><th>SKU</th></tr></thead><tbody>{value.map((variant,index)=><tr key={optionKey(variant.options)}><td>{Object.entries(variant.options).map(([name,item])=>name+": "+item).join(" · ")}</td><td><input type="number" min="0" value={variant.price} onChange={event=>onChange(value.map((item,i)=>i===index?{...item,price:Number(event.target.value)}:item))}/></td><td><input type="number" min="0" value={variant.stock} onChange={event=>onChange(value.map((item,i)=>i===index?{...item,stock:Number(event.target.value)}:item))}/></td><td><input className="variant-sku-input" value={variant.sku} placeholder="Optional" onChange={event=>onChange(value.map((item,i)=>i===index?{...item,sku:event.target.value}:item))}/></td></tr>)}</tbody></table></div>}
   {!value.length&&<div className="variant-empty"><RefreshCw size={15}/> Generate the combinations to add stock and prices per option.</div>}
  </>}
 </div>;
}
