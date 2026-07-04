"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Search,
  Plus,
  Download,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Truck,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/imgs/ImageUploader";
import { getSwalThemeOpts } from "./lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  precio_base: number;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
  imagen_url?: string | null;
  imagen_url_2?: string | null;
  imagen_url_3?: string | null;
  created_at?: string;
  proveedor_id?: string | null;
  inv_proveedores?: {
    nombre: string;
  } | null;
  inv_compras_detalles?: {
    inv_compras?: {
      inv_proveedores?: {
        nombre: string;
      } | null;
    } | null;
  }[];
}



// ─── Tarjeta de producto ─────────────────────────────────────────────────────
function ProductoCard({
  producto,
  onClick,
  onEdit,
  onDelete,
}: {
  producto: Producto;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isLowStock = producto.stock_actual <= producto.stock_minimo;
  const imagenes = [producto.imagen_url, producto.imagen_url_2, producto.imagen_url_3].filter(Boolean);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -1 }}
      onClick={onClick}
      className="group relative bg-[#F5F5F1] dark:bg-[#525D53]/10 border border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 rounded-xl p-2.5 cursor-pointer hover:border-[#8DA78E] dark:hover:border-[#A3BEB0]/60 flex gap-3 items-center min-h-[96px]"
    >
      {/* Thumbnail Left */}
      <div className="shrink-0 size-20 rounded-lg bg-white dark:bg-zinc-900/60 border border-[#C1D1C5]/30 dark:border-[#A3BEB0]/20 flex items-center justify-center overflow-hidden">
        {producto.imagen_url ? (
          <img
            src={createClient().storage.from("Imagenes_Farmacia").getPublicUrl(producto.imagen_url).data.publicUrl}
            alt={producto.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="size-6 text-slate-300 dark:text-slate-600 animate-pulse" />
        )}
      </div>

      {/* Content Right */}
      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="font-black text-xs text-slate-900 dark:text-white truncate uppercase leading-tight">
              {producto.nombre}
            </h3>
            <span className={cn(
              "size-2 rounded-full mt-0.5 shrink-0",
              producto.activo ? "bg-[#8DA78E]" : "bg-red-400"
            )} />
          </div>
          <p className="text-[9px] font-mono text-slate-500 mt-0.5">
            CÓD: {producto.codigo || "SIN CÓDIGO"}
          </p>
          {(producto.inv_proveedores?.nombre || producto.inv_compras_detalles?.[0]?.inv_compras?.inv_proveedores?.nombre) && (
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase flex items-center gap-1">
              <Truck className="size-3 text-[#8DA78E] dark:text-[#A3BEB0]" /> {producto.inv_proveedores?.nombre || producto.inv_compras_detalles?.[0]?.inv_compras?.inv_proveedores?.nombre}
            </p>
          )}
        </div>

        {/* Bottom stats and action buttons side by side */}
        <div className="mt-1.5 flex items-center justify-between gap-2 pt-1 border-t border-[#C1D1C5]/20 dark:border-[#A3BEB0]/10">
          <div className="flex gap-2.5 text-[9px] leading-none">
            <div>
              <span className="text-[#525D53]/60 dark:text-[#A3BEB0]/50 font-bold uppercase">Stock:</span>
              <span className={cn(
                "font-black ml-0.5",
                isLowStock ? "text-red-500 animate-pulse" : "text-slate-700 dark:text-slate-300"
              )}>
                {producto.stock_actual}
              </span>
            </div>
            <div>
              <span className="text-[#525D53]/60 dark:text-[#A3BEB0]/50 font-bold uppercase">Precio:</span>
              <span className="font-black ml-0.5 text-[#8DA78E] dark:text-[#A3BEB0]">
                Q{producto.precio_base.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action buttons (50/50 split) */}
          <div className="flex gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="px-2.5 py-1 bg-[#A3BEB0]/20 hover:bg-[#A3BEB0]/40 text-[#525D53] dark:text-[#A3BEB0] text-[9px] font-bold rounded-md transition-all cursor-pointer uppercase"
            >
              Editar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="px-2.5 py-1 bg-red-400 hover:bg-red-500 text-white text-[9px] font-bold rounded-md transition-all cursor-pointer uppercase"
            >
              Borrar
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Panel de detalle ──────────────────────────────────────────────────────────
function ProductoDetalle({
  producto,
  onClose,
  onUpdate,
  defaultEdit = false,
}: {
  producto: Producto;
  onClose: () => void;
  onUpdate: () => void;
  defaultEdit?: boolean;
}) {
  const isLowStock = producto.stock_actual <= producto.stock_minimo;
  const [isEditing, setIsEditing] = useState(defaultEdit);
  const [formData, setFormData] = useState(producto);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if producto prop changes
  useEffect(() => {
    setFormData(producto);
    setIsEditing(defaultEdit);
  }, [producto, defaultEdit]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("inv_productos")
        .update({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          codigo: formData.codigo,
          precio_base: formData.precio_base,
          stock_actual: formData.stock_actual,
          stock_minimo: formData.stock_minimo,
          activo: formData.activo,
          imagen_url: formData.imagen_url,
          imagen_url_2: formData.imagen_url_2,
          imagen_url_3: formData.imagen_url_3
        })
        .eq("id", producto.id);

      if (error) throw new Error(error.message);

      setIsEditing(false);
      onUpdate();
      
      const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
      Swal.fire({
        title: "Guardado",
        text: "Producto actualizado correctamente",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        background: isDark ? "#18181b" : "#F5F5F1",
        color: isDark ? "#F5F5F1" : "#525D53",
      });
    } catch (error: any) {
      console.error(error);
      const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
      Swal.fire({
        title: "Error",
        text: "No se pudo guardar: " + error.message,
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        background: isDark ? "#18181b" : "#F5F5F1",
        color: isDark ? "#F5F5F1" : "#525D53",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="bg-zinc-100 dark:bg-zinc-800 border border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 rounded-2xl p-3 flex flex-col gap-2.5 h-fit max-h-full overflow-y-auto w-full animate-fade-in shadow-2xl"
    >
      {/* Cabecera */}
      <div className="flex items-center justify-between pb-2 border-b border-[#C1D1C5]/30 dark:border-[#A3BEB0]/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="shrink-0 size-8 rounded-lg bg-gradient-to-br from-[#C1D1C5] to-[#8DA78E] flex items-center justify-center text-white">
            <Package className="size-4.5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Detalle del Producto</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-[#525D53] dark:hover:text-[#A3BEB0] transition-colors text-base font-bold px-1.5 cursor-pointer shrink-0"
        >
          ✕
        </button>
      </div>

      {/* Nombre */}
      <div className="space-y-1">
        <h4 className="text-[10px] uppercase tracking-widest font-black text-[#525D53] dark:text-[#A3BEB0]/70">Nombre</h4>
        {isEditing ? (
          <textarea 
            value={formData.nombre}
            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
            rows={1}
            className="w-full font-black text-slate-900 dark:text-white text-base leading-tight bg-white dark:bg-zinc-900 border border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#8DA78E] outline-none transition-all resize-none break-words shadow-sm"
          />
        ) : (
          <h2 className="font-black text-slate-900 dark:text-white text-base leading-tight break-words">{formData.nombre}</h2>
        )}
      </div>

      {/* Código y Estado Switch */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="col-span-2 space-y-1">
          <h4 className="text-[10px] uppercase tracking-widest font-black text-[#525D53] dark:text-[#A3BEB0]/70">Código de Barras</h4>
          {isEditing ? (
            <input 
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData({...formData, codigo: e.target.value})}
              className="w-full text-xs font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-zinc-900 border border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#8DA78E] outline-none transition-all shadow-sm"
            />
          ) : (
            <p className="text-xs font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-zinc-900/40 border border-[#C1D1C5]/20 rounded-lg px-3 py-2 uppercase">{formData.codigo || "Sin Código"}</p>
          )}
        </div>
        
        <div className="space-y-1">
          <h4 className="text-[10px] uppercase tracking-widest font-black text-[#525D53] dark:text-[#A3BEB0]/70">Estado</h4>
          <div className="bg-white dark:bg-zinc-900/40 border border-[#C1D1C5]/20 rounded-lg px-2.5 py-1.5 flex items-center justify-center gap-2 h-[38px] shadow-sm">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, activo: !formData.activo})}
                  className={cn(
                    "relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    formData.activo ? "bg-[#8DA78E]" : "bg-red-500 dark:bg-red-600"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block size-3.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out",
                      formData.activo ? "translate-x-3.5" : "translate-x-0"
                    )}
                  />
                </button>
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-wider select-none",
                  formData.activo ? "text-[#8DA78E] dark:text-[#A3BEB0]" : "text-red-500"
                )}>
                  {formData.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
            ) : (
              <span className={cn(
                "text-[10px] font-bold uppercase",
                formData.activo ? "text-[#8DA78E] dark:text-[#A3BEB0]" : "text-red-500"
              )}>
                {formData.activo ? "Activo" : "Inactivo"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Descripción */}
      <div className="space-y-1 mt-1">
        <h4 className="text-[10px] uppercase tracking-widest font-black text-[#525D53] dark:text-[#A3BEB0]/70">Descripción</h4>
        {isEditing ? (
          <textarea
            value={formData.descripcion || ""}
            onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
            className="w-full text-xs text-slate-600 dark:text-slate-300 leading-normal bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 min-h-[50px] h-[50px] focus:ring-2 focus:ring-[#8DA78E] outline-none transition-all shadow-sm resize-none"
          />
        ) : (
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal bg-white dark:bg-zinc-900/50 p-2.5 rounded-lg border border-[#C1D1C5]/30 dark:border-[#A3BEB0]/10">
            {formData.descripcion || "Sin descripción registrada para este producto."}
          </p>
        )}
      </div>

      {/* Datos técnicos */}
      <div>
        <h4 className="text-[10px] uppercase tracking-widest font-black text-[#525D53] dark:text-[#A3BEB0]/70 mb-1.5">Inventario y Costos</h4>
        <div className="grid grid-cols-3 gap-2">
          {/* Existencias */}
          <div className="bg-white dark:bg-[#525D53]/10 rounded-xl px-2 py-1.5 border border-[#C1D1C5]/30 dark:border-[#A3BEB0]/10 flex items-center justify-between gap-1 h-[38px] shadow-sm">
            <span className="text-[9px] text-[#525D53] dark:text-[#A3BEB0]/70 font-bold uppercase tracking-wider shrink-0">Existencias</span>
            {isEditing ? (
              <input 
                type="number"
                value={formData.stock_actual}
                onChange={(e) => setFormData({...formData, stock_actual: Number(e.target.value)})}
                className="w-12 text-xs font-bold text-center bg-white dark:bg-zinc-900 border border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 rounded-md py-0.5 text-[#8DA78E] dark:text-[#A3BEB0] focus:ring-1 focus:ring-[#8DA78E] outline-none"
              />
            ) : (
              <span className={`text-xs font-black ${isLowStock ? "text-red-400" : "text-[#8DA78E] dark:text-[#A3BEB0]"}`}>{formData.stock_actual}</span>
            )}
          </div>
          
          {/* Alerta Mínima */}
          <div className="bg-white dark:bg-[#525D53]/10 rounded-xl px-2 py-1.5 border border-[#C1D1C5]/30 dark:border-[#A3BEB0]/10 flex items-center justify-between gap-1 h-[38px] shadow-sm">
            <span className="text-[9px] text-[#525D53] dark:text-[#A3BEB0]/70 font-bold uppercase tracking-wider shrink-0">Mínimo</span>
            {isEditing ? (
              <input 
                type="number"
                value={formData.stock_minimo}
                onChange={(e) => setFormData({...formData, stock_minimo: Number(e.target.value)})}
                className="w-12 text-xs font-bold text-center bg-white dark:bg-zinc-900 border border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 rounded-md py-0.5 text-[#8DA78E] dark:text-[#A3BEB0] focus:ring-1 focus:ring-[#8DA78E] outline-none"
              />
            ) : (
              <span className="text-xs font-black text-[#8DA78E] dark:text-[#A3BEB0]">{formData.stock_minimo}</span>
            )}
          </div>

          {/* Precio Unitario */}
          <div className="bg-white dark:bg-[#525D53]/10 rounded-xl px-2 py-1.5 border border-[#C1D1C5]/30 dark:border-[#A3BEB0]/10 flex items-center justify-between gap-1 h-[38px] shadow-sm">
            <span className="text-[9px] text-[#525D53] dark:text-[#A3BEB0]/70 font-bold uppercase tracking-wider shrink-0">Precio U.</span>
            {isEditing ? (
              <div className="flex items-center bg-white dark:bg-zinc-900 border border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 rounded-md px-1 py-0.5 w-[56px] focus-within:ring-1 focus-within:ring-[#8DA78E] transition-all">
                <span className="text-[10px] font-bold text-slate-400 select-none mr-0.5">Q</span>
                <input 
                  type="number"
                  step="0.01"
                  value={formData.precio_base}
                  onChange={(e) => setFormData({...formData, precio_base: Number(e.target.value)})}
                  className="w-full text-xs font-bold text-center bg-transparent border-0 p-0 text-[#8DA78E] dark:text-[#A3BEB0] focus:ring-0 outline-none"
                />
              </div>
            ) : (
              <span className="text-xs font-black text-[#8DA78E] dark:text-[#A3BEB0]">Q{formData.precio_base.toFixed(2)}</span>
            )}
          </div>

          {/* Proveedor */}
          <div className="col-span-3 bg-white dark:bg-[#525D53]/10 rounded-xl p-2.5 border border-[#C1D1C5]/30 dark:border-[#A3BEB0]/10">
            <span className="text-[9px] text-[#525D53] dark:text-[#A3BEB0]/70 font-semibold uppercase tracking-wide block mb-0.5">Proveedor</span>
            <p className="text-xs font-bold text-[#8DA78E] dark:text-[#A3BEB0] truncate">
              {formData.inv_proveedores?.nombre || formData.inv_compras_detalles?.[0]?.inv_compras?.inv_proveedores?.nombre || "Sin Proveedor"}
            </p>
          </div>
        </div>
      </div>

      {/* Galería de Imágenes */}
      <div className="space-y-1.5 mt-1">
        <h4 className="text-[10px] uppercase tracking-widest font-black text-[#525D53] dark:text-[#A3BEB0]/70">Galería de Imágenes</h4>
        <div className="grid grid-cols-3 gap-2">
          {isEditing ? (
            <>
              {[
                { field: "imagen_url", val: formData.imagen_url },
                { field: "imagen_url_2", val: formData.imagen_url_2 },
                { field: "imagen_url_3", val: formData.imagen_url_3 },
              ].map((imgInfo, idx) => (
                <div key={idx} className="aspect-[3/4] rounded-xl bg-white dark:bg-zinc-900/60 border border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 overflow-hidden relative shadow-sm">
                  <ImageUploader
                    bucketName="Imagenes_Farmacia"
                    currentImagePath={imgInfo.val ?? null}
                    onUploadSuccess={(path) => setFormData({ ...formData, [imgInfo.field]: path })}
                    onDeleteSuccess={() => setFormData({ ...formData, [imgInfo.field]: null })}
                    aspect={3/4}
                    permitirTodos={true}
                    compact={true}
                    previewClassName="w-full h-full object-cover"
                  />
                </div>
              ))}
            </>
          ) : (
            <>
              {[producto.imagen_url, producto.imagen_url_2, producto.imagen_url_3].map((imgUrl, idx) => {
                const publicUrl = imgUrl ? createClient().storage.from("Imagenes_Farmacia").getPublicUrl(imgUrl).data.publicUrl : null;
                return (
                  <div key={idx} className="aspect-[3/4] rounded-xl bg-white dark:bg-zinc-900/60 border border-[#C1D1C5]/30 dark:border-[#A3BEB0]/20 flex items-center justify-center overflow-hidden shadow-xs">
                    {publicUrl ? (
                      <img src={publicUrl} alt={`${producto.nombre} - img ${idx + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="size-5 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="space-y-2 mt-4 pt-3 border-t border-[#C1D1C5]/20 dark:border-[#A3BEB0]/10 shrink-0">
        {isEditing ? (
          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="w-full py-2 px-4 rounded-xl bg-transparent border border-[#8DA78E] hover:bg-[#8DA78E]/10 text-[#8DA78E] dark:text-[#A3BEB0] dark:border-[#A3BEB0]/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-2 px-4 rounded-xl bg-[#A3BEB0] hover:bg-[#8DA78E] text-[#F5F5F1] text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-[#A3BEB0] hover:bg-[#8DA78E] text-[#F5F5F1] text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            Editar Producto
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export function VerInventario() {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [filtroStockBajo, setFiltroStockBajo] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "activos" | "inactivos">("activos");
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [modoEdicionDetalle, setModoEdicionDetalle] = useState(false);

  // Estados de Base de Datos Real
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [mostrarPageSizeDropdown, setMostrarPageSizeDropdown] = useState(false);
  const pageSizeDropdownRef = useRef<HTMLDivElement>(null);
  const [mostrarFiltroEstadoDropdown, setMostrarFiltroEstadoDropdown] = useState(false);
  const filtroEstadoDropdownRef = useRef<HTMLDivElement>(null);



  // Cargar productos de la base de datos
  const loadDbProductos = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("inv_productos")
        .select("*, inv_proveedores(nombre), inv_compras_detalles(inv_compras(inv_proveedores(nombre)))")
        .order("nombre", { ascending: true });

      if (error) {
        console.error("Error al cargar productos desde Supabase:", error);
        Swal.fire({
          title: "Error de Conexión",
          text: "No se pudieron obtener los productos desde Supabase: " + error.message,
          icon: "error",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 4000,
          ...getSwalThemeOpts()
        });
        setProductos([]);
      } else if (data) {
        // Mapear datos
        const mapped: Producto[] = data.map((row: any) => ({
          id: row.id,
          codigo: row.codigo || "",
          nombre: row.nombre || "Producto sin nombre",
          descripcion: row.descripcion || "",
          precio_base: row.precio_base || 0,
          stock_actual: row.stock_actual || 0,
          stock_minimo: row.stock_minimo || 0,
          activo: row.activo !== false,
          imagen_url: row.imagen_url || null,
          imagen_url_2: row.imagen_url_2 || null,
          imagen_url_3: row.imagen_url_3 || null,
          proveedor_id: row.proveedor_id || null,
          inv_proveedores: row.inv_proveedores || null,
          inv_compras_detalles: row.inv_compras_detalles || []
        }));
        setProductos(mapped);

        // Sincronizar selección actual
        setProductoSeleccionado((prev) => {
          if (!prev) return null;
          const fresh = mapped.find((p) => p.id === prev.id);
          return fresh || null;
        });
      }
    } catch (err: any) {
      console.error("Error en loadDbProductos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDbProductos();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pageSizeDropdownRef.current && !pageSizeDropdownRef.current.contains(event.target as Node)) {
        setMostrarPageSizeDropdown(false);
      }
      if (filtroEstadoDropdownRef.current && !filtroEstadoDropdownRef.current.contains(event.target as Node)) {
        setMostrarFiltroEstadoDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtrado de productos
  const productosFiltrados = productos.filter((p) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busqueda.toLowerCase());
    
    const matchesStock = !filtroStockBajo || p.stock_actual <= p.stock_minimo;
    
    const matchesEstado = 
      filtroEstado === "todos" ? true :
      filtroEstado === "activos" ? p.activo :
      !p.activo;
    
    return matchesSearch && matchesStock && matchesEstado;
  });

  const hayStockBajoGlobal = productos.some((p) => p.stock_actual <= p.stock_minimo);

  const totalItems = productosFiltrados.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const activePage = Math.min(currentPage, totalPages);
  
  const productosPaginados = productosFiltrados.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize
  );



  const handleNuevoProducto = () => {
    router.push("/kore/inventario/nuevo");
  };

  const handleEliminarProducto = async (producto: Producto) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar producto?",
      html: `¿Estás seguro de que deseas eliminar <strong>${producto.nombre}</strong>? Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      ...getSwalThemeOpts(),
      confirmButtonColor: "#ef4444"
    });
    if (!confirm.isConfirmed) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("inv_productos")
        .delete()
        .eq("id", producto.id);

      if (error) throw new Error(error.message);

      if (productoSeleccionado?.id === producto.id) setProductoSeleccionado(null);

      Swal.fire({
        title: "Eliminado",
        text: `${producto.nombre} fue eliminado del inventario.`,
        icon: "success",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        ...getSwalThemeOpts()
      });

      loadDbProductos();
    } catch (err: any) {
      Swal.fire({
        title: "Error",
        text: "No se pudo eliminar el producto: " + err.message,
        icon: "error",
        ...getSwalThemeOpts(),
        confirmButtonColor: "#ef4444"
      });
    }
  };



  // Exportar lista a PDF
  const handleExportarPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Encabezado
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(82, 93, 83); // #525D53 (Olivo Oscuro)
      doc.text("FARMACIA SALUD - REPORTE DE INVENTARIO", 14, 20);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      const fecha = new Date().toLocaleDateString("es-GT", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      doc.text(`Fecha de generación: ${fecha}`, 14, 27);
      doc.text(`Total de productos listados: ${productosFiltrados.length}`, 14, 33);
      
      // Línea divisoria
      doc.setDrawColor(193, 209, 197); // #C1D1C5
      doc.line(14, 38, 196, 38);
      
      // Generar tabla
      autoTable(doc, {
        startY: 42,
        head: [["Código", "Nombre del Producto", "Proveedor", "Stock Actual", "Mínimo", "Precio Venta", "Estado"]],
        body: productosFiltrados.map((p) => [
          p.codigo || "Sin Código",
          p.nombre,
          p.inv_proveedores?.nombre || p.inv_compras_detalles?.[0]?.inv_compras?.inv_proveedores?.nombre || "—",
          p.stock_actual,
          p.stock_minimo,
          `Q${p.precio_base.toFixed(2)}`,
          p.activo ? "Activo" : "Inactivo"
        ]),
        headStyles: {
          fillColor: [141, 167, 142], // #8DA78E
          textColor: [245, 245, 241],
          fontStyle: "bold",
          fontSize: 10
        },
        alternateRowStyles: {
          fillColor: [245, 245, 241]
        },
        margin: { top: 40 },
        styles: {
          fontSize: 9,
          cellPadding: 3
        }
      });
      
      doc.save(`Reporte_Inventario_${new Date().toISOString().slice(0, 10)}.pdf`);
      
      Swal.fire({
        title: "¡PDF Exportado!",
        text: "El reporte de inventario se ha descargado exitosamente.",
        icon: "success",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        ...getSwalThemeOpts()
      });
    } catch (error: any) {
      console.error("Error al exportar PDF:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudo generar el archivo PDF: " + error.message,
        icon: "error",
        ...getSwalThemeOpts(),
        confirmButtonColor: "#ef4444"
      });
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 p-0 md:p-6 pt-32 md:pt-24 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-2.5 md:px-0">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#8DA78E] dark:text-[#A3BEB0]">Módulo</p>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none mt-1">
              Inventario
            </h1>
          </div>
        </div>

        <button
          onClick={handleNuevoProducto}
          className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#8DA78E] hover:bg-[#525D53] text-[#F5F5F1] text-sm font-bold transition-all shadow-sm cursor-pointer shrink-0 animate-fade-in"
        >
          Nuevo
        </button>
      </div>

      {/* Tabs Selector: Activos / Inactivos (arriba del Buscador) */}
      <div className="px-2.5 md:px-0 mt-2">
        <div className="flex border-b border-[#C1D1C5]/30 dark:border-[#A3BEB0]/10 w-full select-none">
          <button
            type="button"
            onClick={() => {
              setFiltroEstado("activos");
              setCurrentPage(1);
            }}
            className={cn(
              "flex-1 py-3 text-xs font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer",
              filtroEstado === "activos"
                ? "border-[#8DA78E] text-[#8DA78E] dark:text-[#A3BEB0]"
                : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
            )}
          >
            Activos
          </button>
          <button
            type="button"
            onClick={() => {
              setFiltroEstado("inactivos");
              setCurrentPage(1);
            }}
            className={cn(
              "flex-1 py-3 text-xs font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer",
              filtroEstado === "inactivos"
                ? "border-[#8DA78E] text-[#8DA78E] dark:text-[#A3BEB0]"
                : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
            )}
          >
            Inactivos
          </button>
        </div>
      </div>

      {/* Buscador, Filtros y Exportar */}
      <div className="flex flex-col md:flex-row gap-3 px-2.5 md:px-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o código de barras..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-zinc-900/60 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8DA78E]/30 focus:border-[#8DA78E] transition-all"
          />
        </div>
        
        <div className="grid grid-cols-2 md:flex md:w-auto gap-2 w-full pb-1 md:pb-0 select-none">
          <button
            onClick={() => {
              setFiltroStockBajo(!filtroStockBajo);
              setCurrentPage(1);
            }}
            className={`w-full md:w-auto justify-center px-1.5 md:px-4 py-2.5 rounded-xl border text-[11px] md:text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
              filtroStockBajo
                ? "border-red-400 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800"
                : "border-red-200 dark:border-red-900/50 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
            } ${hayStockBajoGlobal && !filtroStockBajo ? "animate-pulse" : ""}`}
          >
            <AlertTriangle className="size-3 md:size-3.5" /> Stock Bajo
          </button>
          
          <button
            onClick={handleExportarPDF}
            className="w-full md:w-auto justify-center px-1.5 md:px-4 py-2.5 rounded-xl border border-[#C1D1C5] dark:border-[#A3BEB0]/30 text-[#525D53] dark:text-[#A3BEB0] hover:bg-[#C1D1C5]/10 transition-all flex items-center gap-1 text-[11px] md:text-xs font-bold shrink-0 cursor-pointer"
          >
            <Download className="size-3 md:size-3.5" /> Exportar
          </button>
        </div>
      </div>

      {/* Grid de productos + detalle */}
      <div className="flex gap-4 flex-1 relative min-h-[800px]">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center z-50 rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 rounded-full border-2 border-[#8DA78E]/30 border-t-[#8DA78E] animate-spin" />
              <span className="text-xs font-bold text-slate-500">Cargando base de datos...</span>
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Mobile: Product Cards */}
          <div className="md:hidden flex flex-col gap-3 px-2.5">
            {productosPaginados.length === 0 ? (
              <div className="text-center py-14 text-slate-400 font-bold text-sm">
                No se encontraron productos
              </div>
            ) : (
              productosPaginados.map((p) => (
                <ProductoCard
                  key={p.id}
                  producto={p}
                  onClick={() => {
                    setProductoSeleccionado(p);
                    setModoEdicionDetalle(false);
                  }}
                  onEdit={() => {
                    setProductoSeleccionado(p);
                    setModoEdicionDetalle(true);
                  }}
                  onDelete={() => handleEliminarProducto(p)}
                />
              ))
            )}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block bg-white dark:bg-[#525D53]/10 border border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F5F5F1] dark:bg-[#525D53]/20 text-[#525D53] dark:text-[#A3BEB0] font-bold uppercase tracking-wider border-b border-[#C1D1C5]/40 dark:border-[#A3BEB0]/20">
                    <th className="px-5 py-3.5">Código</th>
                    <th className="px-5 py-3.5">Producto</th>
                    <th className="px-5 py-3.5">Proveedor</th>
                    <th className="px-5 py-3.5">Existencias</th>
                    <th className="px-5 py-3.5">Estado</th>
                    <th className="px-5 py-3.5 text-right">Precio Venta</th>
                    <th className="px-5 py-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C1D1C5]/20 dark:divide-zinc-800/40 text-slate-700 dark:text-slate-300">
                  {productosPaginados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-14 text-slate-400 font-bold">
                        No se encontraron productos
                      </td>
                    </tr>
                  ) : (
                    productosPaginados.map((p) => {
                      const isLowStock = p.stock_actual <= p.stock_minimo;
                      const isSelected = productoSeleccionado?.id === p.id;
                      return (
                        <tr
                          key={p.id}
                          onClick={() => {
                            setProductoSeleccionado(isSelected ? null : p);
                            setModoEdicionDetalle(false);
                          }}
                          className={cn(
                            "hover:bg-[#8DA78E]/10 dark:hover:bg-[#A3BEB0]/15 transition-all cursor-pointer",
                            isSelected && "bg-[#8DA78E]/20 dark:bg-[#8DA78E]/25"
                          )}
                        >
                          <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                            {p.codigo || "Sin Código"}
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                            {p.nombre}
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400">
                            {p.inv_proveedores?.nombre || p.inv_compras_detalles?.[0]?.inv_compras?.inv_proveedores?.nombre || "—"}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={cn(
                              "font-semibold",
                              isLowStock ? "text-red-500 animate-pulse font-bold" : "text-slate-700 dark:text-slate-300"
                            )}>
                              {p.stock_actual}
                            </span>
                            {isLowStock && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-[9px] font-bold uppercase tracking-wide">
                                Stock Bajo
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              p.activo
                                ? "bg-[#8DA78E]/15 text-[#8DA78E] dark:bg-[#A3BEB0]/10 dark:text-[#A3BEB0]"
                                : "bg-slate-50 text-slate-700 dark:bg-zinc-950/20 dark:text-slate-400"
                            )}>
                              {p.activo ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold text-[#8DA78E] dark:text-[#A3BEB0]">
                            Q{p.precio_base.toFixed(2)}
                          </td>
                          <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setProductoSeleccionado(p);
                                  setModoEdicionDetalle(true);
                                }}
                                className="px-3 py-1.5 bg-[#A3BEB0]/20 hover:bg-[#A3BEB0]/40 text-[#525D53] dark:text-[#A3BEB0] font-bold rounded-lg transition-colors cursor-pointer text-[10px] uppercase"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleEliminarProducto(p)}
                                className="px-3 py-1.5 bg-red-400 hover:bg-red-500 text-white font-bold rounded-lg transition-colors cursor-pointer text-[10px] uppercase"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Barra de Paginación */}
          {totalItems > 0 && (
            <div className="flex items-center justify-between w-full mt-6 px-2.5 md:px-0 text-slate-600 dark:text-slate-400">
              {/* Fracción (Lado Izquierdo) */}
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[50px]">
                {activePage} / {totalPages}
              </div>

              {/* Botones de navegación (Centro) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, activePage - 1))}
                  disabled={activePage === 1}
                  className="size-8 rounded-lg border transition-all disabled:opacity-40 select-none bg-white dark:bg-zinc-900 text-[#525D53] dark:text-[#A3BEB0] border-slate-200 dark:border-slate-800 hover:border-[#A3BEB0] disabled:hover:border-slate-200 dark:disabled:hover:border-slate-800 cursor-pointer flex items-center justify-center"
                  title="Anterior"
                >
                  <ChevronLeft className="size-4" />
                </button>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, activePage + 1))}
                  disabled={activePage === totalPages}
                  className="size-8 rounded-lg border transition-all disabled:opacity-40 select-none bg-white dark:bg-zinc-900 text-[#525D53] dark:text-[#A3BEB0] border-slate-200 dark:border-slate-800 hover:border-[#A3BEB0] disabled:hover:border-slate-200 dark:disabled:hover:border-slate-800 cursor-pointer flex items-center justify-center"
                  title="Siguiente"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>

              {/* Selector de registros (Lado Derecho) */}
              <div className="flex items-center justify-end min-w-[50px]">
                <div className="relative" ref={pageSizeDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setMostrarPageSizeDropdown(!mostrarPageSizeDropdown)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-900 text-xs font-bold text-[#525D53] dark:text-[#A3BEB0] transition-all cursor-pointer flex items-center gap-1.5 hover:border-[#8DA78E] h-[34px] min-w-[55px] justify-between"
                  >
                    <span>{pageSize}</span>
                    <ChevronDown className="size-3 text-slate-400" />
                  </button>

                  <AnimatePresence>
                    {mostrarPageSizeDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full mb-1.5 right-0 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1 flex flex-col gap-0.5 min-w-[70px]"
                      >
                        {[10, 50, 100].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              setPageSize(size);
                              setCurrentPage(1);
                              setMostrarPageSizeDropdown(false);
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                              pageSize === size
                                ? "bg-[#8DA78E]/10 text-[#8DA78E] dark:text-[#A3BEB0]"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900/60"
                            }`}
                          >
                            <span>{size}</span>
                            {pageSize === size && <Check className="size-3" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel de detalle */}
        <AnimatePresence>
          {productoSeleccionado && (
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="hidden md:block absolute top-[-110px] right-0 h-[calc(100%+110px)] w-[750px] z-20"
            >
              <div className="h-fit max-h-full">
                <ProductoDetalle
                  producto={productoSeleccionado}
                  onClose={() => setProductoSeleccionado(null)}
                  onUpdate={() => loadDbProductos()}
                  defaultEdit={modoEdicionDetalle}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
