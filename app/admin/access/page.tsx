import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { AdminNavigation } from "@/components/admin-navigation";
import { StoreAccess } from "@/components/store-access";
export const dynamic="force-dynamic";
export default async function AccessPage(){
 const session=await getAdminSession();
 if(!session)redirect("/admin/login");
 if(session.role!=="owner")notFound();
 return <main className="admin-shell">
  <AdminNavigation canManageAccess/>
  <div className="admin-top"><div><strong>NIMA.</strong><span className="admin-top-sub">Control room</span></div><a className="btn secondary admin-top-btn" href="/admin">Back</a></div>
  <main className="admin-main">
   <div className="admin-heading"><div><div className="eyebrow">Account settings</div><h1>Store access.</h1></div></div>
   <StoreAccess/>
  </main>
 </main>;
}
