import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BadgeIndianRupee,
  Boxes,
  CheckCircle2,
  ClipboardList,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Maximize2,
  PackageCheck,
  Phone,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  Store,
  ShoppingCart,
  X
} from "lucide-react";
import { createPurchaseRequest, fetchCategories, fetchProducts, fetchPurchaseRequests, fetchSummary, mediaUrl, updateProduct } from "./api";

const ADMIN_SESSION_KEY = "antrocare-admin-key";
const DEFAULT_COST = "Price on request";

function createEmptyPurchaseDraft() {
  return {
    buyerName: "",
    buyerPhone: "",
    buyerEmail: "",
    quantity: 1,
    notes: ""
  };
}

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({ totalProducts: 0, activeProducts: 0, pricedProducts: 0, categories: 0, purchaseRequests: 0 });
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [view, setView] = useState("catalog");
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(ADMIN_SESSION_KEY) || "");
  const [adminDraftKey, setAdminDraftKey] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [previewProduct, setPreviewProduct] = useState(null);
  const [buyingProduct, setBuyingProduct] = useState(null);
  const [purchaseDraft, setPurchaseDraft] = useState(createEmptyPurchaseDraft);
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [loading, setLoading] = useState(true);

  const isAdmin = Boolean(adminKey);

  useEffect(() => {
    loadCatalog(adminKey);
  }, [adminKey]);

  useEffect(() => {
    if (!previewProduct && !buyingProduct) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        setPreviewProduct(null);
        setBuyingProduct(null);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [previewProduct, buyingProduct]);

  async function loadCatalog(key = "") {
    setLoading(true);
    try {
      const [productData, categoryData, summaryData, purchaseRequestData] = await Promise.all([
        fetchProducts(key),
        fetchCategories(),
        fetchSummary(),
        key ? fetchPurchaseRequests(key) : Promise.resolve([])
      ]);
      setProducts(productData);
      setCategories(["All", ...categoryData]);
      setSummary(summaryData);
      setPurchaseRequests(purchaseRequestData);
      setStatusMessage("");
    } catch (error) {
      setStatusMessage("Could not load catalog. Make sure the Spring Boot server is running on port 8081.");
    } finally {
      setLoading(false);
    }
  }

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const categoryMatch = selectedCategory === "All" || product.category === selectedCategory;
      const textMatch = !normalizedQuery || `${product.name} ${product.category} ${product.useDescription || ""}`.toLowerCase().includes(normalizedQuery);
      const statusMatch = isAdmin || product.status === "Active";
      return categoryMatch && textMatch && statusMatch;
    });
  }, [products, query, selectedCategory, isAdmin]);

  const categoryCounts = useMemo(() => {
    return products.reduce((acc, product) => {
      if (isAdmin || product.status === "Active") {
        acc[product.category] = (acc[product.category] || 0) + 1;
      }
      return acc;
    }, {});
  }, [products, isAdmin]);

  async function handleAdminLogin(event) {
    event.preventDefault();
    const key = adminDraftKey.trim();
    if (!key) return;
    setLoading(true);

    try {
      const [productData, categoryData, summaryData, purchaseRequestData] = await Promise.all([
        fetchProducts(key),
        fetchCategories(),
        fetchSummary(),
        fetchPurchaseRequests(key)
      ]);
      setProducts(productData);
      setCategories(["All", ...categoryData]);
      setSummary(summaryData);
      setPurchaseRequests(purchaseRequestData);
      sessionStorage.setItem(ADMIN_SESSION_KEY, key);
      setAdminKey(key);
      setAdminDraftKey("");
      setStatusMessage("Admin console unlocked.");
      setView("admin");
    } catch (error) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      setAdminKey("");
      setStatusMessage("Invalid admin passcode.");
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setAdminKey("");
    setPurchaseRequests([]);
    setView("catalog");
  }

  function updateLocalProduct(id, field, value) {
    setProducts((current) => current.map((product) => (product.id === id ? { ...product, [field]: value } : product)));
  }

  async function saveProduct(product) {
    try {
      const updated = await updateProduct(product, adminKey);
      setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSummary(await fetchSummary());
      setStatusMessage(`${updated.name} updated.`);
    } catch (error) {
      setStatusMessage("Admin update failed. Check the passcode and backend server.");
    }
  }

  function openPurchaseModal(product) {
    setBuyingProduct(product);
    setPurchaseDraft(createEmptyPurchaseDraft());
  }

  function updatePurchaseDraft(field, value) {
    setPurchaseDraft((current) => ({ ...current, [field]: value }));
  }

  async function submitPurchaseRequest(event) {
    event.preventDefault();
    if (!buyingProduct || purchaseSubmitting) return;

    const quantity = Math.max(1, Number(purchaseDraft.quantity) || 1);
    const request = {
      productId: buyingProduct.id,
      buyerName: purchaseDraft.buyerName.trim(),
      buyerPhone: purchaseDraft.buyerPhone.trim(),
      buyerEmail: purchaseDraft.buyerEmail.trim(),
      quantity,
      notes: purchaseDraft.notes.trim()
    };

    if (!request.buyerName || !request.buyerPhone) {
      setStatusMessage("Name and phone are required for buying.");
      return;
    }

    setPurchaseSubmitting(true);
    try {
      const saved = await createPurchaseRequest(request);
      setBuyingProduct(null);
      setPurchaseDraft(createEmptyPurchaseDraft());
      setSummary(await fetchSummary());
      if (adminKey) {
        setPurchaseRequests(await fetchPurchaseRequests(adminKey));
      }
      setStatusMessage(`Buy request saved for ${saved.productName}.`);
    } catch (error) {
      setStatusMessage("Buy request failed. Please check the details and try again.");
    } finally {
      setPurchaseSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-mist text-ink">
      <Header view={view} setView={setView} isAdmin={isAdmin} onHeightChange={setHeaderHeight} />

      {view === "catalog" ? (
        <CatalogPage
          products={visibleProducts}
          categories={categories}
          categoryCounts={categoryCounts}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          query={query}
          setQuery={setQuery}
          summary={summary}
          loading={loading}
          onPreview={setPreviewProduct}
          onBuy={openPurchaseModal}
          headerHeight={headerHeight}
        />
      ) : (
        <AdminPage
          products={visibleProducts}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          query={query}
          setQuery={setQuery}
          adminDraftKey={adminDraftKey}
          setAdminDraftKey={setAdminDraftKey}
          isAdmin={isAdmin}
          onLogin={handleAdminLogin}
          onSignOut={signOut}
          onLocalChange={updateLocalProduct}
          onSave={saveProduct}
          summary={summary}
          purchaseRequests={purchaseRequests}
        />
      )}

      {statusMessage ? <Toast message={statusMessage} onClose={() => setStatusMessage("")} /> : null}
      {previewProduct ? <ImagePreviewModal product={previewProduct} onClose={() => setPreviewProduct(null)} onBuy={openPurchaseModal} /> : null}
      {buyingProduct ? (
        <PurchaseModal
          product={buyingProduct}
          draft={purchaseDraft}
          onChange={updatePurchaseDraft}
          onClose={() => setBuyingProduct(null)}
          onSubmit={submitPurchaseRequest}
          submitting={purchaseSubmitting}
        />
      ) : null}
      <ContactSection />
    </div>
  );
}

function Header({ view, setView, isAdmin, onHeightChange }) {
  const headerRef = useRef(null);

  useEffect(() => {
    if (!headerRef.current) return undefined;

    const updateHeight = () => {
      onHeightChange(Math.ceil(headerRef.current.getBoundingClientRect().height));
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(headerRef.current);
    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [onHeightChange]);

  return (
    <header ref={headerRef} className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 px-4 py-3 backdrop-blur-xl lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <button className="flex items-center gap-3 text-left" onClick={() => setView("catalog")}>
          <AceLogoMark />
          <span>
            <span className="block text-lg font-black">Antrocare Enterprises</span>
            <span className="block text-sm font-semibold text-slate-500">Orthopaedic, compression and rehab products</span>
          </span>
        </button>

        <nav className="flex flex-wrap gap-2">
          <NavButton active={view === "catalog"} onClick={() => setView("catalog")} icon={Store} label="User catalog" />
          <NavButton active={view === "admin"} onClick={() => setView("admin")} icon={ShieldCheck} label={isAdmin ? "Admin console" : "Admin sign in"} />
          <a className="nav-pill" href="#contact">
            <Mail size={18} />
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}

function AceLogoMark() {
  return (
    <span className="ace-logo-mark" aria-hidden="true">
      <img className="ace-logo-image" src="/assets/ace-logo.png" alt="" />
    </span>
  );
}

function NavButton({ active, onClick, icon: Icon, label }) {
  return (
    <button className={`nav-pill ${active ? "nav-pill-active" : ""}`} onClick={onClick} type="button">
      <Icon size={18} />
      {label}
    </button>
  );
}

function CatalogPage(props) {
  return (
    <main>
      <Hero summary={props.summary} />
      <CatalogControls {...props} />
      <ProductGrid products={props.products} loading={props.loading} onPreview={props.onPreview} onBuy={props.onBuy} />
    </main>
  );
}

function Hero({ summary }) {
  return (
    <section className="relative overflow-hidden bg-white">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: `url(${mediaUrl("/rendered/page-02.png")})` }}
      />
      <div className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.05fr_.95fr] lg:px-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-clinical">
            <Sparkles size={16} />
            Modern medical product catalog
          </div>
          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[.95] tracking-tight text-ink md:text-7xl">
            Clinical support, simplified for modern care.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Explore Antrocare's orthopaedic, compression, and rehabilitation range through a clean digital catalog built for quick discovery, clear visuals, and quote-ready decisions.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a className="btn-primary" href="#products">
              <Search size={19} />
              Browse products
            </a>
            <a className="btn-secondary" href="tel:+919444065691">
              <Phone size={19} />
              Call for quote
            </a>
          </div>
        </div>
        <div className="grid gap-4">
          <div className="rounded-lg border border-white/80 bg-white/85 p-3 shadow-soft backdrop-blur">
            <img className="aspect-[.76] w-full rounded-md object-cover" src={mediaUrl("/rendered/page-01.png")} alt="Antrocare brochure cover" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Metric icon={Boxes} label="Products" value={summary.totalProducts} />
            <Metric icon={ClipboardList} label="Categories" value={summary.categories} />
            <Metric icon={CheckCircle2} label="Active" value={summary.activeProducts} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <Icon className="text-clinical" size={20} />
      <strong className="mt-3 block text-2xl font-black">{value}</strong>
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
    </article>
  );
}

function CatalogControls({ categories, categoryCounts, selectedCategory, setSelectedCategory, query, setQuery, products, headerHeight }) {
  return (
    <section
      id="products"
      className="sticky z-30 border-b border-slate-200/80 bg-mist/95 px-4 py-4 shadow-sm backdrop-blur-xl lg:px-10"
      style={{ top: headerHeight, scrollMarginTop: headerHeight + 16 }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,430px)] lg:items-center">
          <div className="min-w-0">
            <p className="eyebrow">Product catalog</p>
            <h2 className="mt-1 text-xl font-black leading-tight tracking-tight md:text-2xl">Search by treatment area, support type, or name.</h2>
          </div>
          <label className="relative block w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input className="field pl-12" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product or category" />
          </label>
        </div>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              className={`category-chip ${selectedCategory === category ? "category-chip-active" : ""}`}
              key={category}
              onClick={() => setSelectedCategory(category)}
              type="button"
            >
              {category}
              <span>{category === "All" ? products.length : categoryCounts[category] || 0}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductGrid({ products, loading, onPreview, onBuy }) {
  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-8 pb-16 lg:px-10"><div className="empty-panel">Loading catalog...</div></div>;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 pb-16 lg:px-10">
      <div className="mb-5 flex items-center justify-between gap-4 text-sm font-black text-slate-500">
        <span>{products.length} products shown</span>
        <span className="hidden items-center gap-2 md:flex"><SlidersHorizontal size={17} /> Sorted by category</span>
      </div>
      {products.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => <ProductCard key={product.id} product={product} onPreview={onPreview} onBuy={onBuy} />)}
        </div>
      ) : (
        <div className="empty-panel">No products match the current filters.</div>
      )}
    </section>
  );
}

function ProductCard({ product, onPreview, onBuy }) {
  const imageSrc = mediaUrl(product.imageUrl);
  const brochureSrc = mediaUrl(product.brochureUrl);

  return (
    <article className="product-card group">
      <button className="product-media-link" type="button" onClick={() => onPreview(product)} aria-label={`View ${product.name} image`}>
        <ProductImage product={product} imageSrc={imageSrc} brochureSrc={brochureSrc} />
        <span className="image-action-badge" aria-hidden="true">
          <Maximize2 size={16} />
        </span>
      </button>
      <div className="p-5">
        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-black uppercase text-clinical">{product.category}</span>
        <h3 className="mt-4 min-h-14 text-xl font-black leading-tight">{product.name}</h3>
        {product.useDescription ? (
          <p className="mt-3 min-h-12 text-sm font-semibold leading-6 text-slate-600">{product.useDescription}</p>
        ) : null}
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs font-black uppercase text-slate-500">Cost</span>
          <strong className={product.cost === DEFAULT_COST ? "text-coral" : "text-ocean"}>{product.cost}</strong>
        </div>
        <button className="btn-primary mt-4 w-full min-h-11" type="button" onClick={() => onBuy(product)}>
          <ShoppingCart size={18} />
          Buy
        </button>
      </div>
    </article>
  );
}

function ProductImage({ product, imageSrc, brochureSrc, full = false }) {
  return (
    <span className={full ? "product-image-stage product-image-stage-full" : "product-image-stage"}>
      <img
        className={full ? "product-image-full" : "product-image"}
        src={imageSrc}
        alt={product.name}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = brochureSrc;
        }}
      />
    </span>
  );
}

function ProductThumbnail({ product }) {
  return (
    <span className="admin-product-thumb">
      <img src={mediaUrl(product.imageUrl)} alt={product.name} />
    </span>
  );
}

function formatRequestTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function AdminPage(props) {
  if (!props.isAdmin) {
    return <AdminLogin {...props} />;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 lg:px-10">
      <section className="grid gap-6 rounded-lg bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-soft lg:grid-cols-[1fr_420px] lg:p-8">
        <div>
          <p className="eyebrow text-emerald-200">Admin console</p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">Manage pricing, visibility, and catalog freshness.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Update costs, hide unavailable products, and review buy requests saved in the database.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Metric icon={Boxes} label="Products" value={props.summary.totalProducts} />
          <Metric icon={BadgeIndianRupee} label="Priced" value={props.summary.pricedProducts} />
          <Metric icon={Activity} label="Active" value={props.summary.activeProducts} />
          <Metric icon={PackageCheck} label="Buy requests" value={props.summary.purchaseRequests} />
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_260px_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input className="field pl-12" value={props.query} onChange={(event) => props.setQuery(event.target.value)} placeholder="Search inventory" />
          </label>
          <select className="field" value={props.selectedCategory} onChange={(event) => props.setSelectedCategory(event.target.value)}>
            {props.categories.map((category) => <option key={category}>{category}</option>)}
          </select>
          <button className="btn-secondary" onClick={props.onSignOut} type="button">
            <LogOut size={18} />
            Sign out
          </button>
        </div>

        <div className="mt-5 overflow-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="table-cell">Product</th>
                <th className="table-cell">Category</th>
                <th className="table-cell">Cost</th>
                <th className="table-cell">Status</th>
                <th className="table-cell">Action</th>
              </tr>
            </thead>
            <tbody>
              {props.products.map((product) => (
                <tr className="border-t border-slate-100" key={product.id}>
                  <td className="table-cell">
                    <div className="flex items-center gap-3 font-black">
                      <ProductThumbnail product={product} />
                      {product.name}
                    </div>
                  </td>
                  <td className="table-cell">{product.category}</td>
                  <td className="table-cell">
                    <input className="field min-w-44" value={product.cost} onChange={(event) => props.onLocalChange(product.id, "cost", event.target.value)} />
                  </td>
                  <td className="table-cell">
                    <select className="field min-w-36" value={product.status} onChange={(event) => props.onLocalChange(product.id, "status", event.target.value)}>
                      <option>Active</option>
                      <option>Hidden</option>
                    </select>
                  </td>
                  <td className="table-cell">
                    <button className="btn-primary min-h-11" onClick={() => props.onSave(product)} type="button">
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Buy requests</p>
            <h2 className="mt-1 text-2xl font-black">Customer requests saved in the database.</h2>
          </div>
          <span className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-black text-clinical">{props.purchaseRequests.length} total</span>
        </div>

        <div className="mt-5 overflow-auto">
          {props.purchaseRequests.length ? (
            <table className="w-full min-w-[980px] border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <th className="table-cell">Request</th>
                  <th className="table-cell">Product</th>
                  <th className="table-cell">Buyer</th>
                  <th className="table-cell">Contact</th>
                  <th className="table-cell">Qty</th>
                  <th className="table-cell">Status</th>
                </tr>
              </thead>
              <tbody>
                {props.purchaseRequests.map((request) => (
                  <tr className="border-t border-slate-100" key={request.id}>
                    <td className="table-cell font-bold text-slate-500">{formatRequestTime(request.createdAt)}</td>
                    <td className="table-cell">
                      <div className="font-black">{request.productName}</div>
                      <div className="mt-1 text-sm font-bold text-slate-500">{request.productCategory} - {request.costSnapshot}</div>
                      {request.notes ? <div className="mt-2 max-w-md text-sm font-semibold text-slate-500">{request.notes}</div> : null}
                    </td>
                    <td className="table-cell font-black">{request.buyerName}</td>
                    <td className="table-cell">
                      <div className="font-bold">{request.buyerPhone}</div>
                      {request.buyerEmail ? <div className="mt-1 text-sm font-semibold text-slate-500">{request.buyerEmail}</div> : null}
                    </td>
                    <td className="table-cell font-black">{request.quantity}</td>
                    <td className="table-cell">
                      <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-black uppercase text-amber-700">{request.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-panel">No buy requests yet.</div>
          )}
        </div>
      </section>
    </main>
  );
}

function AdminLogin({ adminDraftKey, setAdminDraftKey, onLogin }) {
  return (
    <main className="grid min-h-[calc(100vh-80px)] place-items-center bg-white px-4 py-12">
      <form className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-soft" onSubmit={onLogin}>
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-slate-950 text-white">
          <LockKeyhole size={26} />
        </div>
        <p className="eyebrow">Admin access</p>
        <h1 className="text-4xl font-black leading-tight">Sign in to manage products.</h1>
        <p className="mt-3 leading-7 text-slate-600">Regular users can browse the catalog only. Pricing and visibility controls are available after admin login.</p>
        <label className="mt-6 block">
          <span className="mb-2 block text-sm font-black text-slate-500">Passcode</span>
          <input className="field" type="password" value={adminDraftKey} onChange={(event) => setAdminDraftKey(event.target.value)} placeholder="Enter admin passcode" />
        </label>
        <button className="btn-primary mt-5 w-full" type="submit">
          <ShieldCheck size={19} />
          Unlock admin
        </button>
      </form>
    </main>
  );
}

function ImagePreviewModal({ product, onClose, onBuy }) {
  const imageSrc = mediaUrl(product.imageUrl);
  const brochureSrc = mediaUrl(product.brochureUrl);

  return (
    <div
      className="image-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} image preview`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="image-modal-panel">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4">
          <div>
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-black uppercase text-clinical">{product.category}</span>
            <h2 className="mt-3 text-2xl font-black leading-tight text-ink">{product.name}</h2>
            {product.useDescription ? <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">{product.useDescription}</p> : null}
          </div>
          <button className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-ink" onClick={onClose} type="button" aria-label="Close image preview">
            <X size={22} />
          </button>
        </div>
        <div className="p-4">
          <ProductImage product={product} imageSrc={imageSrc} brochureSrc={brochureSrc} full />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4">
          <strong className={product.cost === DEFAULT_COST ? "text-coral" : "text-ocean"}>{product.cost}</strong>
          <div className="flex flex-wrap gap-3">
            <button
              className="btn-primary min-h-11"
              type="button"
              onClick={() => {
                onBuy(product);
                onClose();
              }}
            >
              <ShoppingCart size={18} />
              Buy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PurchaseModal({ product, draft, onChange, onClose, onSubmit, submitting }) {
  return (
    <div
      className="image-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Buy ${product.name}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <form className="w-full max-w-2xl overflow-hidden rounded-lg border border-white/20 bg-white shadow-2xl" onSubmit={onSubmit}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-black uppercase text-clinical">{product.category}</span>
            <h2 className="mt-3 text-2xl font-black leading-tight text-ink">Buy {product.name}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{product.cost}</p>
          </div>
          <button className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-ink" onClick={onClose} type="button" aria-label="Close buy form">
            <X size={22} />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-500">Name</span>
            <input className="field" value={draft.buyerName} onChange={(event) => onChange("buyerName", event.target.value)} required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-500">Phone</span>
            <input className="field" value={draft.buyerPhone} onChange={(event) => onChange("buyerPhone", event.target.value)} required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-500">Email</span>
            <input className="field" type="email" value={draft.buyerEmail} onChange={(event) => onChange("buyerEmail", event.target.value)} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-500">Quantity</span>
            <input className="field" type="number" min="1" max="99" value={draft.quantity} onChange={(event) => onChange("quantity", event.target.value)} required />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-black text-slate-500">Notes</span>
            <textarea className="field min-h-28 resize-y py-3" value={draft.notes} onChange={(event) => onChange("notes", event.target.value)} />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-5">
          <span className="text-sm font-bold text-slate-500">The request will be saved for admin review.</span>
          <button className="btn-primary min-h-11" type="submit" disabled={submitting}>
            <Send size={18} />
            {submitting ? "Saving..." : "Send buy request"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ContactSection() {
  return (
    <footer id="contact" className="bg-slate-950 px-4 py-12 text-white lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="eyebrow text-emerald-200">Contact</p>
          <h2 className="text-3xl font-black">Antrocare Enterprises</h2>
          <p className="mt-4 flex gap-3 leading-7 text-slate-300">
            <MapPin className="mt-1 flex-none text-emerald-300" size={20} />
            #75, Old No.27, 2nd floor, Railway Colony, 3rd Street, Nelson Manickam Road, Chennai - 600 029
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ContactLink icon={Phone} label="044 - 42082353" href="tel:+914442082353" />
          <ContactLink icon={Phone} label="044 - 43553381" href="tel:+914443553381" />
          <ContactLink icon={Phone} label="+91 94440 65691" href="tel:+919444065691" />
          <ContactLink icon={Mail} label="antro_ace@yahoo.co.in" href="mailto:antro_ace@yahoo.co.in" />
        </div>
      </div>
    </footer>
  );
}

function ContactLink({ icon: Icon, label, href }) {
  return (
    <a className="flex min-h-16 items-center gap-3 rounded-lg border border-white/10 bg-white/10 px-4 font-black transition hover:bg-white/15" href={href}>
      <Icon className="text-emerald-300" size={20} />
      {label}
    </a>
  );
}

function Toast({ message, onClose }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-md items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 font-bold shadow-soft">
      <Stethoscope className="text-clinical" size={22} />
      <span>{message}</span>
      <button className="ml-2 rounded-md p-1 hover:bg-slate-100" onClick={onClose} type="button" aria-label="Close message">
        <X size={18} />
      </button>
    </div>
  );
}

export default App;
