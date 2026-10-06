"use client";

import { useSyncExternalStore } from "react";

const THEME_INIT = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t="dark"}var d=document.documentElement;d.setAttribute("data-theme",t);d.classList.toggle("dark",t==="dark")}catch(e){}})();`;

const subscribe = () => () => {};

export function ThemeScript() {
  const fromServer = useSyncExternalStore(subscribe, () => false, () => true);
  if (!fromServer) return null;
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />;
}
