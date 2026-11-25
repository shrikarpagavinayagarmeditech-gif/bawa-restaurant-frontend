
import React from "react";
import "./ReceiptPrint.css";

// Logo inside frontend/public/images/
const LOGO_SRC = "/images/bawa_hotel_tamil_logo.jpeg";

const money = (value) =>
  `Rs. ${Number(value || 0).toFixed(2)}`;

export default function ReceiptPrint({ receipt }) {
  if (!receipt) return null;

  const branch = receipt.branch || {};

  const items = Array.isArray(receipt.items)
    ? receipt.items
    : [];

  const subtotal = Number(receipt.subtotal || 0);
  const discountAmount = Number(receipt.discountAmount || 0);
  const cgst = Number(receipt.cgst ?? receipt.cgstAmount ?? 0);
  const sgst = Number(receipt.sgst ?? receipt.sgstAmount ?? 0);

  const total = Number(
    receipt.finalAmount ??
    receipt.total ??
    receipt.totalAmount ??
    subtotal - discountAmount + cgst + sgst
  );

  return (
    <div id="receipt-print-root">
      <div className="thermal-receipt">

        {/* LOGO */}
        <div className="receipt-header">

          <img
            className="receipt-logo"
            src={LOGO_SRC}
            alt="Bawa Restaurant Logo"
            crossOrigin="anonymous"
            loading="eager"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />

          <h2>
            {branch.name || "BAWA RESTAURANT"}
          </h2>

          {branch.address && (
            <p className="receipt-address">
              {branch.address}
            </p>
          )}

          {branch.phone && (
            <p className="receipt-small-text">
              Mobile: {branch.phone}
            </p>
          )}

          {branch.gstin && (
            <p className="receipt-small-text">
              GSTIN: {branch.gstin}
            </p>
          )}

        </div>

        <p className="center receipt-title">
          INVOICE RECEIPT
        </p>

        <hr />

        {/* INVOICE DETAILS */}
        <div className="receipt-meta">
          <p>
            <strong>Invoice No:</strong>{" "}
            {receipt.invoiceNumber || "-"}
          </p>

          <p>
            <strong>Date:</strong>{" "}
            {receipt.date || "-"}
          </p>
        </div>

        <hr />

        {/* ITEMS */}
        <table className="receipt-items">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => {
              const quantity = Number(item.quantity || 0);

              const price = Number(
                item.price ??
                item.rate ??
                item.fooditem?.rate ??
                item.foodItem?.rate ??
                0
              );

              const amount = Number(
                item.amount ?? price * quantity
              );

              return (
                <tr key={item.id || index}>
                  <td className="receipt-item-name">
                    {item.name ||
                      item.fooditem?.name ||
                      item.foodItem?.name ||
                      "Item"}
                  </td>

                  <td>{quantity}</td>

                  <td>{money(amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <hr />

        {/* BILL SUMMARY */}
        <div className="receipt-row">
          <span>Subtotal</span>
          <span>{money(subtotal)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="receipt-row">
            <span>Discount</span>
            <span>-{money(discountAmount)}</span>
          </div>
        )}

        <div className="receipt-row receipt-tax-row">
          <span>CGST (2.5%)</span>
          <span>{money(cgst)}</span>
        </div>

        <div className="receipt-row receipt-tax-row">
          <span>SGST (2.5%)</span>
          <span>{money(sgst)}</span>
        </div>

        {receipt.roundOff !== undefined &&
          Number(receipt.roundOff) !== 0 && (
            <div className="receipt-row">
              <span>Round Off</span>
              <span>{money(receipt.roundOff)}</span>
            </div>
          )}

        <hr />

        {/* GRAND TOTAL */}
        <div className="receipt-row receipt-grand-total">
          <strong>GRAND TOTAL</strong>
          <strong>{money(total)}</strong>
        </div>

        <hr />

        {/* PAYMENT DETAILS */}
        {receipt.paymentMethod && (
          <div className="receipt-row">
            <span>Payment</span>
            <span>{receipt.paymentMethod}</span>
          </div>
        )}

        {/* FOOTER */}
        <div className="receipt-footer">
          <p className="center thank-you">
            Thank you! Visit Again
          </p>

          <p className="center">
            Powered by Bawa Restaurant
          </p>
        </div>

      </div>
    </div>
  );
}
