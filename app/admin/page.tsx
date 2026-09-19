import{redirect}from"next/navigation";
import{getAdminSession}from"@/lib/auth";
import{getAdminProducts,getAdminStats,getRecentOrders}from"@/lib/store";
import{AdminDashboard}from"@/components/admin-dashboard";

export const dynamic="force-dynamic";

export default async function AdminPage(){
 const s=await getAdminSession();
 if(!s)redirect("/admin/login");
 const[p,o,stats]=await Promise.all([
  getAdminProducts({page:1,pageSize:24}),
  getRecentOrders({page:1,pageSize:20}),
  getAdminStats()
 ]);
 return <AdminDashboard initialProducts={p.products} initialProductTotal={p.total} initialOrders={o.orders} initialOrderTotal={o.total} stats={stats}/>;
}