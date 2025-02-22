import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles.css"; // Import the stylesheet
import { useWebSocket } from "../api";
import { ModeToggle } from "./mode-toggle.tsx"; // Import the ModeToggle component

interface NavbarProps {} // No props for now

const Navbar: React.FC<NavbarProps> = () => {
  const {
    requestAuthCode,
    qrCodeData,
    authCode,
    connectedDevices,
    // removeDevice,
    isConnected,
  } = useWebSocket();
  const [showQrCode, setShowQrCode] = useState(false);
  const [showOneTimeCode, setShowOneTimeCode] = useState(false);
  const [showDeviceList, setShowDeviceList] = useState(false);
  useEffect(() => {
    if (qrCodeData) {
      // Check if qrCodeData has been received
      setShowQrCode(true);
      setShowOneTimeCode(false);
      setShowDeviceList(false);
    } else if (authCode) {
      // Similarly check for authCode
      setShowOneTimeCode(true);
      setShowQrCode(false);
      setShowDeviceList(false);
    } else if (connectedDevices.length > 0) {
      setShowDeviceList(true);
      setShowQrCode(false);
      setShowOneTimeCode(false);
    }
  }, [qrCodeData, authCode, connectedDevices]);
  const handleAddDeviceClick = () => {
    if (showQrCode || showOneTimeCode) {
      setShowQrCode(false);
      setShowOneTimeCode(false);
    } else {
      if (isConnected) {
        // Check for connection before requesting
        requestAuthCode(); // Use the context function
      } else {
        console.warn("WebSocket is not connected. Cannot request QR code.");
      }
    }
  };
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">
          Nodeflow
        </Link>
      </div>
      <div className="navbar-center">
        <Link to="/journal" className="nav-link">
          Journal
        </Link>
        <Link to="/storage" className="nav-link">
          Storage
        </Link>{" "}
        <Link to="/todos" className="nav-link">
          Todos
        </Link>
      </div>
      <div className="navbar-right">
        <ModeToggle />
        <div className="dropdown">
          <button className="dropbtn">Account</button>
          <div className="dropdown-content">
            <button id="addDeviceButton" onClick={handleAddDeviceClick}>
              Add Device
            </button>

            {showQrCode && (
              <div id="qrCodeContainer">
                <img
                  id="qrCodeImage"
                  src={qrCodeData as string}
                  alt="QR Code"
                />
              </div>
            )}

            {showOneTimeCode && ( // Conditionally render the one-time code
              <div id="oneTimeCodeContainer">
                One-Time Code: <span id="oneTimeCode">{authCode}</span>
              </div>
            )}

            {showDeviceList && ( // Conditionally render the connected devices list
              <div id="connectedDevicesContainer">
                <h3>Connected Devices</h3>
                <ul id="connectedDevicesList">
                  {connectedDevices.length === 0 ? (
                    <li>No devices connected.</li>
                  ) : (
                    connectedDevices.map((device) => (
                      <li key={device}>{device}</li>
                    ))
                  )}
                </ul>{" "}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
