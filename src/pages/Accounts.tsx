import { useState, useMemo, useEffect } from "react";
import Layout from "@/components/Layout";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  ACCOUNT_COLORS,
  ACCOUNT_TYPES,
  accountTypeLabel,
  formatMoney,
  todayISO,
} from "@/lib/finance";
import {
  ArrowLeftRight,
  Banknote,
  ChevronDown,
  ChevronLeft,
  CreditCard,
  FileText,
  Folder,
  FolderOpen,
  Landmark,
  LayoutGrid,
  ListTree,
  Pencil,
  PiggyBank,
  Plus,
  PlusCircle,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote className="h-4 w-4" />,
  bank: <Landmark className="h-4 w-4" />,
  credit_card: <CreditCard className="h-4 w-4" />,
  savings: <PiggyBank className="h-4 w-4" />,
  income: <Wallet className="h-4 w-4" />,
  expense: <Wallet className="h-4 w-4" />,
  other: <FileText className="h-4 w-4" />,
};

type AccountWithBalance = {
  id: number;
  name: string;
  nameEn?: string;
  code?: string;
  parentCode?: string;
  level?: number;
  type: string;
  color: string;
  balance: number;
  isPostable?: boolean;
};

interface AccountTreeNode {
  account: AccountWithBalance;
  children: AccountTreeNode[];
  totalBalance: number;
  directBalance: number;
  level: number;
  depth: number;
  hasChildren: boolean;
}

// Build the hierarchical tree from a flat accounts list
function buildAccountTree(accounts: AccountWithBalance[]): AccountTreeNode[] {
  const codeMap = new Map<string, AccountWithBalance>();
  accounts.forEach((acc) => {
    if (acc.code) codeMap.set(String(acc.code).trim(), acc);
  });

  const getParentCode = (acc: AccountWithBalance): string => {
    if (acc.parentCode !== undefined && acc.parentCode !== "") {
      return String(acc.parentCode).trim();
    }
    const code = String(acc.code || "").trim();
    if (!code || code.length <= 1) return "";
    for (let len = code.length - 1; len >= 1; len--) {
      const prefix = code.slice(0, len);
      if (codeMap.has(prefix)) {
        return prefix;
      }
    }
    return "";
  };

  const nodeMap = new Map<number, AccountTreeNode>();
  accounts.forEach((acc) => {
    nodeMap.set(acc.id, {
      account: acc,
      children: [],
      totalBalance: Number(acc.balance) || 0,
      directBalance: Number(acc.balance) || 0,
      level: acc.level ?? 1,
      depth: 0,
      hasChildren: false,
    });
  });

  const roots: AccountTreeNode[] = [];

  accounts.forEach((acc) => {
    const node = nodeMap.get(acc.id)!;
    const parentCode = getParentCode(acc);
    const parentAcc = parentCode ? codeMap.get(parentCode) : null;
    const parentNode = parentAcc ? nodeMap.get(parentAcc.id) : null;

    if (parentNode && parentNode.account.id !== node.account.id) {
      parentNode.children.push(node);
      parentNode.hasChildren = true;
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes: AccountTreeNode[], currentDepth: number) => {
    nodes.sort((a, b) => {
      const ca = String(a.account.code || "");
      const cb = String(b.account.code || "");
      return ca.localeCompare(cb, undefined, { numeric: true });
    });
    for (const node of nodes) {
      node.depth = currentDepth;
      if (node.children.length > 0) {
        sortNodes(node.children, currentDepth + 1);
      }
    }
  };
  sortNodes(roots, 0);

  const computeTotals = (node: AccountTreeNode): number => {
    let sum = node.directBalance;
    for (const child of node.children) {
      sum += computeTotals(child);
    }
    node.totalBalance = sum;
    return sum;
  };

  roots.forEach(computeTotals);
  return roots;
}

export default function AccountsPage() {
  const utils = trpc.useUtils();
  const { data: accounts, isLoading } = trpc.finance.accounts.list.useQuery();
  const { data: transfers } = trpc.finance.transfers.list.useQuery();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"tree" | "grid">("tree");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // Account Form Dialog State
  const [accDialog, setAccDialog] = useState(false);
  const [editing, setEditing] = useState<AccountWithBalance | null>(null);
  const [parentAccountForNew, setParentAccountForNew] = useState<AccountWithBalance | null>(null);
  const [deleting, setDeleting] = useState<AccountWithBalance | null>(null);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [code, setCode] = useState("");
  const [parentCode, setParentCode] = useState("");
  const [level, setLevel] = useState<number>(1);
  const [isPostable, setIsPostable] = useState(true);
  const [type, setType] = useState<string>("asset");
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);

  // Transfer Dialog State
  const [tfDialog, setTfDialog] = useState(false);
  const [fromId, setFromId] = useState<number | null>(null);
  const [toId, setToId] = useState<number | null>(null);
  const [tfAmount, setTfAmount] = useState("");
  const [tfDate, setTfDate] = useState(todayISO());
  const [tfNote, setTfNote] = useState("");

  const allAccountsList = (accounts ?? []) as AccountWithBalance[];

  // Build the complete hierarchical account tree
  const treeRoots = useMemo(() => {
    return buildAccountTree(allAccountsList);
  }, [allAccountsList]);

  // Auto-expand levels 1 & 2 on initial load
  useEffect(() => {
    if (allAccountsList.length > 0 && expandedIds.size === 0) {
      const initialExpanded = new Set<number>();
      allAccountsList.forEach((a) => {
        if (!a.level || a.level <= 2) {
          initialExpanded.add(a.id);
        }
      });
      setExpandedIds(initialExpanded);
    }
  }, [allAccountsList]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<number>();
    allAccountsList.forEach((a) => allIds.add(a.id));
    setExpandedIds(allIds);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const expandToLevel = (lvl: number) => {
    const ids = new Set<number>();
    allAccountsList.forEach((a) => {
      if ((a.level ?? 1) <= lvl) {
        ids.add(a.id);
      }
    });
    setExpandedIds(ids);
  };

  // Filter tree with search & category
  const { filteredTree, searchAutoExpandedIds } = useMemo(() => {
    const autoExpand = new Set<number>();
    const q = searchQuery.toLowerCase().trim();

    const filterRecursive = (node: AccountTreeNode): AccountTreeNode | null => {
      const acc = node.account;
      const matchName = acc.name.toLowerCase().includes(q);
      const matchNameEn = acc.nameEn ? acc.nameEn.toLowerCase().includes(q) : false;
      const matchCode = acc.code ? acc.code.toLowerCase().includes(q) : false;
      const matchType = accountTypeLabel(acc.type).toLowerCase().includes(q);
      const selfMatch = !q || matchName || matchNameEn || matchCode || matchType;

      const filteredChildren: AccountTreeNode[] = [];
      for (const child of node.children) {
        const res = filterRecursive(child);
        if (res) filteredChildren.push(res);
      }

      if (selfMatch || filteredChildren.length > 0) {
        if (filteredChildren.length > 0 && q) {
          autoExpand.add(acc.id);
        }
        return {
          ...node,
          children: filteredChildren,
          hasChildren: filteredChildren.length > 0,
        };
      }
      return null;
    };

    let targetRoots = treeRoots;
    if (selectedCategory !== "all") {
      targetRoots = treeRoots.filter((n) => {
        const c = String(n.account.code || "");
        if (selectedCategory === "asset") return c.startsWith("1") || n.account.type === "asset";
        if (selectedCategory === "liability") return c.startsWith("2") || n.account.type === "liability";
        if (selectedCategory === "equity") return c.startsWith("3") || n.account.type.includes("equity");
        if (selectedCategory === "income") return c.startsWith("4") || n.account.type === "income";
        if (selectedCategory === "expense") return c.startsWith("5") || n.account.type === "expense";
        return true;
      });
    }

    const res: AccountTreeNode[] = [];
    for (const r of targetRoots) {
      const m = filterRecursive(r);
      if (m) res.push(m);
    }
    return { filteredTree: res, searchAutoExpandedIds: autoExpand };
  }, [treeRoots, searchQuery, selectedCategory]);

  // Combined expanded set
  const effectiveExpandedIds = useMemo(() => {
    if (!searchQuery.trim()) return expandedIds;
    const combined = new Set(expandedIds);
    searchAutoExpandedIds.forEach((id) => combined.add(id));
    return combined;
  }, [expandedIds, searchAutoExpandedIds, searchQuery]);

  // Filtered accounts for grid view
  const filteredGridAccounts = useMemo(() => {
    return allAccountsList.filter((a) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchName = a.name.toLowerCase().includes(q);
        const matchNameEn = a.nameEn ? a.nameEn.toLowerCase().includes(q) : false;
        const matchCode = a.code ? a.code.toLowerCase().includes(q) : false;
        const matchType = accountTypeLabel(a.type).toLowerCase().includes(q);
        if (!matchName && !matchNameEn && !matchCode && !matchType) return false;
      }
      if (selectedCategory === "all") return true;
      if (selectedCategory === "asset") return a.code?.startsWith("1") || a.type === "asset";
      if (selectedCategory === "liability") return a.code?.startsWith("2") || a.type === "liability";
      if (selectedCategory === "equity") return a.code?.startsWith("3") || a.type.includes("equity");
      if (selectedCategory === "income") return a.code?.startsWith("4") || a.type === "income";
      if (selectedCategory === "expense") return a.code?.startsWith("5") || a.type === "expense";
      return true;
    });
  }, [allAccountsList, searchQuery, selectedCategory]);

  const invalidate = () => {
    utils.finance.accounts.list.invalidate();
    utils.finance.transfers.list.invalidate();
    utils.finance.dashboard.invalidate();
  };

  const createMut = trpc.finance.accounts.create.useMutation({
    onSuccess: () => { toast.success("تم إنشاء الحساب بنجاح"); invalidate(); setAccDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.finance.accounts.update.useMutation({
    onSuccess: () => { toast.success("تم تحديث الحساب بنجاح"); invalidate(); setAccDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const delMut = trpc.finance.accounts.delete.useMutation({
    onSuccess: () => { toast.success("تم حذف الحساب بنجاح"); invalidate(); setDeleting(null); },
    onError: (e) => toast.error(e.message),
  });
  const tfMut = trpc.finance.transfers.create.useMutation({
    onSuccess: () => {
      toast.success("تم التحويل بنجاح");
      invalidate();
      setTfDialog(false);
      setTfAmount(""); setTfNote("");
    },
    onError: (e) => toast.error(e.message),
  });

  // Open Create Account Modal as Root
  const openCreateRoot = () => {
    setEditing(null);
    setParentAccountForNew(null);
    setName("");
    setNameEn("");
    setCode("");
    setParentCode("");
    setLevel(1);
    setIsPostable(true);
    setType("asset");
    setColor(ACCOUNT_COLORS[0]);
    setAccDialog(true);
  };

  // Open Create Sub-Account Modal under a specific Parent
  const openCreateChild = (parent: AccountWithBalance) => {
    setEditing(null);
    setParentAccountForNew(parent);
    setName("");
    setNameEn("");
    setParentCode(parent.code || "");
    const childLevel = (parent.level || 1) + 1;
    setLevel(childLevel);
    setIsPostable(true);
    setType(parent.type);
    setColor(parent.color || ACCOUNT_COLORS[0]);

    // Smart code generation
    const pCode = String(parent.code || "");
    const siblings = allAccountsList.filter((a) => a.parentCode === pCode || (pCode && a.code?.startsWith(pCode) && a.code !== pCode));
    let suggestedCode = "";
    if (siblings.length > 0) {
      const childCodes = siblings.map((s) => s.code || "").filter(Boolean);
      childCodes.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
      const maxCode = childCodes[0];
      const matchNum = maxCode.match(/(\d+)$/);
      if (matchNum) {
        const nextNum = parseInt(matchNum[1], 10) + 1;
        suggestedCode = maxCode.slice(0, matchNum.index) + String(nextNum).padStart(matchNum[1].length, "0");
      }
    }
    if (!suggestedCode && pCode) {
      if (pCode.length === 1) suggestedCode = `${pCode}1`;
      else suggestedCode = `${pCode}01`;
    }
    setCode(suggestedCode || "");
    setAccDialog(true);
  };

  // Open Edit Account Modal
  const openEdit = (a: AccountWithBalance) => {
    setEditing(a);
    const parent = allAccountsList.find((p) => p.code && p.code === a.parentCode);
    setParentAccountForNew(parent || null);
    setName(a.name);
    setNameEn(a.nameEn || "");
    setCode(a.code || "");
    setParentCode(a.parentCode || "");
    setLevel(a.level || 1);
    setIsPostable(a.isPostable ?? true);
    setType(a.type);
    setColor(a.color);
    setAccDialog(true);
  };

  // Safe delete handler: check if account has children
  const handleRequestDelete = (a: AccountWithBalance) => {
    const hasChildren = allAccountsList.some((c) => c.parentCode === a.code || (a.code && c.code?.startsWith(a.code) && c.code !== a.code));
    if (hasChildren) {
      toast.error("لا يمكن حذف هذا الحساب لأنه يحتوي على حسابات فرعية تحته. يرجى حذف أو نقل الحسابات الفرعية أولاً.");
      return;
    }
    setDeleting(a);
  };

  const accName = (id: number) => allAccountsList.find((a) => a.id === id)?.name ?? "";

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: AccountTreeNode) => {
    const acc = node.account;
    const isExpanded = effectiveExpandedIds.has(acc.id);
    const hasChildren = node.children.length > 0;
    const isRoot = node.depth === 0;

    // Level-specific badge styling
    const levelStyles: Record<number, string> = {
      1: "bg-emerald-600 text-white font-black",
      2: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 font-bold",
      3: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 font-bold",
      4: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 font-semibold",
      5: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 font-medium",
    };

    return (
      <div key={acc.id} className="relative group">
        {/* Row Container */}
        <div
          className={cn(
            "flex items-center justify-between gap-2 py-2 px-2.5 rounded-xl transition-all border",
            isRoot
              ? "bg-slate-50/90 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 shadow-xs my-1.5 hover:bg-slate-100/90"
              : "border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-muted/40 my-0.5",
          )}
          style={{
            paddingRight: `${Math.min(node.depth * 22 + 10, 140)}px`,
          }}
        >
          {/* Right Section: Chevron, Level line, Code, Name */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Expand / Collapse Button */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(acc.id);
                }}
                className={cn(
                  "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border transition-all text-muted-foreground hover:text-foreground",
                  isExpanded
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800"
                    : "bg-muted/60 border-slate-200 dark:border-slate-700",
                )}
                aria-label={isExpanded ? "طي التفرع" : "توسيع التفرع"}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="h-7 w-7 flex items-center justify-center shrink-0 text-muted-foreground/40">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              </div>
            )}

            {/* Account Code Badge */}
            {acc.code && (
              <span
                className={cn(
                  "font-mono text-xs px-2 py-0.5 rounded-md border shrink-0",
                  levelStyles[acc.level || 1] || "bg-muted text-foreground",
                )}
                dir="ltr"
              >
                {acc.code}
              </span>
            )}

            {/* Account Icon */}
            <div
              className={cn(
                "h-6 w-6 rounded-md text-white flex items-center justify-center shrink-0 shadow-2xs text-xs",
                isRoot ? "h-7 w-7 text-sm" : "",
              )}
              style={{ background: acc.color }}
            >
              {hasChildren ? (
                isExpanded ? <FolderOpen className="h-3.5 w-3.5" /> : <Folder className="h-3.5 w-3.5" />
              ) : (
                TYPE_ICONS[acc.type] ?? <FileText className="h-3.5 w-3.5" />
              )}
            </div>

            {/* Account Names & Badges */}
            <div className="min-w-0 flex-1 flex items-baseline gap-2 flex-wrap">
              <span
                onClick={() => openEdit(acc)}
                className={cn(
                  "cursor-pointer hover:text-emerald-600 transition-colors truncate",
                  isRoot ? "text-base font-extrabold text-slate-900 dark:text-slate-100" : "",
                  node.depth === 1 ? "text-sm font-bold text-slate-800 dark:text-slate-200" : "",
                  node.depth >= 2 ? "text-xs font-semibold text-slate-700 dark:text-slate-300" : "",
                )}
              >
                {acc.name}
              </span>

              {acc.nameEn && (
                <span className="text-[11px] text-muted-foreground font-sans truncate hidden sm:inline" dir="ltr">
                  ({acc.nameEn})
                </span>
              )}

              {/* Sub-accounts count badge */}
              {hasChildren && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border font-medium">
                  {node.children.length} {node.children.length === 1 ? "فرع" : "فروع"}
                </span>
              )}

              {/* Postable / Non-postable Badge */}
              {acc.isPostable === false ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 hidden md:inline">
                  رئيسي تجميعي
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 hidden md:inline">
                  حركي
                </span>
              )}
            </div>
          </div>

          {/* Left Section: Balance & Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Balance Display */}
            <div className="text-left font-mono tabular-nums min-w-[90px] sm:min-w-[120px]" dir="ltr">
              <div
                className={cn(
                  "font-bold leading-tight",
                  isRoot ? "text-sm sm:text-base text-emerald-700 dark:text-emerald-400 font-black" : "text-xs sm:text-sm",
                  node.totalBalance < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400",
                )}
              >
                {formatMoney(node.totalBalance)}
              </div>
              {hasChildren && node.directBalance !== 0 && (
                <div className="text-[10px] text-muted-foreground font-sans leading-none mt-0.5" dir="rtl">
                  مباشر: {formatMoney(node.directBalance)}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-0.5">
              {/* Add Child Account Shortcut */}
              <button
                type="button"
                onClick={() => openCreateChild(acc)}
                className="p-1.5 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                title="إضافة حساب فرعي تحته"
                aria-label={`إضافة حساب فرعي تحت ${acc.name}`}
              >
                <PlusCircle className="h-4 w-4" />
              </button>

              {/* Edit Account */}
              <button
                type="button"
                onClick={() => openEdit(acc)}
                className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                title="تعديل الحساب"
                aria-label={`تعديل ${acc.name}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>

              {/* Delete Account */}
              <button
                type="button"
                onClick={() => handleRequestDelete(acc)}
                className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                title="حذف الحساب"
                aria-label={`حذف ${acc.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Branch Children Container */}
        {hasChildren && isExpanded && (
          <div className="relative pr-2 space-y-0.5">
            {/* Vertical Guide Line */}
            <div
              className="absolute top-0 bottom-3 w-px bg-slate-200 dark:bg-slate-800"
              style={{
                right: `${Math.min(node.depth * 22 + 23, 153)}px`,
              }}
            />
            {node.children.map(renderTreeNode)}
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header with Title and Primary Actions */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span>شجرة دليل الحسابات</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                {allAccountsList.length} حساب
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              الهيكل الهرمي المحاسبي المعتمد: الحساب الأب وفروعه مع الأرصدة التجميعية اللحظية
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border">
              <button
                type="button"
                onClick={() => setViewMode("tree")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  viewMode === "tree"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <ListTree className="h-3.5 w-3.5 text-emerald-600" />
                <span>عرض الشجرة</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  viewMode === "grid"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5 text-blue-600" />
                <span>عرض البطاقات</span>
              </button>
            </div>

            <Button variant="outline" onClick={() => setTfDialog(true)} className="gap-1.5 text-xs h-9">
              <ArrowLeftRight className="h-3.5 w-3.5" /> تحويل
            </Button>
            <Button onClick={openCreateRoot} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs h-9">
              <Plus className="h-4 w-4" /> حساب جديد
            </Button>
          </div>
        </div>

        {/* Search, Category Filter, and Expand/Collapse Controls */}
        <div className="bg-card border rounded-2xl p-3.5 space-y-3 shadow-xs">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute right-3.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="ابحث برقم الحساب، اسم الحساب، أو الحرف الأول..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 pl-9 h-10 text-sm bg-background/50 rounded-xl"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-2.5 p-1 text-muted-foreground hover:text-foreground"
                aria-label="مسح البحث"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Categories and Expand Controls Row */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            {/* Category Pills */}
            <div className="flex gap-1.5 overflow-x-auto text-xs no-scrollbar flex-1">
              {[
                { id: "all", label: "الكل", count: allAccountsList.length },
                { id: "asset", label: "1. الأصول", count: allAccountsList.filter((a) => a.code?.startsWith("1") || a.type === "asset").length },
                { id: "liability", label: "2. الالتزامات", count: allAccountsList.filter((a) => a.code?.startsWith("2") || a.type === "liability").length },
                { id: "equity", label: "3. حقوق الملكية", count: allAccountsList.filter((a) => a.code?.startsWith("3") || a.type.includes("equity")).length },
                { id: "income", label: "4. الإيرادات", count: allAccountsList.filter((a) => a.code?.startsWith("4") || a.type === "income").length },
                { id: "expense", label: "5. المصروفات", count: allAccountsList.filter((a) => a.code?.startsWith("5") || a.type === "expense").length },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all border text-xs",
                    selectedCategory === cat.id
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground",
                  )}
                >
                  {cat.label} ({cat.count})
                </button>
              ))}
            </div>

            {/* Tree Level & Expand/Collapse Controls */}
            {viewMode === "tree" && (
              <div className="flex items-center gap-1 shrink-0 text-xs">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-2.5 py-1 rounded-md border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  توسيع الكل
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-2.5 py-1 rounded-md border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  طي الكل
                </button>
                <div className="hidden sm:flex items-center gap-1 border-r pr-1 mr-1">
                  <button
                    type="button"
                    onClick={() => expandToLevel(1)}
                    className="px-2 py-0.5 rounded text-[11px] bg-muted/60 hover:bg-muted text-muted-foreground"
                  >
                    م1
                  </button>
                  <button
                    type="button"
                    onClick={() => expandToLevel(2)}
                    className="px-2 py-0.5 rounded text-[11px] bg-muted/60 hover:bg-muted text-muted-foreground"
                  >
                    م2
                  </button>
                  <button
                    type="button"
                    onClick={() => expandToLevel(3)}
                    className="px-2 py-0.5 rounded text-[11px] bg-muted/60 hover:bg-muted text-muted-foreground"
                  >
                    م3
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Section: Loading / Empty / Tree / Grid */}
        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground py-12">جارٍ تحميل شجرة الحسابات…</p>
        ) : viewMode === "tree" ? (
          filteredTree.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-2xl bg-card">
              <p className="text-muted-foreground font-medium">لم يتم العثور على حساب يطابق بحثك «{searchQuery}»</p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="mt-2 text-emerald-600"
              >
                إعادة تعيين البحث
              </Button>
            </div>
          ) : (
            <div className="bg-card border rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 px-2 border-b">
                <span>تفرع الحساب الأب والحسابات التابعة</span>
                <span>الرصيد التراكمي / إجمالي الفرع</span>
              </div>
              <div className="pt-1">{filteredTree.map(renderTreeNode)}</div>
            </div>
          )
        ) : (
          /* Grid View Mode */
          filteredGridAccounts.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-2xl bg-card">
              <p className="text-muted-foreground font-medium">لم يتم العثور على حساب يطابق بحثك «{searchQuery}»</p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="mt-2 text-emerald-600"
              >
                إعادة تعيين البحث
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredGridAccounts.map((a) => (
                <Card
                  key={a.id}
                  className="overflow-hidden hover:shadow-md transition-all cursor-pointer border-slate-200 group"
                  onClick={() => openEdit(a)}
                >
                  <div className="h-1.5" style={{ background: a.color }} />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="h-10 w-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs"
                          style={{ background: a.color }}
                        >
                          {TYPE_ICONS[a.type] ?? <FileText className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {a.code && (
                              <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold">
                                {a.code}
                              </span>
                            )}
                            <div className="font-bold text-sm truncate group-hover:text-emerald-600 transition-colors">
                              {a.name}
                            </div>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {a.nameEn ? `${a.nameEn} · ` : ""}
                            {accountTypeLabel(a.type)}
                            {a.level ? ` (م${a.level})` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 -mr-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="p-2 text-muted-foreground hover:text-emerald-600 min-h-[44px]"
                          onClick={() => openEdit(a)}
                          aria-label="تعديل"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-muted-foreground hover:text-rose-600 min-h-[44px]"
                          onClick={() => handleRequestDelete(a)}
                          aria-label="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-slate-100">
                      <span className="text-[11px] text-muted-foreground">الرصيد الحالي:</span>
                      <div
                        className={cn("text-lg font-bold tabular-nums font-mono", a.balance < 0 ? "text-rose-600" : "text-emerald-700")}
                        dir="ltr"
                      >
                        {formatMoney(a.balance)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}

        {/* Transfers Section */}
        <h2 className="font-bold text-lg pt-2">التحويلات بين الحسابات</h2>
        <Card>
          <CardContent className="p-2">
            {!transfers || transfers.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">لا توجد تحويلات بعد.</p>
            ) : (
              transfers.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-accent">
                  <div className="h-9 w-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      من {accName(t.fromAccountId)} إلى {accName(t.toAccountId)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.note ? `${t.note} · ` : ""}
                      {String(t.date)}
                    </div>
                  </div>
                  <div className="text-sm font-bold tabular-nums font-mono" dir="ltr">
                    {formatMoney(t.amount)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Create / Edit Dialog */}
      <Dialog open={accDialog} onOpenChange={setAccDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? `تعديل الحساب «${editing.name}»`
                : parentAccountForNew
                ? `إضافة حساب فرعي تحت [${parentAccountForNew.code}]`
                : "إضافة حساب رئيسي جديد"}
            </DialogTitle>
          </DialogHeader>

          {/* Parent Account Info Banner */}
          {parentAccountForNew && !editing && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs">
              <span className="text-emerald-800 dark:text-emerald-300 font-bold block mb-1">
                الحساب الأب المباشر:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border text-slate-800 dark:text-slate-200">
                  {parentAccountForNew.code}
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {parentAccountForNew.name}
                </span>
                <span className="text-muted-foreground">
                  (مستوى {parentAccountForNew.level || 1})
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {/* Arabic Name */}
            <div className="space-y-1">
              <Label>اسم الحساب بالعربية <span className="text-rose-500">*</span></Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: صندوق فرع الرياض، بنك الراجحي جاري..."
                className="h-10 text-sm"
              />
            </div>

            {/* English Name */}
            <div className="space-y-1">
              <Label>اسم الحساب بالإنجليزية (اختياري)</Label>
              <Input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Riyadh Branch Cash, Al-Rajhi Bank..."
                className="h-10 text-sm font-sans"
                dir="ltr"
              />
            </div>

            {/* Code & Parent Code Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>رقم / كود الحساب <span className="text-rose-500">*</span></Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="مثال: 11010101"
                  className="h-10 font-mono text-sm"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <Label>كود الحساب الأب</Label>
                <Input
                  value={parentCode}
                  onChange={(e) => setParentCode(e.target.value)}
                  placeholder="مثال: 110101"
                  className="h-10 font-mono text-sm"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Level & Type Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>المستوى في الشجرة</Label>
                <Select value={String(level)} onValueChange={(v) => setLevel(Number(v))}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">مستوى 1 (رئيسي أولي)</SelectItem>
                    <SelectItem value="2">مستوى 2 (مجموعة فرعية)</SelectItem>
                    <SelectItem value="3">مستوى 3 (حساب وسيط)</SelectItem>
                    <SelectItem value="4">مستوى 4 (حساب تفصيلي)</SelectItem>
                    <SelectItem value="5">مستوى 5 (حساب حركي فرعي)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>التصنيف المالي</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Postable / Non-Postable Toggle */}
            <div className="p-3 rounded-xl border bg-muted/30 flex items-center justify-between">
              <div>
                <div className="font-semibold text-xs">قابلية القيد المالي</div>
                <div className="text-[11px] text-muted-foreground">
                  {isPostable ? "حساب حركي يقبل تسجيل العمليات والقيود عليه" : "حساب تجميعي للإجماليات فقط لا يقبل قيود مباشرة"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPostable(!isPostable)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold border transition-colors",
                  isPostable
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200",
                )}
              >
                {isPostable ? "حركي (يقبل القيد)" : "رئيسي تجميعي"}
              </button>
            </div>

            {/* Color Palette */}
            <div className="space-y-1">
              <Label>لون الترميز</Label>
              <div className="flex flex-wrap gap-1.5">
                {ACCOUNT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-transform",
                      color === c ? "border-foreground scale-110 shadow-xs" : "border-transparent",
                    )}
                    style={{ background: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            {/* Save Button */}
            <Button
              className="h-11 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              disabled={createMut.isPending || updateMut.isPending}
              onClick={() => {
                if (!name.trim()) return toast.error("أدخل اسم الحساب");
                if (!code.trim()) return toast.error("أدخل رقم / كود الحساب");

                if (editing) {
                  updateMut.mutate({
                    id: editing.id,
                    name: name.trim(),
                    nameEn: nameEn.trim() || undefined,
                    code: code.trim(),
                    parentCode: parentCode.trim() || undefined,
                    level,
                    isPostable,
                    type: type as any,
                    color,
                  });
                } else {
                  createMut.mutate({
                    name: name.trim(),
                    nameEn: nameEn.trim() || undefined,
                    code: code.trim(),
                    parentCode: parentCode.trim() || undefined,
                    level,
                    isPostable,
                    type: type as any,
                    color,
                  });
                }
              }}
            >
              حفظ الحساب
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={tfDialog} onOpenChange={setTfDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تحويل بين الحسابات</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>من حساب</Label>
            <Select value={fromId ? String(fromId) : undefined} onValueChange={(v) => setFromId(Number(v))}>
              <SelectTrigger className="h-11"><SelectValue placeholder="اختر الحساب" /></SelectTrigger>
              <SelectContent>
                {allAccountsList.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.code ? `[${a.code}] ` : ""}{a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>إلى حساب</Label>
            <Select value={toId ? String(toId) : undefined} onValueChange={(v) => setToId(Number(v))}>
              <SelectTrigger className="h-11"><SelectValue placeholder="اختر الحساب" /></SelectTrigger>
              <SelectContent>
                {allAccountsList.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.code ? `[${a.code}] ` : ""}{a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>المبلغ</Label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                dir="ltr"
                className="h-11 font-mono"
                value={tfAmount}
                onChange={(e) => setTfAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>التاريخ</Label>
              <Input
                type="date"
                className="h-11"
                value={tfDate}
                onChange={(e) => setTfDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>ملاحظة (اختياري)</Label>
            <Input value={tfNote} onChange={(e) => setTfNote(e.target.value)} className="h-11" />
          </div>
          <Button
            className="h-12 w-full bg-emerald-600 hover:bg-emerald-700 font-bold"
            disabled={tfMut.isPending}
            onClick={() => {
              const amt = parseFloat(tfAmount);
              if (!fromId || !toId) return toast.error("اختر الحسابين");
              if (!amt || amt <= 0) return toast.error("أدخل مبلغاً صحيحاً");
              tfMut.mutate({
                fromAccountId: fromId,
                toAccountId: toId,
                amount: amt,
                date: tfDate,
                note: tfNote || undefined,
              });
            }}
          >
            تنفيذ التحويل
          </Button>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الحساب «{deleting?.name}»؟</AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن حذف حساب مرتبط بحركات أو قيود محاسبية أو سندات. هل ترغب في المتابعة؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && delMut.mutate({ id: deleting.id })}
              className="bg-rose-600 hover:bg-rose-700"
            >
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
