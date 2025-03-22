import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useRef } from "react";

function PageInstance() {
  const { id } = useParams(); // Get unique ID from URL
  const [text, setText] = useState(""); // State for this specific page
  const ref = useRef();
const sendMessage = () => {
  const message = ref.current.value;
  console.log(message)
}

  return (
    <div>
      <h1>Page Instance: {id}</h1>
      <textarea
        ref = {ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Edit this page"
      />
      <button onClick={sendMessage}>Click to send message</button>
      <p>Changes here do not affect other bobcat.</p>
    </div>
  );
}

export default PageInstance;
