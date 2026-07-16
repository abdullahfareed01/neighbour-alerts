import React from "react";
import Sidebar from "./Sidebar";

function MainLayout({children}) {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar />
      <div
        style={{
          width: "70%",
          padding: "1rem",
          background: "#fff",
          boxSizing: "border-box",
        }}
      >
        {children}

      </div>
    </div>
  );
}

export default MainLayout;
