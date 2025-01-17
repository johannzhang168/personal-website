import React from "react";
import Navbar from "./components/Navbar";
import NameTab from "./components/NameTab";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100 text-black">
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar />
      </div>
      <div className="container mx-auto p-4 pt-[80px]">
        <div className="flex flex-col items-center gap-5">
          <NameTab />
          <main className="w-[50vw]">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
