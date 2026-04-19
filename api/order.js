export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    const order = body.payload;

    console.log("===== NEW ORDER =====");
    console.log(JSON.stringify(order, null, 2));

    // Split name
    const nameParts = order.customerInfo.fullName.split(" ");
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "";

    // 🔴 Fetch all Printify products (we’ll optimise later)
    const printifyProductsRes = await fetch(
      `https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/products.json`,
      {
        headers: {
          "Authorization": `Bearer ${process.env.PRINTIFY_API_KEY}`
        }
      }
    );

    const printifyProducts = await printifyProductsRes.json();

    // Map items using SKU
    const line_items = order.purchasedItems.map(item => {

      if (!item.variantSKU) {
        throw new Error(`Missing SKU for variantId: ${item.variantId}`);
      }

      let match = null;

      for (const product of printifyProducts.data) {
        for (const variant of product.variants) {
          if (variant.sku === item.variantSKU) {
            match = {
              product_id: product.id,
              variant_id: variant.id
            };
            break;
          }
        }
        if (match) break;
      }

      if (!match) {
        throw new Error(`No Printify match for SKU: ${item.variantSKU}`);
      }

      return {
        product_id: match.product_id,
        variant_id: match.variant_id,
        quantity: item.count
      };
    });

    // Build order for Printify
    const printifyOrder = {
      line_items,
      shipping_method: 1,
      send_shipping_notification: true,
      address_to: {
        first_name: firstName,
        last_name: lastName,
        email: order.customerInfo.email,
        country: order.shippingAddress.country,
        region: order.shippingAddress.state,
        city: order.shippingAddress.city,
        address1: order.shippingAddress.line1,
        address2: order.shippingAddress.line2 || "",
        postal_code: order.shippingAddress.postalCode
      }
    };

    console.log("Sending to Printify:", JSON.stringify(printifyOrder, null, 2));

    const response = await fetch(
      `https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/orders.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.PRINTIFY_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(printifyOrder)
      }
    );

    const data = await response.json();

    console.log("PRINTIFY RESPONSE:", data);

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
