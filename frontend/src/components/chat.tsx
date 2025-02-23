import React, { useState, useEffect, useRef } from "react";
import { useWebSocket } from "../api";

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

    try {
      sendMessage(
        JSON.stringify({
          type: "chat-file",
          data: { type: "chat-file", data: JSON.stringify(file) },
        }),
      );

      setFile(null);
      setMessageInput("");
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
      }
    } catch (error) {
      console.error("File upload error:", error);
      // Handle upload errors (e.g., display an error message to the user)
      alert("File upload failed. Please try again.");
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
      style={{
        height: "500px",
        width: "400px",
        border: "1px solid #ccc",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{ flexGrow: 1, padding: "10px", overflowY: "auto" }}
        ref={messageListRef}
      >
        {messageList.map((message, index) => (
          <div
            key={index}
            style={{
              marginBottom: "8px",
              padding: "8px",
              border: "1px solid #eee",
              borderRadius: "5px",
              backgroundColor: "#f9f9f9",
            }}
          >
            {message.data}
          </div>
        ))}
      </div>
      <div
        style={{
          padding: "10px",
          borderTop: "1px solid #ccc",
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
        <label htmlFor="fileInput" style={{ cursor: "pointer" }}>
          {file ? "Change File" : "Upload File"}
        </label>

        <input
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
        <button onClick={handleSendMessage} style={{ padding: "8px 15px" }}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
