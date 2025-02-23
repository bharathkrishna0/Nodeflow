import React, { useState, useEffect, useRef } from "react";
import "../journal.css";
// import Markdown from "react-markdown";
import ReactMarkdown from "react-markdown";
// import remarkPrism from "remark-prism";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { useWebSocket } from "../api";
import gfm from "remark-gfm";
// import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";

async function sendFormData(
  text: string,
  filename: string,
  endpoint: string = "/sendfile",
): Promise<void> {
  try {
    const formData = new FormData();

    formData.append("text", text);
    formData.append("filename", filename);

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData, // No need to set Content-Type; fetch does it automatically for FormData
    });

    if (!response.ok) {
      const errorText = await response.text(); // Get error details from the server
      throw new Error(`HTTP error ${response.status}: ${errorText}`); // Throw an error with details
    }

    const data = await response.json(); // If the server sends back JSON
    console.log("File uploaded successfully:", data);
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

const TextEditor: React.FC = () => {
  const [markdownText, setMarkdownText] = useState("");

  const { latestMessage, sendMessage } = useWebSocket();
  const typingSpaceRef = useRef<HTMLTextAreaElement>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    if (latestMessage) {
      try {
        const parsedMessage = JSON.parse(latestMessage);

        //Check for message type
        if (parsedMessage.type === "contentUpdate") {
          console.log("contentUpdate");
          console.log(parsedMessage.data, "data");
          setMarkdownText(parsedMessage.data.data);
          if (typingSpaceRef.current) {
            typingSpaceRef.current.value = parsedMessage.data.data;
          }
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    }
  }, [latestMessage, isPreviewMode]);
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = event.target.value;
    console.log(newText, "newtext");
    setMarkdownText(newText);
    // Send message on every change
    sendMessage(JSON.stringify({ type: "contentUpdate", data: newText }));
  };

  const handleSave = () => {
    const filename = prompt("Enter filename:", "journal_entry.md"); // Default filename
    if (filename === null || filename.trim() === "") {
      // User cancelled or entered an empty filename
      alert("Filename is required.");
      return; // Stop the saving process
    }
    sendFormData(markdownText, filename);
    //Implement save logic (e.g., to local storage or server)
    console.log("Saving:", markdownText);
    //Simple download of the text as a file.
    // const blob = new Blob([markdownText], { type: "text/markdown" });
    // const url = URL.createObjectURL(blob);
    // const a = document.createElement("a");
    // a.href = url;
    // a.download = "journal_entry.md";
    // a.click();
    // URL.revokeObjectURL(url); // Clean up
  };

  const handleClear = () => {
    setMarkdownText("");
    if (typingSpaceRef.current) {
      typingSpaceRef.current.value = "";
    }
    sendMessage(JSON.stringify({ type: "contentUpdate", content: "" }));
  };

  const handlePreview = () => {
    console.log("preview");
    setIsPreviewMode(!isPreviewMode);
  };
  return (
    <div>
      <div id="parentContainer">
        <div id="displayDiv"></div>

        <div id="textDiv">
          <div id="optonsDiv">
            <ul id="optionsList">
              <a className="fileButton" id="save" onClick={handleSave}>
                SAVE
              </a>
              <a className="fileButton" id="file">
                OPEN
              </a>
              <a className="fileButton" id="preview" onClick={handlePreview}>
                PREVIEW
              </a>
              <a className="fileButton" id="clear" onClick={handleClear}>
                CLEAR
              </a>
            </ul>
          </div>
          <div id="typingDiv">
            <textarea
              id="typingSpace"
              placeholder="Go crazy here . . ."
              onChange={handleInputChange}
              ref={typingSpaceRef}
              // style={{ display: isPreviewMode ? "block" : "block" }}
            ></textarea>
          </div>

          <div
            id="previewDiv"
            style={{ display: isPreviewMode ? "block" : "none" }}
          >
            <ReactMarkdown
              remarkPlugins={[gfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                ol: ({ children, ...props }) => (
                  <ol
                    className="max-w-md space-y-1 text-gray-500 list-decimal list-inside dark:text-gray-400"
                    {...props}
                  >
                    {children}
                  </ol>
                ),
                ul: ({ children, ...props }) => (
                  <ul
                    className="max-w-md space-y-1 text-gray-500 list-disc list-inside dark:text-gray-400"
                    {...props}
                  >
                    {children}
                  </ul>
                ),
                h1: ({ children, ...props }) => (
                  <h1
                    className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white"
                    {...props}
                  >
                    {children}
                  </h1>
                ),
                h2: ({ children, ...props }) => (
                  <h2
                    className="text-4xl font-extrabold dark:text-white"
                    {...props}
                  >
                    {children}
                  </h2>
                ),
                h3: ({ children, ...props }) => (
                  <h3 className="text-3xl font-bold dark:text-white" {...props}>
                    {children}
                  </h3>
                ),

                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  // Cast children to string, handle null/undefined
                  const codeString =
                    children == null ? "" : String(children).replace(/\n$/, "");

                  return match ? (
                    <SyntaxHighlighter
                      // style={oneDark}
                      language={match[1]}
                      PreTag="div"
                    >
                      {codeString}
                    </SyntaxHighlighter>
                  ) : (
                    <code {...props} className={className}>
                      {children}
                    </code>
                  );
                },
                table: ({ ...props }) => (
                  <table
                    className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400"
                    {...props}
                  />
                ),
                th: ({ ...props }) => (
                  <th className="px-6 py-3 border-black" {...props} />
                ),
                td: ({ ...props }) => (
                  <td className="px-6 py-4 border-black" {...props} />
                ),
              }}
              children={markdownText}
            />
            {/* <Markdown remarkPlugins={[remarkGfm, remarkMath]}> */}
            {/*   {markdownText} */}
            {/* </Markdown> */}
            {/* <Markdown remarkPlugins={[remarkGfm]}>{markdownText}</Markdown> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextEditor;
