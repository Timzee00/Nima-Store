"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle({className=""}:{className?:string}){
  const {theme,toggle}=useTheme();
  return <button className={"theme-toggle "+className} onClick={toggle} aria-label={theme==="light"?"Switch to dark theme":"Switch to light theme"} title={theme==="light"?"Dark theme":"Light theme"}>
    {theme==="light"?<Moon size={18}/>:<Sun size={18}/>}
  </button>;
}
