import React, { useState, useEffect, useRef, JSX } from "react";
import { useWebSocket } from "../api";
import { sendFormData, getImage } from "./utils";

async function createMessageTag(message: {
  type: string;
  data: string;
}): Promise<JSX.Element> {
  if (message.type === "file") {
    if (message.data.endsWith(".jpg") || message.data.endsWith(".png")) {
      // Corrected file extension check
      try {
        const imageBlob: Blob = (await getImage(message.data)) as Blob; // No need for 'as Blob' if getImage returns a Blob
        if (!imageBlob) {
          return <a href="/">{`${message.data} error retrieving file`}</a>; // Return JSX for error link
        }
        const imageUrl = URL.createObjectURL(imageBlob);
        return <img id="sentImage" src={imageUrl} alt={`Image: ${message.data}`} />; // Return JSX for image
      } catch (error) {
        console.error("Error getting image:", error);
        return <a href="/">{`${message.data} error retrieving file`}</a>; // JSX for error link
      }
    } else {
      return <a href="/">{message.data}</a>; // JSX for generic link
    }
  } else {
    return <span id="sentMessage">{message.data}</span>; // JSX for text
  }
}
import "../styles.css"; //Importing stylesheet

const ChatInterface: React.FC = () => {
  const [messageList, setMessageList] = useState<JSX.Element[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [messageDisplayVisible, setMessageDisplayVisible] = useState(false);
  const [file, setFile] = useState<File | null>(null); // Store the selected file
  const messageListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for the file input
  const messageBoxRef = useRef<HTMLInputElement | null>(null);
  const { latestMessage, sendMessage } = useWebSocket();

  useEffect(() => {
    async function processMessage() {
      // Define an async function *inside* useEffect
      if (latestMessage) {
        try {
          const parsedMessage = JSON.parse(latestMessage);

          if (parsedMessage.type === "recieve-chat") {
            const content = await createMessageTag(parsedMessage.data);
            setMessageList((prevMessages) => [...prevMessages, content]);
          }
        } catch (error) {
          console.error("Error parsing latest message:", error);
          console.error("Latest message was:", latestMessage);
        }
      }
    }

    processMessage();
  }, [latestMessage]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messageList]);

  const handleSendMessage = () => {
    if (file) {
      handleFileUpload(); // Call file upload if a file is selected
    } else if (messageInput.trim()) {
      sendMessage(JSON.stringify({ type: "chat", data: messageInput }));
      setMessageInput("");
    }
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessageInput(selectedFile.name); // Display file name in the input
    } else {
      setFile(null);
      setMessageInput("");
    }
  };

  const handleFileUpload = async () => {
    console.log(file);
    if (!file) return;

    sendFormData("file", file, file.name);
  };

  const handleBlur = () => setMessageDisplayVisible(false);
  useEffect(() => {
    // const handleBlur = () => setMessageDisplayVisible(false);
    const handleFocus = () => setMessageDisplayVisible(true);

    const messageBox = messageBoxRef.current; // Store the current value
    console.log(messageBox);

    if (messageBox) {
      messageBox.addEventListener("mouseenter", handleFocus);
      // messageBox.addEventListener("mouseleave", handleBlur);
    }
  }, [messageBoxRef]);
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (file) {
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
      }
    }
    setMessageInput(e.target.value);
  };

  return (
    <div
      id="parentMessageContainer"
      ref={messageBoxRef} // Attach the ref
      style={{
        height: "500px",
        width: "400px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {messageDisplayVisible && (
        <div
          id="messageDisplay"
          style={{ flexGrow: 1, padding: "10px", overflowY: "auto" }}
          ref={messageListRef}
        >
          <button
            id="collapse"
            onClick={handleBlur}
            style={{ padding: "8px 15px" }}
          >
            collapse
          </button>

          {messageList.map((message, index) => (
            <div key={index}>{message}</div> // Render the JSX elements
          ))}
        </div>
      )}
      <div
        id="messageSpace"
        style={{
          padding: "10px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
        }}
      >
        {!file && ( // Show file input only if no file is selected
          <input
            type="file"
            onChange={handleFileChange}
            ref={fileInputRef} // Attach the ref
            style={{ display: "none" }}
            id="fileInput"
          />
        )}
        <label id="fileLabel" htmlFor="fileInput" style={{ cursor: "pointer" }}>
          {file ? "Change" : "Upload"}
        </label>

        <input
          id="messageBox"
          type="text"
          style={{ flexGrow: 1, padding: "8px" }}
          placeholder={file ? "" : "Type a message..."} // Placeholder changes
          value={messageInput}
          onChange={handleTextChange}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSendMessage();
            }
          }}
        />
        <button
          id="sendButton"
          onClick={handleSendMessage}
          style={{ padding: "8px 15px" }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
