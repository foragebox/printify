const PRODUCT_MAP = {
  "69e38990c6908e6c1cf02113": {
    product_id: 123456,   // ← your Printify product ID
    variant_id: 654321    // ← your Printify variant ID
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log("===== NEW ORDER =====");
    console.log(JSON.stringify(req.body, null, 2));

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
