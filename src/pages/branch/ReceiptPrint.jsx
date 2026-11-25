import React from "react";
import "./ReceiptPrint.css";

const LOGO_SRC = "/images/bawa_hotel_tamil_logo.jpeg";
const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

const signedRoundOff = (value) => {
  const amount = Number(value || 0);
  if (amount > 0) return `+${money(amount)}`;
  if (amount < 0) return `-${money(Math.abs(amount))}`;
  return money(0);
};

export default function ReceiptPrint({ receipt }) {
  if (!receipt) return null;

  const branch = receipt.branch || {};
  const items = Array.isArray(receipt.items) ? receipt.items : [];
  const logoSrc = receipt.logoDataUri || LOGO_SRC;

  return (
    <div id="receipt-print-root">
      <div
        className="thermal-receipt"
        style={{
          width: "72mm",
          minWidth: "72mm",
          boxSizing: "border-box",
          padding: "2mm",
          background: "#ffffff",
          color: "#000000",
          fontFamily: "Arial, sans-serif",
          fontSize: "11px",
          lineHeight: 1.35,
        }}
      >
        <div className="receipt-header" style={{ textAlign: "center" }}>
          {logoSrc ? (
            <img
              className="receipt-logo"
              src={logoSrc}
              alt="Bawa Restaurant"
              crossOrigin="anonymous"
              style={{
                display: "block",
                width: "42mm",
                maxWidth: "100%",
                maxHeight: "30mm",
                objectFit: "contain",
                margin: "0 auto 5px",
              }}
            />
          ) : null}
          <div style={{ fontWeight: 700, fontSize: "14px" }}>
            {branch.name || "BAWA RESTAURANT"}
          </div>
          {branch.address ? <div>{branch.address}</div> : null}
          {branch.phone ? <div>Ph: {branch.phone}</div> : null}
          {branch.gstin ? <div>GSTIN: {branch.gstin}</div> : null}
        </div>

        <div style={{ textAlign: "center", fontWeight: 700, marginTop: 7 }}>
          PAYMENT RECEIPT
        </div>
        <hr style={{ border: 0, borderTop: "1px dashed #000", margin: "6px 0" }} />

        <div>Invoice: {receipt.invoiceNumber || "-"}</div>
        <div>Date: {receipt.date || "-"}</div>
        {receipt.serviceMode ? <div>Type: {receipt.serviceMode}</div> : null}
        {receipt.cashier ? <div>Cashier: {receipt.cashier}</div> : null}

        <hr style={{ border: 0, borderTop: "1px dashed #000", margin: "6px 0" }} />

        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", width: "48%" }}>Item</th>
              <th style={{ textAlign: "center", width: "13%" }}>Qty</th>
              <th style={{ textAlign: "right", width: "19%" }}>Rate</th>
              <th style={{ textAlign: "right", width: "20%" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const quantity = Number(item.quantity || 0);
              const price = Number(item.price || 0);
              return (
                <tr key={item.id || `${item.name || "item"}-${index}`}>
                  <td style={{ padding: "3px 2px 3px 0", overflowWrap: "anywhere" }}>
                    {item.name || "Food Item"}
                  </td>
                  <td style={{ textAlign: "center", padding: "3px 0" }}>{quantity}</td>
                  <td style={{ textAlign: "right", padding: "3px 0" }}>{price.toFixed(2)}</td>
                  <td style={{ textAlign: "right", padding: "3px 0" }}>
                    {(price * quantity).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <hr style={{ border: 0, borderTop: "1px dashed #000", margin: "6px 0" }} />

        <div className="receipt-row" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span>Subtotal</span><span>{money(receipt.subtotal)}</span>
        </div>
        {Number(receipt.discountAmount || 0) > 0 ? (
          <div className="receipt-row" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span>Discount</span><span>-{money(receipt.discountAmount)}</span>
          </div>
        ) : null}
        <div className="receipt-row" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span>CGST (2.5%)</span><span>{money(receipt.cgst)}</span>
        </div>
        <div className="receipt-row" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span>SGST (2.5%)</span><span>{money(receipt.sgst)}</span>
        </div>
        {receipt.amountBeforeRounding !== undefined ? (
          <>
            <div className="receipt-row" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span>Amount Before Rounding</span><span>{money(receipt.amountBeforeRounding)}</span>
            </div>
            <div className="receipt-row" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span>Round Off</span><span>{signedRoundOff(receipt.roundOff)}</span>
            </div>
          </>
        ) : null}

        <hr style={{ border: 0, borderTop: "1px dashed #000", margin: "6px 0" }} />
        <div
          className="receipt-grand-total"
          style={{ display: "flex", justifyContent: "space-between", gap: 8, fontWeight: 700, fontSize: "14px" }}
        >
          <span>GRAND TOTAL</span><span>{money(receipt.total)}</span>
        </div>
        {receipt.paymentMethod ? (
          <>
            <hr style={{ border: 0, borderTop: "1px dashed #000", margin: "6px 0" }} />
            <div style={{ fontWeight: 700 }}>Payment: {receipt.paymentMethod}</div>
            {receipt.paymentMethod === "CASH" || receipt.paymentMethod === "SPLIT" ? (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Cash</span><span>{money(receipt.cashAmount)}</span>
              </div>
            ) : null}
            {receipt.paymentMethod === "UPI" || receipt.paymentMethod === "SPLIT" ? (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>UPI</span><span>{money(receipt.upiAmount)}</span>
              </div>
            ) : null}
          </>
        ) : null}

        <hr style={{ border: 0, borderTop: "1px dashed #000", margin: "6px 0" }} />
        <div style={{ textAlign: "center", fontWeight: 700, marginTop: 8 }}>
          Thank you! Visit Again
        </div>
      </div>
    </div>
  );
}
