import React, { useState, useEffect, useRef } from "react";
import { useWebSocket } from "../api";
import { sendFormData } from "./utils";
import "../styles.css"; //Importing stylesheet

const ChatInterface: React.FC = () => {
  const [messageList, setMessageList] = useState<
    { data: string; id: number }[]
  >([]);
  const [messageInput, setMessageInput] = useState("");
  const [file, setFile] = useState<File | null>(null); // Store the selected file
  const messageListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for the file input

  const { latestMessage, sendMessage } = useWebSocket();

  useEffect(() => {
    if (latestMessage) {
      try {
        const parsedMessage = JSON.parse(latestMessage);
        if (parsedMessage.type === "recieve-chat") {
          setMessageList((prevMessages) => [
            ...prevMessages,
            parsedMessage.data,
          ]);
        }
        if (parsedMessage.type === "recieve-chat-file") {
          setMessageList((prevMessages) => [
            ...prevMessages,
            parsedMessage.data,
          ]);
        }
      } catch (error) {
        console.error("Error parsing latest message:", error);
        console.error("Latest message was:", latestMessage);
      }
    }
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

  const handleFileUpload = async () => {
    console.log(file);
    if (!file) return;

    sendFormData("file", file, file.name);
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
      style={{
        height: "500px",
        width: "400px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        id="messageDisplay"
        style={{ flexGrow: 1, padding: "10px", overflowY: "auto" }}
        ref={messageListRef}
      >
        {messageList.map((message, index) => (
          <div
            id="messageContainer"
            key={index}
            style={{
              marginBottom: "8px",
              padding: "8px",
              border: "1px solid #eee",
              borderRadius: "5px",
            }}
          >
            {message.data}
          </div>
        ))}
      </div>
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
        <button id="sendButton" onClick={handleSendMessage} style={{ padding: "8px 15px" }}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
