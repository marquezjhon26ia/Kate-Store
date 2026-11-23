// ============================================================
// KATE STORE — Cliente de Conexión a Supabase
// ============================================================

const SUPABASE_URL = "https://kyyydvrngcqlcpsyqfud.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_W3P2uEa49oXitZ8yvV9rPw_eB3k8enW";

let supabaseClient = null;
if (typeof window !== "undefined" && window.supabase && typeof window.supabase.createClient === "function") {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}

// Conversores DB (snake_case) <-> Frontend (camelCase)
function mapProductFromDB(row) {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    price: Number(row.price) || 0,
    originalPrice: row.original_price != null ? Number(row.original_price) : null,
    featured: Boolean(row.featured),
    badge: row.badge || null,
    stock: Number(row.stock) || 0,
    views: Number(row.views) || 0,
    image: row.image,
    angles: Array.isArray(row.angles) ? row.angles : [],
    colors: Array.isArray(row.colors) ? row.colors : [],
    sizes: Array.isArray(row.sizes) ? row.sizes : ["Única"],
    description: row.description || "",
    specs: row.specs || {}
  };
}

function mapProductToDB(p) {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    price: Number(p.price),
    original_price: p.originalPrice != null ? Number(p.originalPrice) : null,
    featured: Boolean(p.featured),
    badge: p.badge || null,
    stock: Number(p.stock),
    views: Number(p.views || 0),
    image: p.image,
    angles: p.angles || [],
    colors: p.colors || [],
    sizes: p.sizes || ["Única"],
    description: p.description || "",
    specs: p.specs || {}
  };
}

function mapOrderFromDB(row) {
  const created = row.created_at
    ? new Date(row.created_at).toISOString().slice(0, 16).replace("T", " ")
    : "";
  return {
    id: row.id,
    date: created,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      doc: row.customer_doc || "",
      city: row.customer_city,
      address: row.customer_address,
      billingAddress: row.billing_address || ""
    },
    items: Array.isArray(row.items) ? row.items : [],
    shippingMethod: row.shipping_method,
    shippingCost: Number(row.shipping_cost) || 0,
    paymentMethod: row.payment_method,
    subtotal: Number(row.subtotal) || 0,
    tax: Number(row.tax) || 0,
    total: Number(row.total) || 0,
    status: row.status || "Pendiente"
  };
}

function mapOrderToDB(o) {
  return {
    id: o.id,
    customer_name: o.customer.name,
    customer_email: o.customer.email,
    customer_phone: o.customer.phone,
    customer_doc: o.customer.doc || null,
    customer_city: o.customer.city,
    customer_address: o.customer.address,
    billing_address: o.customer.billingAddress || null,
    items: o.items,
    shipping_method: o.shippingMethod,
    shipping_cost: Number(o.shippingCost),
    payment_method: o.paymentMethod,
    subtotal: Number(o.subtotal),
    tax: Number(o.tax),
    total: Number(o.total),
    status: o.status || "Pendiente"
  };
}

const KateDB = {
  isReady() {
    return Boolean(supabaseClient);
  },

  async fetchProducts() {
    if (!supabaseClient) throw new Error("SDK de Supabase no cargado");
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data || []).map(mapProductFromDB);
  },

  async upsertProduct(product) {
    if (!supabaseClient) return;
    const { error } = await supabaseClient
      .from("products")
      .upsert(mapProductToDB(product), { onConflict: "id" });
    if (error) throw error;
  },

  async updateProductInventory(id, price, stock) {
    if (!supabaseClient) return;
    const { error } = await supabaseClient
      .from("products")
      .update({ price: Number(price), stock: Number(stock), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async incrementProductViews(id) {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.rpc("increment_product_views", {
      p_product_id: id
    });
    if (error) {
      // Fallback directo si la función RPC aún no existe
      const { data } = await supabaseClient.from("products").select("views").eq("id", id).single();
      if (data) {
        await supabaseClient.from("products").update({ views: (data.views || 0) + 1 }).eq("id", id);
      }
    }
  },

  async fetchOrders() {
    if (!supabaseClient) throw new Error("SDK de Supabase no cargado");
    const { data, error } = await supabaseClient
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(mapOrderFromDB);
  },

  async createOrder(order) {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.from("orders").insert(mapOrderToDB(order));
    if (error) throw error;
  },

  async updateOrderStatus(id, status) {
    if (!supabaseClient) return;
    const { error } = await supabaseClient
      .from("orders")
      .update({ status })
      .eq("id", id);
    if (error) throw error;
  },

  async createContactMessage({ name, email, message }) {
    if (!supabaseClient) return;
    const { error } = await supabaseClient
      .from("contact_messages")
      .insert({ name, email, message });
    if (error) throw error;
  },

  async fetchContactMessages() {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async fetchAnalytics() {
    if (!supabaseClient) throw new Error("SDK de Supabase no cargado");
    const { data, error } = await supabaseClient
      .from("analytics_daily")
      .select("*")
      .order("visit_date", { ascending: true })
      .limit(7);
    if (error) throw error;
    const dailyVisitors = (data || []).map((row) => ({
      day: row.day_label,
      count: Number(row.visitors) || 0
    }));
    const visitors = dailyVisitors.reduce((sum, d) => sum + d.count, 0);
    return {
      visitors,
      dailyVisitors,
      completedPurchasesBase: INITIAL_ANALYTICS.completedPurchasesBase
    };
  },

  async recordVisit() {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.rpc("record_daily_visit", {
      p_day_label: "Hoy"
    });
    if (error) throw error;
  }
};
