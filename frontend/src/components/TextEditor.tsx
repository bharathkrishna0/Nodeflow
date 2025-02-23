import React from "react";
import "../journal.css";
import ReactMarkdown from 'react-markdown'

const TextEditor: React.FC = () => {
  return (<div>
      <div id="parentContainer">
        <div id="displayDiv">

        </div>

        <div id="textDiv">
          <div id="optonsDiv">
            <ul id="optionsList">
              <a className="fileButton" id="save">SAVE</a>
              <a className="fileButton" id="file">OPEN</a>
              <a className="fileButton" id="preview">PREVIEW</a>
              <a className="fileButton" id="clear">CLEAR</a>
            </ul>
          </div>
          <div id="typingDiv">
            <textarea id="typingSpace" placeholder="Go crazy here . . ."></textarea>
          </div>

          <div id="previewDiv">
            <ReactMarkdown></ReactMarkdown>
          </div>

        </div>

      </div>

  </div>
  );
};

export default TextEditor;
