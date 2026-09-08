import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar, LocaleConfig } from "react-native-calendars";
import type { DateData } from "react-native-calendars/src/types";
import { KeyboardAwareScrollView, KeyboardAvoidingView } from "react-native-keyboard-controller";

import { cancelDailyReminder, ensureReminderPermission, scheduleDailyReminder } from "@/src/notifications";

import { makeStyles, useTheme } from "@/src/theme";
import {
  AppData,
  Buyer,
  EGG_PRICE,
  Expense,
  Production,
  Sale,
  emptyData,
  formatDate,
  formatRupiah,
  loadData,
  monthKey,
  saveData,
  todayKey,
  uid,
} from "@/src/storage";

LocaleConfig.locales.id = {
  monthNames: ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
  monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
  dayNames: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
  dayNamesShort: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
  today: "Hari ini",
};
LocaleConfig.defaultLocale = "id";

type Tab = "home" | "sales" | "production" | "expenses";
type ModalKind = "sale" | "expense" | "production" | "buyer" | "flock" | "report" | null;

const useStyles = makeStyles((colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  eyebrow: { color: colors.brandPrimary, fontSize: 12, fontWeight: "700", letterSpacing: 1.1, textTransform: "uppercase" },
  title: { color: colors.onSurface, fontSize: 30, lineHeight: 36, fontWeight: "700", fontFamily: Platform.select({ ios: "Georgia", default: "serif" }) },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 5 },
  headerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 26, marginBottom: 12 },
  sectionTitle: { color: colors.onSurface, fontSize: 20, fontWeight: "700" },
  link: { color: colors.brandPrimary, fontSize: 13, fontWeight: "700" },
  heroCard: { backgroundColor: colors.brandPrimary, borderRadius: 20, padding: 20, marginBottom: 18 },
  heroLabel: { color: colors.brandTertiary, fontSize: 13, fontWeight: "700" },
  heroValue: { color: colors.onBrandPrimary, fontSize: 30, fontWeight: "700", marginTop: 8 },
  heroCaption: { color: colors.brandTertiary, fontSize: 13, marginTop: 3 },
  statRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, backgroundColor: colors.surfaceSecondary, borderRadius: 14, padding: 14, minHeight: 94 },
  statLabel: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  statValue: { color: colors.onSurface, fontSize: 17, fontWeight: "700", marginTop: 10 },
  positive: { color: colors.success },
  negative: { color: colors.error },
  quickRow: { flexDirection: "row", gap: 10 },
  quickButton: { flex: 1, minHeight: 78, borderRadius: 14, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, padding: 12, justifyContent: "space-between" },
  quickText: { color: colors.onSurface, fontSize: 12, fontWeight: "700", marginTop: 8 },
  listCard: { backgroundColor: colors.surfaceSecondary, borderRadius: 14, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: "row", alignItems: "center" },
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemTitle: { color: colors.onSurface, fontSize: 15, fontWeight: "700" },
  itemMeta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  amount: { color: colors.brandPrimary, fontSize: 15, fontWeight: "700" },
  empty: { paddingVertical: 26, alignItems: "center" },
  emptyText: { color: colors.muted, fontSize: 14, textAlign: "center", marginTop: 10 },
  primaryButton: { minHeight: 48, borderRadius: 14, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, flexDirection: "row", gap: 8 },
  primaryButtonText: { color: colors.onBrandPrimary, fontWeight: "700", fontSize: 14 },
  outlineButton: { minHeight: 46, borderRadius: 13, borderWidth: 1, borderColor: colors.brandPrimary, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, flexDirection: "row", gap: 8 },
  outlineText: { color: colors.brandPrimary, fontWeight: "700", fontSize: 14 },
  pressed: { opacity: 0.72 },
  filterInput: { backgroundColor: colors.surfaceTertiary, borderRadius: 12, paddingHorizontal: 14, height: 46, color: colors.onSurface, fontSize: 14, marginBottom: 10 },
  searchBox: { minHeight: 48, flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceTertiary, borderRadius: 13, paddingHorizontal: 13, marginBottom: 8 },
  searchInput: { flex: 1, color: colors.onSurface, fontSize: 15, paddingHorizontal: 9, minHeight: 46 },
  searchResults: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: 13, overflow: "hidden", marginBottom: 12 },
  searchResultRow: { minHeight: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, borderBottomWidth: 1, borderBottomColor: colors.divider },
  searchResultContent: { flex: 1, marginLeft: 10 },
  searchResultTitle: { color: colors.onSurface, fontSize: 14, fontWeight: "700" },
  searchResultMeta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  searchEmpty: { color: colors.muted, fontSize: 13, padding: 14 },
  chipScroll: { marginBottom: 14 },
  chip: { minHeight: 38, borderRadius: 19, paddingHorizontal: 15, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center", marginRight: 8 },
  chipSelected: { backgroundColor: colors.brandPrimary },
  chipText: { color: colors.onSurfaceTertiary, fontSize: 13, fontWeight: "700" },
  chipTextSelected: { color: colors.onBrandPrimary },
  fab: { position: "absolute", right: 20, bottom: 20, height: 52, borderRadius: 26, backgroundColor: colors.brandPrimary, paddingHorizontal: 18, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  fabText: { color: colors.onBrandPrimary, fontSize: 14, fontWeight: "700" },
  tabBar: { borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.surface, flexDirection: "row", paddingTop: 8 },
  tabItem: { flex: 1, minHeight: 58, alignItems: "center", gap: 4 },
  tabText: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  tabTextActive: { color: colors.brandPrimary },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(28,27,26,0.4)", justifyContent: "flex-end" },
  sheet: { maxHeight: "92%", backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12 },
  handle: { alignSelf: "center", width: 42, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, marginBottom: 18 },
  sheetTitle: { color: colors.onSurface, fontSize: 24, fontWeight: "700", marginBottom: 18 },
  fieldLabel: { color: colors.onSurfaceSecondary, fontSize: 13, fontWeight: "700", marginBottom: 7, marginTop: 10 },
  field: { minHeight: 46, borderRadius: 11, backgroundColor: colors.surfaceTertiary, paddingHorizontal: 13, color: colors.onSurface, fontSize: 15 },
  fieldMulti: { minHeight: 72, paddingTop: 13, textAlignVertical: "top" },
  pickerField: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pickerText: { color: colors.onSurface, fontSize: 15, fontWeight: "600" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.surfaceTertiary, borderRadius: 10, padding: 12, marginTop: 16, borderWidth: 1, borderColor: colors.error },
  errorText: { color: colors.error, fontSize: 13, fontWeight: "600", flex: 1 },
  sheetActions: { flexDirection: "row", gap: 10, marginTop: 24, marginBottom: 20 },
  halfButton: { flex: 1 },
  buyerOption: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 11, marginRight: 8, minWidth: 112 },
  buyerOptionSelected: { backgroundColor: colors.brandTertiary, borderColor: colors.brandPrimary },
  buyerName: { color: colors.onSurface, fontSize: 13, fontWeight: "700" },
  reportCard: { backgroundColor: colors.surfaceSecondary, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  bigReportValue: { color: colors.onSurface, fontSize: 25, fontWeight: "700", marginTop: 5 },
  reportTab: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  reportTabActive: { borderBottomColor: colors.brandPrimary },
  reportTabText: { color: colors.muted, fontWeight: "700", fontSize: 14 },
  reportTabTextActive: { color: colors.brandPrimary },
  categoryLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
}));

function Icon({ name, size = 20, color }: { name: keyof typeof Ionicons.glyphMap; size?: number; color: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

function Header({ title, subtitle, onReport }: { title: string; subtitle: string; onReport?: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <View style={styles.header}>
    <View><Text style={styles.eyebrow}>TELORKU</Text><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text></View>
    {onReport ? <Pressable testID="open-report-button" accessibilityLabel="Buka laporan" onPress={onReport} style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}><Icon name="document-text-outline" color={colors.brandPrimary} /></Pressable> : null}
  </View>;
}

function EmptyState({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <View style={styles.empty}><Icon name={icon} size={30} color={colors.brandSecondary} /><Text style={styles.emptyText}>{text}</Text></View>;
}

function FormSheet({ mode, visible, onClose, data, initialSale, initialExpense, initialProduction, initialBuyer, onSave }: {
  mode: Exclude<ModalKind, null | "report" | "flock">; visible: boolean; onClose: () => void; data: AppData;
  initialSale?: Sale | null; initialExpense?: Expense | null; initialProduction?: Production | null; initialBuyer?: Buyer | null;
  onSave: (value: Sale | Expense | Production | Buyer, mode: Exclude<ModalKind, null | "report" | "flock">) => void | Promise<void>;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [date, setDate] = useState(todayKey());
  const [name, setName] = useState("");
  const [buyerId, setBuyerId] = useState("");
  const [buyerSearch, setBuyerSearch] = useState("");
  const [eggs, setEggs] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("Pakan");
  const [newCategory, setNewCategory] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [cost, setCost] = useState("");
  const [pickingDate, setPickingDate] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setDate(initialSale?.date ?? initialExpense?.date ?? initialProduction?.date ?? todayKey());
    setName(initialBuyer?.name ?? initialSale?.buyerName ?? ""); setBuyerId(initialSale?.buyerId ?? ""); setBuyerSearch(initialSale?.buyerName ?? ""); setEggs(initialSale ? String(initialSale.eggs) : initialProduction ? String(initialProduction.eggsCollected) : "");
    setPhone(initialBuyer?.phone ?? ""); setAddress(initialBuyer?.address ?? ""); setCategory(initialExpense?.category ?? data.categories[0]); setItemName(initialExpense?.itemName ?? ""); setItemSearch(initialExpense?.itemName ?? ""); setQuantity(initialExpense?.quantity ?? ""); setUnit(initialExpense?.unit ?? "kg"); setCost(initialExpense ? String(initialExpense.totalCost) : ""); setNewCategory(""); setPickingDate(false); setError("");
  }, [visible, initialSale, initialExpense, initialProduction, initialBuyer, data.categories, data.activeChickens]);

  const title = mode === "sale" ? (initialSale ? "Edit Penjualan" : "Catat Penjualan") : mode === "expense" ? (initialExpense ? "Edit Biaya" : "Tambah Biaya") : mode === "production" ? "Koleksi Telur" : (initialBuyer ? "Edit Pembeli" : "Tambah Pembeli");
  const buyerOptions = useMemo(() => data.buyers.filter((buyer) => buyer.name.toLowerCase().includes(buyerSearch.toLowerCase())), [data.buyers, buyerSearch]);
  const itemOptions = useMemo(() => { const selectedCategory = newCategory.trim() || category; const seen = new Set<string>(); return data.expenses.filter((expense) => expense.category === selectedCategory && expense.itemName.toLowerCase().includes(itemSearch.toLowerCase())).map((expense) => expense.itemName).filter((item) => { if (seen.has(item.toLowerCase())) return false; seen.add(item.toLowerCase()); return true; }).slice(0, 8); }, [data.expenses, category, newCategory, itemSearch]);
  const submit = async () => {
    setError("");
    if (!date) return setError("Masukkan tanggal terlebih dahulu.");
    if (mode === "sale") {
      const qty = Number(eggs); if (!name.trim() || !qty || qty < 1) return setError("Isi nama pembeli dan jumlah telur.");
      await onSave({ id: initialSale?.id ?? uid(), date, buyerId: buyerId || undefined, buyerName: name.trim(), eggs: qty, total: qty * EGG_PRICE }, mode);
    } else if (mode === "expense") {
      const totalCost = Number(cost); if (!itemName.trim() || !totalCost || totalCost < 1) return setError("Isi nama item dan total biaya.");
      await onSave({ id: initialExpense?.id ?? uid(), date, category: newCategory.trim() || category, itemName: itemName.trim(), quantity: quantity || "-", unit: unit || "-", totalCost }, mode);
    } else if (mode === "production") {
      const collected = Number(eggs); const flock = data.activeChickens; if (!collected || collected < 0) return setError("Isi jumlah telur terkumpul."); if (!flock || flock < 1) return setError("Atur dulu jumlah ayam aktif bertelur lewat tombol 'Atur ayam aktif bertelur'.");
      await onSave({ id: initialProduction?.id ?? uid(), date, eggsCollected: collected, activeChickens: flock }, mode);
    } else {
      if (!name.trim()) return setError("Isi nama pembeli.");
      await onSave({ id: initialBuyer?.id ?? uid(), name: name.trim(), phone: phone.trim(), address: address.trim() }, mode);
    }
    onClose();
  };
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
    <View style={styles.modalBackdrop}>
      <View style={styles.sheet}><View style={styles.handle} /><KeyboardAwareScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" bottomOffset={24}><Text style={styles.sheetTitle}>{title}</Text>
        {mode !== "buyer" ? <><Text style={styles.fieldLabel}>Tanggal</Text><Pressable testID="form-date-field" onPress={() => setPickingDate(!pickingDate)} style={({ pressed }) => [styles.field, styles.pickerField, pressed && styles.pressed]}><Text style={styles.pickerText}>{formatDate(date)}</Text><Icon name="calendar-outline" size={18} color={colors.brandPrimary} /></Pressable>{pickingDate ? <InlineCalendar value={date} onSelect={(picked) => { setDate(picked); setPickingDate(false); }} onClose={() => setPickingDate(false)} /> : null}</> : null}
        {mode === "sale" ? <>
          <Text style={styles.fieldLabel}>Cari pembeli tersimpan</Text><View style={styles.searchBox}><Icon name="search-outline" size={19} color={colors.muted} /><TextInput testID="buyer-search" value={buyerSearch} onChangeText={setBuyerSearch} placeholder="Ketik nama pembeli..." placeholderTextColor={colors.muted} style={styles.searchInput} /><Pressable testID="clear-buyer-search" onPress={() => setBuyerSearch("")} hitSlop={8}><Icon name="close-circle" size={18} color={colors.muted} /></Pressable></View>{buyerSearch.trim() ? <View style={styles.searchResults}>{buyerOptions.length ? buyerOptions.slice(0, 6).map((buyer) => <Pressable key={buyer.id} onPress={() => { setBuyerId(buyer.id); setName(buyer.name); setBuyerSearch(buyer.name); }} style={({ pressed }) => [styles.searchResultRow, pressed && styles.pressed]}><Icon name="person-circle-outline" size={27} color={colors.brandPrimary} /><View style={styles.searchResultContent}><Text style={styles.searchResultTitle}>{buyer.name}</Text><Text style={styles.searchResultMeta}>{buyer.phone || "Pembeli tersimpan"}</Text></View><Icon name="arrow-forward" size={17} color={colors.muted} /></Pressable>) : <Text style={styles.searchEmpty}>Tidak ada pembeli yang cocok.</Text>}</View> : null}<Pressable onPress={() => { setBuyerId(""); setName(""); setBuyerSearch(""); }} style={styles.buyerOption}><Text style={styles.buyerName}>+ Pembeli baru</Text></Pressable>
          <Text style={styles.fieldLabel}>Nama pembeli</Text><TextInput value={name} onChangeText={(value) => { setName(value); setBuyerId(""); }} placeholder="Contoh: Bu Sari" placeholderTextColor={colors.muted} style={styles.field} />
          <Text style={styles.fieldLabel}>Jumlah telur</Text><TextInput value={eggs} onChangeText={setEggs} placeholder="0" keyboardType="numeric" placeholderTextColor={colors.muted} style={styles.field} />
          <View style={styles.between}><Text style={styles.fieldLabel}>Total otomatis</Text><Text style={[styles.amount, { marginTop: 10 }]}>{formatRupiah((Number(eggs) || 0) * EGG_PRICE)}</Text></View>
        </> : null}
        {mode === "expense" ? <>
          <Text style={styles.fieldLabel}>Kategori</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>{data.categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipSelected]}><Text style={[styles.chipText, category === item && styles.chipTextSelected]}>{item}</Text></Pressable>)}</ScrollView>
          <TextInput testID="expense-custom-category" value={newCategory} onChangeText={setNewCategory} placeholder="Atau ketik kategori baru" placeholderTextColor={colors.muted} style={styles.field} />
          <Text style={styles.fieldLabel}>Cari jenis item dalam kategori</Text><View style={styles.searchBox}><Icon name="search-outline" size={19} color={colors.muted} /><TextInput testID="expense-item-search" value={itemSearch} onChangeText={(value) => { setItemSearch(value); setItemName(value); }} placeholder={`Cari item ${category.toLowerCase()}...`} placeholderTextColor={colors.muted} style={styles.searchInput} /><Pressable testID="clear-item-search" onPress={() => { setItemSearch(""); setItemName(""); }} hitSlop={8}><Icon name="close-circle" size={18} color={colors.muted} /></Pressable></View>{itemSearch.trim() ? <View style={styles.searchResults}>{itemOptions.length ? itemOptions.map((item) => <Pressable key={item} onPress={() => { setItemName(item); setItemSearch(item); }} style={({ pressed }) => [styles.searchResultRow, pressed && styles.pressed]}><Icon name="leaf-outline" size={24} color={colors.brandPrimary} /><View style={styles.searchResultContent}><Text style={styles.searchResultTitle}>{item}</Text><Text style={styles.searchResultMeta}>Item tersimpan di kategori {category}</Text></View><Icon name="arrow-forward" size={17} color={colors.muted} /></Pressable>) : <Text style={styles.searchEmpty}>Belum ada item yang cocok di kategori ini.</Text>}</View> : null}
          <Text style={styles.fieldLabel}>Nama item</Text><TextInput testID="expense-item" value={itemName} onChangeText={(value) => { setItemName(value); setItemSearch(value); }} placeholder="Contoh: Jagung" placeholderTextColor={colors.muted} style={styles.field} />
          <View style={styles.statRow}><View style={{ flex: 1 }}><Text style={styles.fieldLabel}>Jumlah</Text><TextInput testID="expense-quantity" value={quantity} onChangeText={setQuantity} placeholder="10" placeholderTextColor={colors.muted} style={styles.field} /></View><View style={{ flex: 1 }}><Text style={styles.fieldLabel}>Satuan</Text><TextInput testID="expense-unit" value={unit} onChangeText={setUnit} placeholder="kg" placeholderTextColor={colors.muted} style={styles.field} /></View></View>
          <Text style={styles.fieldLabel}>Total biaya (Rp)</Text><TextInput testID="expense-cost" value={cost} onChangeText={setCost} placeholder="0" keyboardType="numeric" placeholderTextColor={colors.muted} style={styles.field} />
        </> : null}
        {mode === "production" ? <><View style={styles.reportCard}><Text style={styles.itemMeta}>Ayam aktif bertelur saat ini</Text><Text style={styles.bigReportValue}>{data.activeChickens || 0} ekor</Text><Text style={styles.itemMeta}>Jumlah ini diatur terpisah dari koleksi telur.</Text></View><Text style={styles.fieldLabel}>Telur terkumpul hari ini</Text><TextInput value={eggs} onChangeText={setEggs} placeholder="Contoh: 9" keyboardType="numeric" placeholderTextColor={colors.muted} style={styles.field} /></> : null}
        {mode === "buyer" ? <><Text style={styles.fieldLabel}>Nama pembeli</Text><TextInput value={name} onChangeText={setName} placeholder="Contoh: Bu Sari" placeholderTextColor={colors.muted} style={styles.field} /><Text style={styles.fieldLabel}>Nomor telepon (opsional)</Text><TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="08..." placeholderTextColor={colors.muted} style={styles.field} /><Text style={styles.fieldLabel}>Alamat (opsional)</Text><TextInput value={address} onChangeText={setAddress} placeholder="Alamat pembeli" placeholderTextColor={colors.muted} multiline style={[styles.field, styles.fieldMulti]} /></> : null}
        {error ? <View style={styles.errorBox} testID="form-error"><Icon name="alert-circle-outline" size={18} color={colors.error} /><Text style={styles.errorText}>{error}</Text></View> : null}
        <View style={styles.sheetActions}><Pressable onPress={onClose} style={({ pressed }) => [styles.outlineButton, styles.halfButton, pressed && styles.pressed]}><Text style={styles.outlineText}>Batal</Text></Pressable><Pressable testID={`save-${mode}`} onPress={submit} style={({ pressed }) => [styles.primaryButton, styles.halfButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>Simpan</Text></Pressable></View>
      </KeyboardAwareScrollView></View>
    </View>
  </Modal>;
}

function FlockSheet({ visible, current, onClose, onSave }: { visible: boolean; current: number; onClose: () => void; onSave: (value: number) => void }) {
  const styles = useStyles(); const { colors } = useTheme(); const [value, setValue] = useState(""); const [error, setError] = useState("");
  useEffect(() => { if (visible) { setValue(current ? String(current) : ""); setError(""); } }, [visible, current]);
  const submit = () => { const flock = Number(value); if (!flock || flock < 1) return setError("Masukkan minimal 1 ayam yang sudah bertelur."); onSave(flock); onClose(); };
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}><KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === "ios" ? "padding" : "height"}><View style={styles.sheet}><View style={styles.handle} /><Text style={styles.sheetTitle}>Atur Ayam Bertelur</Text><Text style={styles.subtitle}>Pisahkan ayam dewasa yang sudah bertelur dari ayam yang masih tumbuh.</Text><Text style={styles.fieldLabel}>Jumlah ayam aktif bertelur</Text><TextInput autoFocus value={value} onChangeText={setValue} placeholder="Contoh: 12" keyboardType="numeric" placeholderTextColor={colors.muted} style={styles.field} />{error ? <View style={styles.errorBox} testID="flock-error"><Icon name="alert-circle-outline" size={18} color={colors.error} /><Text style={styles.errorText}>{error}</Text></View> : null}<View style={styles.sheetActions}><Pressable onPress={onClose} style={({ pressed }) => [styles.outlineButton, styles.halfButton, pressed && styles.pressed]}><Text style={styles.outlineText}>Batal</Text></Pressable><Pressable onPress={submit} style={({ pressed }) => [styles.primaryButton, styles.halfButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>Simpan</Text></Pressable></View></View></KeyboardAvoidingView></Modal>;
}

function InlineCalendar({ value, onSelect, onClose }: { value: string; onSelect: (date: string) => void; onClose: () => void }) {
  const styles = useStyles(); const { colors } = useTheme();
  return <View style={[styles.reportCard, { marginTop: 12, padding: 8 }]} testID="date-picker-card"><Calendar current={value} onDayPress={(day: DateData) => onSelect(day.dateString)} markedDates={{ [value]: { selected: true, selectedColor: colors.brandPrimary } }} firstDay={1} theme={{ calendarBackground: colors.surfaceSecondary, dayTextColor: colors.onSurface, monthTextColor: colors.onSurface, textDisabledColor: colors.muted, arrowColor: colors.brandPrimary, todayTextColor: colors.brandPrimary, selectedDayBackgroundColor: colors.brandPrimary, selectedDayTextColor: colors.onBrandPrimary }} /><Pressable testID="date-picker-close" onPress={onClose} style={{ alignSelf: "center", minHeight: 44, justifyContent: "center" }}><Text style={styles.link}>Tutup kalender</Text></Pressable></View>;
}

function ReportSheet({ visible, onClose, data, month, setMonth, onAddBuyer, onEditBuyer, onDeleteBuyer }: { visible: boolean; onClose: () => void; data: AppData; month: string; setMonth: (value: string) => void; onAddBuyer: () => void; onEditBuyer: (buyer: Buyer) => void; onDeleteBuyer: (buyer: Buyer) => void }) {
  const styles = useStyles(); const { colors } = useTheme(); const [section, setSection] = useState<"report" | "buyers">("report");
  const [period, setPeriod] = useState<"month" | "year" | "range">("month"); const [year, setYear] = useState(month.slice(0, 4)); const [rangeStart, setRangeStart] = useState(`${month}-01`); const [rangeEnd, setRangeEnd] = useState(todayKey());
  const rangeReady = rangeStart.length === 10 && rangeEnd.length === 10 && rangeStart <= rangeEnd;
  const inPeriod = (date: string) => period === "month" ? date.startsWith(month) : period === "year" ? date.startsWith(year) : rangeReady && date >= rangeStart && date <= rangeEnd;
  const sales = data.sales.filter((item) => inPeriod(item.date)); const expenses = data.expenses.filter((item) => inPeriod(item.date)); const revenue = sales.reduce((sum, item) => sum + item.total, 0); const costs = expenses.reduce((sum, item) => sum + item.totalCost, 0); const eggsSold = sales.reduce((sum, item) => sum + item.eggs, 0); const byCategory = expenses.reduce<Record<string, number>>((acc, item) => { acc[item.category] = (acc[item.category] || 0) + item.totalCost; return acc; }, {}); const periodLabel = period === "month" ? new Date(`${month}-01T12:00:00`).toLocaleDateString("id-ID", { month: "long", year: "numeric" }) : period === "year" ? `Tahun ${year}` : rangeReady ? `${formatDate(rangeStart)} – ${formatDate(rangeEnd)}` : "Rentang tanggal";
  const [picking, setPicking] = useState<null | "month" | "start" | "end">(null);
  const chart = useMemo(() => {
    const summarize = (key: string, byDay: boolean) => { const daySales = data.sales.filter((item) => byDay ? item.date === key : item.date.startsWith(key)); const dayCosts = data.expenses.filter((item) => byDay ? item.date === key : item.date.startsWith(key)).reduce((sum, item) => sum + item.totalCost, 0); return { revenue: daySales.reduce((sum, item) => sum + item.total, 0), costs: dayCosts, eggs: daySales.reduce((sum, item) => sum + item.eggs, 0) }; };
    if (period === "year" && year.length === 4) return { title: "Grafik per bulan", unit: "Bulan", rows: Array.from({ length: 12 }, (_, index) => { const key = `${year}-${String(index + 1).padStart(2, "0")}`; return { key, label: new Date(`${key}-01T12:00:00`).toLocaleDateString("id-ID", { month: "long" }), ...summarize(key, false) }; }) };
    if (period === "range" && rangeReady) {
      const dayCount = Math.round((new Date(`${rangeEnd}T12:00:00`).getTime() - new Date(`${rangeStart}T12:00:00`).getTime()) / 86400000) + 1;
      if (dayCount <= 31) { const rows: { key: string; label: string; revenue: number; costs: number; eggs: number }[] = []; const cursor = new Date(`${rangeStart}T12:00:00`); for (let index = 0; index < dayCount; index++) { const key = todayKey(cursor); rows.push({ key, label: cursor.toLocaleDateString("id-ID", { day: "numeric", month: "short" }), ...summarize(key, true) }); cursor.setDate(cursor.getDate() + 1); } return { title: "Grafik per hari", unit: "Tanggal", rows }; }
      const rows: { key: string; label: string; revenue: number; costs: number; eggs: number }[] = []; const endMonth = rangeEnd.slice(0, 7); const cursor = new Date(`${rangeStart.slice(0, 7)}-01T12:00:00`); while (todayKey(cursor).slice(0, 7) <= endMonth) { const key = todayKey(cursor).slice(0, 7); rows.push({ key, label: cursor.toLocaleDateString("id-ID", { month: "short", year: "numeric" }), ...summarize(key, false) }); cursor.setMonth(cursor.getMonth() + 1); } return { title: "Grafik per bulan", unit: "Bulan", rows };
    }
    return { title: "", unit: "", rows: [] as { key: string; label: string; revenue: number; costs: number; eggs: number }[] };
  }, [period, year, rangeReady, rangeStart, rangeEnd, data.sales, data.expenses]);
  const maxChart = chart.rows.reduce((max, item) => Math.max(max, item.revenue, item.costs), 1);
  const exportPdf = async () => { try { const rows = Object.entries(byCategory).map(([key, value]) => `<tr><td>${key}</td><td>Rp ${value.toLocaleString("id-ID")}</td></tr>`).join(""); const detailRows = chart.rows.filter((item) => item.revenue || item.costs || item.eggs).map((item) => `<tr><td>${item.label}</td><td>${item.eggs}</td><td>Rp ${item.revenue.toLocaleString("id-ID")}</td><td>Rp ${item.costs.toLocaleString("id-ID")}</td><td>Rp ${(item.revenue - item.costs).toLocaleString("id-ID")}</td></tr>`).join(""); const monthTable = chart.rows.length ? `<h3>Rincian ${chart.unit === "Tanggal" ? "per hari" : "per bulan"}</h3><table border="1" cellspacing="0" cellpadding="6"><tr><th>${chart.unit}</th><th>Telur</th><th>Pendapatan</th><th>Biaya</th><th>Bersih</th></tr>${detailRows}</table>` : ""; const html = `<html><body style="font-family:Arial;padding:28px;color:#2C2A29"><h1>TelorKu</h1><h2>Laporan ${periodLabel}</h2><p>Total telur terjual: <b>${eggsSold} butir</b></p><p>Pendapatan: <b>Rp ${revenue.toLocaleString("id-ID")}</b></p><p>Total biaya: <b>Rp ${costs.toLocaleString("id-ID")}</b></p><p>Laba bersih: <b>Rp ${(revenue - costs).toLocaleString("id-ID")}</b></p><h3>Biaya per kategori</h3><table>${rows}</table>${monthTable}</body></html>`; const file = await Print.printToFileAsync({ html }); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: "application/pdf", dialogTitle: "Bagikan laporan TelorKu" }); else Alert.alert("PDF siap", "File laporan sudah dibuat di perangkat Anda."); } catch { Alert.alert("Ekspor gagal", "Laporan belum dapat dibuat. Silakan coba lagi."); } };
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}><View style={styles.modalBackdrop}><View style={styles.sheet}><View style={styles.handle} /><View style={styles.between}><Text style={styles.sheetTitle}>Laporan & Pembeli</Text><Pressable accessibilityLabel="Tutup laporan" onPress={onClose} style={styles.headerIcon}><Icon name="close" color={colors.onSurface} /></Pressable></View><View style={styles.row}><Pressable onPress={() => setSection("report")} style={[styles.reportTab, section === "report" && styles.reportTabActive]}><Text style={[styles.reportTabText, section === "report" && styles.reportTabTextActive]}>Laporan</Text></Pressable><Pressable onPress={() => setSection("buyers")} style={[styles.reportTab, section === "buyers" && styles.reportTabActive]}><Text style={[styles.reportTabText, section === "buyers" && styles.reportTabTextActive]}>Daftar pembeli</Text></Pressable></View><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 22 }}>
    {section === "report" ? <><View style={[styles.row, { gap: 8, marginTop: 4, marginBottom: 4 }]}><Pressable testID="period-month-toggle" onPress={() => setPeriod("month")} style={[styles.chip, { marginRight: 0 }, period === "month" && styles.chipSelected]}><Text style={[styles.chipText, period === "month" && styles.chipTextSelected]}>Bulanan</Text></Pressable><Pressable testID="period-year-toggle" onPress={() => setPeriod("year")} style={[styles.chip, { marginRight: 0 }, period === "year" && styles.chipSelected]}><Text style={[styles.chipText, period === "year" && styles.chipTextSelected]}>Tahunan</Text></Pressable><Pressable testID="period-range-toggle" onPress={() => setPeriod("range")} style={[styles.chip, { marginRight: 0 }, period === "range" && styles.chipSelected]}><Text style={[styles.chipText, period === "range" && styles.chipTextSelected]}>Rentang tanggal</Text></Pressable></View>{period === "month" ? <><Text style={styles.fieldLabel}>Bulan laporan</Text><Pressable testID="report-month-input" onPress={() => setPicking(picking === "month" ? null : "month")} style={({ pressed }) => [styles.field, styles.pickerField, pressed && styles.pressed]}><Text style={styles.pickerText}>{new Date(`${month}-01T12:00:00`).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</Text><Icon name="calendar-outline" size={18} color={colors.brandPrimary} /></Pressable></> : null}{period === "year" ? <><Text style={styles.fieldLabel}>Tahun laporan</Text><View style={[styles.row, { gap: 10 }]}><Pressable testID="report-year-minus" onPress={() => setYear(String((Number(year) || 0) - 1))} style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}><Icon name="remove" color={colors.brandPrimary} /></Pressable><TextInput testID="report-year-input" value={year} onChangeText={setYear} placeholder="YYYY" keyboardType="numeric" maxLength={4} placeholderTextColor={colors.muted} style={[styles.field, { flex: 1, textAlign: "center" }]} /><Pressable testID="report-year-plus" onPress={() => setYear(String((Number(year) || 0) + 1))} style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}><Icon name="add" color={colors.brandPrimary} /></Pressable></View></> : null}{period === "range" ? <><View style={styles.statRow}><View style={{ flex: 1 }}><Text style={styles.fieldLabel}>Dari tanggal</Text><Pressable testID="report-range-start" onPress={() => setPicking(picking === "start" ? null : "start")} style={({ pressed }) => [styles.field, styles.pickerField, pressed && styles.pressed]}><Text style={styles.pickerText}>{formatDate(rangeStart)}</Text><Icon name="calendar-outline" size={18} color={colors.brandPrimary} /></Pressable></View><View style={{ flex: 1 }}><Text style={styles.fieldLabel}>Sampai tanggal</Text><Pressable testID="report-range-end" onPress={() => setPicking(picking === "end" ? null : "end")} style={({ pressed }) => [styles.field, styles.pickerField, pressed && styles.pressed]}><Text style={styles.pickerText}>{formatDate(rangeEnd)}</Text><Icon name="calendar-outline" size={18} color={colors.brandPrimary} /></Pressable></View></View>{!rangeReady ? <Text style={[styles.itemMeta, { marginTop: 8 }]}>Tanggal awal harus sebelum tanggal akhir.</Text> : null}</> : null}{picking ? <InlineCalendar value={picking === "month" ? `${month}-01` : picking === "start" ? rangeStart : rangeEnd} onSelect={(picked) => { if (picking === "month") setMonth(picked.slice(0, 7)); else if (picking === "start") setRangeStart(picked); else setRangeEnd(picked); setPicking(null); }} onClose={() => setPicking(null)} /> : null}<View style={[styles.reportCard, { marginTop: 12 }]}><Text style={styles.itemMeta}>{periodLabel}</Text><Text style={styles.bigReportValue}>{formatRupiah(revenue - costs)}</Text><Text style={[(revenue - costs) >= 0 ? styles.positive : styles.negative, styles.itemMeta]}>{(revenue - costs) >= 0 ? "Laba bersih" : "Rugi bersih"}</Text><View style={[styles.statRow, { marginTop: 16 }]}><View><Text style={styles.itemMeta}>Telur terjual</Text><Text style={styles.itemTitle}>{sales.reduce((sum, item) => sum + item.eggs, 0)} butir</Text></View><View><Text style={styles.itemMeta}>Pendapatan</Text><Text style={styles.itemTitle}>{formatRupiah(revenue)}</Text></View></View></View><View style={styles.reportCard}><Text style={styles.itemTitle}>Biaya per kategori</Text>{Object.keys(byCategory).length ? Object.entries(byCategory).map(([key, value]) => <View key={key} style={styles.categoryLine}><Text style={styles.itemMeta}>{key}</Text><Text style={styles.itemTitle}>{formatRupiah(value)}</Text></View>) : <Text style={styles.itemMeta}>Belum ada biaya pada periode ini.</Text>}<View style={[styles.categoryLine, { borderBottomWidth: 0 }]}><Text style={styles.itemTitle}>Total biaya</Text><Text style={styles.amount}>{formatRupiah(costs)}</Text></View></View>{chart.rows.length ? <View style={styles.reportCard} testID="period-chart"><Text style={styles.itemTitle}>{chart.title}</Text>{chart.rows.map((item) => <View key={item.key} style={{ marginTop: 12 }}><View style={styles.between}><Text style={styles.itemMeta}>{item.label}</Text><Text style={[styles.itemMeta, item.revenue - item.costs >= 0 ? styles.positive : styles.negative]}>{formatRupiah(item.revenue - item.costs)}</Text></View><View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceTertiary, marginTop: 6 }}><View style={{ height: 8, borderRadius: 4, width: `${Math.max((item.revenue / maxChart) * 100, item.revenue ? 2 : 0)}%`, backgroundColor: colors.brandPrimary }} /></View><View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceTertiary, marginTop: 4 }}><View style={{ height: 8, borderRadius: 4, width: `${Math.max((item.costs / maxChart) * 100, item.costs ? 2 : 0)}%`, backgroundColor: colors.error }} /></View></View>)}<View style={[styles.row, { marginTop: 16, gap: 16 }]}><View style={styles.row}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brandPrimary, marginRight: 6 }} /><Text style={styles.itemMeta}>Pendapatan</Text></View><View style={styles.row}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.error, marginRight: 6 }} /><Text style={styles.itemMeta}>Biaya</Text></View></View></View> : null}<Pressable testID="export-pdf-button" onPress={exportPdf} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Icon name="share-outline" color={colors.onBrandPrimary} /><Text style={styles.primaryButtonText}>Ekspor & Bagikan PDF</Text></Pressable></> : <><Pressable onPress={onAddBuyer} style={({ pressed }) => [styles.outlineButton, { marginVertical: 14 }, pressed && styles.pressed]}><Icon name="person-add-outline" color={colors.brandPrimary} /><Text style={styles.outlineText}>Tambah pembeli</Text></Pressable>{data.buyers.length ? data.buyers.map((buyer) => { const history = data.sales.filter((sale) => sale.buyerId === buyer.id || sale.buyerName.toLowerCase() === buyer.name.toLowerCase()); return <View key={buyer.id} style={styles.listCard}><View style={styles.between}><View style={{ flex: 1 }}><Text style={styles.itemTitle}>{buyer.name}</Text><Text style={styles.itemMeta}>{buyer.phone || "Tanpa nomor telepon"}</Text></View><View style={styles.row}><Pressable accessibilityLabel={`Edit ${buyer.name}`} onPress={() => onEditBuyer(buyer)} style={styles.headerIcon}><Icon name="create-outline" size={18} color={colors.brandPrimary} /></Pressable><Pressable accessibilityLabel={`Hapus ${buyer.name}`} onPress={() => onDeleteBuyer(buyer)} style={styles.headerIcon}><Icon name="trash-outline" size={18} color={colors.error} /></Pressable></View></View><Text style={[styles.itemMeta, { marginTop: 12 }]}>{history.reduce((sum, item) => sum + item.eggs, 0)} telur · {formatRupiah(history.reduce((sum, item) => sum + item.total, 0))}</Text></View>; }) : <EmptyState icon="people-outline" text="Belum ada pembeli tersimpan." />}</>}
  </ScrollView></View></View></Modal>;
}

export default function Index() {
  const styles = useStyles(); const { colors } = useTheme(); const insets = useSafeAreaInsets(); const [data, setData] = useState<AppData>(emptyData); const [ready, setReady] = useState(false); const [tab, setTab] = useState<Tab>("home"); const [modal, setModal] = useState<ModalKind>(null); const [editingSale, setEditingSale] = useState<Sale | null>(null); const [editingExpense, setEditingExpense] = useState<Expense | null>(null); const [editingProduction, setEditingProduction] = useState<Production | null>(null); const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null); const [reportMonth, setReportMonth] = useState(monthKey()); const [reminderTime, setReminderTime] = useState("16:00"); const [salesSearch, setSalesSearch] = useState(""); const [salesMonth, setSalesMonth] = useState(""); const [expenseMonth, setExpenseMonth] = useState(""); const [expenseCategory, setExpenseCategory] = useState("Semua");
  useEffect(() => { loadData().then((stored) => { setData(stored); setReminderTime(stored.reminder.time); setReady(true); }); }, []);
  const commit = async (next: AppData) => { setData(next); await saveData(next); };
  const saveRecord = async (value: Sale | Expense | Production | Buyer, mode: Exclude<ModalKind, null | "report" | "flock">) => { const next = { ...data }; if (mode === "sale") next.sales = next.sales.some((item) => item.id === value.id) ? next.sales.map((item) => item.id === value.id ? value as Sale : item) : [value as Sale, ...next.sales]; if (mode === "expense") { const expense = value as Expense; next.expenses = next.expenses.some((item) => item.id === expense.id) ? next.expenses.map((item) => item.id === expense.id ? expense : item) : [expense, ...next.expenses]; if (!next.categories.includes(expense.category)) next.categories = [...next.categories, expense.category]; } if (mode === "production") { const production = value as Production; next.productions = next.productions.some((item) => item.id === production.id) ? next.productions.map((item) => item.id === production.id ? production : item) : [production, ...next.productions]; } if (mode === "buyer") next.buyers = next.buyers.some((item) => item.id === value.id) ? next.buyers.map((item) => item.id === value.id ? value as Buyer : item) : [value as Buyer, ...next.buyers]; await commit(next); };
  const saveFlock = async (value: number) => commit({ ...data, activeChickens: value });
  const toggleReminder = async (enabled: boolean) => {
    if (!enabled) { await cancelDailyReminder(); await commit({ ...data, reminder: { ...data.reminder, enabled: false } }); return; }
    if (Platform.OS === "web") return Alert.alert("Hanya di perangkat", "Pengingat notifikasi hanya berfungsi di aplikasi Android/iOS, bukan di browser.");
    const permission = await ensureReminderPermission();
    if (permission === "blocked") return Alert.alert("Izin notifikasi mati", "Aktifkan notifikasi TelorKu melalui pengaturan perangkat Anda.", [{ text: "Batal", style: "cancel" }, { text: "Buka Pengaturan", onPress: () => Linking.openSettings() }]);
    if (permission !== "granted") return Alert.alert("Izin notifikasi ditolak", "Pengingat tidak dapat aktif tanpa izin notifikasi.");
    await scheduleDailyReminder(data.reminder.time);
    await commit({ ...data, reminder: { ...data.reminder, enabled: true } });
  };
  const saveReminderTime = async () => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(reminderTime)) return Alert.alert("Format jam salah", "Gunakan format HH:MM, contoh 16:30.");
    await scheduleDailyReminder(reminderTime);
    await commit({ ...data, reminder: { enabled: true, time: reminderTime } });
    Alert.alert("Pengingat disimpan", `TelorKu akan mengingatkan setiap hari pukul ${reminderTime}.`);
  };
  const removeSale = (item: Sale) => Alert.alert("Hapus penjualan?", "Data ini akan dihapus dari perangkat.", [{ text: "Batal", style: "cancel" }, { text: "Hapus", style: "destructive", onPress: () => commit({ ...data, sales: data.sales.filter((sale) => sale.id !== item.id) }) }]);
  const removeExpense = (item: Expense) => Alert.alert("Hapus biaya?", "Data ini akan dihapus dari perangkat.", [{ text: "Batal", style: "cancel" }, { text: "Hapus", style: "destructive", onPress: () => commit({ ...data, expenses: data.expenses.filter((expense) => expense.id !== item.id) }) }]);
  const removeBuyer = (item: Buyer) => Alert.alert("Hapus pembeli?", "Riwayat penjualan tetap tersimpan.", [{ text: "Batal", style: "cancel" }, { text: "Hapus", style: "destructive", onPress: () => commit({ ...data, buyers: data.buyers.filter((buyer) => buyer.id !== item.id) }) }]);
  const today = todayKey(); const currentMonth = monthKey(); const todaySales = data.sales.filter((item) => item.date === today); const todayExpenses = data.expenses.filter((item) => item.date === today); const monthSales = data.sales.filter((item) => item.date.startsWith(currentMonth)); const monthExpenses = data.expenses.filter((item) => item.date.startsWith(currentMonth)); const todayRevenue = todaySales.reduce((sum, item) => sum + item.total, 0); const todayCosts = todayExpenses.reduce((sum, item) => sum + item.totalCost, 0); const monthRevenue = monthSales.reduce((sum, item) => sum + item.total, 0); const monthCosts = monthExpenses.reduce((sum, item) => sum + item.totalCost, 0);
  const filteredSales = useMemo(() => data.sales.filter((item) => (!salesMonth || item.date.startsWith(salesMonth)) && (!salesSearch || item.buyerName.toLowerCase().includes(salesSearch.toLowerCase()))), [data.sales, salesMonth, salesSearch]); const filteredExpenses = useMemo(() => data.expenses.filter((item) => (!expenseMonth || item.date.startsWith(expenseMonth)) && (expenseCategory === "Semua" || item.category === expenseCategory)), [data.expenses, expenseMonth, expenseCategory]);
  const open = (kind: ModalKind) => { setEditingSale(null); setEditingExpense(null); setEditingProduction(null); setEditingBuyer(null); setModal(kind); };
  const greeting = new Date().getHours() < 11 ? "Selamat pagi" : new Date().getHours() < 15 ? "Selamat siang" : "Selamat sore";
  if (!ready) return <View style={[styles.root, { alignItems: "center", justifyContent: "center" }]}><ActivityIndicator color={colors.brandPrimary} /><Text style={[styles.subtitle, { marginTop: 12 }]}>Menyiapkan TelorKu...</Text></View>;
  const renderHome = () => <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}><Header title={greeting} subtitle={new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })} onReport={() => open("report")} /><View style={styles.heroCard}><Text style={styles.heroLabel}>LABA BERSIH HARI INI</Text><Text style={styles.heroValue}>{formatRupiah(todayRevenue - todayCosts)}</Text><Text style={styles.heroCaption}>{todayRevenue - todayCosts >= 0 ? "Usaha hari ini berjalan baik" : "Biaya hari ini lebih besar"}</Text></View><View style={styles.statRow}><View style={styles.statCard}><Text style={styles.statLabel}>Telur terjual</Text><Text style={styles.statValue}>{todaySales.reduce((sum, item) => sum + item.eggs, 0)} butir</Text></View><View style={styles.statCard}><Text style={styles.statLabel}>Pendapatan</Text><Text style={styles.statValue}>{formatRupiah(todayRevenue)}</Text></View><View style={styles.statCard}><Text style={styles.statLabel}>Biaya</Text><Text style={styles.statValue}>{formatRupiah(todayCosts)}</Text></View></View><View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Catat aktivitas</Text></View><View style={styles.quickRow}><Pressable testID="quick-add-sale" onPress={() => open("sale")} style={({ pressed }) => [styles.quickButton, pressed && styles.pressed]}><Icon name="cart-outline" color={colors.brandPrimary} /><Text style={styles.quickText}>Jual telur</Text></Pressable><Pressable testID="quick-add-expense" onPress={() => open("expense")} style={({ pressed }) => [styles.quickButton, pressed && styles.pressed]}><Icon name="receipt-outline" color={colors.brandPrimary} /><Text style={styles.quickText}>Tambah biaya</Text></Pressable><Pressable testID="quick-add-production" onPress={() => open("production")} style={({ pressed }) => [styles.quickButton, pressed && styles.pressed]}><Icon name="egg-outline" color={colors.brandPrimary} /><Text style={styles.quickText}>Koleksi telur</Text></Pressable></View><View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Ringkasan bulan ini</Text><Pressable onPress={() => open("report")}><Text style={styles.link}>Lihat laporan</Text></Pressable></View><View style={styles.listCard}><View style={styles.between}><View><Text style={styles.itemMeta}>Pendapatan</Text><Text style={styles.itemTitle}>{formatRupiah(monthRevenue)}</Text></View><View><Text style={styles.itemMeta}>Biaya</Text><Text style={styles.itemTitle}>{formatRupiah(monthCosts)}</Text></View><View><Text style={styles.itemMeta}>Bersih</Text><Text style={[styles.itemTitle, monthRevenue - monthCosts >= 0 ? styles.positive : styles.negative]}>{formatRupiah(monthRevenue - monthCosts)}</Text></View></View></View><View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Aktivitas terbaru</Text><Pressable onPress={() => setTab("sales")}><Text style={styles.link}>Semua</Text></Pressable></View>{data.sales.slice(0, 3).map((item) => <View key={item.id} style={styles.listCard}><View style={styles.between}><View><Text style={styles.itemTitle}>{item.buyerName}</Text><Text style={styles.itemMeta}>{formatDate(item.date)} · {item.eggs} telur</Text></View><Text style={styles.amount}>{formatRupiah(item.total)}</Text></View></View>)}{!data.sales.length ? <EmptyState icon="basket-outline" text="Belum ada penjualan. Catat transaksi pertama hari ini." /> : null}</ScrollView>;
  const renderSales = () => <View style={styles.root}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}><Header title="Penjualan" subtitle={`${data.sales.length} transaksi tersimpan`} /><TextInput value={salesSearch} onChangeText={setSalesSearch} placeholder="Cari nama pembeli" placeholderTextColor={colors.muted} style={styles.filterInput} /><TextInput value={salesMonth} onChangeText={setSalesMonth} placeholder="Filter bulan: YYYY-MM (opsional)" placeholderTextColor={colors.muted} style={styles.filterInput} />{filteredSales.map((item) => <View key={item.id} style={styles.listCard}><View style={styles.between}><View style={{ flex: 1 }}><Text style={styles.itemTitle}>{item.buyerName}</Text><Text style={styles.itemMeta}>{formatDate(item.date)} · {item.eggs} telur × {formatRupiah(EGG_PRICE)}</Text></View><Text style={styles.amount}>{formatRupiah(item.total)}</Text></View><View style={[styles.row, { justifyContent: "flex-end", marginTop: 10, gap: 18 }]}><Pressable onPress={() => { setEditingSale(item); setModal("sale"); }}><Icon name="create-outline" color={colors.brandPrimary} /></Pressable><Pressable onPress={() => removeSale(item)}><Icon name="trash-outline" color={colors.error} /></Pressable></View></View>)}{!filteredSales.length ? <EmptyState icon="cart-outline" text="Belum ada transaksi yang sesuai filter." /> : null}</ScrollView><Pressable testID="fab-add-sale" onPress={() => open("sale")} style={({ pressed }) => [styles.fab, pressed && styles.pressed]}><Icon name="add" color={colors.onBrandPrimary} /><Text style={styles.fabText}>Catat penjualan</Text></Pressable></View>;
  const renderProduction = () => { const latest = data.productions[0]; return <View style={styles.root}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}><Header title="Produksi & Ayam" subtitle="Pantau produktivitas harian" /><Pressable onPress={() => open("flock")} style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}><Icon name="people-outline" color={colors.brandPrimary} /><Text style={styles.outlineText}>Atur ayam aktif bertelur</Text></Pressable><View style={[styles.reportCard, { marginTop: 16 }]} testID="reminder-card"><View style={styles.between}><View style={{ flex: 1, marginRight: 12 }}><Text style={styles.itemTitle}>Pengingat koleksi harian</Text><Text style={styles.itemMeta}>TelorKu mengingatkan Anda mencatat telur setiap hari pukul {data.reminder.time}.</Text></View><Switch testID="reminder-toggle" value={data.reminder.enabled} onValueChange={toggleReminder} trackColor={{ true: colors.brandSecondary, false: colors.borderStrong }} thumbColor={data.reminder.enabled ? colors.brandPrimary : colors.surfaceTertiary} /></View>{data.reminder.enabled ? <View style={[styles.row, { marginTop: 12, gap: 10 }]}><TextInput testID="reminder-time-input" value={reminderTime} onChangeText={setReminderTime} placeholder="16:00" keyboardType="numbers-and-punctuation" maxLength={5} placeholderTextColor={colors.muted} style={[styles.field, { flex: 1 }]} /><Pressable testID="reminder-save-button" onPress={saveReminderTime} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>Simpan jam</Text></Pressable></View> : null}</View><View style={[styles.heroCard, { marginTop: 16 }]}><Text style={styles.heroLabel}>AYAM AKTIF BERTELUR</Text><Text style={styles.heroValue}>{data.activeChickens || 0} ekor</Text><Text style={styles.heroCaption}>{latest ? `Terakhir dicatat ${formatDate(latest.date)}` : "Atur jumlah ayam untuk mulai memantau"}</Text></View><View style={styles.statRow}><View style={styles.statCard}><Text style={styles.statLabel}>Koleksi terakhir</Text><Text style={styles.statValue}>{latest ? `${latest.eggsCollected} butir` : "—"}</Text></View><View style={styles.statCard}><Text style={styles.statLabel}>Produktivitas</Text><Text style={styles.statValue}>{latest && latest.activeChickens ? `${(latest.eggsCollected / latest.activeChickens).toFixed(2)}` : "—"} telur/ayam</Text></View></View><View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Riwayat koleksi</Text></View>{data.productions.map((item) => <View key={item.id} style={styles.listCard}><View style={styles.between}><View><Text style={styles.itemTitle}>{formatDate(item.date)}</Text><Text style={styles.itemMeta}>{item.activeChickens} ayam aktif · {(item.eggsCollected / item.activeChickens).toFixed(2)} telur/ayam</Text></View><Text style={styles.amount}>{item.eggsCollected} butir</Text></View></View>)}{!data.productions.length ? <EmptyState icon="egg-outline" text="Belum ada catatan koleksi telur." /> : null}</ScrollView><Pressable testID="fab-add-production" onPress={() => open("production")} style={({ pressed }) => [styles.fab, pressed && styles.pressed]}><Icon name="add" color={colors.onBrandPrimary} /><Text style={styles.fabText}>Catat koleksi</Text></Pressable></View>; };
  const renderExpenses = () => <View style={styles.root}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}><Header title="Keuangan" subtitle={`${data.expenses.length} biaya operasional`} /><TextInput value={expenseMonth} onChangeText={setExpenseMonth} placeholder="Filter bulan: YYYY-MM (opsional)" placeholderTextColor={colors.muted} style={styles.filterInput} /><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}><Pressable onPress={() => setExpenseCategory("Semua")} style={[styles.chip, expenseCategory === "Semua" && styles.chipSelected]}><Text style={[styles.chipText, expenseCategory === "Semua" && styles.chipTextSelected]}>Semua</Text></Pressable>{data.categories.map((item) => <Pressable key={item} onPress={() => setExpenseCategory(item)} style={[styles.chip, expenseCategory === item && styles.chipSelected]}><Text style={[styles.chipText, expenseCategory === item && styles.chipTextSelected]}>{item}</Text></Pressable>)}</ScrollView>{filteredExpenses.map((item) => <View key={item.id} style={styles.listCard}><View style={styles.between}><View style={{ flex: 1 }}><Text style={styles.itemTitle}>{item.itemName}</Text><Text style={styles.itemMeta}>{item.category} · {formatDate(item.date)} · {item.quantity} {item.unit}</Text></View><Text style={styles.amount}>{formatRupiah(item.totalCost)}</Text></View><View style={[styles.row, { justifyContent: "flex-end", marginTop: 10, gap: 18 }]}><Pressable onPress={() => { setEditingExpense(item); setModal("expense"); }}><Icon name="create-outline" color={colors.brandPrimary} /></Pressable><Pressable onPress={() => removeExpense(item)}><Icon name="trash-outline" color={colors.error} /></Pressable></View></View>)}{!filteredExpenses.length ? <EmptyState icon="receipt-outline" text="Belum ada biaya yang sesuai filter." /> : null}</ScrollView><Pressable testID="fab-add-expense" onPress={() => open("expense")} style={({ pressed }) => [styles.fab, pressed && styles.pressed]}><Icon name="add" color={colors.onBrandPrimary} /><Text style={styles.fabText}>Tambah biaya</Text></Pressable></View>;
  const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [{ key: "home", label: "Beranda", icon: "home-outline" }, { key: "sales", label: "Penjualan", icon: "cart-outline" }, { key: "production", label: "Produksi", icon: "egg-outline" }, { key: "expenses", label: "Keuangan", icon: "wallet-outline" }];
  return <View style={[styles.root, { paddingTop: insets.top }]}>{tab === "home" ? renderHome() : tab === "sales" ? renderSales() : tab === "production" ? renderProduction() : renderExpenses()}<View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>{tabs.map((item) => <Pressable key={item.key} testID={`tab-${item.key}`} onPress={() => setTab(item.key)} style={({ pressed }) => [styles.tabItem, pressed && styles.pressed]}><Icon name={item.icon} color={tab === item.key ? colors.brandPrimary : colors.muted} /><Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text></Pressable>)}</View><FormSheet mode="sale" visible={modal === "sale"} onClose={() => setModal(null)} data={data} initialSale={editingSale} onSave={saveRecord} /><FormSheet mode="expense" visible={modal === "expense"} onClose={() => setModal(null)} data={data} initialExpense={editingExpense} onSave={saveRecord} /><FormSheet mode="production" visible={modal === "production"} onClose={() => setModal(null)} data={data} initialProduction={editingProduction} onSave={saveRecord} /><FormSheet mode="buyer" visible={modal === "buyer"} onClose={() => setModal(null)} data={data} initialBuyer={editingBuyer} onSave={saveRecord} /><FlockSheet visible={modal === "flock"} current={data.activeChickens} onClose={() => setModal(null)} onSave={saveFlock} /><ReportSheet visible={modal === "report"} onClose={() => setModal(null)} data={data} month={reportMonth} setMonth={setReportMonth} onAddBuyer={() => { setEditingBuyer(null); setModal("buyer"); }} onEditBuyer={(buyer) => { setEditingBuyer(buyer); setModal("buyer"); }} onDeleteBuyer={removeBuyer} /></View>;
}