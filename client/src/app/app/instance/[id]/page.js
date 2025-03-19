"use client";
import React, { useState } from "react";
import { useParams } from "react-router-dom";

function PageInstance() {
  const { id } = useParams(); // Get unique ID from URL
  const [text, setText] = useState(""); // State for this specific page

  return (
    <div>
      <h1>Page Instance: {id}</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Edit this page"
      />
      <p>Changes here do not affect other instances.</p>
    </div>
  );
}
export default PageInstance;
