import{redirect}from"next/navigation";
import{getAdminSession}from"@/lib/auth";
import{getSupportTickets}from"@/lib/store";
import{AdminSupport}from"@/components/admin-support";
import{AdminNavigation}from"@/components/admin-navigation";

export const dynamic="force-dynamic";

export default async function SupportAdmin(){
 if(!await getAdminSession())redirect("/admin/login");
 const tickets=await getSupportTickets();
 return <main className="admin-shell">
  <AdminNavigation/>
  <header className="admin-top">
   <div><strong>NIMA.</strong><span className="admin-top-sub">Support desk</span></div>
   <div className="admin-top-actions"><a className="btn secondary admin-top-btn" href="/admin">Back to dashboard</a></div>
  </header>
  <main className="admin-main">
   <div className="admin-heading"><div><div className="eyebrow">Customer care</div><h1>Support tickets.</h1><p>Review customer requests and update their status from the admin workspace.</p></div></div>
   <AdminSupport initial={tickets}/>
  </main>
 </main>;
}