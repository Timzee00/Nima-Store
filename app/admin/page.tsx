import{redirect}from"next/navigation";
import{getAdminSession}from"@/lib/auth";
import{getAdminProducts,getAdminStats,getRecentOrders,getCategoryMergeSuggestions}from"@/lib/store";
import{AdminDashboard}from"@/components/admin-dashboard";

export const dynamic="force-dynamic";

export default async function AdminPage({searchParams}:{searchParams:Promise<{catalog?:string}>}){
 const params=await searchParams;
 const initialArchived=params.catalog==="archived";
 const s=await getAdminSession();
 if(!s)redirect("/admin/login");
 const[p,o,stats,suggestions]=await Promise.all([
  getAdminProducts({page:1,pageSize:24,archived:initialArchived}),
  getRecentOrders({page:1,pageSize:20}),
  getAdminStats(),
  getCategoryMergeSuggestions()
 ]);
 return <AdminDashboard key={initialArchived?"archived":"active"} initialArchived={initialArchived} initialProducts={p.products} initialProductTotal={p.total} initialOrders={o.orders} initialOrderTotal={o.total} stats={stats} categorySuggestions={suggestions} canManageAccess={s.role==="owner"}/>;
}