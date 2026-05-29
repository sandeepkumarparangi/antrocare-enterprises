import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BadgeIndianRupee,
  Boxes,
  CheckCircle2,
  ClipboardList,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Maximize2,
  Phone,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  Store,
  X
} from "lucide-react";
import { fetchCategories, fetchProducts, fetchSummary, mediaUrl, updateProduct } from "./api";

const ADMIN_SESSION_KEY = "antrocare-admin-key";
const DEFAULT_COST = "Price on request";

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({ totalProducts: 0, activeProducts: 0, pricedProducts: 0, categories: 0 });
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [view, setView] = useState("catalog");
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(ADMIN_SESSION_KEY) || "");
  const [adminDraftKey, setAdminDraftKey] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [previewProduct, setPreviewProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = Boolean(adminKey);

  useEffect(() => {
    loadCatalog(adminKey);
  }, [adminKey]);

  useEffect(() => {
    if (!previewProduct) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        setPreviewProduct(null);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [previewProduct]);

  async function loadCatalog(key = "") {
    setLoading(true);
    try {
      const [productData, categoryData, summaryData] = await Promise.all([
        fetchProducts(key),
        fetchCategories(),
        fetchSummary()
      ]);
      setProducts(productData);
      setCategories(["All", ...categoryData]);
      setSummary(summaryData);
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
      const textMatch = !normalizedQuery || `${product.name} ${product.category}`.toLowerCase().includes(normalizedQuery);
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
      const [productData, categoryData, summaryData] = await Promise.all([
        fetchProducts(key),
        fetchCategories(),
        fetchSummary()
      ]);
      setProducts(productData);
      setCategories(["All", ...categoryData]);
      setSummary(summaryData);
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

  return (
    <div className="min-h-screen bg-mist text-ink">
      <Header view={view} setView={setView} isAdmin={isAdmin} />

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
        />
      )}

      {statusMessage ? <Toast message={statusMessage} onClose={() => setStatusMessage("")} /> : null}
      {previewProduct ? <ImagePreviewModal product={previewProduct} onClose={() => setPreviewProduct(null)} /> : null}
      <ContactSection />
    </div>
  );
}

function Header({ view, setView, isAdmin }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 px-4 py-3 backdrop-blur-xl lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <button className="flex items-center gap-3 text-left" onClick={() => setView("catalog")}>
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br from-clinical to-ocean font-black text-white shadow-soft">
            ACE
          </span>
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
      <ProductGrid products={props.products} loading={props.loading} onPreview={props.onPreview} />
      <BrochureStrip />
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
            Care products arranged for fast, confident selection.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Browse the complete Antrocare brochure as a searchable product application with product photos, source pages, and admin-managed cost visibility.
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

function CatalogControls({ categories, categoryCounts, selectedCategory, setSelectedCategory, query, setQuery, products }) {
  return (
    <section id="products" className="mx-auto max-w-7xl px-4 py-12 lg:px-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Product catalog</p>
          <h2 className="section-title">Search by treatment area, support type, or name.</h2>
        </div>
        <label className="relative block w-full max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input className="field pl-12" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product or category" />
        </label>
      </div>

      <div className="mt-7 flex gap-3 overflow-x-auto pb-3">
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
    </section>
  );
}

function ProductGrid({ products, loading, onPreview }) {
  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-10"><div className="empty-panel">Loading catalog...</div></div>;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-10">
      <div className="mb-5 flex items-center justify-between gap-4 text-sm font-black text-slate-500">
        <span>{products.length} products shown</span>
        <span className="hidden items-center gap-2 md:flex"><SlidersHorizontal size={17} /> Sorted by category</span>
      </div>
      {products.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => <ProductCard key={product.id} product={product} onPreview={onPreview} />)}
        </div>
      ) : (
        <div className="empty-panel">No products match the current filters.</div>
      )}
    </section>
  );
}

function ProductCard({ product, onPreview }) {
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
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs font-black uppercase text-slate-500">Cost</span>
          <strong className={product.cost === DEFAULT_COST ? "text-coral" : "text-ocean"}>{product.cost}</strong>
        </div>
        <a className="mt-3 inline-flex items-center gap-1.5 text-sm font-black text-ocean" href={brochureSrc} target="_blank" rel="noreferrer">
          Brochure page {product.brochurePage}
          <ArrowUpRight size={15} />
        </a>
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
      {!full ? <span className="product-page-badge">Page {product.brochurePage}</span> : null}
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
            Update costs from the in-memory H2 database, hide unavailable products, and keep the public catalog clean.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <Metric icon={Boxes} label="Products" value={props.summary.totalProducts} />
          <Metric icon={BadgeIndianRupee} label="Priced" value={props.summary.pricedProducts} />
          <Metric icon={Activity} label="Active" value={props.summary.activeProducts} />
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

function BrochureStrip() {
  return (
    <section className="bg-white px-4 py-12 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow">Original brochure</p>
        <h2 className="section-title">Source pages stay one click away.</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 12 }, (_, index) => {
            const page = String(index + 1).padStart(2, "0");
            const brochureSrc = mediaUrl(`/rendered/page-${page}.png`);
            return (
              <a className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft" href={brochureSrc} key={page} target="_blank" rel="noreferrer">
                <img className="aspect-[.76] w-full object-cover" src={brochureSrc} alt={`Brochure page ${index + 1}`} />
                <span className="block px-3 py-2 text-sm font-black text-slate-500">Page {index + 1}</span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ImagePreviewModal({ product, onClose }) {
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
          <a className="btn-secondary min-h-11" href={brochureSrc} target="_blank" rel="noreferrer">
            <ArrowUpRight size={18} />
            Brochure page {product.brochurePage}
          </a>
        </div>
      </div>
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
