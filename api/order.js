export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log("===== WEBFLOW ORDER RECEIVED =====");

    // Full payload (what Webflow sends)
    console.log("FULL BODY:");
    console.log(JSON.stringify(req.body, null, 2));

    // Extract payload safely
    const order = req.body.payload;

    if (!order) {
      console.log("⚠️ No payload field found");
      return res.status(400).json({ error: "No payload found" });
    }

    // Key fields (easier to read in logs)
    console.log("===== SUMMARY =====");
    console.log("Order ID:", order.orderId);
    console.log("Customer:", order.customerInfo?.email);

    console.log("Items:");
    order.purchasedItems.forEach(item => {
      console.log({
        productName: item.productName,
        variantName: item.variantName,
        SKU: item.variantSKU,
        quantity: item.count
      });
    });

    console.log("Shipping Address:", order.shippingAddress);

    return res.status(200).json({
      received: true,
      orderId: order.orderId
    });

  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
