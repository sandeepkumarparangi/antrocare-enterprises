import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ArrowRight,
  BadgeIndianRupee,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Filter,
  Info,
  KeyRound,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Maximize2,
  MessageCircle,
  PackageCheck,
  Phone,
  Ruler,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Store,
  ShoppingCart,
  Trash2,
  TrendingUp,
  UserCircle,
  UserPlus,
  X
} from "lucide-react";
import { API_BASE, approveProductChange, createPurchaseRequest, deleteAdminAccount, fetchAdminAccounts, fetchCategories, fetchCurrentSession, fetchMyPurchaseRequests, fetchOAuth2Status, fetchProductChangeRequests, fetchProducts, fetchPurchaseRequests, fetchStockAlerts, fetchSummary, loginAdmin, loginUser, logoutSession, mediaUrl, registerAdmin, rejectProductChange, sendTestEmail, signupUser, updateProduct, updatePurchaseRequestStatus, uploadPrescription } from "./api";

const AUTH_SESSION_KEY = "antrocare-auth-session";
const APP_SETTINGS_KEY = "antrocare-app-settings";
const DEFAULT_COST = "₹50";
const WHATSAPP_URL = "https://wa.me/919444065691";
const BODY_AREAS = [
  { id: "all", label: "All areas", keywords: [] },
  { id: "neck", label: "Neck", keywords: ["cervical", "neck", "collar"] },
  { id: "shoulder", label: "Shoulder", keywords: ["shoulder", "arm sling", "clavicle", "humeral"] },
  { id: "wrist", label: "Elbow / Wrist", keywords: ["elbow", "wrist", "thumb", "hand", "carpal"] },
  { id: "back", label: "Back / Spine", keywords: ["spine", "thoracic", "lumbar", "back", "sacro", "coccyx"] },
  { id: "hip", label: "Hip", keywords: ["hip", "femur"] },
  { id: "knee", label: "Knee", keywords: ["knee", "kafo", "acl", "pcl"] },
  { id: "ankle", label: "Ankle / Foot", keywords: ["ankle", "foot", "toe", "heel", "insole"] },
  { id: "rehab", label: "Rehab", keywords: ["walker", "walking", "crutch", "stick", "exercise", "thera", "weight"] },
  { id: "pediatric", label: "Pediatric", keywords: ["child", "pediatric", "torticollis"] }
];
const NEED_TYPES = [
  { id: "all", label: "Any need", keywords: [] },
  { id: "pain", label: "Pain relief", keywords: ["pain", "comfort", "support", "cushion", "pillow", "belt", "sleeve"] },
  { id: "injury", label: "Injury recovery", keywords: ["fracture", "immobilizer", "immobiliser", "splint", "brace", "support"] },
  { id: "posture", label: "Posture support", keywords: ["posture", "spinal", "lumbar", "cervical", "back"] },
  { id: "walking", label: "Walking support", keywords: ["walker", "walking", "crutch", "stick", "ankle", "foot"] },
  { id: "therapy", label: "Exercise therapy", keywords: ["exercise", "thera", "weight", "rom", "dynamic"] }
];
const PRODUCT_BUNDLES = [
  { name: "Neck pain kit", keywords: ["cervical", "neck", "pillow", "collar"], note: "Daily neck support and sleep comfort." },
  { name: "Knee recovery kit", keywords: ["knee", "immobiliser", "brace", "cap"], note: "Support for knee strain, recovery, and controlled movement." },
  { name: "Back support kit", keywords: ["lumbar", "spine", "back", "sacro"], note: "Posture and lower-back support for daily use." },
  { name: "Walking support kit", keywords: ["walker", "crutch", "walking", "stick"], note: "Mobility support after injury or weakness." }
];
const SEARCH_SYNONYMS = {
  "neck pain": "cervical collar pillow traction neck",
  "back pain": "lumbar spine back sacro belt posture",
  "knee pain": "knee brace cap immobiliser acl pcl",
  "ankle pain": "ankle foot splint walker stabilizer",
  "wrist pain": "wrist cock up splint carpal thumb",
  "shoulder pain": "shoulder arm sling clavicle immobilizer",
  "walking support": "walker crutch walking stick rehabilitation",
  "child support": "pediatric child torticollis head holder"
};
const CARE_GUIDE = {
  "Cervical Orthosis": ["Wear only as advised by a clinician.", "Keep foam and skin contact areas dry.", "Check for pressure marks every few hours."],
  "Knee Supports": ["Fasten evenly around the knee.", "Avoid over-tightening around swelling.", "Air dry after gentle cleaning."],
  "Ankle Orthosis": ["Wear with comfortable socks when suitable.", "Check heel and toe comfort before walking.", "Keep straps clean and dry."],
  "Spine Supports": ["Position the belt around the painful support area.", "Tighten gradually while standing upright.", "Remove during sleep unless advised."],
  default: ["Use under professional guidance when injured.", "Keep the product clean and dry.", "Stop use if discomfort or numbness increases."]
};
const SIZE_GUIDE = {
  "Cervical Orthosis": "Measure neck circumference and neck height before selecting collar size.",
  "Knee Supports": "Measure around the knee center and compare with product sizing.",
  "Ankle Orthosis": "Measure ankle circumference and usual footwear size.",
  "Spine Supports": "Measure waist or abdominal circumference over light clothing.",
  "Waist / Abdominal Supports": "Measure around the abdomen where the belt will sit.",
  default: "Measure the supported body area snugly, without compressing skin."
};
const SIZE_RECOMMENDATIONS = {
  pediatric: [
    { label: "Child XS", age: "1-3 years", height: "75-95 cm", weight: "8-14 kg", fit: "Small pediatric supports, collars, cuffs, and soft braces." },
    { label: "Child S", age: "4-6 years", height: "96-115 cm", weight: "15-22 kg", fit: "Child collars, arm slings, and light spinal supports." },
    { label: "Child M", age: "7-10 years", height: "116-140 cm", weight: "23-36 kg", fit: "Most pediatric braces, supports, and therapy aids." },
    { label: "Teen", age: "11-15 years", height: "141-165 cm", weight: "37-55 kg", fit: "Teen-size braces or smaller adult supports." }
  ],
  adultSupport: [
    { label: "S", age: "16+ years", height: "145-160 cm", weight: "40-55 kg", fit: "Slim adult frame or shorter support length." },
    { label: "M", age: "16+ years", height: "161-172 cm", weight: "56-72 kg", fit: "Average adult frame and standard support length." },
    { label: "L", age: "16+ years", height: "173-184 cm", weight: "73-90 kg", fit: "Broader adult frame or longer support length." },
    { label: "XL", age: "16+ years", height: "185+ cm", weight: "91-115 kg", fit: "Large adult frame with wider straps or circumference." }
  ],
  compression: [
    { label: "S", age: "16+ years", height: "145-160 cm", weight: "40-55 kg", fit: "Slim limb circumference with gentle compression fit." },
    { label: "M", age: "16+ years", height: "161-172 cm", weight: "56-72 kg", fit: "Average limb circumference and daily compression fit." },
    { label: "L", age: "16+ years", height: "173-184 cm", weight: "73-90 kg", fit: "Broader limb circumference with secure compression fit." },
    { label: "XL", age: "16+ years", height: "185+ cm", weight: "91-115 kg", fit: "Large limb circumference or post-surgical swelling range." }
  ],
  mobility: [
    { label: "Short", age: "12+ years", height: "125-150 cm", weight: "30-55 kg", fit: "Short walkers, sticks, and crutches." },
    { label: "Regular", age: "16+ years", height: "151-175 cm", weight: "45-85 kg", fit: "Standard mobility aids and everyday walking support." },
    { label: "Tall", age: "16+ years", height: "176-195 cm", weight: "60-110 kg", fit: "Tall walking aids with extended height adjustment." }
  ],
  footwear: [
    { label: "S", age: "10+ years", height: "120-155 cm", weight: "30-55 kg", fit: "Foot size 3-5 UK or slim ankle profile." },
    { label: "M", age: "14+ years", height: "156-172 cm", weight: "45-75 kg", fit: "Foot size 6-8 UK or average ankle profile." },
    { label: "L", age: "16+ years", height: "173-188 cm", weight: "70-95 kg", fit: "Foot size 9-10 UK or broad ankle profile." },
    { label: "XL", age: "16+ years", height: "189+ cm", weight: "90-115 kg", fit: "Foot size 11+ UK or extra broad ankle profile." }
  ]
};
const DEFAULT_APP_SETTINGS = {
  profileName: "",
  profileEmail: "",
  profilePicture: "",
  defaultStockFilter: "all",
  compactCards: false,
  showSupportPrompts: true,
  emailNotifications: true,
  pushNotifications: false,
  smsNotifications: false,
  orderUpdates: true,
  lowStockAlerts: true,
  promotionalMessages: false,
  dataSharing: false,
  publicProfile: true,
  analyticsSharing: false,
  appearanceMode: "light",
  themeColor: "clinical",
  fontSize: "comfortable",
  highContrast: false,
  screenReaderHints: true,
  language: "en",
  timezone: "America/Chicago",
  dateFormat: "medium",
  twoFactorEnabled: false,
  loginAlerts: true,
  rememberDevice: true,
  linkedGoogle: false,
  linkedWhatsApp: true,
  linkedEmail: true
};

function readStoredSession() {
  try {
    return JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function readStoredSettings() {
  try {
    return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(localStorage.getItem(APP_SETTINGS_KEY) || "{}") };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

function createEmptyPurchaseDraft(session = null) {
  return {
    buyerName: session?.displayName && session.displayName !== session.email ? session.displayName : "",
    buyerPhone: "",
    buyerEmail: session?.email || "",
    quantity: 1,
    selectedSize: "",
    prescriptionName: "",
    prescriptionUrl: "",
    notes: ""
  };
}

function expandSearchQuery(query) {
  if (!query) return "";
  const additions = Object.entries(SEARCH_SYNONYMS)
    .filter(([phrase]) => query.includes(phrase))
    .map(([, terms]) => terms)
    .join(" ");
  return `${query} ${additions}`.trim();
}

function productGuideFor(product) {
  return {
    care: CARE_GUIDE[product.category] || CARE_GUIDE.default,
    size: SIZE_GUIDE[product.category] || SIZE_GUIDE.default
  };
}

function sizeGuideFor(product) {
  const searchableText = `${product.name} ${product.category}`.toLowerCase();
  let type = "adultSupport";
  if (searchableText.includes("pediatric") || searchableText.includes("child") || searchableText.includes("torticollis") || searchableText.includes("head holder")) {
    type = "pediatric";
  } else if (searchableText.includes("walker") || searchableText.includes("crutch") || searchableText.includes("walking stick")) {
    type = "mobility";
  } else if (searchableText.includes("stocking") || searchableText.includes("compression") || searchableText.includes("garment") || searchableText.includes("lymphedema")) {
    type = "compression";
  } else if (searchableText.includes("ankle") || searchableText.includes("foot") || searchableText.includes("heel") || searchableText.includes("insole") || searchableText.includes("toe")) {
    type = "footwear";
  }

  const measurementByType = {
    pediatric: "Confirm the child's supported body-area circumference before final selection.",
    adultSupport: SIZE_GUIDE[product.category] || SIZE_GUIDE.default,
    compression: "Measure limb circumference in the morning before swelling increases.",
    mobility: "Measure from wrist crease to floor while standing upright.",
    footwear: "Match shoe size first, then confirm ankle or foot circumference."
  };

  return {
    type,
    measurement: measurementByType[type],
    rows: SIZE_RECOMMENDATIONS[type]
  };
}

function recommendProducts(products, prompt, limit = 4) {
  const terms = expandSearchQuery(String(prompt || "").toLowerCase()).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  return products
    .map((product) => {
      const searchableText = `${product.name} ${product.category} ${product.useDescription || ""}`.toLowerCase();
      const score = terms.reduce((sum, term) => sum + (searchableText.includes(term) ? 1 : 0), 0);
      return { product, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.product.name.localeCompare(right.product.name))
    .slice(0, limit)
    .map((item) => item.product);
}

function bundleProducts(products, bundle) {
  return products
    .filter((product) => {
      const searchableText = `${product.name} ${product.category} ${product.useDescription || ""}`.toLowerCase();
      return bundle.keywords.some((keyword) => searchableText.includes(keyword));
    })
    .slice(0, 3);
}

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({ totalProducts: 0, activeProducts: 0, pricedProducts: 0, categories: 0, purchaseRequests: 0, totalUnitsSold: 0, lowStockProducts: 0 });
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [myPurchaseRequests, setMyPurchaseRequests] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [productChangeRequests, setProductChangeRequests] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [adminQuery, setAdminQuery] = useState("");
  const [adminSelectedCategory, setAdminSelectedCategory] = useState("All");
  const [selectedBodyArea, setSelectedBodyArea] = useState("all");
  const [selectedNeedType, setSelectedNeedType] = useState("all");
  const [compareIds, setCompareIds] = useState([]);
  const [appSettings, setAppSettings] = useState(readStoredSettings);
  const [stockFilter, setStockFilter] = useState(appSettings.defaultStockFilter);
  const [view, setView] = useState("catalog");
  const [authSession, setAuthSession] = useState(readStoredSession);
  const [adminLoginDraft, setAdminLoginDraft] = useState({ email: "", password: "" });
  const [adminRegisterDraft, setAdminRegisterDraft] = useState({ name: "", email: "", phone: "", password: "" });
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [authMode, setAuthMode] = useState("login");
  const [userDraft, setUserDraft] = useState({ name: "", email: "", password: "" });
  const [statusMessage, setStatusMessage] = useState("");
  const [previewProduct, setPreviewProduct] = useState(null);
  const [sizeGuideProduct, setSizeGuideProduct] = useState(null);
  const [buyingProduct, setBuyingProduct] = useState(null);
  const [pendingPurchaseProduct, setPendingPurchaseProduct] = useState(null);
  const [purchaseDraft, setPurchaseDraft] = useState(createEmptyPurchaseDraft);
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [loading, setLoading] = useState(true);
  const [oauth2Status, setOauth2Status] = useState({ enabled: false, providers: [] });

  const isAdmin = authSession?.role === "ADMIN" || authSession?.role === "MAIN_ADMIN";
  const isMainAdmin = Boolean(authSession?.mainAdmin);
  const isUser = authSession?.role === "USER";
  const adminKey = isAdmin ? authSession.token : "";
  const appShellClasses = [
    "app-shell min-h-screen text-ink",
    `settings-mode-${appSettings.appearanceMode}`,
    `settings-theme-${appSettings.themeColor}`,
    `settings-font-${appSettings.fontSize}`,
    appSettings.highContrast ? "settings-high-contrast" : ""
  ].filter(Boolean).join(" ");

  useEffect(() => {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(appSettings));
  }, [appSettings]);

  useEffect(() => {
    fetchOAuth2Status()
      .then(setOauth2Status)
      .catch(() => setOauth2Status({ enabled: false, providers: [] }));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get("oauthToken");
    const oauthError = params.get("oauthError");

    if (oauthError) {
      setStatusMessage("OAuth2 sign-in failed because the provider did not return a verified email.");
      window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash}`);
      return;
    }

    if (!oauthToken) return;

    const session = {
      token: oauthToken,
      role: params.get("oauthRole") || "USER",
      email: params.get("oauthEmail") || "",
      displayName: params.get("oauthName") || params.get("oauthEmail") || "User",
      mainAdmin: params.get("oauthMainAdmin") === "true"
    };
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    setAuthSession(session);
    setStatusMessage("OAuth2 sign-in complete.");
    setView("catalog");
    window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash}`);
  }, []);

  useEffect(() => {
    loadCatalog(adminKey);
  }, [adminKey]);

  useEffect(() => {
    if (view !== "admin") return;
    setAdminQuery("");
    setAdminSelectedCategory("All");
  }, [view]);

  useEffect(() => {
    refreshAdminAccounts();
    refreshProductChangeRequests();
  }, [adminKey, isMainAdmin]);

  useEffect(() => {
    refreshMyPurchaseRequests();
  }, [authSession?.token, isUser]);

  useEffect(() => {
    if (!authSession?.token) return undefined;

    fetchCurrentSession(authSession.token).catch(() => {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      setAuthSession(null);
      setView("catalog");
    });
  }, [authSession?.token]);

  useEffect(() => {
    if (!previewProduct && !sizeGuideProduct && !buyingProduct) return undefined;

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
  }, [previewProduct, sizeGuideProduct, buyingProduct]);

  useEffect(() => {
    function captureInstallPrompt(event) {
      event.preventDefault();
      setInstallPromptEvent(event);
    }

    function markInstalled() {
      setInstallPromptEvent(null);
      setInstallDismissed(true);
    }

    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", markInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  async function loadCatalog(key = "") {
    setLoading(true);
    try {
      const [productData, categoryData, summaryData, purchaseRequestData, stockAlertData] = await Promise.all([
        fetchProducts(key),
        fetchCategories(),
        fetchSummary(),
        key ? fetchPurchaseRequests(key) : Promise.resolve([]),
        key ? fetchStockAlerts(key) : Promise.resolve([])
      ]);
      setProducts(productData);
      setCategories(["All", ...categoryData]);
      setSummary(summaryData);
      setPurchaseRequests(purchaseRequestData);
      setStockAlerts(stockAlertData);
      setStatusMessage("");
    } catch (error) {
      console.error("Catalog load failed:", error);
      setStatusMessage(`Could not load catalog: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const expandedQuery = expandSearchQuery(normalizedQuery);
    const bodyArea = BODY_AREAS.find((area) => area.id === selectedBodyArea) || BODY_AREAS[0];
    const needType = NEED_TYPES.find((need) => need.id === selectedNeedType) || NEED_TYPES[0];

    return products.filter((product) => {
      const searchableText = `${product.name} ${product.category} ${product.useDescription || ""}`.toLowerCase();
      const categoryMatch = selectedCategory === "All" || product.category === selectedCategory;
      const textMatch = !expandedQuery || expandedQuery.split(/\s+/).some((term) => term && searchableText.includes(term));
      const bodyMatch = !bodyArea.keywords.length || bodyArea.keywords.some((keyword) => searchableText.includes(keyword));
      const needMatch = !needType.keywords.length || needType.keywords.some((keyword) => searchableText.includes(keyword));
      const statusMatch = isAdmin || product.status === "Active";
      const stock = Number(product.stockQuantity) || 0;
      const stockMatch = stockFilter === "all"
        || (stockFilter === "available" && stock > 0)
        || (stockFilter === "low" && stock > 0 && stock < 5)
        || (stockFilter === "unavailable" && stock === 0);
      return categoryMatch && textMatch && bodyMatch && needMatch && statusMatch && stockMatch;
    });
  }, [products, query, selectedCategory, selectedBodyArea, selectedNeedType, stockFilter, isAdmin]);

  const adminVisibleProducts = useMemo(() => {
    const normalizedQuery = adminQuery.trim().toLowerCase();

    return products.filter((product) => {
      const searchableText = `${product.name} ${product.category} ${product.useDescription || ""}`.toLowerCase();
      const categoryMatch = adminSelectedCategory === "All" || product.category === adminSelectedCategory;
      const queryMatch = !normalizedQuery || searchableText.includes(normalizedQuery);
      return categoryMatch && queryMatch;
    });
  }, [products, adminQuery, adminSelectedCategory]);

  const compareProducts = useMemo(() => {
    return compareIds
      .map((id) => products.find((product) => product.id === id))
      .filter(Boolean);
  }, [compareIds, products]);

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
    const credentials = {
      email: adminLoginDraft.email.trim(),
      password: adminLoginDraft.password
    };
    if (!credentials.password) return;
    setLoading(true);

    try {
      const session = await loginAdmin(credentials);
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      setAuthSession(session);
      setAdminLoginDraft({ email: "", password: "" });
      setStatusMessage("Admin signed in.");
      setView("admin");
    } catch (error) {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      setAuthSession(null);
      setStatusMessage("Invalid admin password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUserAuth(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: userDraft.name.trim(),
        email: userDraft.email.trim(),
        password: userDraft.password
      };
      const session = authMode === "signup" ? await signupUser(payload) : await loginUser(payload);
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      setAuthSession(session);
      setUserDraft({ name: "", email: "", password: "" });
      if (pendingPurchaseProduct) {
        setBuyingProduct(pendingPurchaseProduct);
        setPendingPurchaseProduct(null);
        setPurchaseDraft(createEmptyPurchaseDraft(session));
        setStatusMessage("Signed in. Complete the buy request below.");
      } else {
        setStatusMessage(authMode === "signup" ? "User account created." : "User signed in.");
      }
      setView("catalog");
    } catch (error) {
      setStatusMessage(authMode === "signup" ? "Signup failed. Try another email." : "User login failed.");
    } finally {
      setLoading(false);
    }
  }

  function updateUserDraft(field, value) {
    setUserDraft((current) => ({ ...current, [field]: value }));
  }

  function updateAdminLoginDraft(field, value) {
    setAdminLoginDraft((current) => ({ ...current, [field]: value }));
  }

  function updateAdminRegisterDraft(field, value) {
    setAdminRegisterDraft((current) => ({ ...current, [field]: value }));
  }

  async function signOut() {
    if (authSession?.token) {
      try {
        await logoutSession(authSession.token);
      } catch {
        setStatusMessage("Signed out on this device. The server session could not be confirmed.");
      }
    }
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    setAuthSession(null);
    setAdminAccounts([]);
    setProductChangeRequests([]);
    setPurchaseRequests([]);
    setMyPurchaseRequests([]);
    setStockAlerts([]);
    setView("catalog");
  }

  function updateLocalProduct(id, field, value) {
    setProducts((current) => current.map((product) => (product.id === id ? { ...product, [field]: value } : product)));
  }

  function toggleCompare(product) {
    setCompareIds((current) => {
      if (current.includes(product.id)) {
        return current.filter((id) => id !== product.id);
      }

      if (current.length >= 3) {
        setStatusMessage("You can compare up to 3 products at a time.");
        return current;
      }

      return [...current, product.id];
    });
  }

  async function saveProduct(product) {
    try {
      const updated = await updateProduct(product, adminKey);
      setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSummary(await fetchSummary());
      setStockAlerts(await fetchStockAlerts(adminKey));
      if (isMainAdmin) {
        setStatusMessage(`${updated.name} updated.`);
      } else if (updated._responseStatus === 202) {
        setStatusMessage(`${updated.name} was sent to the main admin for approval.`);
      } else {
        setStatusMessage(`No changes were found for ${updated.name}.`);
      }
    } catch (error) {
      setStatusMessage("Admin update failed. Check the passcode and backend server.");
    }
  }

  async function refreshAdminAccounts(token = adminKey) {
    if (!isMainAdmin || !token) {
      setAdminAccounts([]);
      return;
    }

    try {
      setAdminAccounts(await fetchAdminAccounts(token));
    } catch {
      setAdminAccounts([]);
    }
  }

  async function refreshProductChangeRequests(token = adminKey) {
    if (!isMainAdmin || !token) {
      setProductChangeRequests([]);
      return;
    }

    try {
      setProductChangeRequests(await fetchProductChangeRequests(token));
    } catch {
      setProductChangeRequests([]);
    }
  }

  async function refreshMyPurchaseRequests(token = authSession?.token) {
    if (!isUser || !token) {
      setMyPurchaseRequests([]);
      return;
    }

    try {
      setMyPurchaseRequests(await fetchMyPurchaseRequests(token));
    } catch {
      setMyPurchaseRequests([]);
    }
  }

  async function handleAdminRegister(event) {
    event.preventDefault();
    if (!isMainAdmin || !adminKey) return;

    try {
      const account = await registerAdmin({
        name: adminRegisterDraft.name.trim(),
        email: adminRegisterDraft.email.trim(),
        phone: adminRegisterDraft.phone.trim(),
        password: adminRegisterDraft.password
      }, adminKey);
      setAdminAccounts((current) => [account, ...current.filter((item) => item.id !== account.id)]);
      setAdminRegisterDraft({ name: "", email: "", phone: "", password: "" });
      setStatusMessage(`${account.name} was added as an admin.`);
    } catch {
      setStatusMessage("Admin registration failed. Use a new email and a strong password.");
    }
  }

  async function handleDeleteAdmin(account) {
    if (!isMainAdmin || !adminKey) return;
    const shouldDelete = window.confirm(`Delete admin access for ${account.name}?`);
    if (!shouldDelete) return;

    try {
      await deleteAdminAccount(account.id, adminKey);
      setAdminAccounts((current) => current.filter((item) => item.id !== account.id));
      setStatusMessage(`${account.name} was removed from admin access.`);
    } catch {
      setStatusMessage("Could not delete that admin account.");
    }
  }

  async function handleReviewProductChange(change, decision) {
    if (!isMainAdmin || !adminKey) return;

    try {
      if (decision === "approve") {
        await approveProductChange(change.id, adminKey);
        setStatusMessage(`Approved ${change.productName}.`);
      } else {
        await rejectProductChange(change.id, adminKey);
        setStatusMessage(`Rejected ${change.productName}.`);
      }

      const [productData, summaryData, stockAlertData, changeData] = await Promise.all([
        fetchProducts(adminKey),
        fetchSummary(),
        fetchStockAlerts(adminKey),
        fetchProductChangeRequests(adminKey)
      ]);
      setProducts(productData);
      setSummary(summaryData);
      setStockAlerts(stockAlertData);
      setProductChangeRequests(changeData);
    } catch {
      setStatusMessage("Could not review that product change.");
    }
  }

  async function handlePurchaseStatusChange(request, status) {
    if (!isAdmin || !adminKey) return;

    try {
      const updated = await updatePurchaseRequestStatus(request.id, status, adminKey);
      setPurchaseRequests((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setStatusMessage(`${request.productName} request moved to ${status}.`);
    } catch {
      setStatusMessage("Could not update request status.");
    }
  }

  async function handleSendTestEmail() {
    if (!isAdmin || !adminKey) return;

    try {
      await sendTestEmail(adminKey);
      setStatusMessage("Test email sent to sandeepkumar.parangi@gmail.com.");
    } catch {
      setStatusMessage("Test email was not sent. Enable SMTP or SES email settings first.");
    }
  }

  function openPurchaseModal(product) {
    if (!authSession?.token) {
      setPendingPurchaseProduct(product);
      setBuyingProduct(null);
      setPreviewProduct(null);
      setAuthMode("login");
      setView("account");
      setStatusMessage("Please login or signup before buying this product.");
      return;
    }

    setBuyingProduct(product);
    setPurchaseDraft(createEmptyPurchaseDraft(authSession));
  }

  function updatePurchaseDraft(field, value) {
    setPurchaseDraft((current) => ({ ...current, [field]: value }));
  }

  async function handlePrescriptionFile(file) {
    if (!file || !authSession?.token) return;

    try {
      const uploaded = await uploadPrescription(file, authSession.token);
      setPurchaseDraft((current) => ({
        ...current,
        prescriptionName: uploaded.fileName,
        prescriptionUrl: uploaded.url
      }));
      setStatusMessage("Prescription uploaded.");
    } catch {
      setPurchaseDraft((current) => ({
        ...current,
        prescriptionName: file.name,
        prescriptionUrl: ""
      }));
      setStatusMessage("Prescription upload failed. The file name was saved for follow-up.");
    }
  }

  function updateAppSetting(field, value) {
    setAppSettings((current) => ({ ...current, [field]: value }));
    if (field === "defaultStockFilter") {
      setStockFilter(value);
    }
  }

  function updateProfilePicture(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateAppSetting("profilePicture", reader.result);
      setStatusMessage("Profile picture saved locally.");
    };
    reader.onerror = () => setStatusMessage("Could not load that profile picture.");
    reader.readAsDataURL(file);
  }

  function removeProfilePicture() {
    updateAppSetting("profilePicture", "");
    setStatusMessage("Profile picture removed.");
  }

  async function installMobileApp() {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    await installPromptEvent.userChoice.catch(() => null);
    setInstallPromptEvent(null);
    setInstallDismissed(true);
  }

  async function submitPurchaseRequest(event) {
    event.preventDefault();
    if (!buyingProduct || purchaseSubmitting) return;

    if (!authSession?.token) {
      setBuyingProduct(null);
      setPendingPurchaseProduct(buyingProduct);
      setAuthMode("login");
      setView("account");
      setStatusMessage("Please login or signup before buying this product.");
      return;
    }

    const availableStock = Number(buyingProduct.stockQuantity) || 0;
    const quantity = Math.max(1, Number(purchaseDraft.quantity) || 1);
    const request = {
      productId: buyingProduct.id,
      buyerName: purchaseDraft.buyerName.trim(),
      buyerPhone: purchaseDraft.buyerPhone.trim(),
      buyerEmail: purchaseDraft.buyerEmail.trim(),
      quantity,
      selectedSize: purchaseDraft.selectedSize.trim(),
      notes: [
        purchaseDraft.notes.trim(),
        purchaseDraft.prescriptionName ? `Doctor note/prescription: ${purchaseDraft.prescriptionName}` : ""
      ].filter(Boolean).join("\n"),
      prescriptionFileName: purchaseDraft.prescriptionName,
      prescriptionUrl: purchaseDraft.prescriptionUrl
    };

    if (!request.buyerName || !request.buyerPhone) {
      setStatusMessage("Name and phone are required for buying.");
      return;
    }

    if (!request.selectedSize) {
      setStatusMessage("Please select one size before sending the buy request.");
      return;
    }

    if (quantity > availableStock) {
      setStatusMessage(`Only ${availableStock} units are available for ${buyingProduct.name}.`);
      return;
    }

    setPurchaseSubmitting(true);
    try {
      const saved = await createPurchaseRequest(request, authSession.token);
      setBuyingProduct(null);
      setPurchaseDraft(createEmptyPurchaseDraft());
      const [summaryData, myRequestData] = await Promise.all([
        fetchSummary(),
        fetchMyPurchaseRequests(authSession.token).catch(() => [])
      ]);
      setSummary(summaryData);
      setMyPurchaseRequests(myRequestData);
      if (adminKey) {
        const [purchaseRequestData, stockAlertData, productData] = await Promise.all([
          fetchPurchaseRequests(adminKey),
          fetchStockAlerts(adminKey),
          fetchProducts(adminKey)
        ]);
        setPurchaseRequests(purchaseRequestData);
        setStockAlerts(stockAlertData);
        setProducts(productData);
      }
      setStatusMessage(`Request placed for ${saved.productName}. Our team will contact you shortly.`);
    } catch (error) {
      setStatusMessage("Buy request failed. Please login again or check available stock.");
    } finally {
      setPurchaseSubmitting(false);
    }
  }

  return (
    <div className={appShellClasses}>
      <Header view={view} setView={setView} authSession={authSession} isAdmin={isAdmin} isUser={isUser} onHeightChange={setHeaderHeight} onSignOut={signOut} />

      {view === "catalog" ? (
        <CatalogPage
          products={visibleProducts}
          categories={categories}
          categoryCounts={categoryCounts}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedBodyArea={selectedBodyArea}
          setSelectedBodyArea={setSelectedBodyArea}
          selectedNeedType={selectedNeedType}
          setSelectedNeedType={setSelectedNeedType}
          stockFilter={stockFilter}
          setStockFilter={setStockFilter}
          query={query}
          setQuery={setQuery}
          summary={summary}
          appSettings={appSettings}
          compareProducts={compareProducts}
          compareIds={compareIds}
          loading={loading}
          onPreview={setPreviewProduct}
          onShowSizeGuide={setSizeGuideProduct}
          onBuy={openPurchaseModal}
          onCompare={toggleCompare}
          onClearCompare={() => setCompareIds([])}
          onShowRequests={() => setView("account")}
          headerHeight={headerHeight}
        />
      ) : view === "account" ? (
        <AccountPage
          authMode={authMode}
          setAuthMode={setAuthMode}
          userDraft={userDraft}
          updateUserDraft={updateUserDraft}
          onSubmit={handleUserAuth}
          authSession={authSession}
          oauth2Status={oauth2Status}
          myPurchaseRequests={myPurchaseRequests}
          onBrowse={() => setView("catalog")}
          onSignOut={signOut}
        />
      ) : view === "settings" ? (
        <SettingsPage
          authSession={authSession}
          isAdmin={isAdmin}
          summary={summary}
          appSettings={appSettings}
          updateAppSetting={updateAppSetting}
          onProfilePictureChange={updateProfilePicture}
          onRemoveProfilePicture={removeProfilePicture}
          onSendTestEmail={handleSendTestEmail}
          onSignOut={signOut}
          onLogin={() => setView("account")}
          onAdmin={() => setView("admin")}
        />
      ) : (
        <AdminPage
          products={adminVisibleProducts}
          categories={categories}
          selectedCategory={adminSelectedCategory}
          setSelectedCategory={setAdminSelectedCategory}
          query={adminQuery}
          setQuery={setAdminQuery}
          adminLoginDraft={adminLoginDraft}
          updateAdminLoginDraft={updateAdminLoginDraft}
          adminRegisterDraft={adminRegisterDraft}
          updateAdminRegisterDraft={updateAdminRegisterDraft}
          adminAccounts={adminAccounts}
          productChangeRequests={productChangeRequests}
          isAdmin={isAdmin}
          isMainAdmin={isMainAdmin}
          onLogin={handleAdminLogin}
          onRegisterAdmin={handleAdminRegister}
          onDeleteAdmin={handleDeleteAdmin}
          onReviewProductChange={handleReviewProductChange}
          onPurchaseStatusChange={handlePurchaseStatusChange}
          onSendTestEmail={handleSendTestEmail}
          onSignOut={signOut}
          onLocalChange={updateLocalProduct}
          onSave={saveProduct}
          summary={summary}
          purchaseRequests={purchaseRequests}
          stockAlerts={stockAlerts}
        />
      )}

      {statusMessage ? <Toast message={statusMessage} onClose={() => setStatusMessage("")} /> : null}
      {previewProduct ? <ImagePreviewModal product={previewProduct} onClose={() => setPreviewProduct(null)} onBuy={openPurchaseModal} onShowSizeGuide={setSizeGuideProduct} /> : null}
      {sizeGuideProduct ? <SizeGuideModal product={sizeGuideProduct} onClose={() => setSizeGuideProduct(null)} /> : null}
      {buyingProduct ? (
        <PurchaseModal
          product={buyingProduct}
          draft={purchaseDraft}
          onChange={updatePurchaseDraft}
          onPrescriptionFile={handlePrescriptionFile}
          onClose={() => setBuyingProduct(null)}
          onSubmit={submitPurchaseRequest}
          submitting={purchaseSubmitting}
        />
      ) : null}
      <MobileNav view={view} setView={setView} authSession={authSession} isAdmin={isAdmin} isUser={isUser} />
      {installPromptEvent && !installDismissed ? (
        <InstallAppBanner onInstall={installMobileApp} onClose={() => setInstallDismissed(true)} />
      ) : null}
      <ContactSection />
    </div>
  );
}

function Header({ view, setView, authSession, isAdmin, isUser, onHeightChange, onSignOut }) {
  const headerRef = useRef(null);
  const accountMenuRef = useRef(null);
  const accountButtonRef = useRef(null);
  const signOutButtonRef = useRef(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [accountError, setAccountError] = useState("");
  const displayName = authSession?.displayName || authSession?.email || "Account";

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

  useEffect(() => {
    if (!authSession) {
      setIsAccountMenuOpen(false);
      setIsSigningOut(false);
      setAccountError("");
    }
  }, [authSession]);

  useEffect(() => {
    if (!isAccountMenuOpen) return undefined;

    function handlePointerDown(event) {
      if (!accountMenuRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsAccountMenuOpen(false);
        accountButtonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isAccountMenuOpen]);

  useEffect(() => {
    if (isAccountMenuOpen) {
      signOutButtonRef.current?.focus();
    }
  }, [isAccountMenuOpen]);

  function toggleAccountMenu() {
    setAccountError("");
    setIsAccountMenuOpen((current) => !current);
  }

  function openAccountMenu() {
    setAccountError("");
    setIsAccountMenuOpen(true);
  }

  async function handleSignOut() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    setAccountError("");

    try {
      await onSignOut();
      setIsAccountMenuOpen(false);
    } catch {
      setAccountError("Sign out failed. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  function handleAccountButtonKeyDown(event) {
    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        toggleAccountMenu();
        break;
      case "ArrowDown":
        event.preventDefault();
        openAccountMenu();
        break;
      case "Escape":
        if (isAccountMenuOpen) {
          event.preventDefault();
          setIsAccountMenuOpen(false);
        }
        break;
    }
  }

  function handleSignOutKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsAccountMenuOpen(false);
      accountButtonRef.current?.focus();
    }

    if (event.key === "Tab" && event.shiftKey) {
      event.preventDefault();
      setIsAccountMenuOpen(false);
      accountButtonRef.current?.focus();
    }
  }

  return (
    <header ref={headerRef} className="app-header">
      <div className="app-header-inner">
        <button className="app-brand" onClick={() => setView("catalog")} type="button">
          <AceLogoMark />
          <span>
            <strong>Antrocare</strong>
            <small>Orthopaedic care</small>
          </span>
        </button>

        <nav className="app-primary-nav" aria-label="Primary navigation">
          <NavButton active={view === "catalog"} onClick={() => setView("catalog")} label="Products" />
          <NavButton active={view === "account"} onClick={() => setView("account")} label={isUser ? "My requests" : "Account"} />
          <NavButton active={view === "settings"} onClick={() => setView("settings")} label="Settings" />
          {isAdmin ? (
            <NavButton active={view === "admin"} onClick={() => setView("admin")} label="Admin console" />
          ) : null}
          {!isAdmin && !isUser ? (
            <NavButton active={view === "admin"} onClick={() => setView("admin")} label="Admin" />
          ) : null}
        </nav>

        <div className="app-header-actions">
          <a className="header-icon-button" href="#contact" aria-label="Contact Antrocare" title="Contact Antrocare">
            <Mail size={19} />
          </a>
          {authSession ? (
            <div className="account-menu-shell" ref={accountMenuRef}>
              <button
                ref={accountButtonRef}
                className="account-action account-action-menu"
                onClick={toggleAccountMenu}
                onKeyDown={handleAccountButtonKeyDown}
                type="button"
                aria-haspopup="menu"
                aria-expanded={isAccountMenuOpen}
                aria-controls="header-account-menu"
                title={displayName}
              >
                <span className="account-action-name">{displayName}</span>
                <ChevronDown className={`account-action-chevron ${isAccountMenuOpen ? "account-action-chevron-open" : ""}`} size={16} />
              </button>
              {isAccountMenuOpen ? (
                <div className="account-dropdown" id="header-account-menu" role="menu" aria-label="Account options">
                  <button
                    ref={signOutButtonRef}
                    className="account-dropdown-item"
                    onClick={handleSignOut}
                    onKeyDown={handleSignOutKeyDown}
                    type="button"
                    role="menuitem"
                    disabled={isSigningOut}
                  >
                    <LogOut size={16} />
                    {isSigningOut ? "Signing out..." : "Sign Out"}
                  </button>
                  {accountError ? <p className="account-dropdown-error" role="alert">{accountError}</p> : null}
                </div>
              ) : null}
            </div>
          ) : (
            <button className="account-action" onClick={() => setView("account")} type="button">
              <UserCircle size={19} />
              Sign In
            </button>
          )}
        </div>
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

function NavButton({ active, onClick, label }) {
  return (
    <button className={`nav-pill ${active ? "nav-pill-active" : ""}`} onClick={onClick} type="button">
      {label}
    </button>
  );
}

function MobileNav({ view, setView, authSession, isAdmin, isUser }) {
  return (
    <nav className="mobile-tabbar" aria-label="Mobile navigation">
      <MobileNavButton active={view === "catalog"} onClick={() => setView("catalog")} icon={Store} label="Catalog" />
      <MobileNavButton active={view === "account"} onClick={() => setView("account")} icon={isUser ? UserCircle : UserPlus} label={authSession ? "Account" : "Login"} />
      <MobileNavButton active={view === "settings"} onClick={() => setView("settings")} icon={Settings} label="Settings" />
      {(isAdmin || !isUser) ? (
        <MobileNavButton active={view === "admin"} onClick={() => setView("admin")} icon={ShieldCheck} label="Admin" />
      ) : null}
      <a className="mobile-tabbar-button" href="#contact">
        <Mail size={19} />
        <span>Contact</span>
      </a>
    </nav>
  );
}

function MobileNavButton({ active, onClick, icon: Icon, label }) {
  return (
    <button className={`mobile-tabbar-button ${active ? "mobile-tabbar-button-active" : ""}`} onClick={onClick} type="button">
      <Icon size={19} />
      <span>{label}</span>
    </button>
  );
}

function InstallAppBanner({ onInstall, onClose }) {
  return (
    <aside className="mobile-install-banner" aria-label="Install mobile app">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-emerald-50 text-clinical">
          <Store size={21} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-black text-ink">Install Antrocare</p>
          <p className="truncate text-xs font-bold text-slate-500">Use it like a mobile app from your home screen.</p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button className="rounded-md bg-ink px-3 py-2 text-xs font-black text-white" type="button" onClick={onInstall}>Install</button>
        <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" type="button" onClick={onClose} aria-label="Dismiss install prompt">
          <X size={16} />
        </button>
      </div>
    </aside>
  );
}

function CatalogPage(props) {
  return (
    <main>
      <Hero summary={props.summary} />
      <CatalogControls {...props} />
      <CareFinder
        selectedBodyArea={props.selectedBodyArea}
        setSelectedBodyArea={props.setSelectedBodyArea}
        selectedNeedType={props.selectedNeedType}
        setSelectedNeedType={props.setSelectedNeedType}
      />
      <MotionShowcase />
      <ComparisonPanel products={props.compareProducts} onBuy={props.onBuy} onClear={props.onClearCompare} />
      <ProductGrid
        products={props.products}
        selectedCategory={props.selectedCategory}
        loading={props.loading}
        appSettings={props.appSettings}
        compareIds={props.compareIds}
        onPreview={props.onPreview}
        onShowSizeGuide={props.onShowSizeGuide}
        onBuy={props.onBuy}
        onCompare={props.onCompare}
        onShowRequests={props.onShowRequests}
      />
      <section className="advanced-care-heading">
        <p className="eyebrow">Guided care tools</p>
        <h2>More ways to find the right support.</h2>
        <p>Use symptoms, treatment notes, or recovery goals to create a more focused shortlist.</p>
      </section>
      <UniqueCareSuite products={props.products} onBuy={props.onBuy} onCompare={props.onCompare} />
    </main>
  );
}

function MotionShowcase() {
  const collections = [
    {
      eyebrow: "Precision with purpose",
      title: "Clinical insight, shaped around people.",
      detail: "Antrocare combines thoughtful assessment, technical knowledge, and human understanding to support every care decision.",
      visual: "/assets/antrocare-precision-care.png",
      alt: "Antrocare clinician and customer reviewing a modern mobility assessment",
      tone: "precision"
    },
    {
      eyebrow: "Care that moves forward",
      title: "Restoring confidence beyond the clinic.",
      detail: "Our work connects professional care with real life, helping people return to movement, independence, and everyday possibility.",
      visual: "/assets/antrocare-human-impact.png",
      alt: "People moving confidently outside an Antrocare rehabilitation environment",
      tone: "impact"
    }
  ];

  return (
    <section className="motion-showcase" aria-labelledby="motion-showcase-title">
      <div className="motion-showcase-heading">
        <div>
          <p className="eyebrow">The Antrocare story</p>
          <h2 id="motion-showcase-title">Technology guided by human care.</h2>
        </div>
        <p>We bring clinical precision and practical empathy together to help people move through life with greater confidence.</p>
      </div>
      <div className="motion-showcase-grid">
        {collections.map((collection) => (
          <article className={`motion-feature motion-feature-${collection.tone}`} key={collection.title}>
            <div className="motion-feature-media">
              <img
                className="motion-brand-visual"
                src={collection.visual}
                alt={collection.alt}
                width="1672"
                height="941"
                loading="lazy"
              />
              <span className="motion-scan" aria-hidden="true" />
              <span className="motion-orbit" aria-hidden="true"><span /></span>
              <span className="motion-frame-label" aria-hidden="true">Antrocare / {collection.tone === "precision" ? "Care intelligence" : "Human progress"}</span>
            </div>
            <div className="motion-feature-copy">
              <p>{collection.eyebrow}</p>
              <h3>{collection.title}</h3>
              <span>{collection.detail}</span>
              <a href="#contact">
                Meet Antrocare
                <ArrowRight size={16} />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CareFinder({ selectedBodyArea, setSelectedBodyArea, selectedNeedType, setSelectedNeedType }) {
  return (
    <section className="guided-care-strip" aria-label="Guided product finder">
      <div className="guided-care-copy">
        <span><Sparkles size={20} /></span>
        <div>
          <strong>Not sure what fits?</strong>
          <small>Choose a body area, then refine by support need.</small>
        </div>
      </div>
      <div className="body-area-links">
        {BODY_AREAS.map((area) => (
          <button
            className={selectedBodyArea === area.id ? "active" : ""}
            key={area.id}
            type="button"
            onClick={() => setSelectedBodyArea(area.id)}
          >
            {area.label}
          </button>
        ))}
      </div>
      <label className="need-select">
        <span>Support need</span>
        <select value={selectedNeedType} onChange={(event) => setSelectedNeedType(event.target.value)}>
          {NEED_TYPES.map((need) => <option key={need.id} value={need.id}>{need.label}</option>)}
        </select>
      </label>
    </section>
  );
}

function ComparisonPanel({ products, onBuy, onClear }) {
  if (!products.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 lg:px-10">
      <div className="surface-panel-padded border-ocean/20 bg-sky-50/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow text-ocean">Product comparison</p>
            <h2 className="mt-1 text-2xl font-black">Compare selected products side by side.</h2>
          </div>
          <button className="btn-secondary" type="button" onClick={onClear}>
            <X size={18} />
            Clear
          </button>
        </div>

        <div className="mt-5 overflow-auto">
          <table className="w-full min-w-[760px] border-collapse rounded-lg bg-white">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="table-cell">Product</th>
                <th className="table-cell">Category</th>
                <th className="table-cell">Use</th>
                <th className="table-cell">Cost</th>
                <th className="table-cell">Stock</th>
                <th className="table-cell">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr className="border-t border-slate-100" key={product.id}>
                  <td className="table-cell font-black">{product.name}</td>
                  <td className="table-cell">{product.category}</td>
                  <td className="table-cell max-w-sm text-sm font-semibold text-slate-600">{product.useDescription}</td>
                  <td className="table-cell font-black">{product.cost}</td>
                  <td className="table-cell font-black">{product.stockQuantity}</td>
                  <td className="table-cell">
                    <button className="btn-primary min-h-10 px-3" type="button" onClick={() => onBuy(product)}>
                      Buy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Hero({ summary }) {
  return (
    <section className="hero-panel">
      <div className="hero-grid">
        <div className="hero-copy-panel">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-clinical">
              <Stethoscope size={16} />
              Clinical product catalog
            </div>
            <h1>
              Support for better movement.
            </h1>
            <p>
              Find orthopaedic products by body area, comfort need, and live availability.
            </p>
          </div>
          <div className="hero-metrics" aria-label="Catalog summary">
            <Metric icon={Boxes} label="Products" value={summary.totalProducts} />
            <Metric icon={ClipboardList} label="Categories" value={summary.categories} />
            <Metric icon={CheckCircle2} label="Live stock" value={summary.activeProducts} />
          </div>
        </div>
      </div>
    </section>
  );
}

function UniqueCareSuite({ products, onBuy, onCompare }) {
  return (
    <section className="mx-auto grid max-w-7xl gap-5 px-4 pt-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
      <CareAssistant products={products} onBuy={onBuy} />
      <VisualBodyMap />
      <DoctorMode products={products} onCompare={onCompare} />
      <ProductBundles products={products} onBuy={onBuy} />
      <EducationHub />
    </section>
  );
}

function CareAssistant({ products, onBuy }) {
  const [prompt, setPrompt] = useState("knee pain while walking");
  const suggestions = recommendProducts(products, prompt, 3);

  return (
    <article className="surface-panel-padded">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">AI product assistant</p>
          <h2 className="mt-1 text-2xl font-black">Describe pain or activity.</h2>
        </div>
        <Sparkles className="text-clinical" size={26} />
      </div>
      <textarea className="field mt-4 min-h-24 py-3" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
      <div className="mt-4 grid gap-3">
        {suggestions.length ? suggestions.map((product) => (
          <article className="rounded-lg border border-slate-100 bg-white p-4" key={product.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-black">{product.name}</h3>
                <p className="mt-1 text-sm font-bold text-slate-500">{product.category}</p>
              </div>
              <button className="btn-primary min-h-10 px-3" type="button" onClick={() => onBuy(product)}>Buy</button>
            </div>
          </article>
        )) : <div className="rounded-lg border border-dashed border-slate-200 p-4 font-bold text-slate-500">Type a symptom to see suggestions.</div>}
      </div>
    </article>
  );
}

function VisualBodyMap() {
  return (
    <article className="surface-panel-padded">
      <p className="eyebrow">Visual body map</p>
      <h2 className="mt-1 text-2xl font-black">Tap a care zone in the finder below.</h2>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {["Neck", "Shoulder", "Wrist", "Back", "Hip", "Knee", "Ankle", "Foot", "Rehab"].map((area) => (
          <a className="finder-tile grid place-items-center text-center" href="#products" key={area}>
            {area}
          </a>
        ))}
      </div>
      <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">Use this map as a quick body-area shortcut, then refine with the guided finder.</p>
    </article>
  );
}

function DoctorMode({ products, onCompare }) {
  const [caseNote, setCaseNote] = useState("post surgery knee support");
  const recommendations = recommendProducts(products, caseNote, 4);

  return (
    <article className="surface-panel-padded lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Doctor / therapist mode</p>
          <h2 className="mt-1 text-2xl font-black">Create a quick recommendation shortlist.</h2>
        </div>
        <ClipboardList className="text-ocean" size={26} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <textarea className="field min-h-32 py-3" value={caseNote} onChange={(event) => setCaseNote(event.target.value)} />
        <div className="grid gap-3 md:grid-cols-2">
          {recommendations.map((product) => (
            <article className="rounded-lg border border-slate-100 bg-white p-4" key={product.id}>
              <h3 className="font-black">{product.name}</h3>
              <p className="mt-1 text-sm font-bold text-slate-500">{product.category}</p>
              <button className="btn-secondary mt-3 min-h-10 w-full" type="button" onClick={() => onCompare(product)}>
                Add to compare
              </button>
            </article>
          ))}
        </div>
      </div>
    </article>
  );
}

function ProductBundles({ products, onBuy }) {
  return (
    <article className="surface-panel-padded lg:col-span-2">
      <p className="eyebrow">Product bundles</p>
      <h2 className="mt-1 text-2xl font-black">Ready-made care kits.</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PRODUCT_BUNDLES.map((bundle) => {
          const items = bundleProducts(products, bundle);
          return (
            <div className="rounded-lg border border-slate-100 bg-white p-4" key={bundle.name}>
              <h3 className="font-black">{bundle.name}</h3>
              <p className="mt-2 min-h-12 text-sm font-semibold leading-6 text-slate-500">{bundle.note}</p>
              <div className="mt-3 grid gap-2">
                {items.map((product) => (
                  <button className="text-left text-sm font-black text-ocean hover:text-clinical" key={product.id} type="button" onClick={() => onBuy(product)}>
                    {product.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function EducationHub() {
  const topics = [
    ["When to use", "Use supports for recovery, posture assistance, mobility, or clinician-guided protection."],
    ["How to measure", "Measure the supported body area snugly over light clothing without compressing skin."],
    ["Safety warnings", "Stop use if numbness, swelling, skin marks, or pain increases."],
    ["Cleaning tips", "Clean gently, avoid harsh heat, and dry fully before reuse."]
  ];

  return (
    <article className="surface-panel-padded lg:col-span-2">
      <p className="eyebrow">Product education</p>
      <h2 className="mt-1 text-2xl font-black">Care guidance before users buy.</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        {topics.map(([title, detail]) => (
          <div className="rounded-lg border border-slate-100 bg-white p-4" key={title}>
            <h3 className="font-black">{title}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{detail}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <article className="metric-tile">
      <Icon size={17} />
      <span>
        <strong className="block text-xl font-black leading-none">{value}</strong>
        <span>{label}</span>
      </span>
    </article>
  );
}

function CatalogControls({ categories, categoryCounts, selectedCategory, setSelectedCategory, query, setQuery, stockFilter, setStockFilter, products, headerHeight }) {
  const stockFilters = [
    { id: "all", label: "All stock" },
    { id: "available", label: "Available" },
    { id: "low", label: "Low stock" },
    { id: "unavailable", label: "Unavailable" }
  ];

  return (
    <section
      id="products"
      className="control-dock"
      style={{ top: headerHeight, scrollMarginTop: headerHeight + 16 }}
    >
      <div className="catalog-control-inner">
        <div className="catalog-search-shell">
          <label className="catalog-search-box">
            <Search size={21} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search knee support, neck pain, walking aid..." />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                <X size={18} />
              </button>
            ) : null}
          </label>
          <span className="catalog-search-status"><PackageCheck size={18} /> Live inventory</span>
        </div>

        <div className="catalog-filter-bar">
          <div className="catalog-category-scroll">
            {categories.map((category) => (
              <button
                className={`category-chip ${selectedCategory === category ? "category-chip-active" : ""}`}
                key={category}
                onClick={() => setSelectedCategory(category)}
                type="button"
              >
                {category === "All" ? "All products" : category}
                <span>{category === "All" ? products.length : categoryCounts[category] || 0}</span>
              </button>
            ))}
          </div>
          <div className="stock-segment" aria-label="Stock filter">
            {stockFilters.map((filter) => (
              <button
                className={stockFilter === filter.id ? "active" : ""}
                key={filter.id}
                onClick={() => setStockFilter(filter.id)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductGrid({ products, selectedCategory, loading, appSettings, compareIds, onPreview, onShowSizeGuide, onBuy, onCompare, onShowRequests }) {
  if (loading) {
    return <div className="catalog-results"><div className="empty-panel">Loading catalog...</div></div>;
  }

  return (
    <section className="catalog-results">
      <div className="results-toolbar">
        <div>
          <h2>{selectedCategory === "All" ? "All products" : selectedCategory}</h2>
          <span>{products.length} matching products</span>
        </div>
        <button className="my-requests-button" type="button" onClick={onShowRequests}>
          <Clock3 size={17} />
          My requests
        </button>
      </div>
      {products.length ? (
        <div className="product-grid-modern">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              compact={appSettings.compactCards}
              showSupportPrompts={appSettings.showSupportPrompts}
              selectedForCompare={compareIds.includes(product.id)}
              onPreview={onPreview}
              onShowSizeGuide={onShowSizeGuide}
              onBuy={onBuy}
              onCompare={onCompare}
            />
          ))}
        </div>
      ) : (
        <div className="empty-panel">No products match the current filters.</div>
      )}
    </section>
  );
}

function ProductCard({ product, compact, showSupportPrompts, selectedForCompare, onPreview, onShowSizeGuide, onBuy, onCompare }) {
  const imageSrc = mediaUrl(product.imageUrl);
  const brochureSrc = mediaUrl(product.brochureUrl);
  const availableStock = Number(product.stockQuantity) || 0;
  const stockClass = availableStock === 0
    ? "bg-rose-50 text-rose-700"
    : availableStock < 5
      ? "bg-amber-50 text-amber-700"
      : "bg-emerald-50 text-clinical";

  return (
    <article className="product-card group">
      <button className="product-media-link" type="button" onClick={() => onPreview(product)} aria-label={`View ${product.name} image`}>
        <span className={`product-stock-label ${availableStock === 0 ? "out" : availableStock < 5 ? "low" : ""}`}>
          {availableStock === 0 ? "Out of stock" : availableStock < 5 ? `${availableStock} left` : "In stock"}
        </span>
        <ProductImage product={product} imageSrc={imageSrc} brochureSrc={brochureSrc} />
        <span className="image-action-badge" aria-hidden="true">
          <Maximize2 size={16} />
        </span>
      </button>
      <div className={compact ? "product-card-copy compact" : "product-card-copy"}>
        <div className="product-card-meta">
          <span>{product.category}</span>
          <span className={`stock-chip ${stockClass}`}>{availableStock} stock</span>
        </div>
        <h3>{product.name}</h3>
        {!compact && product.useDescription ? (
          <p>{product.useDescription}</p>
        ) : null}
        <div className="product-card-footer">
          <div>
            <small>Estimated price</small>
            <strong>{product.cost}</strong>
          </div>
          <button className="view-product-button" type="button" onClick={() => onPreview(product)}>
            View product
          </button>
        </div>
        <div className="product-quick-actions">
          <button className={selectedForCompare ? "active" : ""} type="button" onClick={() => onCompare(product)} title={selectedForCompare ? "Remove from comparison" : "Compare product"}>
            <ClipboardList size={17} />
            {selectedForCompare ? "Comparing" : "Compare"}
          </button>
          <button type="button" onClick={() => onShowSizeGuide(product)} title="Open age, height, and weight size guide">
            <Ruler size={17} />
            Size
          </button>
          {showSupportPrompts ? <a href={`${WHATSAPP_URL}?text=${encodeURIComponent(`I want to know more about ${product.name}`)}`} target="_blank" rel="noreferrer" aria-label={`Ask about ${product.name} on WhatsApp`} title="Ask on WhatsApp">
            <MessageCircle size={18} />
            Ask
          </a> : null}
          <button type="button" onClick={() => onBuy(product)} disabled={availableStock === 0} title="Buy product">
            <ShoppingCart size={17} />
            Buy
          </button>
        </div>
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

function parseRupeeCost(cost) {
  const value = Number(String(cost || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function formatRevenue(product) {
  const revenue = parseRupeeCost(product.cost) * (Number(product.unitsSold) || 0);
  return `₹${revenue.toLocaleString("en-IN")}`;
}

function SettingsPage({
  authSession,
  isAdmin,
  summary,
  appSettings,
  updateAppSetting,
  onProfilePictureChange,
  onRemoveProfilePicture,
  onSendTestEmail,
  onSignOut,
  onLogin,
  onAdmin
}) {
  const emailEnabled = false;
  const displayName = appSettings.profileName || authSession?.displayName || "Guest customer";
  const displayEmail = appSettings.profileEmail || authSession?.email || "Not signed in";
  const currentTimePreview = new Intl.DateTimeFormat(appSettings.language === "hi" ? "hi-IN" : "en-US", {
    dateStyle: appSettings.dateFormat,
    timeStyle: "short",
    timeZone: appSettings.timezone
  }).format(new Date());

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 lg:px-10">
      <section className="workspace-hero grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <p className="eyebrow text-emerald-200">Settings</p>
          <h1 className="max-w-4xl text-3xl font-black leading-tight md:text-4xl">Control app services, preferences, and access.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Keep customer browsing simple, admin tools reachable, and operational services visible from one place.
          </p>
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <SettingsSection icon={UserCircle} title="Profile" badge={authSession ? "Signed in" : "Local"}>
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-100 bg-white p-4">
            <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-emerald-50 text-clinical ring-1 ring-emerald-100">
              {appSettings.profilePicture ? (
                <img className="h-full w-full object-cover" src={appSettings.profilePicture} alt="Profile" />
              ) : (
                <UserCircle size={40} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-black text-ink">{displayName}</p>
              <p className="mt-1 break-words text-sm font-bold text-slate-500">{displayEmail}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="btn-secondary min-h-10 cursor-pointer px-3 text-sm">
                  Upload picture
                  <input className="sr-only" type="file" accept="image/*" onChange={(event) => onProfilePictureChange(event.target.files?.[0])} />
                </label>
                <button className="btn-secondary min-h-10 px-3 text-sm" type="button" onClick={onRemoveProfilePicture}>Remove</button>
              </div>
            </div>
          </div>
          <SettingsTextInput label="Name" value={appSettings.profileName} placeholder={authSession?.displayName || "Enter display name"} onChange={(value) => updateAppSetting("profileName", value)} />
          <SettingsTextInput label="Email" value={appSettings.profileEmail} placeholder={authSession?.email || "Enter email"} type="email" onChange={(value) => updateAppSetting("profileEmail", value)} />
        </SettingsSection>

        <SettingsSection icon={KeyRound} title="Account" badge={authSession ? authSession.role : "Guest"}>
          <SettingsInfo label="Password" value="Managed by the login form and stored as a secure backend hash" />
          <SettingsInfo label="Session" value={authSession ? "Active in this browser" : "Login required for buying"} />
          <SettingsToggle checked={appSettings.linkedEmail} label="Linked email account" detail="Use email as the primary request and notification identity." onChange={(value) => updateAppSetting("linkedEmail", value)} />
          <SettingsToggle checked={appSettings.linkedGoogle} label="Linked Google account" detail="Reserved for a future Google sign-in integration." onChange={(value) => updateAppSetting("linkedGoogle", value)} />
          <SettingsToggle checked={appSettings.linkedWhatsApp} label="Linked WhatsApp contact" detail="Use WhatsApp as a preferred customer support path." onChange={(value) => updateAppSetting("linkedWhatsApp", value)} />
          {authSession ? (
            <button className="btn-secondary mt-4 w-full" type="button" onClick={onSignOut}>
              <LogOut size={18} />
              Sign out
            </button>
          ) : (
            <button className="btn-primary mt-4 w-full" type="button" onClick={onLogin}>
              <UserCircle size={18} />
              User login
            </button>
          )}
        </SettingsSection>

        <SettingsSection icon={Mail} title="Notifications" badge={emailEnabled ? "Enabled" : "Needs setup"}>
          <SettingsToggle checked={appSettings.emailNotifications} label="Email notifications" detail="Send request, approval, and low-stock emails when provider settings are enabled." onChange={(value) => updateAppSetting("emailNotifications", value)} />
          <SettingsToggle checked={appSettings.pushNotifications} label="Push notifications" detail="Reserved for browser push notifications after deployment." onChange={(value) => updateAppSetting("pushNotifications", value)} />
          <SettingsToggle checked={appSettings.smsNotifications} label="SMS preferences" detail="Reserved for Twilio or another SMS provider integration." onChange={(value) => updateAppSetting("smsNotifications", value)} />
          <SettingsToggle checked={appSettings.orderUpdates} label="Order/request updates" detail="Notify customers when their request status changes." onChange={(value) => updateAppSetting("orderUpdates", value)} />
          <SettingsToggle checked={appSettings.lowStockAlerts} label="Low-stock alerts" detail="Alert admins when product stock falls below 5 units." onChange={(value) => updateAppSetting("lowStockAlerts", value)} />
          <SettingsToggle checked={appSettings.promotionalMessages} label="Promotional messages" detail="Allow future product updates and offers." onChange={(value) => updateAppSetting("promotionalMessages", value)} />
          {isAdmin ? (
            <button className="btn-primary mt-4 w-full" type="button" onClick={onSendTestEmail}>
              <Send size={18} />
              Send test email
            </button>
          ) : null}
        </SettingsSection>

        <SettingsSection icon={ShieldCheck} title="Privacy" badge={appSettings.dataSharing ? "Shared" : "Private"}>
          <SettingsToggle checked={appSettings.dataSharing} label="Data sharing" detail="Allow product request data to be used for internal reporting." onChange={(value) => updateAppSetting("dataSharing", value)} />
          <SettingsToggle checked={appSettings.publicProfile} label="Profile visibility" detail="Keep your profile visible to admins handling your requests." onChange={(value) => updateAppSetting("publicProfile", value)} />
          <SettingsToggle checked={appSettings.analyticsSharing} label="Analytics sharing" detail="Use anonymous browsing patterns to improve catalog layout." onChange={(value) => updateAppSetting("analyticsSharing", value)} />
          <SettingsInfo label="Customer data" value="Buy requests stay inside the Antrocare database for admin review" />
        </SettingsSection>

        <SettingsSection icon={Sparkles} title="Appearance" badge={appSettings.appearanceMode}>
          <SettingsSelect label="Mode" value={appSettings.appearanceMode} onChange={(value) => updateAppSetting("appearanceMode", value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </SettingsSelect>
          <SettingsSelect label="Theme" value={appSettings.themeColor} onChange={(value) => updateAppSetting("themeColor", value)}>
            <option value="clinical">Clinical green</option>
            <option value="ocean">Ocean blue</option>
            <option value="coral">Coral accent</option>
            <option value="neutral">Neutral</option>
          </SettingsSelect>
          <SettingsInfo label="Preview" value="Theme changes apply immediately to this browser" />
        </SettingsSection>

        <SettingsSection icon={Settings} title="Accessibility" badge={appSettings.highContrast ? "High contrast" : appSettings.fontSize}>
          <SettingsSelect label="Font size" value={appSettings.fontSize} onChange={(value) => updateAppSetting("fontSize", value)}>
            <option value="compact">Compact</option>
            <option value="comfortable">Comfortable</option>
            <option value="large">Large</option>
          </SettingsSelect>
          <SettingsToggle checked={appSettings.highContrast} label="High contrast" detail="Increase contrast for controls, panels, and text." onChange={(value) => updateAppSetting("highContrast", value)} />
          <SettingsToggle checked={appSettings.screenReaderHints} label="Screen reader options" detail="Keep clearer labels and helper text visible for assistive technology." onChange={(value) => updateAppSetting("screenReaderHints", value)} />
        </SettingsSection>

        <SettingsSection icon={MapPin} title="Language And Region" badge={appSettings.timezone}>
          <SettingsSelect label="Language" value={appSettings.language} onChange={(value) => updateAppSetting("language", value)}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="ta">Tamil</option>
          </SettingsSelect>
          <SettingsSelect label="Timezone" value={appSettings.timezone} onChange={(value) => updateAppSetting("timezone", value)}>
            <option value="America/Chicago">America/Chicago</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Asia/Kolkata">Asia/Kolkata</option>
            <option value="UTC">UTC</option>
          </SettingsSelect>
          <SettingsSelect label="Date format" value={appSettings.dateFormat} onChange={(value) => updateAppSetting("dateFormat", value)}>
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </SettingsSelect>
          <SettingsInfo label="Preview" value={currentTimePreview} />
        </SettingsSection>

        <SettingsSection icon={KeyRound} title="Security" badge={appSettings.twoFactorEnabled ? "2FA on" : "Standard"}>
          <SettingsToggle checked={appSettings.twoFactorEnabled} label="Two-factor authentication" detail="Reserve a second verification step for production login security." onChange={(value) => updateAppSetting("twoFactorEnabled", value)} />
          <SettingsToggle checked={appSettings.loginAlerts} label="Login alerts" detail="Notify admins or users when a new login is detected." onChange={(value) => updateAppSetting("loginAlerts", value)} />
          <SettingsToggle checked={appSettings.rememberDevice} label="Remember this device" detail="Keep local session convenience for trusted devices." onChange={(value) => updateAppSetting("rememberDevice", value)} />
          <SettingsInfo label="Login history" value={authSession ? "Current browser session is active" : "No active login in this browser"} />
          <SettingsInfo label="Main passcode" value="Set with ANTROCARE_ADMIN_KEY before deployment" />
        </SettingsSection>

      </div>
    </main>
  );
}

function SettingsSection({ icon: Icon, title, badge, children }) {
  return (
    <section className="surface-panel-padded">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-emerald-50 text-clinical">
            <Icon size={23} />
          </span>
          <h2 className="text-2xl font-black leading-tight">{title}</h2>
        </div>
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-black uppercase text-slate-500">{badge}</span>
      </div>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function SettingsInfo({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-4">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words font-black text-ink">{value}</p>
    </div>
  );
}

function SettingsTextInput({ label, value, placeholder, type = "text", onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-500">{label}</span>
      <input className="field" type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SettingsSelect({ label, value, onChange, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-500">{label}</span>
      <select className="field" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function SettingsToggle({ checked, label, detail, onChange }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-slate-100 bg-white p-4">
      <span>
        <span className="block font-black text-ink">{label}</span>
        <span className="mt-1 block text-sm font-semibold leading-6 text-slate-500">{detail}</span>
      </span>
      <input
        className="mt-1 h-5 w-5 accent-emerald-600"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function AccountPage({ authMode, setAuthMode, userDraft, updateUserDraft, onSubmit, authSession, oauth2Status, myPurchaseRequests, onBrowse, onSignOut }) {
  if (authSession) {
    return (
      <main className="mx-auto min-h-[calc(100vh-80px)] max-w-7xl px-4 py-12 lg:px-10">
        <section className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div className="surface-panel-padded">
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-50 text-clinical">
              <UserCircle size={28} />
            </div>
            <p className="eyebrow">{authSession.role === "ADMIN" ? "Admin session" : "User account"}</p>
            <h1 className="text-4xl font-black leading-tight">{authSession.displayName}</h1>
            <p className="mt-3 font-bold text-slate-500">{authSession.email}</p>
            <p className="mt-5 leading-7 text-slate-600">
              {authSession.role === "ADMIN"
                ? "This session can access the catalog, stock controls, sales dashboard, and admin pages."
                : "Browse products, place buy requests, and track every request from this page."}
            </p>
            <div className="mt-6 grid gap-3">
              <button className="btn-primary w-full" onClick={onBrowse} type="button">
                <Store size={18} />
                Browse products
              </button>
              <button className="btn-secondary w-full" onClick={onSignOut} type="button">
                <LogOut size={18} />
                Sign out
              </button>
            </div>
          </div>

          <div className="surface-panel-padded">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">My requests</p>
                <h2 className="mt-1 text-3xl font-black leading-tight">Track your product requests.</h2>
                <p className="mt-2 max-w-2xl font-semibold leading-7 text-slate-600">After you submit a buy request, Antrocare keeps it here and the team contacts you shortly.</p>
              </div>
              <span className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-black text-clinical">{myPurchaseRequests.length} saved</span>
            </div>

            <div className="mt-6 grid gap-4">
              {myPurchaseRequests.length ? myPurchaseRequests.map((request) => (
                <article className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm" key={request.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black text-ink">{request.productName}</h3>
                      <p className="mt-1 text-sm font-bold text-slate-500">{request.productCategory} - {request.costSnapshot}</p>
                    </div>
                    <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-black uppercase text-amber-700">{request.status}</span>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm font-bold text-slate-600 sm:grid-cols-3">
                    <span>Qty: <strong className="text-ink">{request.quantity}</strong></span>
                    <span>Size: <strong className="text-ink">{request.selectedSize || "Not selected"}</strong></span>
                    <span>Phone: <strong className="text-ink">{request.buyerPhone}</strong></span>
                    <span>{formatRequestTime(request.createdAt)}</span>
                  </div>
                  <div className="mt-4 rounded-md bg-sky-50 p-3 text-sm font-bold leading-6 text-ocean">
                    Next step: Antrocare will review this request and contact you using the phone number provided.
                  </div>
                  <RequestTimeline status={request.status} />
                </article>
              )) : (
                <div className="empty-panel min-h-72">
                  <div>
                    <Clock3 className="mx-auto mb-3 text-clinical" size={34} />
                    <p>No requests yet.</p>
                    <button className="btn-primary mt-5" onClick={onBrowse} type="button">
                      <Store size={18} />
                      Start browsing
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    );
  }

  const isSignup = authMode === "signup";
  const oauthProvider = oauth2Status?.providers?.[0] || "google";
  const oauthUrl = `${API_BASE}/oauth2/authorization/${oauthProvider}`;

  return (
    <main className="grid min-h-[calc(100vh-80px)] place-items-center px-4 py-12">
      <form className="surface-panel-padded w-full max-w-xl" onSubmit={onSubmit}>
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-50 text-clinical">
          {isSignup ? <UserPlus size={28} /> : <UserCircle size={28} />}
        </div>
        <p className="eyebrow">User access</p>
        <h1 className="text-3xl font-black leading-tight">{isSignup ? "Create a user account." : "Sign in as a user."}</h1>
        <p className="mt-3 leading-7 text-slate-600">Users can browse products and send buy requests. Admin stock and sales tools remain private.</p>

        {oauth2Status?.enabled ? (
          <a className="google-login-button mt-6" href={oauthUrl}>
            <img alt="" aria-hidden="true" className="h-5 w-5" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" />
            Continue with Google
          </a>
        ) : (
          <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-4 text-center text-sm font-bold leading-6 text-slate-500">
            Google sign-in is temporarily unavailable.
          </div>
        )}
        <div className="my-5 flex items-center gap-3 text-xs font-black uppercase text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          Or use email
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        {isSignup ? (
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-500">Name</span>
            <input className="field" value={userDraft.name} onChange={(event) => updateUserDraft("name", event.target.value)} required />
          </label>
        ) : null}
        <label className={isSignup ? "mt-4 block" : "block"}>
          <span className="mb-2 block text-sm font-black text-slate-500">Email</span>
          <input className="field" type="email" value={userDraft.email} onChange={(event) => updateUserDraft("email", event.target.value)} required />
        </label>
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-black text-slate-500">Password</span>
          <input className="field" type="password" minLength={isSignup ? 8 : undefined} value={userDraft.password} onChange={(event) => updateUserDraft("password", event.target.value)} required />
        </label>
        {isSignup ? (
          <p className="mt-2 text-xs font-bold leading-5 text-slate-500">Use 8+ characters with uppercase, lowercase, number, and symbol.</p>
        ) : null}

        <button className="btn-primary mt-5 w-full" type="submit">
          {isSignup ? <UserPlus size={19} /> : <UserCircle size={19} />}
          {isSignup ? "Create account" : "Sign in"}
        </button>
        <button className="mt-4 w-full rounded-md px-4 py-3 text-sm font-black text-ocean transition hover:bg-sky-50" type="button" onClick={() => setAuthMode(isSignup ? "login" : "signup")}>
          {isSignup ? "Already have an account? Sign in" : "New user? Create an account"}
        </button>
      </form>
    </main>
  );
}

function RequestTimeline({ status }) {
  const steps = ["Request placed", "Admin reviewed", "Customer contacted", "Completed"];
  const activeIndex = status === "Completed" ? 3 : status === "Contacted" ? 2 : status === "Reviewed" ? 1 : 0;

  return (
    <div className="mt-4 grid gap-2 rounded-lg border border-slate-100 bg-white p-4 sm:grid-cols-4">
      {steps.map((step, index) => (
        <div className="flex items-center gap-2" key={step}>
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${index <= activeIndex ? "bg-clinical text-white" : "bg-slate-100 text-slate-400"}`}>
            {index + 1}
          </span>
          <span className={`text-xs font-black uppercase ${index <= activeIndex ? "text-ink" : "text-slate-400"}`}>{step}</span>
        </div>
      ))}
    </div>
  );
}

function AdminPage(props) {
  if (!props.isAdmin) {
    return <AdminLogin {...props} />;
  }

  const salesProducts = [...props.products].sort((a, b) => (Number(b.unitsSold) || 0) - (Number(a.unitsSold) || 0));
  const totalProducts = Math.max(1, Number(props.summary.totalProducts) || props.products.length || 1);
  const activeProducts = Number(props.summary.activeProducts) || props.products.filter((product) => product.status === "Active").length;
  const hiddenProducts = Math.max(0, totalProducts - activeProducts);
  const outOfStockProducts = props.products.filter((product) => (Number(product.stockQuantity) || 0) === 0).length;
  const lowStockProducts = Number(props.summary.lowStockProducts) || props.stockAlerts.length;
  const healthyProducts = Math.max(0, totalProducts - lowStockProducts - outOfStockProducts);
  const totalStock = props.products.reduce((sum, product) => sum + (Number(product.stockQuantity) || 0), 0);
  const totalSold = Number(props.summary.totalUnitsSold) || 0;
  const inventoryMovementTotal = Math.max(1, totalStock + totalSold);
  const activePercent = Math.round((activeProducts / totalProducts) * 100);
  const movementPercent = Math.round((totalSold / inventoryMovementTotal) * 100);
  const categoryRows = Object.entries(props.products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {})).sort(([, left], [, right]) => right - left).slice(0, 7);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 lg:px-10">
      <section className="workspace-hero grid gap-6 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="eyebrow text-emerald-200">Admin console</p>
          <h1 className="max-w-3xl text-3xl font-black leading-tight md:text-4xl">Manage pricing, visibility, and catalog freshness.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Update costs, hide unavailable products, and review buy requests saved in the database.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Metric icon={Boxes} label="Products" value={props.summary.totalProducts} />
          <Metric icon={BadgeIndianRupee} label="Priced" value={props.summary.pricedProducts} />
          <Metric icon={Activity} label="Active" value={props.summary.activeProducts} />
          <Metric icon={PackageCheck} label="Buy requests" value={props.summary.purchaseRequests} />
          <Metric icon={TrendingUp} label="Units sold" value={props.summary.totalUnitsSold} />
          <Metric icon={AlertTriangle} label="Low stock" value={props.summary.lowStockProducts} />
          {props.isMainAdmin ? <Metric icon={ShieldCheck} label="Pending approvals" value={props.productChangeRequests.length} /> : null}
        </div>
      </section>

      <section className="admin-graph-shell mt-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Dashboard overview</p>
            <h2 className="mt-1 text-3xl font-black leading-tight">Graphical inventory and sales summary.</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-secondary bg-white" type="button" onClick={props.onSendTestEmail}>
              <Send size={18} />
              Send test email
            </button>
            <span className="rounded-md bg-white px-3 py-2 text-sm font-black text-ocean shadow-sm">{props.purchaseRequests.length} buy requests</span>
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
            <DashboardGauge
              label="Active catalog"
              value={`${activePercent}%`}
              detail={`${activeProducts} active / ${hiddenProducts} hidden`}
              percent={activePercent}
              color="#0f8a78"
            />
            <DashboardGauge
              label="Sales movement"
              value={`${movementPercent}%`}
              detail={`${totalSold} sold / ${totalStock} in stock`}
              percent={movementPercent}
              color="#236a9f"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <StockStatusChart healthy={healthyProducts} low={lowStockProducts} out={outOfStockProducts} total={totalProducts} />
            <SalesBarChart products={salesProducts} />
            <CategoryMixChart rows={categoryRows} total={totalProducts} />
          </div>
        </div>
      </section>

      <ReorderPredictionPanel products={props.products} />

      {props.isMainAdmin ? (
        <>
          <ProductApprovalPanel changes={props.productChangeRequests} onReview={props.onReviewProductChange} />
          <AdminAccessPanel
            draft={props.adminRegisterDraft}
            updateDraft={props.updateAdminRegisterDraft}
            onSubmit={props.onRegisterAdmin}
            onDeleteAdmin={props.onDeleteAdmin}
            adminAccounts={props.adminAccounts}
          />
        </>
      ) : null}

      <section className="mt-8 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-4 shadow-lg shadow-amber-900/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow text-amber-700">Stock alerts</p>
            <h2 className="mt-1 text-2xl font-black">Products below 5 available units.</h2>
          </div>
          <span className="rounded-md bg-white px-3 py-2 text-sm font-black text-amber-700">{props.stockAlerts.length} alerts</span>
        </div>
        {props.stockAlerts.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {props.stockAlerts.map((product) => (
              <article className="rounded-lg border border-amber-200 bg-white p-4" key={product.id}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-1 shrink-0 text-amber-600" size={20} />
                  <div>
                    <h3 className="font-black leading-tight">{product.name}</h3>
                    <p className="mt-1 text-sm font-bold text-slate-500">{product.category}</p>
                    <p className="mt-2 text-sm font-black text-amber-700">Only {product.stockQuantity} left. Update stock soon.</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-amber-100 bg-white p-4 font-bold text-slate-500">No low-stock alerts right now.</div>
        )}
      </section>

      <section className="surface-panel-padded mt-8">
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
                <th className="table-cell">Stock</th>
                <th className="table-cell">Sold</th>
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
                    <input
                      className="field min-w-28"
                      type="number"
                      min="0"
                      value={product.stockQuantity ?? 0}
                      onChange={(event) => props.onLocalChange(product.id, "stockQuantity", event.target.value)}
                    />
                    {(Number(product.stockQuantity) || 0) > 0 && (Number(product.stockQuantity) || 0) < 5 ? (
                      <div className="mt-2 text-xs font-black uppercase text-amber-700">Low stock</div>
                    ) : null}
                  </td>
                  <td className="table-cell font-black">{product.unitsSold || 0}</td>
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

      <section className="surface-panel-padded mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Sales dashboard</p>
            <h2 className="mt-1 text-2xl font-black">Track product sales and remaining stock.</h2>
          </div>
          <span className="rounded-md bg-sky-50 px-3 py-2 text-sm font-black text-ocean">{props.summary.totalUnitsSold} units sold</span>
        </div>

        <div className="mt-5 overflow-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="table-cell">Product</th>
                <th className="table-cell">Category</th>
                <th className="table-cell">Units sold</th>
                <th className="table-cell">Stock left</th>
                <th className="table-cell">Revenue estimate</th>
              </tr>
            </thead>
            <tbody>
              {salesProducts.map((product) => (
                <tr className="border-t border-slate-100" key={product.id}>
                  <td className="table-cell font-black">{product.name}</td>
                  <td className="table-cell">{product.category}</td>
                  <td className="table-cell font-black">{product.unitsSold || 0}</td>
                  <td className="table-cell">
                    <span className={(Number(product.stockQuantity) || 0) < 5 ? "font-black text-amber-700" : "font-black text-clinical"}>{product.stockQuantity ?? 0}</span>
                  </td>
                  <td className="table-cell font-black">{formatRevenue(product)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface-panel-padded mt-8">
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
                  <th className="table-cell">Prescription</th>
                  <th className="table-cell">Follow-up</th>
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
                      {request.selectedSize ? <div className="mt-2 inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-black uppercase text-clinical">Size: {request.selectedSize}</div> : null}
                      {request.notes ? <div className="mt-2 max-w-md text-sm font-semibold text-slate-500">{request.notes}</div> : null}
                    </td>
                    <td className="table-cell font-black">{request.buyerName}</td>
                    <td className="table-cell">
                      <div className="font-bold">{request.buyerPhone}</div>
                      {request.buyerEmail ? <div className="mt-1 text-sm font-semibold text-slate-500">{request.buyerEmail}</div> : null}
                    </td>
                    <td className="table-cell font-black">{request.quantity}</td>
                    <td className="table-cell">
                      {request.prescriptionUrl ? (
                        <a className="font-black text-ocean hover:text-clinical" href={mediaUrl(request.prescriptionUrl)} target="_blank" rel="noreferrer">
                          {request.prescriptionFileName || "Open file"}
                        </a>
                      ) : (
                        <span className="text-sm font-bold text-slate-400">No file</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className="rounded-md bg-sky-50 px-2.5 py-1 text-xs font-black uppercase text-ocean">
                        {request.status === "New" ? "Call today" : request.status === "Reviewed" ? "Confirm fit" : request.status === "Contacted" ? "Close loop" : "Done"}
                      </span>
                    </td>
                    <td className="table-cell">
                      <select className="field min-w-36" value={request.status} onChange={(event) => props.onPurchaseStatusChange(request, event.target.value)}>
                        <option>New</option>
                        <option>Reviewed</option>
                        <option>Contacted</option>
                        <option>Completed</option>
                      </select>
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

function ProductApprovalPanel({ changes, onReview }) {
  return (
    <section className="surface-panel-padded mt-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Main admin approval</p>
          <h2 className="mt-1 text-2xl font-black">Review admin product changes before publishing.</h2>
          <p className="mt-2 max-w-2xl font-semibold leading-7 text-slate-600">
            Changes submitted by other admins stay pending here. They affect the public catalog only after main admin approval.
          </p>
        </div>
        <span className="rounded-md bg-amber-50 px-3 py-2 text-sm font-black text-amber-700">{changes.length} pending</span>
      </div>

      <div className="mt-5 grid gap-4">
        {changes.length ? changes.map((change) => (
          <article className="rounded-lg border border-amber-100 bg-white p-4 shadow-sm" key={change.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-ink">{change.productName}</h3>
                <p className="mt-1 text-sm font-bold text-slate-500">{change.productCategory}</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Requested by <span className="font-black text-ink">{change.requestedByName}</span> ({change.requestedByEmail}) on {formatRequestTime(change.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary min-h-10" type="button" onClick={() => onReview(change, "approve")}>
                  <CheckCircle2 size={17} />
                  Approve
                </button>
                <button className="btn-danger min-h-10" type="button" onClick={() => onReview(change, "reject")}>
                  <X size={17} />
                  Reject
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <ChangeCompare label="Cost" current={change.currentCost} requested={change.requestedCost} />
              <ChangeCompare label="Stock" current={change.currentStockQuantity} requested={change.requestedStockQuantity} />
              <ChangeCompare label="Status" current={change.currentStatus} requested={change.requestedStatus} />
            </div>
          </article>
        )) : (
          <div className="empty-panel min-h-48">No pending product changes.</div>
        )}
      </div>
    </section>
  );
}

function ReorderPredictionPanel({ products }) {
  const rows = products
    .map((product) => {
      const stock = Number(product.stockQuantity) || 0;
      const sold = Number(product.unitsSold) || 0;
      const urgency = sold * 2 + Math.max(0, 10 - stock);
      const suggested = Math.max(10, sold * 2, stock < 5 ? 20 : 10);
      return { product, stock, sold, urgency, suggested };
    })
    .filter((row) => row.stock < 10 || row.sold > 0)
    .sort((left, right) => right.urgency - left.urgency)
    .slice(0, 8);

  return (
    <section className="surface-panel-padded mt-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Reorder prediction</p>
          <h2 className="mt-1 text-2xl font-black">Products likely to need restocking.</h2>
          <p className="mt-2 max-w-2xl font-semibold leading-7 text-slate-600">Prediction uses current stock and sales movement from this local catalog.</p>
        </div>
        <TrendingUp className="text-ocean" size={28} />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {rows.length ? rows.map(({ product, stock, sold, suggested }) => (
          <article className="rounded-lg border border-slate-100 bg-white p-4" key={product.id}>
            <h3 className="font-black leading-tight">{product.name}</h3>
            <p className="mt-1 text-sm font-bold text-slate-500">{product.category}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black uppercase">
              <span className="rounded-md bg-slate-50 p-2">Stock<br />{stock}</span>
              <span className="rounded-md bg-sky-50 p-2 text-ocean">Sold<br />{sold}</span>
              <span className="rounded-md bg-emerald-50 p-2 text-clinical">Order<br />{suggested}</span>
            </div>
          </article>
        )) : (
          <div className="empty-panel min-h-40 md:col-span-2 xl:col-span-4">No reorder risk yet.</div>
        )}
      </div>
    </section>
  );
}

function ChangeCompare({ label, current, requested }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-4">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <div className="mt-3 grid gap-2 text-sm">
        <div>
          <span className="block font-bold text-slate-500">Current</span>
          <strong className="text-ink">{current}</strong>
        </div>
        <div>
          <span className="block font-bold text-slate-500">Requested</span>
          <strong className="text-clinical">{requested}</strong>
        </div>
      </div>
    </div>
  );
}

function AdminAccessPanel({ draft, updateDraft, onSubmit, adminAccounts, onDeleteAdmin }) {
  return (
    <section className="surface-panel-padded mt-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Main admin only</p>
          <h2 className="mt-1 text-2xl font-black">Create admin accounts.</h2>
          <p className="mt-2 max-w-2xl font-semibold leading-7 text-slate-600">
            Add trusted admins who can manage products, stock, sales, and buy requests. This panel is hidden from regular admin logins.
          </p>
        </div>
        <span className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-black text-clinical">{adminAccounts.length} registered admins</span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <form className="rounded-lg border border-slate-100 bg-slate-50/70 p-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-500">Admin name</span>
            <input className="field" value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} required />
          </label>
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-black text-slate-500">Admin email</span>
            <input className="field" type="email" value={draft.email} onChange={(event) => updateDraft("email", event.target.value)} required />
          </label>
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-black text-slate-500">Admin phone</span>
            <input className="field" type="tel" value={draft.phone} onChange={(event) => updateDraft("phone", event.target.value)} required />
          </label>
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-black text-slate-500">Temporary password</span>
            <input className="field" type="password" minLength="8" value={draft.password} onChange={(event) => updateDraft("password", event.target.value)} required />
          </label>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-500">Use 8+ characters with uppercase, lowercase, number, and symbol.</p>
          <button className="btn-primary mt-5 w-full" type="submit">
            <ShieldCheck size={18} />
            Add admin
          </button>
        </form>

        <div className="overflow-auto rounded-lg border border-slate-100 bg-white">
          {adminAccounts.length ? (
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <th className="table-cell">Admin</th>
                  <th className="table-cell">Email</th>
                  <th className="table-cell">Phone</th>
                  <th className="table-cell">Created</th>
                  <th className="table-cell">Action</th>
                </tr>
              </thead>
              <tbody>
                {adminAccounts.map((account) => (
                  <tr className="border-t border-slate-100" key={account.id}>
                    <td className="table-cell font-black">{account.name}</td>
                    <td className="table-cell font-semibold text-slate-600">{account.email}</td>
                    <td className="table-cell font-semibold text-slate-600">{account.phone}</td>
                    <td className="table-cell font-bold text-slate-500">{formatRequestTime(account.createdAt)}</td>
                    <td className="table-cell">
                      <button className="btn-danger min-h-10" type="button" onClick={() => onDeleteAdmin(account)}>
                        <Trash2 size={17} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-panel min-h-56">No registered admins yet.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function DashboardGauge({ label, value, detail, percent, color }) {
  const safePercent = Math.max(0, Math.min(100, percent));

  return (
    <article className="graph-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-slate-500">{label}</p>
          <strong className="mt-2 block text-4xl font-black text-ink">{value}</strong>
          <p className="mt-2 text-sm font-bold text-slate-500">{detail}</p>
        </div>
        <div
          className="dashboard-gauge"
          style={{ "--gauge-color": color, "--gauge-percent": `${safePercent}%` }}
          aria-label={`${label} ${safePercent}%`}
        >
          <span>{safePercent}</span>
        </div>
      </div>
    </article>
  );
}

function StockStatusChart({ healthy, low, out, total }) {
  const rows = [
    { label: "Healthy stock", value: healthy, color: "bg-clinical" },
    { label: "Low stock", value: low, color: "bg-gold" },
    { label: "Out of stock", value: out, color: "bg-coral" }
  ];

  return (
    <article className="graph-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-slate-500">Stock status</p>
          <h3 className="mt-2 text-2xl font-black text-ink">Availability breakdown</h3>
        </div>
        <Boxes className="text-clinical" size={26} />
      </div>
      <div className="mt-6 grid gap-4">
        {rows.map((row) => (
          <DashboardBar key={row.label} label={row.label} value={row.value} max={total} colorClass={row.color} />
        ))}
      </div>
    </article>
  );
}

function SalesBarChart({ products }) {
  const chartProducts = products.filter((product) => (Number(product.unitsSold) || 0) > 0).slice(0, 6);
  const rows = chartProducts.length ? chartProducts : products.slice(0, 6);
  const maxUnits = Math.max(1, ...rows.map((product) => Number(product.unitsSold) || 0));

  return (
    <article className="graph-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-slate-500">Sales graph</p>
          <h3 className="mt-2 text-2xl font-black text-ink">Top product movement</h3>
        </div>
        <TrendingUp className="text-ocean" size={26} />
      </div>
      <div className="mt-6 grid gap-4">
        {rows.length ? rows.map((product) => (
          <DashboardBar
            key={product.id}
            label={product.name}
            value={Number(product.unitsSold) || 0}
            max={maxUnits}
            colorClass="bg-ocean"
          />
        )) : (
          <div className="rounded-lg border border-dashed border-slate-200 p-5 text-sm font-bold text-slate-500">No product movement yet.</div>
        )}
      </div>
    </article>
  );
}

function CategoryMixChart({ rows, total }) {
  const maxCount = Math.max(1, ...rows.map(([, count]) => Number(count) || 0));

  return (
    <article className="graph-card lg:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-slate-500">Category graph</p>
          <h3 className="mt-2 text-2xl font-black text-ink">Product distribution</h3>
        </div>
        <ClipboardList className="text-coral" size={26} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {rows.map(([category, count]) => (
          <DashboardBar
            key={category}
            label={category}
            value={`${count} / ${total}`}
            max={maxCount}
            rawValue={count}
            colorClass="bg-coral"
          />
        ))}
      </div>
    </article>
  );
}

function DashboardBar({ label, value, max, colorClass, rawValue = value }) {
  const width = `${Math.max(4, Math.round((Number(rawValue) || 0) / Math.max(1, max) * 100))}%`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-black text-ink">{label}</span>
        <span className="shrink-0 font-black text-slate-500">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width }} />
      </div>
    </div>
  );
}

function AdminLogin({ adminLoginDraft, updateAdminLoginDraft, onLogin }) {
  return (
    <main className="grid min-h-[calc(100vh-80px)] place-items-center px-4 py-12">
      <form className="surface-panel-padded w-full max-w-xl" onSubmit={onLogin}>
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-slate-950 text-white">
          <LockKeyhole size={26} />
        </div>
        <p className="eyebrow">Admin access</p>
        <h1 className="text-3xl font-black leading-tight">Sign in to manage products.</h1>
        <p className="mt-3 leading-7 text-slate-600">Use the main admin passcode, or login with a registered admin email and password.</p>
        <label className="mt-6 block">
          <span className="mb-2 block text-sm font-black text-slate-500">Registered admin email</span>
          <input className="field" type="email" value={adminLoginDraft.email} onChange={(event) => updateAdminLoginDraft("email", event.target.value)} placeholder="Leave blank for main admin" />
        </label>
        <label className="mt-6 block">
          <span className="mb-2 block text-sm font-black text-slate-500">Password / main passcode</span>
          <input className="field" type="password" value={adminLoginDraft.password} onChange={(event) => updateAdminLoginDraft("password", event.target.value)} placeholder="Enter password" />
        </label>
        <button className="btn-primary mt-5 w-full" type="submit">
          <ShieldCheck size={19} />
          Unlock admin
        </button>
      </form>
    </main>
  );
}

function ImagePreviewModal({ product, onClose, onBuy, onShowSizeGuide }) {
  const imageSrc = mediaUrl(product.imageUrl);
  const brochureSrc = mediaUrl(product.brochureUrl);
  const availableStock = Number(product.stockQuantity) || 0;
  const guide = productGuideFor(product);

  return (
    <div
      className="image-modal-backdrop product-drawer-backdrop"
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
        <div className="product-drawer-topbar">
          <strong>Product details</strong>
          <button className="header-icon-button" onClick={onClose} type="button" aria-label="Close image preview">
            <X size={22} />
          </button>
        </div>
        <div className="product-drawer-image">
          <ProductImage product={product} imageSrc={imageSrc} brochureSrc={brochureSrc} full />
        </div>
        <div className="product-drawer-content">
          <p className="eyebrow">{product.category}</p>
          <h2>{product.name}</h2>
          {product.useDescription ? <p className="product-drawer-description">{product.useDescription}</p> : null}
          <div className="product-drawer-facts">
            <span><PackageCheck size={18} /><strong>{availableStock} available</strong></span>
            <span><ShieldCheck size={18} /><strong>Admin verified</strong></span>
          </div>
          <div className="product-guide-section">
            <strong>Care instructions</strong>
            <ul>
              {guide.care.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div className="product-guide-section">
            <strong>Size guide</strong>
            <p>{guide.size}</p>
            <button className="size-guide-inline-button" type="button" onClick={() => onShowSizeGuide(product)}>
              <Ruler size={17} />
              View age, height, and weight chart
            </button>
          </div>
          <div className="product-drawer-price">
            <span>Estimated price</span>
            <strong>{product.cost}</strong>
          </div>
          <button
            className="btn-primary w-full"
            type="button"
            disabled={availableStock === 0}
            onClick={() => {
              onBuy(product);
              onClose();
            }}
          >
            <ShoppingCart size={18} />
            {availableStock === 0 ? "Currently unavailable" : "Request this product"}
          </button>
          <p className="clinical-use-note"><Info size={16} /> Product selection should follow professional clinical advice.</p>
        </div>
      </div>
    </div>
  );
}

function SizeGuideModal({ product, onClose }) {
  const guide = sizeGuideFor(product);

  return (
    <div
      className="image-modal-backdrop size-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} size guide`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="size-modal-panel">
        <div className="size-modal-header">
          <span className="size-modal-icon"><Ruler size={24} /></span>
          <div>
            <p className="eyebrow">{product.category}</p>
            <h2>{product.name} size guide</h2>
          </div>
          <button className="header-icon-button" onClick={onClose} type="button" aria-label="Close size guide">
            <X size={22} />
          </button>
        </div>

        <div className="size-measurement-note">
          <strong>How to choose</strong>
          <p>{guide.measurement}</p>
        </div>

        <div className="size-guide-table-wrap">
          <table className="size-guide-table">
            <thead>
              <tr>
                <th>Size</th>
                <th>Age</th>
                <th>Height</th>
                <th>Weight</th>
                <th>Best fit</th>
              </tr>
            </thead>
            <tbody>
              {guide.rows.map((row) => (
                <tr key={`${product.id}-${row.label}`}>
                  <td><strong>{row.label}</strong></td>
                  <td>{row.age}</td>
                  <td>{row.height}</td>
                  <td>{row.weight}</td>
                  <td>{row.fit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="size-guide-cards">
          {guide.rows.map((row) => (
            <article key={`${product.id}-${row.label}-card`}>
              <strong>{row.label}</strong>
              <span>{row.age}</span>
              <span>{row.height}</span>
              <span>{row.weight}</span>
              <p>{row.fit}</p>
            </article>
          ))}
        </div>

        <p className="clinical-use-note"><Info size={16} /> This guide is a quick reference. Final fitting should follow body measurements and clinical advice.</p>
      </div>
    </div>
  );
}

function PurchaseModal({ product, draft, onChange, onPrescriptionFile, onClose, onSubmit, submitting }) {
  const availableStock = Number(product.stockQuantity) || 0;
  const sizeGuide = sizeGuideFor(product);

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
      <form className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-white/20 bg-white shadow-2xl" onSubmit={onSubmit}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-black uppercase text-clinical">{product.category}</span>
            <h2 className="mt-3 text-2xl font-black leading-tight text-ink">Buy {product.name}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{product.cost} - {availableStock} available</p>
          </div>
          <button className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-ink" onClick={onClose} type="button" aria-label="Close buy form">
            <X size={22} />
          </button>
        </div>

        <div className="grid gap-3 border-b border-slate-100 bg-slate-50/80 p-5 text-sm font-bold text-slate-600 sm:grid-cols-3">
          <div className="rounded-md bg-white p-3">
            <span className="mb-2 grid h-8 w-8 place-items-center rounded-md bg-emerald-50 text-clinical">1</span>
            Submit request
          </div>
          <div className="rounded-md bg-white p-3">
            <span className="mb-2 grid h-8 w-8 place-items-center rounded-md bg-sky-50 text-ocean">2</span>
            Team reviews stock
          </div>
          <div className="rounded-md bg-white p-3">
            <span className="mb-2 grid h-8 w-8 place-items-center rounded-md bg-amber-50 text-amber-700">3</span>
            You get a call
          </div>
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
            <input className="field" type="number" min="1" max={Math.min(99, availableStock)} value={draft.quantity} onChange={(event) => onChange("quantity", event.target.value)} required />
            <span className="mt-2 block text-xs font-black uppercase text-slate-500">{availableStock} available</span>
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 block text-sm font-black text-slate-500">Select size</legend>
            <p className="mb-3 text-sm font-semibold leading-6 text-slate-500">{sizeGuide.measurement}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {sizeGuide.rows.map((row) => {
                const sizeValue = `${row.label} - ${row.age}, ${row.height}, ${row.weight}`;
                const checked = draft.selectedSize === sizeValue;
                return (
                  <label className={`size-choice-card ${checked ? "selected" : ""}`} key={`${product.id}-purchase-${row.label}`}>
                    <input
                      type="radio"
                      name="selectedSize"
                      value={sizeValue}
                      checked={checked}
                      onChange={(event) => onChange("selectedSize", event.target.value)}
                      required
                    />
                    <span>
                      <strong>{row.label}</strong>
                      <small>{row.age} | {row.height} | {row.weight}</small>
                      <em>{row.fit}</em>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-black text-slate-500">Prescription / doctor note</span>
            <input
              className="field py-3"
              type="file"
              accept="image/*,.pdf"
              onChange={(event) => onPrescriptionFile(event.target.files?.[0])}
            />
            {draft.prescriptionName ? <span className="mt-2 block text-xs font-black uppercase text-ocean">{draft.prescriptionName}{draft.prescriptionUrl ? " uploaded" : ""}</span> : null}
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-black text-slate-500">Notes</span>
            <textarea className="field min-h-28 resize-y py-3" value={draft.notes} onChange={(event) => onChange("notes", event.target.value)} />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-5">
          <span className="text-sm font-bold text-slate-500">Your request is saved to your account and the admin dashboard.</span>
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
    <footer id="contact" className="bg-ink px-4 py-12 text-white lg:px-10">
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
          <ContactLink icon={MessageCircle} label="WhatsApp Antrocare" href={`${WHATSAPP_URL}?text=${encodeURIComponent("Hello Antrocare, I need help choosing a product.")}`} />
          <ContactLink icon={Mail} label="antro_ace@yahoo.co.in" href="mailto:antro_ace@yahoo.co.in" />
        </div>
      </div>
    </footer>
  );
}

function ContactLink({ icon: Icon, label, href }) {
  const external = href.startsWith("http");
  return (
    <a className="flex min-h-16 items-center gap-3 rounded-lg border border-white/10 bg-white/10 px-4 font-black transition hover:bg-white/15" href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
      <Icon className="text-emerald-300" size={20} />
      {label}
    </a>
  );
}

function Toast({ message, onClose }) {
  return (
    <div className="toast-panel">
      <Stethoscope className="text-clinical" size={22} />
      <span>{message}</span>
      <button className="ml-2 rounded-md p-1 hover:bg-slate-100" onClick={onClose} type="button" aria-label="Close message">
        <X size={18} />
      </button>
    </div>
  );
}

export default App;
